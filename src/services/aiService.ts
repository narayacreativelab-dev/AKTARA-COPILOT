import { GoogleGenAI, Type } from '@google/genai';
import { School, RegionFilter, AiExecutiveBrief, ChatMessage } from '../types';

/**
 * Lazy-initialize client-side GoogleGenAI SDK instance
 * Uses VITE_GEMINI_API_KEY for Vite client SPA (e.g. Vercel deployment)
 */
function getGeminiClient(): GoogleGenAI | null {
  try {
    const apiKey = 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      '';

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }

    return new GoogleGenAI({ apiKey: apiKey.trim() });
  } catch (err) {
    console.warn('[AI Service] Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * Custom Fetch Wrapper with Timeout & Exponential Backoff Retry Mechanism
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: { retries?: number; timeoutMs?: number; backoffMs?: number } = {}
): Promise<Response> {
  const { retries = 2, timeoutMs = 12000, backoffMs = 600 } = config;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timerId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timerId);

      if (!response.ok && response.status >= 500 && attempt < retries) {
        throw new Error(`Server error HTTP ${response.status}`);
      }

      return response;
    } catch (err: any) {
      clearTimeout(timerId);
      lastError = err;

      if (options.signal?.aborted) {
        throw err;
      }

      if (attempt < retries) {
        const delay = backoffMs * Math.pow(1.5, attempt) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

/**
 * Generate Client-Side Heuristic Executive Brief
 * Used as a zero-latency or resilient offline fallback when Gemini API is unreachable
 */
export function generateClientHeuristicBrief(
  filteredSchools: School[],
  filter: RegionFilter
): AiExecutiveBrief {
  const totalSchools = filteredSchools.length;
  const negeriCount = filteredSchools.filter((s) => s.status === 'Negeri').length;
  const swastaCount = filteredSchools.filter((s) => s.status === 'Swasta').length;
  const totalStudents = filteredSchools.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
  const maleStudents = filteredSchools.reduce((acc, s) => acc + (s.maleStudents || 0), 0);
  const femaleStudents = filteredSchools.reduce((acc, s) => acc + (s.femaleStudents || 0), 0);
  const negeriPercentage = totalSchools > 0 ? Math.round((negeriCount / totalSchools) * 100) : 0;
  const swastaPercentage = totalSchools > 0 ? Math.round((swastaCount / totalSchools) * 100) : 0;
  const marketDominance =
    negeriCount >= swastaCount
      ? `Didominasi Sekolah Negeri (${negeriPercentage}% vs ${swastaPercentage}%)`
      : `Didominasi Sekolah Swasta (${swastaPercentage}% vs ${negeriPercentage}%)`;

  const sorted = [...filteredSchools].sort(
    (a, b) => (b.totalStudents || 0) - (a.totalStudents || 0)
  );
  const topSchool = sorted[0];

  const cityName = filter.cityDistrict && filter.cityDistrict !== 'Semua Kabupaten/Kota' ? filter.cityDistrict : 'Jawa Barat';
  const subDistrictName = filter.subDistrict && filter.subDistrict !== 'Semua Kecamatan' ? filter.subDistrict : 'Seluruh Kecamatan';

  return {
    executiveBrief: `Analisis demografi wilayah ${cityName} (${subDistrictName}) mengidentifikasi ${totalSchools} institusi pendidikan aktif dengan akumulasi ${totalStudents.toLocaleString('id-ID')} siswa (${maleStudents.toLocaleString('id-ID')} putra, ${femaleStudents.toLocaleString('id-ID')} putri). Komposisi pasar ${marketDominance} menawarkan peluang penetrasi strategis bagi AKTARA Academy melalui program akselerasi kurikulum AI, sertifikasi industri, dan link & match kerja vokasi.`,
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
    strategicRecommendations: [
      `Fokuskan penetrasi Kelas Industri AKTARA pada ${topSchool?.name || 'SMK klaster utama'} dengan basis ${topSchool?.totalStudents?.toLocaleString('id-ID') || 'ribuan'} siswa aktif.`,
      `Luncurkan penawaran program sertifikasi AI & Web Development untuk rumpun keahlian IT & Bisnis di klaster ${cityName}.`,
      `Bentuk koridor visitasi efisien dengan mengelompokkan 3-4 sekolah berdekatan per hari untuk efisiensi tim representatif AKTARA Group.`
    ],
    targetSchoolsHighlight: sorted.slice(0, 3).map((s) => ({
      name: s.name,
      subDistrict: s.subDistrict,
      studentCount: s.totalStudents,
      reason: `Sekolah ${s.status} berakreditasi ${s.accreditation} dengan ${s.totalStudents} siswa aktif dan jurusan potensial.`,
      actionPlan: `Tawarkan workshop digital orientation dan fasilitasi program magang industri AKTARA.`
    }))
  };
}

/**
 * Fetch Executive Brief Directly via Client-Side Gemini API (No backend 405 error on Vercel SPA)
 */
export async function requestExecutiveBrief(
  filteredSchools: School[],
  filter: RegionFilter,
  abortSignal?: AbortSignal
): Promise<AiExecutiveBrief> {
  const fallback = generateClientHeuristicBrief(filteredSchools, filter);

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // If no API key configured in client env, seamlessly use heuristic brief
      return fallback;
    }

    const totalSchools = filteredSchools.length;
    const totalStudents = filteredSchools.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
    const sampleSchools = filteredSchools.slice(0, 15).map(s => ({
      name: s.name,
      type: s.type,
      status: s.status,
      subDistrict: s.subDistrict,
      cityDistrict: s.cityDistrict,
      accreditation: s.accreditation,
      totalStudents: s.totalStudents,
      majors: s.majors || []
    }));

    const cityName = filter.cityDistrict || 'Jawa Barat';
    const subDistrictName = filter.subDistrict || 'Semua Kecamatan';

    const prompt = `Anda adalah AKTARA Executive Strategic Copilot untuk pimpinan AKTARA Group.
Buat analisis intelijen pasar dan ringkasan eksekutif komprehensif berdasarkan data sekolah berikut:
- Wilayah: ${cityName} (${subDistrictName})
- Total Sekolah Terfilter: ${totalSchools}
- Total Populasi Siswa: ${totalStudents}
- Sampel Data Sekolah: ${JSON.stringify(sampleSchools)}

Hasilkan JSON terstruktur sesuai format yang diminta dengan narasi profesional tingkat pimpinan (Bahasa Indonesia).`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 18000);
    });

    const apiCallPromise = ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveBrief: {
              type: Type.STRING,
              description: 'Naratif ringkasan eksekutif mendalam mengenai kondisi pasar dan peluang bisnis'
            },
            keyMetrics: {
              type: Type.OBJECT,
              properties: {
                totalSchools: { type: Type.INTEGER },
                negeriCount: { type: Type.INTEGER },
                swastaCount: { type: Type.INTEGER },
                totalStudents: { type: Type.INTEGER },
                maleStudents: { type: Type.INTEGER },
                femaleStudents: { type: Type.INTEGER },
                marketDominance: { type: Type.STRING },
                negeriPercentage: { type: Type.INTEGER },
                swastaPercentage: { type: Type.INTEGER }
              },
              required: ['totalSchools', 'negeriCount', 'swastaCount', 'totalStudents', 'marketDominance']
            },
            strategicRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 rekomendasi aksi taktis & strategis'
            },
            targetSchoolsHighlight: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  subDistrict: { type: Type.STRING },
                  studentCount: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                  actionPlan: { type: Type.STRING }
                },
                required: ['name', 'subDistrict', 'studentCount', 'reason', 'actionPlan']
              }
            }
          },
          required: ['executiveBrief', 'keyMetrics', 'strategicRecommendations', 'targetSchoolsHighlight']
        }
      }
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    const responseText = response.text;

    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed && parsed.executiveBrief) {
        return {
          ...fallback,
          ...parsed,
          keyMetrics: {
            ...fallback.keyMetrics,
            ...(parsed.keyMetrics || {})
          }
        };
      }
    }
  } catch (error) {
    console.warn('[AI Service] Gemini client brief error, falling back to heuristic:', error);
  }

  return fallback;
}

