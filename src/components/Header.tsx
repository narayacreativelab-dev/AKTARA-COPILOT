import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Menu, 
  Bot, 
  Plus, 
  RotateCcw, 
  Download, 
  UploadCloud,
  Compass,
  Layers,
  MapPin,
  BarChart3,
  Table as TableIcon,
  Sparkles,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
  Sliders,
  HardDrive,
  LogOut,
  UserCheck,
  Flame
} from 'lucide-react';
import { RegionFilter, UserRole, AppBrandingConfig, AuthUser } from '../types';

interface HeaderProps {
  currentTab: 'summary' | 'map' | 'analytics' | 'table' | 'copilot';
  filteredCount: number;
  totalCount: number;
  filter: RegionFilter;
  onResetFilter: () => void;
  onOpenAddModal: () => void;
  onOpenBulkUpload: () => void;
  onOpenCopilot: () => void;
  onExportData: () => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  currentRole?: UserRole;
  onOpenSettings?: () => void;
  onOpenMobileSidebar: () => void;
  onOpenGoogleDrive?: () => void;
  branding?: AppBrandingConfig;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  filteredCount,
  totalCount,
  filter,
  onResetFilter,
  onOpenAddModal,
  onOpenBulkUpload,
  onOpenCopilot,
  onExportData,
  onExportPdf,
  isExportingPdf = false,
  currentRole = 'super_admin',
  onOpenSettings,
  onOpenMobileSidebar,
  onOpenGoogleDrive,
  branding,
  currentUser,
  onLogout
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const getTabInfo = () => {
    switch (currentTab) {
      case 'summary':
        return { title: 'Dashboard Executive Summary', icon: LayoutDashboard, desc: 'Ringkasan KPI demografi, penetrasi pasar, dan rekomendasi strategis AI' };
      case 'map':
        return { title: 'Peta Spasial (GIS)', icon: MapPin, desc: 'Pemetaan radius sekolah, sebaran populasi siswa, dan rute kemitraan' };
      case 'analytics':
        return { title: 'Data Analytics (BI)', icon: BarChart3, desc: 'Distribusi statistik, rasio gender, akreditasi, dan segmentasi kejuruan' };
      case 'table':
        return { title: 'Database Direktori Sekolah', icon: TableIcon, desc: 'Tabel data komprehensif, kontak kepala sekolah, dan status kemitraan' };
      case 'copilot':
        return { title: 'AI Intelligence Brief & Copilot', icon: Sparkles, desc: 'Analisis demografi otomatis, ringkasan eksekutif, dan rekomendasi strategis' };
    }
  };

  const currentTabInfo = getTabInfo();
  const Icon = currentTabInfo.icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2.5 sm:gap-3">
          
          {/* Left: Mobile Sidebar Toggle & Page Title / Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#EBF4F7] text-[#0D5C75] border border-[#CCE3EA] hidden sm:flex items-center justify-center font-bold shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                    {currentTabInfo.title}
                  </h1>
                  <span className="hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {filter.cityDistrict}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                  {currentTabInfo.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Metrics, Role Badge & Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Quick Metrics Badge */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 shrink-0">
              <Compass className="w-3.5 h-3.5 text-[#0D5C75]" />
              <span className="font-semibold text-slate-900">{filter.cityDistrict}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{filter.subDistrict}</span>
            </div>

            {/* Filter Count Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#EBF4F7] border border-[#CCE3EA] rounded-lg px-2.5 py-1.5 text-xs shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#0D5C75]" />
              <span className="text-slate-600 font-medium">Filter:</span>
              <span className="font-bold text-[#0D5C75]">{filteredCount}</span>
              <span className="text-slate-400">/ {totalCount}</span>
            </div>

            {/* Role Badge & Settings Quick Toggle */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Klik untuk membuka Pengaturan Role & Hak Akses"
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs cursor-pointer shrink-0 ${
                  currentRole === 'super_admin'
                    ? 'bg-[#FAF3DA] text-[#947518] border-[#F2E3B1] hover:bg-[#F2E3B1]'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {currentRole === 'super_admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#947518]" />
                    <span>Super Admin</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Role Tim</span>
                  </>
                )}
                <Sliders className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            )}

            {/* Cloud Firestore Status Badge */}
            <div 
              title="Database Cloud Firestore terhubung secara real-time (us-west1)"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs font-bold text-amber-800 shadow-2xs shrink-0"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Firestore Sync</span>
            </div>

            {/* Google Drive Cloud Integration Button */}
            {onOpenGoogleDrive && (
              <button
                onClick={onOpenGoogleDrive}
                title="Buka Google Drive Cloud Hub (Pencadangan, Ekspor, & Impor Spreadsheet)"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#0D5C75]" />
                <span className="hidden sm:inline">Google Drive</span>
              </button>
            )}

            {/* Action Buttons */}
            <button
              onClick={onResetFilter}
              title="Reset Filter"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onExportPdf && currentTab === 'summary' ? (
              <button
                onClick={onExportPdf}
                disabled={isExportingPdf}
                title="Ekspor Laporan Executive Summary ke Dokumen PDF"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-lg transition-colors border border-[#0D5C75]/30 shadow-2xs cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Ekspor PDF</span>
                  </>
                )}
              </button>
            ) : currentRole === 'super_admin' ? (
              <button
                onClick={onExportData}
                title="Ekspor CSV"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-2xs cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor CSV</span>
              </button>
            ) : null}

            {/* Super Admin Exclusive Action Buttons */}
            {currentRole === 'super_admin' && (
              <>
                <button
                  onClick={onOpenBulkUpload}
                  title="Upload Masal Data Sekolah (CSV/Excel)"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Masal</span>
                </button>

                <button
                  onClick={onOpenAddModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>

                <button
                  onClick={onOpenCopilot}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-lg shadow-sm border border-[#0D5C75]/20 transition-all cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="hidden sm:inline">AI Copilot</span>
                  <span className="sm:hidden">AI</span>
                </button>
              </>
            )}

            {/* User Account & Logout Action */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200 shrink-0">
                <div 
                  onClick={onOpenSettings}
                  className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-left cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
                  title="Klik untuk membuka Pengaturan Profil"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0D5C75] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 max-w-[120px]">
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate">
                      {currentUser.department}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Keluar / Logout dari Sesi Akun"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Konfirmasi Keluar (Logout)
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi ini? Anda dapat masuk kembali kapan saja dengan email atau akun demo.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
