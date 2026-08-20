import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  FileText, 
  Loader2, 
  Calendar, 
  Printer, 
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { School } from '../types';
import { requestSchoolAnalysis } from '../services/aiService';

interface SchoolDossierModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (schoolId: string, status: School['partnershipStatus']) => void;
}

export const SchoolDossierModal: React.FC<SchoolDossierModalProps> = ({
  school,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai-swot' | 'pitch' | 'roadmap'>('profile');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (!school || !isOpen) {
      setAiAnalysis(null);
      return;
    }

    // Fetch AI SWOT and Tailored Pitch Deck points with retry & fallback
    const fetchAiAnalysis = async () => {
      setIsLoadingAi(true);
      try {
        const data = await requestSchoolAnalysis(school);
        setAiAnalysis(data);
      } catch (err) {
        console.error('Error fetching school AI analysis:', err);
      } finally {
        setIsLoadingAi(false);
      }
    };

    fetchAiAnalysis();
  }, [school, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !school) return null;

  const isNegeri = school.status === 'Negeri';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#07394A] via-[#0D5C75] to-[#0a475b] text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                isNegeri ? 'bg-emerald-400 text-slate-950' : 'bg-[#D4AF37] text-slate-950'
              }`}>
                {school.type} {school.status}
              </span>
              <span className="text-xs text-slate-200">NPSN: {school.npsn}</span>
              <span className="text-xs bg-white/15 text-white px-2 py-0.5 rounded border border-white/20 font-semibold">
                Akreditasi {school.accreditation}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {school.name}
            </h2>
            <p className="text-xs text-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{school.address} ({school.subDistrict}, {school.cityDistrict})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Looker Studio Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-md font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Profil Demografi
          </button>
          <button
            onClick={() => setActiveTab('ai-swot')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai-swot'
                ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-md font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>🧠 Analisis SWOT AI</span>
          </button>
          <button
            onClick={() => setActiveTab('pitch')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-md font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>🎯 Tailored Pitch Deck</span>
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-md font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#0D5C75]" />
            <span>🗓️ Roadmap Kolaborasi</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* TAB 1: Profil Demografi */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Quick KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Siswa</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {school.totalStudents.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    👦 {school.maleStudents} | 👧 {school.femaleStudents}
                  </div>
                </div>

                <div className="bg-[#EBF4F7]/40 border border-[#CCE3EA] rounded-lg p-3">
                  <div className="text-[11px] text-[#0D5C75] font-semibold">AKTARA Fit Score</div>
                  <div className="text-xl font-black text-[#0D5C75] mt-0.5">
                    {school.aktaraCompatibility?.fitScore || 90}%
                  </div>
                  <div className="text-[10px] text-[#0D5C75] font-semibold mt-1">
                    Kesesuaian Sangat Tinggi
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-semibold">Kepala Sekolah</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {school.principal}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Pimpinan Utama</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] text-slate-500 font-semibold">Status Kemitraan</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">
                    {school.partnershipStatus}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">AKTARA CRM</div>
                </div>
              </div>

              {/* Majors Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Daftar Jurusan & Konsentrasi Keahlian</span>
                  <span className="text-xs text-slate-500">{school.majors?.length || 0} Program Keahlian</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {school.majors?.map((major, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{major.name}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#EBF4F7] text-[#0D5C75] font-semibold">
                          {major.category}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">
                        {major.studentCount.toLocaleString('id-ID')} Siswa
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Kontak Telepon:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0D5C75]" />
                    {school.phone}
                  </span>
                </div>
                {school.email && (
                  <div>
                    <span className="text-slate-500 block mb-0.5">Email Resmi:</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0D5C75]" />
                      {school.email}
                    </span>
                  </div>
                )}
                {school.website && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block mb-0.5">Website Resmi:</span>
                    <a 
                      href={school.website} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-semibold text-[#0D5C75] hover:underline flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#0D5C75]" />
                      {school.website}
                    </a>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Analisis SWOT AI */}
          {activeTab === 'ai-swot' && (
            <div className="space-y-4">
              {isLoadingAi ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0D5C75] mx-auto" />
                  <p className="text-xs">Menganalisis matriks SWOT sekolah menggunakan Gemini AI...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-[#EBF4F7] border border-[#CCE3EA] rounded-xl text-xs leading-relaxed text-[#07394A] font-medium">
                    {aiAnalysis.summary}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    {/* Strengths */}
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Kekuatan (Strengths)</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
                        {aiAnalysis.swot?.strengths?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="border border-[#F2E3B1] bg-[#FAF3DA]/40 rounded-xl p-3.5 space-y-2">
                      <div className="font-bold text-[#947518] flex items-center gap-1.5 text-xs">
                        <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                        <span>Kelemahan (Weaknesses)</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
                        {aiAnalysis.swot?.weaknesses?.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="border border-[#CCE3EA] bg-[#EBF4F7]/40 rounded-xl p-3.5 space-y-2">
                      <div className="font-bold text-[#0D5C75] flex items-center gap-1.5 text-xs">
                        <TrendingUp className="w-4 h-4 text-[#0D5C75]" />
                        <span>Peluang (Opportunities)</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
                        {aiAnalysis.swot?.opportunities?.map((o: string, i: number) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-3.5 space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        <span>Tantangan (Threats)</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
                        {aiAnalysis.swot?.threats?.map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500 py-8">
                  Analisis SWOT belum dimuat.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Tailored Pitch Deck */}
          {activeTab === 'pitch' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Argumen Negosiasi & Value Proposition:</span> Poin-poin spesifik yang direkomendasikan AI untuk tim Business Development AKTARA saat audiensi ke sekolah.
              </div>

              {isLoadingAi ? (
                <div className="py-8 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0D5C75] mx-auto mb-2" />
                  <span className="text-xs">Menyusun argumen pitch deck...</span>
                </div>
              ) : aiAnalysis?.tailoredPitchDeckPoints ? (
                <div className="space-y-2">
                  {aiAnalysis.tailoredPitchDeckPoints.map((point: string, idx: number) => (
                    <div key={idx} className="p-3.5 border border-slate-200 rounded-xl bg-white hover:border-[#0D5C75]/40 flex items-start gap-3 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-[#0D5C75] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {school.aktaraCompatibility?.recommendedPrograms?.map((prog, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                      {prog}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Roadmap Kolaborasi */}
          {activeTab === 'roadmap' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Rancangan Jadwal Kerjasama 6 Bulan:</span>
              </div>

              {aiAnalysis?.recommendedCollaborationRoadmap ? (
                <div className="space-y-2.5">
                  {aiAnalysis.recommendedCollaborationRoadmap.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl bg-white">
                      <Calendar className="w-5 h-5 text-[#0D5C75] shrink-0 mt-0.5" />
                      <div className="text-xs font-medium text-slate-800 leading-relaxed">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 border border-slate-200 rounded-lg text-xs">
                    Bulan 1: Penandatanganan MoU & Seminar AI Literacy untuk siswa
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg text-xs">
                    Bulan 2-3: Pelatihan & Sertifikasi Guru Vokasi
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg text-xs">
                    Bulan 4-6: Pelaksanaan Kelas Industri AKTARA & Penyaluran Magang
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Update Status:</span>
            <select
              value={school.partnershipStatus}
              onChange={(e) => onUpdateStatus(school.id, e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-md py-1 px-2 font-semibold text-slate-800"
            >
              <option value="Mitra Aktif">Mitra Aktif</option>
              <option value="Dijadwalkan">Dijadwalkan</option>
              <option value="Prospek">Prospek</option>
              <option value="Belum Dikunjungi">Belum Dikunjungi</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dossier</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
