import React from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Building2, 
  Users, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  FileText,
  Loader2,
  HardDrive
} from 'lucide-react';
import { AiExecutiveBrief, School, AppBrandingConfig } from '../types';

interface ExecutiveBriefCardProps {
  brief: AiExecutiveBrief | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectSchoolByName: (schoolName: string) => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  onOpenGoogleDrive?: () => void;
  branding?: AppBrandingConfig;
}

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({
  brief,
  isLoading,
  onRefresh,
  onSelectSchoolByName,
  onExportPdf,
  isExportingPdf = false,
  onOpenGoogleDrive,
  branding
}) => {
  if (!brief) return null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
      
      {/* Header with Title & Action Buttons */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          {branding?.logoUrl ? (
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1 overflow-hidden shrink-0">
              <img 
                src={branding.logoUrl} 
                alt={branding.appTitle || 'Logo'} 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#EBF4F7] border border-[#CCE3EA] flex items-center justify-center text-[#0D5C75] shrink-0">
              <Sparkles className="w-4 h-4 text-[#0D5C75]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {branding?.bannerHeadline || 'EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS'}
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#B38E22] border border-[#D4AF37]/35 tracking-wider">
                {branding?.badgeText || 'AKTARA COPILOT'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {branding?.bannerSubheadline || 'Analisis Intelijen Spasial & Rekomendasi Penetrasi Pasar Terpadu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Cadangkan atau Simpan Laporan ke Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-[#0D5C75]" />
              <span className="hidden sm:inline">Simpan ke Drive</span>
            </button>
          )}

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] border border-[#0D5C75]/20 rounded-lg transition-all disabled:opacity-60 cursor-pointer shadow-2xs hover:shadow-xs"
              title="Ekspor Laporan Executive Summary Lengkap ke Dokumen PDF"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Ekspor PDF Executive</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Analisis AI</span>
          </button>
        </div>
      </div>

      {/* 1. EXECUTIVE BRIEF (1 Paragraph) */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#0D5C75]" />
        <div className="flex items-start gap-3 pl-1">
          <div className="p-1 rounded-md bg-[#EBF4F7] text-[#0D5C75] shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-[#0D5C75]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                1. Executive Summary
              </h3>
              <span className="text-[10px] font-semibold text-[#0D5C75] bg-[#EBF4F7] px-1.5 py-0.2 rounded">
                AI Automated Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
              {brief.executiveBrief}
            </p>
          </div>
        </div>
      </div>

      {/* 2. KEY METRICS HIGHLIGHT */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#0D5C75]" />
          <span>2. Key Metrics Highlight</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Total Sekolah & Proporsi */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-[#0D5C75]/40 transition-all shadow-2xs min-h-[136px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium text-slate-600">Total Sekolah Terpantau</span>
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {brief.keyMetrics.totalSchools}{' '}
                <span className="text-xs font-normal text-slate-500">Unit Sekolah</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {brief.keyMetrics.negeriCount} Negeri ({brief.keyMetrics.negeriPercentage}%)
              </span>
              <span className="inline-flex items-center gap-1 text-[#947518] font-semibold bg-[#FAF3DA] px-2 py-0.5 rounded-md border border-[#F2E3B1] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                {brief.keyMetrics.swastaCount} Swasta ({brief.keyMetrics.swastaPercentage}%)
              </span>
            </div>
          </div>

          {/* Dominasi Pasar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-[#0D5C75]/40 transition-all shadow-2xs min-h-[136px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium text-slate-600">Dominasi Pasar Wilayah</span>
                <ShieldCheck className="w-4 h-4 text-[#0D5C75] shrink-0" />
              </div>
              <div className="text-base sm:text-lg font-bold text-[#07394A] leading-snug tracking-tight">
                {brief.keyMetrics.marketDominance}
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-normal line-clamp-2">
              <strong className="text-slate-700">Strategi:</strong> {brief.keyMetrics.negeriCount > brief.keyMetrics.swastaCount ? 'Penetrasi institusi negeri via Kelas Industri' : 'Akselerasi kemitraan swasta melalui kurikulum mandiri'}
            </div>
          </div>

          {/* Total Akumulasi Siswa */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-[#0D5C75]/40 transition-all shadow-2xs min-h-[136px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium text-slate-600">Total Akumulasi Siswa</span>
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {brief.keyMetrics.totalStudents.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Siswa Aktif</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <span className="font-medium text-slate-700 whitespace-nowrap">👦 Putra: {brief.keyMetrics.maleStudents.toLocaleString('id-ID')}</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="font-medium text-slate-700 whitespace-nowrap">👧 Putri: {brief.keyMetrics.femaleStudents.toLocaleString('id-ID')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. STRATEGIC RECOMMENDATIONS FOR AKTARA */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#0D5C75]" />
          <span>3. Strategic Recommendations for AKTARA</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {brief.strategicRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-2.5 hover:border-[#0D5C75]/40 hover:shadow-2xs transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-[#0D5C75] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TARGET SCHOOLS HIGHLIGHT */}
      {brief.targetSchoolsHighlight && brief.targetSchoolsHighlight.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span>Target Sekolah Prioritas Teridentifikasi</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {brief.targetSchoolsHighlight.map((target, idx) => (
              <div
                key={idx}
                onClick={() => onSelectSchoolByName(target.name)}
                className="bg-[#F8FAFC] border border-slate-200 hover:border-[#0D5C75]/50 rounded-xl p-3 cursor-pointer transition-all hover:bg-[#EBF4F7]/40 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-[#0D5C75] transition-colors">
                    {target.name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#0D5C75] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {target.subDistrict} • {target.studentCount.toLocaleString('id-ID')} Siswa
                </div>
                <div className="text-[11px] text-slate-700 mt-1.5 line-clamp-2">
                  <span className="font-semibold text-[#0D5C75]">Aksi:</span> {target.actionPlan}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