/**
 * Request AI Copilot Chat Directly via Client-Side Gemini API
 */
export async function requestAiChat(
  message: string,
  schools: School[],
  currentFilter: RegionFilter,
  conversationHistory: ChatMessage[] = [],
  abortSignal?: AbortSignal
): Promise<string> {
  const count = schools.length;
  const cityName = currentFilter.cityDistrict || 'Jawa Barat';
  const defaultReply = `**AKTARA Intelligence Copilot**\n\nBerdasarkan pantauan **${count} sekolah** di wilayah **${cityName}**:\n\n1. **Fokus Kejuruan IT/Digital**: Prioritaskan sosialisasi kurikulum AI pada SMK dengan jurusan RPL, TKJ, dan Bisnis Daring.\n2. **Efisiensi Rute Spasial**: Kelompokkan kunjungan audiensi per kecamatan berdekatan guna menghemat waktu tim perwakilan.\n3. **Paket Kemitraan**: Sediakan proposal terpadu berupa Workshop Guru AI, Magang Industri, dan Sertifikasi Talenta Siswa.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return defaultReply;
    }

    const schoolsContext = schools.slice(0, 20).map(s => ({
      name: s.name,
      type: s.type,
      status: s.status,
      subDistrict: s.subDistrict,
      cityDistrict: s.cityDistrict,
      students: s.totalStudents,
      accreditation: s.accreditation,
      majors: s.majors || []
    }));

    const historyContext = conversationHistory.slice(-4).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const prompt = `Anda adalah AKTARA School Mapping & Market Intelligence Copilot untuk pimpinan dan tim bisnis AKTARA Group di Jawa Barat (Garut, Bandung, dll).
Anda memberikan saran kemitraan pendidikan, kelas industri AI, sertifikasi kejuruan, dan rute visitasi lapangan.

Konteks Filter Saat Ini:
- Wilayah: ${cityName} (${currentFilter.subDistrict || 'Semua Kecamatan'})
- Jumlah Sekolah: ${count}
- Ringkasan Sampel Sekolah: ${JSON.stringify(schoolsContext)}

Riwayat Percakapan Terakhir:
${historyContext}

Pertanyaan Pengguna:
${message}

Jawablah secara terstruktur, percaya diri, profesional, berbasis data nyata, dan berikan langkah taktis bernilai tambah dalam Bahasa Indonesia.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 16000);
    });

    const apiCallPromise = ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    const text = response.text;

    if (text && text.trim()) {
      return text.trim();
    }
  } catch (error) {
    console.warn('[AI Service] Gemini chat error, returning fallback response:', error);
  }

  return defaultReply;
}

