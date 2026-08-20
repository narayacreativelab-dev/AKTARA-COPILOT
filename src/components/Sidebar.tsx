import React from 'react';
import { 
  LayoutDashboard,
  MapPin, 
  BarChart3, 
  Table as TableIcon, 
  Sparkles, 
  Bot, 
  Plus, 
  RotateCcw, 
  Download, 
  UploadCloud,
  Compass,
  X,
  ShieldCheck,
  Users,
  Sliders,
  Lock,
  HardDrive,
  LogOut
} from 'lucide-react';
import { RegionFilter, UserRole, AppBrandingConfig, AuthUser } from '../types';
import { REGIONS_DATA } from '../data/schoolsData';

interface SidebarProps {
  currentTab: 'summary' | 'map' | 'analytics' | 'table' | 'copilot';
  setCurrentTab: (tab: 'summary' | 'map' | 'analytics' | 'table' | 'copilot') => void;
  filteredCount: number;
  totalCount: number;
  filter: RegionFilter;
  setFilter: React.Dispatch<React.SetStateAction<RegionFilter>>;
  onResetFilter: () => void;
  onOpenAddModal: () => void;
  onOpenBulkUpload: () => void;
  onOpenCopilot: () => void;
  onExportData: () => void;
  currentRole: UserRole;
  onOpenSettings: () => void;
  onOpenMobileSidebar: () => void;
  onOpenGoogleDrive?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  branding?: AppBrandingConfig;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  filteredCount,
  totalCount,
  filter,
  setFilter,
  onResetFilter,
  onOpenAddModal,
  onOpenBulkUpload,
  onOpenCopilot,
  onExportData,
  currentRole,
  onOpenSettings,
  onOpenGoogleDrive,
  isOpenMobile,
  onCloseMobile,
  branding,
  currentUser,
  onLogout
}) => {
  const handleCityChange = (city: string) => {
    setFilter(prev => ({
      ...prev,
      cityDistrict: city,
      subDistrict: 'Semua Kecamatan'
    }));
  };

  const handleSubDistrictChange = (subDistrict: string) => {
    setFilter(prev => ({
      ...prev,
      subDistrict
    }));
  };

  const subDistrictOptions = filter.cityDistrict && REGIONS_DATA.subDistrictsByCity[filter.cityDistrict as keyof typeof REGIONS_DATA.subDistrictsByCity]
    ? REGIONS_DATA.subDistrictsByCity[filter.cityDistrict as keyof typeof REGIONS_DATA.subDistrictsByCity]
    : ['Semua Kecamatan'];

  // All navigation items
  const allNavItems = [
    {
      id: 'summary' as const,
      label: 'Executive Summary',
      subtitle: 'Ringkasan KPI & Analisis AI',
      icon: LayoutDashboard,
      badge: 'AI LIVE',
      badgeColor: 'bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1]',
      color: 'text-[#0D5C75]',
      allowedRoles: ['super_admin', 'role_tim']
    },
    {
      id: 'map' as const,
      label: 'Peta Spasial (GIS)',
      subtitle: 'Market Mapping & Radius',
      icon: MapPin,
      badge: null,
      color: 'text-blue-600',
      allowedRoles: ['super_admin', 'role_tim']
    },
    {
      id: 'analytics' as const,
      label: 'Data Analytics (BI)',
      subtitle: 'Grafik & Distribusi Siswa',
      icon: BarChart3,
      badge: null,
      color: 'text-indigo-600',
      allowedRoles: ['super_admin', 'role_tim']
    },
    {
      id: 'table' as const,
      label: 'Database Sekolah',
      subtitle: 'Direktori & Profil Detail',
      icon: TableIcon,
      badge: `${filteredCount}`,
      color: 'text-slate-700',
      allowedRoles: ['super_admin'] // Locked for role_tim
    },
    {
      id: 'copilot' as const,
      label: 'AI Intelligence Brief',
      subtitle: 'Konsultasi & Asisten AI',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-[#D4AF37]/15 text-[#B38E22] border border-[#D4AF37]/30',
      color: 'text-[#0D5C75]',
      allowedRoles: ['super_admin'] // Locked for role_tim
    }
  ];

  // Filter based on active role
  const navItems = allNavItems.filter(item => item.allowedRoles.includes(currentRole));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200/80">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img 
                  src={branding.logoUrl} 
                  alt={branding.appTitle || 'Logo'} 
                  className="w-full h-full object-contain" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#0D5C75] flex items-center justify-center text-white font-black text-lg shadow-sm border border-[#0D5C75]/20 shrink-0">
                <span className="text-[#D4AF37] font-black text-xl">A</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-[#07394A] text-base tracking-tight truncate max-w-[130px]">
                  {branding?.appTitle || 'AKTARA'}
                </span>
                <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#B38E22] border border-[#D4AF37]/40 tracking-wider">
                  COPILOT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">
                {branding?.appTagline || 'School & Market Intelligence'}
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Navigation & Filter Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Main Navigation Links */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>Menu Utama</span>
            <span className="text-[10px] text-[#0D5C75] font-semibold">Looker BI</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all group ${
                    isActive
                      ? 'bg-[#EBF4F7] text-[#0D5C75] font-semibold border border-[#CCE3EA] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-[#0D5C75] text-white shadow-xs' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-[#0D5C75]/15 text-[#0D5C75]' : 'bg-slate-200 text-slate-700')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Region & Scope Quick Selector (Hidden/Commented Out per request) */}
        {/*
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Compass className="w-3.5 h-3.5 text-[#0D5C75]" />
              <span>Filter Wilayah</span>
            </div>
            <button
              onClick={onResetFilter}
              title="Reset Wilayah"
              className="text-[11px] text-[#0D5C75] hover:text-[#07394A] font-medium hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Kabupaten / Kota</label>
            <select
              value={filter.cityDistrict}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0D5C75]"
            >
              {REGIONS_DATA.cityDistricts.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Kecamatan</label>
            <select
              value={filter.subDistrict}
              onChange={(e) => handleSubDistrictChange(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0D5C75]"
            >
              {subDistrictOptions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sekolah Terpilih:</span>
            <span className="font-bold text-[#0D5C75] bg-[#EBF4F7] px-2 py-0.5 rounded border border-[#CCE3EA]">
              {filteredCount} / {totalCount}
            </span>
          </div>
        </div>
        */}

        {/* Quick Institutional Type Legend (Hidden/Commented Out per request) */}
        {/*
        <div className="px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Status Institusi</div>
          <div className="flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>SMK/SMA Negeri</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Negeri
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block"></span>
              <span>SMK/SMA Swasta</span>
            </div>
            <span className="text-[10px] font-bold text-[#B38E22] bg-[#FAF3DA] px-1.5 py-0.2 rounded border border-[#F2E3B1]">
              Swasta
            </span>
          </div>
        </div>
        */}

        {/* Quick Tools & Data Actions (Hidden/Commented Out per request - available in Settings & Header) */}
        {/*
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 flex items-center justify-between">
            <span>Aksi & Data</span>
            {currentRole === 'super_admin' ? (
              <span className="text-[10px] text-emerald-600 font-bold">Admin</span>
            ) : (
              <span className="text-[10px] text-indigo-600 font-bold">Tim</span>
            )}
          </div>

          {currentRole === 'super_admin' ? (
            <>
              <button
                onClick={() => {
                  onOpenAddModal();
                  onCloseMobile();
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sekolah Manual</span>
              </button>

              <button
                onClick={() => {
                  onOpenBulkUpload();
                  onCloseMobile();
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Masal (CSV/Excel)</span>
              </button>

              <button
                onClick={onExportData}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor Data CSV</span>
              </button>
            </>
          ) : (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-800">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hak Akses Terfokus</span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                Role Tim mengakses <strong>Dashboard Summary</strong>, <strong>Peta GIS</strong>, dan <strong>Analytics</strong>. Modul database & upload dikelola Super Admin.
              </p>
            </div>
          )}
        </div>
        */}

      </div>

      {/* Sidebar Footer: Active Role & Pengaturan Launcher */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
        
        {/* Active User Card & Settings / Logout Launcher */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                currentRole === 'super_admin' ? 'bg-[#0D5C75]' : 'bg-indigo-600'
              }`}>
                {currentRole === 'super_admin' ? (
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                ) : (
                  <Users className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold text-slate-900 truncate">
                  {currentUser ? currentUser.name : (currentRole === 'super_admin' ? 'Super Admin' : 'Role Tim')}
                </div>
                <div className="text-[9.5px] text-slate-500 truncate">
                  {currentUser ? `${currentUser.department} • ${currentRole === 'super_admin' ? 'Admin' : 'Tim'}` : (currentRole === 'super_admin' ? 'Akses Penuh (100%)' : 'Akses 3 Modul')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onOpenSettings();
                  onCloseMobile();
                }}
                title="Buka Pengaturan Role & Sistem"
                className="p-1.5 text-slate-500 hover:text-[#0D5C75] hover:bg-[#EBF4F7] rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              {onLogout && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onLogout();
                  }}
                  title="Keluar / Logout"
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => {
                onOpenSettings();
                onCloseMobile();
              }}
              className="py-1.5 px-2 text-[10.5px] font-bold text-slate-700 hover:text-[#0D5C75] bg-slate-50 hover:bg-[#EBF4F7] border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3 text-[#0D5C75]" />
              <span>Pengaturan</span>
            </button>

            {onOpenGoogleDrive && (
              <button
                onClick={() => {
                  onOpenGoogleDrive();
                  onCloseMobile();
                }}
                className="py-1.5 px-2 text-[10.5px] font-bold text-[#0D5C75] hover:text-[#07394A] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <HardDrive className="w-3 h-3 text-[#0D5C75]" />
                <span>Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Copilot (Only if super_admin) */}
        {currentRole === 'super_admin' && (
          <button
            onClick={() => {
              onOpenCopilot();
              onCloseMobile();
            }}
            className="w-full py-2 px-3 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs border border-[#0D5C75]/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Tanya AI Copilot</span>
          </button>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">GIS Engine v2.4</span>
          </div>
          <span className="text-[#0D5C75] font-bold uppercase tracking-wider text-[9px]">
            {currentRole === 'super_admin' ? 'Super Admin' : 'Tim Lapangan'}
          </span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-200 bg-white shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </div>
    </>
  );
};
