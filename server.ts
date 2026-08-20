import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google GenAI client securely on the server
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
}

/**
 * Helper to strip markdown fences and sanitize raw AI response before JSON parsing
 */
function cleanJsonString(raw: string): string {
  if (!raw) return "{}";
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Executes a promise with an enforced timeout duration
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms limit`)), timeoutMs)
    )
  ]);
}

/**
 * Robust helper to call Gemini with multi-model fallback, per-call timeout, and graceful local heuristic fallback.
 * Prevents 503 (Model Unavailable / High Demand), 429 (Quota / Rate Limits), network hangs, and JSON parse failures from crashing requests.
 */
async function callGeminiWithFallback<T>(
  client: GoogleGenAI | null,
  paramsBuilder: (modelName: string) => any,
  parseResult: (text: string) => T,
  fallbackGenerator: () => T,
  timeoutMs: number = 10000
): Promise<T> {
  if (!client) {
    return fallbackGenerator();
  }

  // Model fallback chain per official guidelines: primary (3.7-flash) -> secondary (2.5-flash) -> tertiary (3.1-flash-lite)
  const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const params = paramsBuilder(model);
        
        // Execute Gemini call with strict timeout limit
        const response = await withTimeout(
          client.models.generateContent({
            ...params,
            model,
          }),
          timeoutMs,
          `Gemini [${model}] generateContent`
        );

        const rawText = response.text || "";
        const sanitized = cleanJsonString(rawText);
        const parsed = parseResult(sanitized);
        if (parsed !== undefined && parsed !== null) {
          return parsed;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isQuotaExhausted =
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("quota");

        const isTemporaryHighDemand =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("Resource has been exhausted") ||
          errMsg.includes("Timeout");

        // If quota limit 0 or exhausted on this model, switch immediately to next model
        if (isQuotaExhausted) {
          break;
        }

        if (isTemporaryHighDemand && attempt === 0) {
          // Short exponential delay before retrying same model once
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break; // try next candidate model
      }
    }
  }

  // Smooth fallback to domain-specific heuristic engine
  return fallbackGenerator();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      service: "AKTARA School Mapping & Market Intelligence Copilot",
      timestamp: new Date().toISOString()
    });
  });

  // 1. Executive Brief & Strategic Analysis Endpoint
  app.post("/api/ai/brief", async (req, res) => {
    try {
      const { schools, filterContext } = req.body;

      if (!schools || !Array.isArray(schools)) {
        return res.status(400).json({ error: "Missing or invalid schools array" });
      }

      // Calculate base metrics
      const totalSchools = schools.length;
      const negeriCount = schools.filter(s => s.status === 'Negeri').length;
      const swastaCount = schools.filter(s => s.status === 'Swasta').length;
      const totalStudents = schools.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
      const maleStudents = schools.reduce((acc, s) => acc + (s.maleStudents || 0), 0);
      const femaleStudents = schools.reduce((acc, s) => acc + (s.femaleStudents || 0), 0);
      const negeriPercentage = totalSchools > 0 ? Math.round((negeriCount / totalSchools) * 100) : 0;
      const swastaPercentage = totalSchools > 0 ? Math.round((swastaCount / totalSchools) * 100) : 0;
      
      const marketDominance = negeriCount >= swastaCount 
        ? `Didominasi Sekolah Negeri (${negeriPercentage}% vs ${swastaPercentage}%)`
        : `Didominasi Sekolah Swasta (${swastaPercentage}% vs ${negeriPercentage}%)`;

      const promptContext = `
Data Sekolah Terpilih (${filterContext?.cityDistrict || 'Semua Wilayah'}, ${filterContext?.subDistrict || 'Semua Kecamatan'}):
- Total Sekolah: ${totalSchools}
- Negeri: ${negeriCount} (${negeriPercentage}%), Swasta: ${swastaCount} (${swastaPercentage}%)
- Total Siswa: ${totalStudents.toLocaleString('id-ID')} (Putra: ${maleStudents.toLocaleString('id-ID')}, Putri: ${femaleStudents.toLocaleString('id-ID')})
- Daftar Sekolah Ringkas:
${schools.slice(0, 15).map((s, idx) => `${idx + 1}. ${s.name} (${s.status}, ${s.subDistrict}) - ${s.totalStudents} Siswa | Jurusan: ${s.majors?.map((m: any) => m.name).slice(0, 3).join(', ')} | Status: ${s.partnershipStatus}`).join('\n')}
`;

      const aiData = await callGeminiWithFallback(
        genAI,
        (model) => ({
          contents: `Kamu adalah "AKTARA Intelligence Copilot", asisten AI ahli Sistem Informasi Geografis (GIS), analisis demografi pendidikan, dan strategi penetrasi pasar untuk AKTARA (AKTARA Academy & AKTARA Group).
Berikan output terstruktur dalam format JSON dengan instruksi:
1. EXECUTIVE BRIEF: 1 paragraf ringkasan eksekutif tajam, berbasis data, dan bernilai strategis untuk direksi AKTARA.
2. 3 STRATEGIC RECOMMENDATIONS FOR AKTARA: 3 butir aksi bisnis/kolaborasi yang sangat spesifik, terukur, dan menyebutkan nama sekolah atau klaster wilayah yang tepat sasaran (misal penawaran bootcamp AI, sertifikasi guru, kemitraan kelas industri, rute visitasi).
3. TARGET SCHOOLS HIGHLIGHT: Daftar 3-5 sekolah prioritas teratas dengan alasan dan rancangan aksi (action plan).

Context data:
${promptContext}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveBrief: {
                  type: Type.STRING,
                  description: "Ringkasan eksekutif 1 paragraf tajam untuk pimpinan AKTARA"
                },
                strategicRecommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 butir rekomendasi strategis konkret untuk AKTARA Group"
                },
                targetSchoolsHighlight: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      subDistrict: { type: Type.STRING },
                      studentCount: { type: Type.NUMBER },
                      reason: { type: Type.STRING },
                      actionPlan: { type: Type.STRING }
                    },
                    required: ["name", "subDistrict", "studentCount", "reason", "actionPlan"]
                  }
                }
              },
              required: ["executiveBrief", "strategicRecommendations", "targetSchoolsHighlight"]
            }
          }
        }),
        (rawText) => {
          const parsed = JSON.parse(rawText || "{}");
          return {
            executiveBrief: parsed.executiveBrief,
            strategicRecommendations: parsed.strategicRecommendations,
            targetSchoolsHighlight: parsed.targetSchoolsHighlight
          };
        },
        () => {
          const sorted = [...schools].sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
          const topSchool = sorted[0];
          return {
            executiveBrief: `Analisis demografi wilayah ${filterContext?.cityDistrict || 'Jawa Barat'} (${filterContext?.subDistrict || 'Semua Kecamatan'}) mengidentifikasi ${totalSchools} institusi pendidikan aktif dengan akumulasi ${totalStudents.toLocaleString('id-ID')} siswa (${maleStudents.toLocaleString('id-ID')} putra, ${femaleStudents.toLocaleString('id-ID')} putri). Komposisi pasar ${marketDominance} menawarkan potensi penetrasi signifikan bagi AKTARA Academy melalui program akselerasi kurikulum AI, sertifikasi kompetensi industri, dan talenta siap kerja.`,
            strategicRecommendations: [
              `Fokuskan penetrasi Kelas Industri AKTARA pada ${topSchool?.name || 'SMK klaster utama'} yang memiliki basis ${topSchool?.totalStudents?.toLocaleString('id-ID') || 'ribuan'} siswa aktif.`,
              `Luncurkan penawaran program sertifikasi AI & Web Development untuk rumpun keahlian IT & Bisnis di klaster ${filterContext?.cityDistrict || 'Garut'} dan sekitarnya.`,
              `Bentuk koridor visitasi efisien dengan mengelompokkan 3-4 sekolah berdekatan per hari untuk efisiensi tim representatif AKTARA.`
            ],
            targetSchoolsHighlight: sorted.slice(0, 3).map(s => ({
              name: s.name,
              subDistrict: s.subDistrict,
              studentCount: s.totalStudents,
              reason: `Sekolah ${s.status} berakreditasi ${s.accreditation} dengan ${s.totalStudents} siswa aktif dan jurusan potensial.`,
              actionPlan: `Tawarkan workshop digital orientation dan fasilitasi program magang industri AKTARA.`
            }))
          };
        }
      );

      return res.json({
        executiveBrief: aiData.executiveBrief || `Wilayah ${filterContext?.cityDistrict || 'Jawa Barat'} mencakup ${totalSchools} institusi dengan akumulasi ${totalStudents.toLocaleString('id-ID')} siswa. Pasar menunjukkan rasio ${negeriCount} Negeri dan ${swastaCount} Swasta dengan konsentrasi kejuruan teknik & informatika yang siap diakselerasi melalui ekosistem pelatihan AKTARA.`,
        keyMetrics: {
          totalSchools,
          negeriCount,
          swastaCount,
          totalStudents,
          maleStudents,
          femaleStudents,
          marketDominance,
          negeriPercentage,
          swastaPercentage
        },
        strategicRecommendations: aiData.strategicRecommendations || [
          `Prioritaskan kemitraan Kelas Industri AKTARA dengan SMK Negeri berpopulasi >1.500 siswa sebagai rujukan regional.`,
          `Lakukan penetrasi bootcamp AI & coding intensif ke SMK Swasta unggulan di klaster Tarogong & Garut Kota.`,
          `Jadwalkan visitasi terpadu untuk sosialisasi program sertifikasi guru dan penyaluran magang industri AKTARA Group.`
        ],
        targetSchoolsHighlight: aiData.targetSchoolsHighlight || schools.slice(0, 3).map(s => ({
          name: s.name,
          subDistrict: s.subDistrict,
          studentCount: s.totalStudents,
          reason: `Memiliki basis populasi siswa besar (${s.totalStudents} siswa) dan jurusan relevan dengan AKTARA.`,
          actionPlan: `Kirimkan proposal kemitraan kurikulum AI & jadwalkan audiensi pimpinan sekolah.`
        }))
      });
    } catch (error: any) {
      console.error("Error in /api/ai/brief handler:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI brief" });
    }
  });

  // 2. Natural Language Query Parser Endpoint
  app.post("/api/ai/parse-nl-query", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing natural language query" });
      }

      const result = await callGeminiWithFallback(
        genAI,
        (model) => ({
          contents: `Kamu adalah Natural Language Filter Parser untuk Web App AKTARA School Mapping.
Tugasmu: Mengubah pertanyaan/perintah bahasa sehari-hari pengguna tentang pencarian SMK/SMA menjadi parameter filter JSON terstruktur dan memberikan respon penjelasan ringkas (1-2 kalimat).

Daftar opsi yang valid:
- cityDistrict: 'Kabupaten Garut', 'Kota Bandung', 'Kabupaten Bandung', 'Kota Tasikmalaya', 'Kabupaten Tasikmalaya', 'Kabupaten Sumedang', 'Kabupaten Ciamis', atau 'Semua Kabupaten/Kota'
- subDistrict: Nama kecamatan jika ada (contoh 'Tarogong Kidul', 'Tarogong Kaler', 'Garut Kota', 'Karangpawitan', 'Cipedes', 'Lengkong', 'Dayeuhkolot') atau 'Semua Kecamatan'
- status: 'ALL', 'Negeri', 'Swasta'
- type: 'ALL', 'SMK', 'SMA'
- studentScale: 'ALL', 'Large' (>1000), 'Medium' (500-1000), 'Small' (<500)
- majorCategory: 'Semua Jurusan', 'IT', 'Teknik', 'Bisnis', 'Kreatif', 'Kesehatan', 'Pariwisata'
- searchQuery: Kata kunci spesifik nama sekolah atau kejuruan (contoh: 'Wikrama', 'RPL', 'TKJ')

Pertanyaan Pengguna: "${query}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING, description: "Penjelasan ringkas dalam bahasa Indonesia atas filter yang diterapkan" },
                filters: {
                  type: Type.OBJECT,
                  properties: {
                    cityDistrict: { type: Type.STRING },
                    subDistrict: { type: Type.STRING },
                    status: { type: Type.STRING },
                    type: { type: Type.STRING },
                    studentScale: { type: Type.STRING },
                    majorCategory: { type: Type.STRING },
                    searchQuery: { type: Type.STRING },
                    minStudents: { type: Type.NUMBER }
                  }
                }
              },
              required: ["explanation", "filters"]
            }
          }
        }),
        (rawText) => JSON.parse(rawText || "{}"),
        () => {
          const lower = query.toLowerCase();
          const filters: any = {};

          if (lower.includes("garut")) filters.cityDistrict = "Kabupaten Garut";
          if (lower.includes("bandung")) filters.cityDistrict = "Kota Bandung";
          if (lower.includes("tasik")) filters.cityDistrict = "Kota Tasikmalaya";
          if (lower.includes("sumedang")) filters.cityDistrict = "Kabupaten Sumedang";
          if (lower.includes("ciamis")) filters.cityDistrict = "Kabupaten Ciamis";

          if (lower.includes("tarogong kidul")) filters.subDistrict = "Tarogong Kidul";
          if (lower.includes("tarogong kaler")) filters.subDistrict = "Tarogong Kaler";

          if (lower.includes("negeri")) filters.status = "Negeri";
          if (lower.includes("swasta")) filters.status = "Swasta";

          if (lower.includes("smk")) filters.type = "SMK";
          if (lower.includes("sma")) filters.type = "SMA";

          if (lower.includes("besar") || lower.includes("> 1000") || lower.includes("di atas 1000")) {
            filters.studentScale = "Large";
          }

          if (lower.includes("rpl") || lower.includes("tkj") || lower.includes("it") || lower.includes("informatika") || lower.includes("komputer")) {
            filters.majorCategory = "IT";
          }

          return {
            explanation: `Filter diterapkan berdasarkan kata kunci pencarian "${query}".`,
            filters
          };
        }
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/ai/parse-nl-query:", error);
      res.status(500).json({ error: error.message || "Failed to parse query" });
    }
  });

  // 3. Interactive Copilot Chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, contextSchools, currentFilter } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemInstruction = `Kamu adalah "AKTARA Intelligence Copilot", asisten AI ahli Sistem Informasi Geografis (GIS), analisis demografi pendidikan, dan strategi penetrasi pasar untuk AKTARA (AKTARA Academy & AKTARA Group).
Prinsip utama:
- Gunakan bahasa Indonesia formal-modern yang ramah bisnis, lugas, dan terstruktur.
- Sajikan jawaban dengan format eksekutif: 
  1. EXECUTIVE BRIEF (Ringkasan kondisi)
  2. KEY METRICS HIGHLIGHT
  3. STRATEGIC RECOMMENDATIONS FOR AKTARA (Aksi terukur dan actionable)
  4. CATATAN WILAYAH/SPASIAL
- Kaitkan selalu dengan value proposition AKTARA: Bootcamp AI & Coding, Sertifikasi Pendidik/Guru, Kelas Industri Vokasi, Link & Match Penyaluran Kerja, dan Inkubasi Portofolio Siswa.
- Saat ini pengguna sedang melihat data di wilayah: ${currentFilter?.cityDistrict || 'Semua Wilayah'}, dengan ${contextSchools?.length || 0} sekolah yang terfilter.`;

      const promptContents = `Pertanyaan Pengguna: "${message}"
Data Sekolah yang sedang aktif dalam filter (${contextSchools?.length || 0} sekolah):
${(contextSchools || []).slice(0, 10).map((s: any) => `- ${s.name} (${s.status}, ${s.subDistrict}) | ${s.totalStudents} siswa | Jurusan: ${s.majors?.map((m: any) => m.name).join(', ')} | Prioritas: ${s.priorityScore}/100`).join('\n')}`;

      const reply = await callGeminiWithFallback(
        genAI,
        (model) => ({
          contents: promptContents,
          config: {
            systemInstruction
          }
        }),
        (text) => text || "Analisis strategi penetrasi sekolah AKTARA siap dikembangkan.",
        () => {
          return `**AKTARA Intelligence Copilot Analysis**\n\nBerdasarkan pantauan ${contextSchools?.length || 0} sekolah di wilayah **${currentFilter?.cityDistrict || 'Jawa Barat'}**:\n\n1. **Target Prioritas**: Prioritaskan sekolah dengan konsentrasi kejuruan IT/RPL/TKJ untuk program Bootcamp AI & Coding AKTARA.\n2. **Koridor Lapangan**: Kelompokkan rute audiensi berdasarkan kecamatan berdekatan guna efisiensi operasional tim representatif.\n3. **Penawaran Kemitraan**: Tawarkan integrasi kurikulum vokasi AI terstandarisasi industri serta program sertifikasi pendidik.`;
        }
      );

      return res.json({ reply });
    } catch (error: any) {
      console.error("Error in /api/ai/chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  // 4. Single School Deep-Dive Dossier & AI Pitch Strategy
  app.post("/api/ai/school-analysis", async (req, res) => {
    try {
      const { school } = req.body;
      if (!school) {
        return res.status(400).json({ error: "School data is required" });
      }

      const result = await callGeminiWithFallback(
        genAI,
        (model) => ({
          contents: `Lakukan analisis intelijen strategis (SWOT & Pitch Deck Recommendation) untuk sekolah berikut dari kacamata kemitraan AKTARA Group / AKTARA Academy:
Sekolah: ${school.name}
NPSN: ${school.npsn}
Status: ${school.status} | Jenis: ${school.type} | Akreditasi: ${school.accreditation}
Lokasi: ${school.address}, ${school.subDistrict}, ${school.cityDistrict}
Jumlah Siswa: ${school.totalStudents} (Putra: ${school.maleStudents}, Putri: ${school.femaleStudents})
Kepala Sekolah: ${school.principal}
Jurusan: ${school.majors?.map((m: any) => `${m.name} (${m.studentCount} siswa)`).join(', ')}

Berikan analisis JSON dengan:
1. summary: Ringkasan profil & potensi sekolah
2. swot: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }
3. tailoredPitchDeckPoints: string[] (3 poin argumen jual untuk kepala sekolah/yayasan)
4. recommendedCollaborationRoadmap: string[] (3 tahapan kolaborasi 6 bulan ke depan)
5. estimatedTalentPoolSize: number (Estimasi siswa IT/kreatif potensial)`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                swot: {
                  type: Type.OBJECT,
                  properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["strengths", "weaknesses", "opportunities", "threats"]
                },
                tailoredPitchDeckPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedCollaborationRoadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedTalentPoolSize: { type: Type.NUMBER }
              },
              required: ["summary", "swot", "tailoredPitchDeckPoints", "recommendedCollaborationRoadmap", "estimatedTalentPoolSize"]
            }
          }
        }),
        (rawText) => JSON.parse(rawText || "{}"),
        () => ({
          summary: `${school.name} merupakan institusi ${school.status} berakreditasi ${school.accreditation} di ${school.subDistrict}, ${school.cityDistrict} dengan total ${school.totalStudents} siswa. Memiliki reputasi kokoh pada kejuruan vokasi terapan.`,
          swot: {
            strengths: [`Basis siswa besar (${school.totalStudents} murid)`, `Akreditasi ${school.accreditation}`, `Lokasi strategis di wilayah ${school.subDistrict}`],
            weaknesses: [`Perlunya percepatan adopsi kurikulum kecerdasan buatan (AI)`, `Kebutuhan sertifikasi industri bagi tenaga pendidik`],
            opportunities: [`Peluang integrasi kelas industri AKTARA Academy`, `Tingginya serapan industri terhadap talenta digital terampil`],
            threats: [`Persaingan kompetensi lulusan di tingkat Jawa Barat`]
          },
          tailoredPitchDeckPoints: [
            `Akselerasi Kurikulum Vokasi Berbasis Artificial Intelligence standar industri.`,
            `Peluang Magang & Penyaluran Lulusan langsung ke jaringan industri AKTARA Group.`,
            `Sertifikasi Pendidik dan Siswa Berprestasi berskala nasional/internasional.`
          ],
          recommendedCollaborationRoadmap: [
            `Bulan 1: Penandatanganan MoU Kemitraan & Seminar AI Literacy seluruh siswa`,
            `Bulan 2-3: Pelatihan & Uji Kompetensi Guru Vokasi`,
            `Bulan 4-6: Pelaksanaan Kelas Industri AKTARA & Inkubasi Portofolio Siswa`
          ],
          estimatedTalentPoolSize: Math.round((school.totalStudents || 500) * 0.45)
        })
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/ai/school-analysis:", error);
      res.status(500).json({ error: error.message || "Failed to analyze school" });
    }
  });

  // Vite middleware for development vs static build in production
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');

  if (process.env.NODE_ENV === "production" && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    // Development mode or fallback to dynamic Vite dev server
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite middleware failed, falling back to static files if present:", viteErr);
      if (fs.existsSync(indexHtmlPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(indexHtmlPath);
        });
      }
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AKTARA Intelligence Copilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