/**
 * Request Single School Deep Dive Analysis Directly via Client-Side Gemini API
 */
export async function requestSchoolAnalysis(
  school: School,
  abortSignal?: AbortSignal
): Promise<any> {
  const fallback = {
    summary: `${school.name} adalah institusi ${school.status} berakreditasi ${school.accreditation} di wilayah ${school.subDistrict}, ${school.cityDistrict} dengan total ${school.totalStudents} siswa aktif.`,
    swot: {
      strengths: [
        `Basis peserta didik besar (${school.totalStudents} siswa)`,
        `Akreditasi ${school.accreditation}`,
        `Lokasi strategis di ${school.subDistrict}`
      ],
      weaknesses: [
        `Perlunya akselerasi kurikulum AI dan teknologi digital modern`,
        `Kebutuhan sertifikasi pendidik vokasi berstandar industri`
      ],
      opportunities: [
        `Peluang integrasi program Kelas Industri & Bootcamp AKTARA`,
        `Tingginya permintaan mitra industri atas lulusan siap kerja`
      ],
      threats: [
        `Persaingan daya serap kerja antar lulusan kejuruan di Jawa Barat`
      ]
    },
    tailoredPitchDeckPoints: [
      `Integrasi Kurikulum Kecerdasan Buatan (AI) & Coding berstandar industri.`,
      `Program Magang & Penyaluran Kerja melalui ekosistem kemitraan AKTARA Group.`,
      `Sertifikasi Kompetensi Industri resmi untuk siswa dan tenaga pendidik.`
    ],
    recommendedCollaborationRoadmap: [
      `Bulan 1: Penandatanganan MoU & Seminar AI Literacy`,
      `Bulan 2-3: Workshop & Uji Kompetensi Guru Vokasi`,
      `Bulan 4-6: Pelaksanaan Kelas Industri AKTARA & Portofolio Siswa`
    ],
    estimatedTalentPoolSize: Math.round((school.totalStudents || 400) * 0.45)
  };

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return fallback;
    }

    const prompt = `Lakukan analisis SWOT mendalam dan strategi kemitraan untuk institusi sekolah berikut:
- Nama: ${school.name}
- Status / Tipe: ${school.type} ${school.status}
- NPSN: ${school.npsn}
- Akreditasi: ${school.accreditation}
- Lokasi: ${school.address}, ${school.subDistrict}, ${school.cityDistrict}
- Siswa: ${school.totalStudents} (Putra: ${school.maleStudents}, Putri: ${school.femaleStudents})
- Jurusan / Keahlian: ${school.majors?.join(', ') || 'Umum / Vokasi'}

Hasilkan analisis JSON terstruktur yang mencakup ringkasan eksekutif, SWOT (Strengths, Weaknesses, Opportunities, Threats), poin tailored pitch deck AKTARA, roadmap kolaborasi 6 bulan, dan perkiraan ukuran talent pool.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 16000);
    });

    const apiCallPromise = ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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
              required: ['strengths', 'weaknesses', 'opportunities', 'threats']
            },
            tailoredPitchDeckPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedCollaborationRoadmap: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedTalentPoolSize: { type: Type.INTEGER }
          },
          required: ['summary', 'swot', 'tailoredPitchDeckPoints', 'recommendedCollaborationRoadmap', 'estimatedTalentPoolSize']
        }
      }
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]);
    const responseText = response.text;

    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (parsed && parsed.swot) {
        return {
          ...fallback,
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn('[AI Service] Gemini school analysis error, returning fallback:', error);
  }

  return fallback;
}

/**
 * Parse Natural Language Query into Filter Object Directly via Client-Side Gemini or Local Heuristics
 */
export async function requestParseNlQuery(
  query: string,
  availableSchools: School[] = []
): Promise<Partial<RegionFilter>> {
  const q = query.toLowerCase();
  const fallbackFilter: Partial<RegionFilter> = {};

  // Simple local keywords matcher
  if (q.includes('negeri')) fallbackFilter.status = 'Negeri';
  else if (q.includes('swasta')) fallbackFilter.status = 'Swasta';

  if (q.includes('smk')) fallbackFilter.type = 'SMK';
  else if (q.includes('sma')) fallbackFilter.type = 'SMA';

  if (q.includes('garut')) fallbackFilter.cityDistrict = 'Kabupaten Garut';
  else if (q.includes('bandung')) fallbackFilter.cityDistrict = 'Kota Bandung';

  if (q.includes('tarogong kidul')) fallbackFilter.subDistrict = 'Tarogong Kidul';
  else if (q.includes('tarogong kaler')) fallbackFilter.subDistrict = 'Tarogong Kaler';
  else if (q.includes('karangpawitan')) fallbackFilter.subDistrict = 'Karangpawitan';

  if (q.includes('rpl') || q.includes('rekayasa perangkat lunak')) fallbackFilter.majorCategory = 'Teknologi Informasi & Komunikasi';
  else if (q.includes('tkj') || q.includes('jaringan')) fallbackFilter.majorCategory = 'Teknologi Informasi & Komunikasi';
  else if (q.includes('otomotif') || q.includes('tkro') || q.includes('tbsm')) fallbackFilter.majorCategory = 'Teknologi & Rekayasa';
  else if (q.includes('akuntansi') || q.includes('bisnis')) fallbackFilter.majorCategory = 'Bisnis & Manajemen';

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return fallbackFilter;
    }

    const prompt = `Anda adalah asisten parsing filter direktori sekolah.
Ekstrak parameter filter dari pertanyaan pengguna: "${query}".

Contoh opsi yang valid:
- status: "Negeri" | "Swasta" | "ALL"
- type: "SMK" | "SMA" | "ALL"
- cityDistrict: nama kabupaten/kota seperti "Kabupaten Garut", "Kota Bandung", atau "Semua Kabupaten/Kota"
- subDistrict: nama kecamatan spesifik atau "Semua Kecamatan"
- majorCategory: "Teknologi Informasi & Komunikasi" | "Teknologi & Rekayasa" | "Bisnis & Manajemen" | "Seni & Industri Kreatif" | "Semua Jurusan"
- searchQuery: kata kunci pencarian teks bebas (jika ada nama sekolah tertentu)`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini parse timeout')), 8000);
    });

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            type: { type: Type.STRING },
            cityDistrict: { type: Type.STRING },
            subDistrict: { type: Type.STRING },
            majorCategory: { type: Type.STRING },
            searchQuery: { type: Type.STRING }
          }
        }
      }
    });

    const res = await Promise.race([apiCall, timeoutPromise]);
    const text = res.text;
    if (text) {
      const parsed = JSON.parse(text);
      return { ...fallbackFilter, ...parsed };
    }
  } catch (err) {
    console.warn('[AI Service] NL Query parsing error, using heuristic fallback:', err);
  }

  return fallbackFilter;
}
