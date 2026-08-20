import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ExecutiveBriefCard } from './components/ExecutiveBriefCard';
import { ExecutiveSummaryCharts } from './components/ExecutiveSummaryCharts';
import { MapView } from './components/MapView';
import { AnalyticsView } from './components/AnalyticsView';
import { TableView } from './components/TableView';
import { SalesIntelligenceView } from './views/SalesIntelligenceView';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { SchoolDossierModal } from './components/SchoolDossierModal';
import { AddSchoolModal } from './components/AddSchoolModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { SettingsRoleModal } from './components/SettingsRoleModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { LoginPage } from './components/LoginPage';
import { INITIAL_SCHOOLS } from './data/schoolsData';
import { School, RegionFilter, AiExecutiveBrief, UserRole, TeamMember, AppBrandingConfig, DEFAULT_BRANDING, AuthUser } from './types';
import { exportExecutiveSummaryToPdf } from './utils/exportPdf';
import { requestExecutiveBrief, requestParseNlQuery } from './services/aiService';
import { useBranding } from './hooks/useBranding';
import { 
  subscribeSchools, 
  saveSchoolToFirestore, 
  updateSchoolStatusInFirestore, 
  bulkSaveSchoolsToFirestore,
  fetchTeamMembersFromFirestore,
  saveTeamMemberToFirestore,
  deleteTeamMemberFromFirestore,
  testFirebaseConnection,
  logoutFirebaseUser,
  clearAllSchoolsFromFirestore,
  restoreSampleSchoolsToFirestore
} from './services/firebase';
import { 
  Bot, 
  Sparkles, 
  MapPin, 
  BarChart3, 
  Table as TableIcon, 
  CheckCircle2, 
  X,
  LayoutDashboard,
  ArrowRight,
  Eye,
  Target,
  Compass,
  Building2,
  Users,
  Flame,
  PlusCircle,
  Trophy
} from 'lucide-react';

const DEFAULT_FILTER: RegionFilter = {
  province: 'Jawa Barat',
  cityDistrict: 'Kabupaten Garut',
  subDistrict: 'Semua Kecamatan',
  status: 'ALL',
  type: 'ALL',
  studentScale: 'ALL',
  majorCategory: 'Semua Jurusan',
  accreditation: 'Semua Akreditasi',
  partnershipStatus: 'Semua Status Kemitraan',
  searchQuery: ''
};

export default function App() {
  const [schools, setSchools] = useState<School[]>(() => {
    const saved = localStorage.getItem('aktara_schools_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SCHOOLS;
      }
    }
    return INITIAL_SCHOOLS;
  });

  const [filter, setFilter] = useState<RegionFilter>(DEFAULT_FILTER);
  const [currentTab, setCurrentTab] = useState<'summary' | 'map' | 'analytics' | 'sales' | 'table' | 'copilot'>('summary');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [executiveBrief, setExecutiveBrief] = useState<AiExecutiveBrief | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Authenticated User Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const localSaved = localStorage.getItem('aktara_auth_user');
    if (localSaved) {
      try {
        return JSON.parse(localSaved);
      } catch (e) {
        console.error('Failed to parse local auth user', e);
      }
    }
    const sessionSaved = sessionStorage.getItem('aktara_auth_user');
    if (sessionSaved) {
      try {
        return JSON.parse(sessionSaved);
      } catch (e) {
        console.error('Failed to parse session auth user', e);
      }
    }
    return null;
  });

  // Role Access State (super_admin vs role_tim)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (currentUser?.role) return currentUser.role;
    const saved = localStorage.getItem('aktara_user_role');
    return (saved === 'role_tim' || saved === 'super_admin') ? saved : 'super_admin';
  });

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('aktara_team_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: '1',
        name: 'Direktur Eksekutif AKTARA',
        email: 'executive@aktara.id',
        role: 'super_admin',
        department: 'Executive Board',
        lastActive: 'Sekarang'
      },
      {
        id: '2',
        name: 'Budi Pratama, S.Pd',
        email: 'budi.pratama@aktara.id',
        role: 'role_tim',
        department: 'Tim Lapangan Garut',
        lastActive: '10 menit lalu'
      },
      {
        id: '3',
        name: 'Siti Rahmawati, M.M',
        email: 'siti.rahmawati@aktara.id',
        role: 'role_tim',
        department: 'Surveyor Kemitraan Wilayah',
        lastActive: '1 jam lalu'
      }
    ];
  });

  // Handle User Login
  const handleLoginSuccess = (user: AuthUser, rememberMe: boolean) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('aktara_user_role', user.role);

    if (rememberMe) {
      localStorage.setItem('aktara_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('aktara_auth_user', JSON.stringify(user));
      localStorage.removeItem('aktara_auth_user');
    }

    setToastMessage(`Selamat datang, ${user.name}! Masuk sebagai ${user.role === 'super_admin' ? 'Super Admin' : 'Role Tim'}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle User Logout
  const handleLogout = () => {
    logoutFirebaseUser().catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('aktara_auth_user');
    sessionStorage.removeItem('aktara_auth_user');
    setIsSettingsOpen(false);
    setIsCopilotOpen(false);
    setIsDossierOpen(false);
    setIsAddModalOpen(false);
    setIsBulkUploadOpen(false);
    setIsGoogleDriveOpen(false);
    setToastMessage('Anda telah berhasil keluar dari sesi sistem.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Persist role & team members to localStorage
  useEffect(() => {
    localStorage.setItem('aktara_user_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('aktara_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  // Branding Customization Hook (Persistent to Firestore settings/branding + Real-time sync + Local Cache)
  const { 
    branding, 
    updateBranding, 
    resetBranding, 
    isLoading: isBrandingLoading, 
    isSaving: isBrandingSaving 
  } = useBranding();

  // Firestore Realtime Synchronization on Mount
  useEffect(() => {
    testFirebaseConnection();

    // 1. Subscribe to real-time school updates from Firestore
    const unsubscribeSchools = subscribeSchools((firestoreSchools) => {
      setSchools(firestoreSchools || []);
      localStorage.setItem('aktara_schools_data', JSON.stringify(firestoreSchools || []));
    });

    // 2. Fetch cloud team members
    fetchTeamMembersFromFirestore().then((cloudMembers) => {
      if (cloudMembers && cloudMembers.length > 0) {
        setTeamMembers(cloudMembers);
        localStorage.setItem('aktara_team_members', JSON.stringify(cloudMembers));
      }
    });

    return () => {
      unsubscribeSchools();
    };
  }, []);

  const handleClearSampleData = async () => {
    if (currentRole !== 'super_admin') {
      setToastMessage('Akses ditolak: Hanya Super Admin yang dapat mengosongkan database.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const deletedCount = await clearAllSchoolsFromFirestore();
    setSchools([]);
    localStorage.setItem('aktara_schools_data', JSON.stringify([]));
    setToastMessage(`Database berhasil dibersihkan. ${deletedCount} data sampel telah dihapus dari Firestore.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRestoreSampleData = async () => {
    if (currentRole !== 'super_admin') {
      setToastMessage('Akses ditolak: Hanya Super Admin yang dapat memuat ulang data sampel.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const count = await restoreSampleSchoolsToFirestore();
    setToastMessage(`Berhasil memuat ulang ${count} data sekolah sampel ke Firestore.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleUpdateBranding = async (newBranding: AppBrandingConfig) => {
    try {
      await updateBranding(newBranding);
      setToastMessage('Logo & Banner instansi berhasil disinkronkan ke Firestore (settings/branding)!');
    } catch (e) {
      setToastMessage('Pengaturan disimpan ke cache lokal.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetBranding = async () => {
    try {
      await resetBranding();
      setToastMessage('Branding & banner telah di-reset ke nilai default.');
    } catch (e) {
      setToastMessage('Reset selesai.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Role Change
  const handleChangeRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      if (localStorage.getItem('aktara_auth_user')) {
        localStorage.setItem('aktara_auth_user', JSON.stringify(updated));
      } else if (sessionStorage.getItem('aktara_auth_user')) {
        sessionStorage.setItem('aktara_auth_user', JSON.stringify(updated));
      }
    }
    if (newRole === 'role_tim' && (currentTab === 'table' || currentTab === 'copilot')) {
      setCurrentTab('summary');
    }
    setToastMessage(
      newRole === 'super_admin'
        ? 'Mode wewenang diubah: Super Admin (Akses Penuh Seluruh Sistem)'
        : 'Mode wewenang diubah: Role Tim (Akses: Dashboard Summary, Peta GIS, Analytics)'
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Team members handlers
  const handleAddTeamMember = (newMem: Omit<TeamMember, 'id' | 'lastActive'>) => {
    const newEntry: TeamMember = {
      ...newMem,
      id: Date.now().toString(),
      lastActive: 'Baru saja ditambahkan'
    };
    setTeamMembers(prev => [...prev, newEntry]);
    saveTeamMemberToFirestore(newEntry).catch((err) => console.warn('Cloud team sync fallback:', err));
    setToastMessage(`Anggota "${newMem.name}" berhasil ditambahkan sebagai ${newMem.role === 'super_admin' ? 'Super Admin' : 'Role Tim'}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateMemberRole = (id: string, newRole: UserRole) => {
    setTeamMembers(prev => prev.map(m => {
      if (m.id === id) {
        const updated = { ...m, role: newRole };
        saveTeamMemberToFirestore(updated).catch((err) => console.warn('Cloud team update fallback:', err));
        return updated;
      }
      return m;
    }));
    setToastMessage('Role anggota tim berhasil diperbarui.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    deleteTeamMemberFromFirestore(id).catch((err) => console.warn('Cloud team delete fallback:', err));
    setToastMessage('Anggota tim telah dihapus.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persist schools to localStorage when updated
  useEffect(() => {
    localStorage.setItem('aktara_schools_data', JSON.stringify(schools));
  }, [schools]);

  // Filter schools logic
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      // 1. City / District
      if (filter.cityDistrict !== 'Semua Kabupaten/Kota' && school.cityDistrict !== filter.cityDistrict) {
        return false;
      }

      // 2. Sub-district
      if (filter.subDistrict !== 'Semua Kecamatan' && school.subDistrict !== filter.subDistrict) {
        return false;
      }

      // 3. Status (Negeri vs Swasta)
      if (filter.status !== 'ALL' && school.status !== filter.status) {
        return false;
      }

      // 4. Type (SMK vs SMA)
      if (filter.type !== 'ALL' && school.type !== filter.type) {
        return false;
      }

      // 5. Student Scale
      if (filter.studentScale === 'Large' && school.totalStudents <= 1000) return false;
      if (filter.studentScale === 'Medium' && (school.totalStudents < 500 || school.totalStudents > 1000)) return false;
      if (filter.studentScale === 'Small' && school.totalStudents >= 500) return false;

      // 6. Major Category
      if (filter.majorCategory !== 'Semua Jurusan') {
        const hasMajor = school.majors?.some(m => m.category === filter.majorCategory);
        if (!hasMajor) return false;
      }

      // 7. Accreditation
      if (filter.accreditation !== 'Semua Akreditasi' && school.accreditation !== filter.accreditation) {
        return false;
      }

      // 8. Partnership Status
      if (filter.partnershipStatus !== 'Semua Status Kemitraan' && school.partnershipStatus !== filter.partnershipStatus) {
        return false;
      }

      // 9. Search Query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchName = school.name.toLowerCase().includes(q);
        const matchNpsn = school.npsn.toLowerCase().includes(q);
        const matchPrincipal = school.principal.toLowerCase().includes(q);
        const matchMajor = school.majors?.some(m => m.name.toLowerCase().includes(q));
        if (!matchName && !matchNpsn && !matchPrincipal && !matchMajor) {
          return false;
        }
      }

      return true;
    });
  }, [schools, filter]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.cityDistrict !== 'Semua Kabupaten/Kota') count++;
    if (filter.subDistrict !== 'Semua Kecamatan') count++;
    if (filter.status !== 'ALL') count++;
    if (filter.type !== 'ALL') count++;
    if (filter.studentScale !== 'ALL') count++;
    if (filter.majorCategory !== 'Semua Jurusan') count++;
    if (filter.accreditation !== 'Semua Akreditasi') count++;
    if (filter.partnershipStatus !== 'Semua Status Kemitraan') count++;
    if (filter.searchQuery.trim()) count++;
    return count;
  }, [filter]);

  // Generate / Refresh AI Executive Brief with timeout and retry
  const fetchExecutiveBrief = async () => {
    setIsLoadingBrief(true);
    try {
      const briefData = await requestExecutiveBrief(filteredSchools, filter);
      setExecutiveBrief(briefData);
    } catch (err) {
      console.warn('Unhandled exception during AI brief generation:', err);
    } finally {
      setIsLoadingBrief(false);
    }
  };

  // Re-generate brief when filtered schools change
  useEffect(() => {
    fetchExecutiveBrief();
  }, [filter.cityDistrict, filter.subDistrict, filter.status, filter.type, filteredSchools.length]);

  // Natural Language Query Handler with client-side Gemini and heuristics
  const handleParseNlQuery = async (query: string) => {
    setIsParsingNl(true);
    try {
      const parsedFilters = await requestParseNlQuery(query, schools);
      if (parsedFilters && Object.keys(parsedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          ...parsedFilters
        }));
      }
    } catch (err) {
      console.warn('Error parsing NL query:', err);
    } finally {
      setIsParsingNl(false);
    }
  };

  // Export filtered data as CSV
  const handleExportData = () => {
    if (filteredSchools.length === 0) return;

    const headers = [
      'NPSN',
      'Nama Sekolah',
      'Tingkat',
      'Status',
      'Provinsi',
      'Kabupaten/Kota',
      'Kecamatan',
      'Total Siswa',
      'Siswa Putra',
      'Siswa Putri',
      'Akreditasi',
      'Kepala Sekolah',
      'Status Kemitraan',
      'Jurusan'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredSchools.map(s => [
        `"${s.npsn}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.type}"`,
        `"${s.status}"`,
        `"${s.province}"`,
        `"${s.cityDistrict}"`,
        `"${s.subDistrict}"`,
        s.totalStudents,
        s.maleStudents,
        s.femaleStudents,
        `"${s.accreditation}"`,
        `"${(s.principal || '').replace(/"/g, '""')}"`,
        `"${s.partnershipStatus}"`,
        `"${s.majors?.map(m => m.name).join('; ') || ''}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AKTARA_School_Intelligence_${filter.cityDistrict}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Executive Summary with AI Brief & Visual Charts to PDF
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setToastMessage('Sedang menyusun dokumen PDF Executive Brief & Visual Charts...');
    try {
      await exportExecutiveSummaryToPdf({
        brief: executiveBrief,
        schools: filteredSchools,
        filter: filter,
        elementIdToCapture: 'executive-summary-charts-container',
        branding: branding
      });
      setToastMessage('Dokumen PDF Executive Summary berhasil diunduh.');
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      setToastMessage('Gagal mengekspor PDF. Silakan coba kembali.');
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  // Quick actions
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setIsDossierOpen(true);
  };

  const handleOpenPitch = (school: School) => {
    setSelectedSchool(school);
    setIsDossierOpen(true);
  };

  const handleLocateOnMap = (school: School) => {
    setSelectedSchool(school);
    setCurrentTab('map');
  };

  const handleUpdateStatus = (schoolId: string, newStatus: School['partnershipStatus']) => {
    setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, partnershipStatus: newStatus } : s));
    updateSchoolStatusInFirestore(schoolId, newStatus).catch((err) => {
      console.warn('Firestore status update fallback:', err);
    });
  };

  const handleAddSchool = (newSchool: School) => {
    setSchools(prev => [newSchool, ...prev]);
    saveSchoolToFirestore(newSchool).catch((err) => {
      console.warn('Firestore school save fallback:', err);
    });
    setToastMessage(`Sekolah "${newSchool.name}" berhasil ditambahkan dan disinkronkan ke Cloud.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleBulkImport = (importedSchools: School[], conflictMode: 'update' | 'skip' | 'create_new') => {
    let updatedList: School[] = [];
    let updatedCount = 0;
    let addedCount = 0;

    if (conflictMode === 'update') {
      const importedMap = new Map<string, School>();
      importedSchools.forEach(s => {
        const key = (s.npsn || s.name).trim().toLowerCase();
        importedMap.set(key, s);
      });

      const existingProcessedKeys = new Set<string>();

      // Update existing entries
      updatedList = schools.map(curr => {
        const key = (curr.npsn || curr.name).trim().toLowerCase();
        if (importedMap.has(key)) {
          updatedCount++;
          const matched = importedMap.get(key)!;
          existingProcessedKeys.add(key);
          return { ...curr, ...matched, id: curr.id };
        }
        return curr;
      });

      // Prepend brand new entries
      importedSchools.forEach(s => {
        const key = (s.npsn || s.name).trim().toLowerCase();
        if (!existingProcessedKeys.has(key)) {
          addedCount++;
          updatedList.unshift(s);
        }
      });
    } else if (conflictMode === 'skip') {
      const existingKeys = new Set(schools.map(s => (s.npsn || s.name).trim().toLowerCase()));
      const trulyNew = importedSchools.filter(s => !existingKeys.has((s.npsn || s.name).trim().toLowerCase()));
      addedCount = trulyNew.length;
      updatedList = [...trulyNew, ...schools];
    } else {
      // create_new mode
      addedCount = importedSchools.length;
      updatedList = [...importedSchools, ...schools];
    }

    setSchools(updatedList);
    bulkSaveSchoolsToFirestore(updatedList).catch((err) => {
      console.warn('Firestore bulk save fallback:', err);
    });
    
    const message = conflictMode === 'update' 
      ? `Sukses memproses ${importedSchools.length} sekolah (${addedCount} data baru ditambahkan, ${updatedCount} data diperbarui ke Cloud Firestore).`
      : `Sukses menambahkan ${addedCount} data sekolah ke database Cloud Firestore AKTARA.`;

    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleSelectSchoolByName = (name: string) => {
    const target = schools.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
    if (target) {
      handleSelectSchool(target);
    }
  };

  // If user is not authenticated, render dedicated Login Portal Page
  if (!currentUser) {
    return (
      <LoginPage
        branding={branding}
        teamMembers={teamMembers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-[#0D5C75] selection:text-white relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-gradient-to-r from-[#07394A] to-[#0D5C75] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#D4AF37]/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span className="text-xs font-medium leading-tight">{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Sidebar Navigation (Looker Studio BI Enterprise Architecture) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        filteredCount={filteredSchools.length}
        totalCount={schools.length}
        filter={filter}
        setFilter={setFilter}
        onResetFilter={() => setFilter(DEFAULT_FILTER)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onExportData={handleExportData}
        currentRole={currentRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        branding={branding}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Workspace (Offset on desktop by sidebar width) */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-h-screen w-full min-w-0">
        
        {/* Top Header with Breadcrumb, Actions, and Mobile Toggle */}
        <Header
          currentTab={currentTab}
          filteredCount={filteredSchools.length}
          totalCount={schools.length}
          filter={filter}
          onResetFilter={() => setFilter(DEFAULT_FILTER)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onExportData={handleExportData}
          onExportPdf={handleExportPdf}
          isExportingPdf={isExportingPdf}
          currentRole={currentRole}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
          branding={branding}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Hierarchical Filter Bar & NLP Search - Shown on Map, Analytics, Table & Copilot views */}
        {currentTab !== 'summary' && (
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            onParseNlQuery={handleParseNlQuery}
            isParsingNl={isParsingNl}
            activeFilterCount={activeFilterCount}
            onReset={() => setFilter(DEFAULT_FILTER)}
          />
        )}

        {/* Main Workspace Canvas */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 flex-1">
          
          {/* Looker Studio Top KPI & Executive AI Brief Card */}
          <ExecutiveBriefCard
            brief={executiveBrief}
            isLoading={isLoadingBrief}
            onRefresh={fetchExecutiveBrief}
            onSelectSchoolByName={handleSelectSchoolByName}
            onExportPdf={handleExportPdf}
            isExportingPdf={isExportingPdf}
            onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
            branding={branding}
          />

          {/* View Canvas Modes */}
          {currentTab === 'summary' && (
            <div className="space-y-5">
              
              {/* Visual Charts Bar & Pie Distribution Section */}
              <ExecutiveSummaryCharts
                schools={filteredSchools}
                onSelectSchool={handleSelectSchool}
              />
              
              {/* Quick Navigation / Module Access Cards */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Modul Intelijen & Eksplorasi Data</span>
                  <span className="text-[11px] text-[#0D5C75] font-semibold">
                    {currentRole === 'super_admin' ? 'Akses Penuh Super Admin (4 Modul)' : 'Akses Eksplorasi Tim'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  <div 
                    onClick={() => setCurrentTab('sales')}
                    className="bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/90 hover:border-amber-500 rounded-xl p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                        <span>Sales Intelligence</span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">LEADERBOARD</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Leaderboard tim lapangan, pipeline funnel konversi B2B/B2G, dan progress target kuota wilayah.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-800">
                      <span>Buka Sales Intelligence</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setCurrentTab('map')}
                    className="bg-white border border-slate-200/90 hover:border-[#0D5C75] rounded-xl p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-[#0D5C75] group-hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0D5C75] transition-colors">
                        Peta Spasial (GIS)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Eksplorasi peta interaktif, radius penetrasi, dan sebaran lokasi sekolah.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D5C75]">
                      <span>Buka Peta GIS</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setCurrentTab('analytics')}
                    className="bg-white border border-slate-200/90 hover:border-[#0D5C75] rounded-xl p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-[#0D5C75] group-hover:text-white transition-colors">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0D5C75] transition-colors">
                        Data Analytics (BI)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Grafik demografi siswa, distribusi gender, akreditasi, dan proporsi jurusan.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D5C75]">
                      <span>Buka Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {currentRole === 'role_tim' ? (
                    <div 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-emerald-50/70 border border-emerald-200/90 hover:border-emerald-500 rounded-xl p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-emerald-950 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          <span>Input Canvassing</span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">+ Baru</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Entri data sekolah baru hasil canvassing lapangan langsung tersinkron ke database Cloud.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span>Buka Form Input</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setCurrentTab('table')}
                      className="bg-white border border-slate-200/90 hover:border-[#0D5C75] rounded-xl p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-[#0D5C75] group-hover:text-white transition-colors">
                          <TableIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0D5C75] transition-colors">
                          Database Direktori
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Direktori lengkap {filteredSchools.length} sekolah, kontak kepala sekolah, dan pitch generator.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D5C75]">
                        <span>Lihat Database</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Priority Strategic Target Schools Highlight */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1] flex items-center justify-center font-bold">
                      <Target className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Target Sekolah Prioritas Wilayah Terpilih
                      </h3>
                      <p className="text-xs text-slate-500">
                        Daftar sekolah dengan skor kompatibilitas tertinggi untuk program kemitraan AKTARA
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentTab('table')}
                    className="text-xs font-semibold text-[#0D5C75] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Semua ({filteredSchools.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSchools
                    .sort((a, b) => (b.aktaraCompatibility?.fitScore || 0) - (a.aktaraCompatibility?.fitScore || 0))
                    .slice(0, 6)
                    .map((school) => (
                      <div
                        key={school.id}
                        onClick={() => handleSelectSchool(school)}
                        className="bg-slate-50 hover:bg-[#EBF4F7]/40 border border-slate-200 hover:border-[#0D5C75]/40 rounded-xl p-3.5 cursor-pointer transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              school.status === 'Negeri' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1]'
                            }`}>
                              {school.type} {school.status}
                            </span>
                            <span className="text-[11px] font-bold text-[#0D5C75] bg-white border border-[#CCE3EA] px-2 py-0.5 rounded-md shadow-2xs">
                              Fit {school.aktaraCompatibility?.fitScore || 85}%
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0D5C75] transition-colors line-clamp-1">
                            {school.name}
                          </h4>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{school.subDistrict}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">{school.totalStudents.toLocaleString('id-ID')} Siswa</span>
                          </div>

                          {school.majors && school.majors.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {school.majors.slice(0, 2).map((m, idx) => (
                                <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                                  {m.name}
                                </span>
                              ))}
                              {school.majors.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{school.majors.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {school.partnershipStatus}
                          </span>
                          <span className="font-bold text-[#0D5C75] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                            <Eye className="w-3 h-3" />
                            <span>Buka Dossier</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

          {/* View Canvas Modes */}
          {currentTab === 'map' && (
            <MapView
              schools={filteredSchools}
              selectedSchool={selectedSchool}
              onSelectSchool={handleSelectSchool}
              onOpenPitch={handleOpenPitch}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              schools={filteredSchools}
              onSelectSchool={handleSelectSchool}
            />
          )}

          {currentTab === 'sales' && (
            <SalesIntelligenceView
              schools={schools}
              teamMembers={teamMembers}
              currentUser={currentUser}
              currentRole={currentRole}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onSelectSchool={handleSelectSchool}
              onOpenDossier={handleOpenPitch}
              onBackToDashboard={() => setCurrentTab('summary')}
            />
          )}

          {currentTab === 'table' && (
            currentRole === 'super_admin' ? (
              <TableView
                schools={filteredSchools}
                onSelectSchool={handleSelectSchool}
                onOpenPitch={handleOpenPitch}
                onLocateOnMap={handleLocateOnMap}
                onUpdateStatus={handleUpdateStatus}
                onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs max-w-xl mx-auto my-12">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Akses Modul Terbatas untuk Role Tim</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sesuai konfigurasi sistem hak akses, <strong>Role Tim</strong> hanya memiliki akses ke <strong>Dashboard Executive Summary</strong>, <strong>Peta Spasial (GIS)</strong>, dan <strong>Data Analytics (BI)</strong>. Modul Database Direktori Sekolah dikhususkan untuk <strong>Super Admin</strong>.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => setCurrentTab('summary')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Kembali ke Executive Summary
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'copilot' && (
            currentRole === 'super_admin' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D5C75] to-[#07394A] flex items-center justify-center text-[#D4AF37] font-bold shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">AKTARA Intelligence Copilot Center</h3>
                    <p className="text-xs text-slate-500">
                      Konsultasi Demografi Pendidikan, Pemetaan Spasial, dan Strategi Penetrasi Pasar Vokasi
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FAF3DA]/40 border border-[#F2E3B1] rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-[#947518] uppercase tracking-wider">Perintah Analisis Cepat</span>
                    <p className="text-xs text-slate-600">
                      Klik tombol di bawah untuk membuka laci Copilot interaktif dengan analisis terstruktur 4-poin:
                    </p>
                    <button
                      onClick={() => setIsCopilotOpen(true)}
                      className="w-full py-2.5 px-3 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Buka Chat Copilot Interaktif</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Format Standar Output Copilot:</span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                      <li><strong>1. Executive Brief:</strong> 1 paragraf ringkasan kondisi spasial.</li>
                      <li><strong>2. Key Metrics Highlight:</strong> Total sekolah, dominasi, akumulasi siswa.</li>
                      <li><strong>3. Strategic Recommendation:</strong> 3 aksi bisnis konkret AKTARA.</li>
                      <li><strong>4. Filter Parser:</strong> Konversi bahasa alami ke objek JSON filter.</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs max-w-xl mx-auto my-12">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Akses Copilot Khusus Super Admin</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fitur AI Copilot & Konsultasi Strategis dikonfigurasi untuk wewenang Super Admin. Anggota Role Tim dapat menggunakan visualisasi ringkasan pada Executive Summary, Peta GIS, dan Analisis BI.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={() => setCurrentTab('summary')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Kembali ke Executive Summary
                  </button>
                </div>
              </div>
            )
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Copyright @PT AKTARA</span>
              <span>•</span>
              <span>{branding.organizationName || 'PT AKTARA EDUKASI INDONESIA'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Looker Studio BI Architecture</span>
              <span>•</span>
              <span>Jawa Barat Regional Database</span>
            </div>
          </div>
        </footer>

      </div>

      {/* 5. Drawers & Modals */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        schools={filteredSchools}
        currentFilter={filter}
        onApplyParsedFilter={(parsed) => setFilter(prev => ({ ...prev, ...parsed }))}
      />

      <SchoolDossierModal
        school={selectedSchool}
        isOpen={isDossierOpen}
        onClose={() => {
          setIsDossierOpen(false);
          setSelectedSchool(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSchool={handleAddSchool}
        onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
        currentUser={currentUser}
        teamMembers={teamMembers}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onBulkImport={handleBulkImport}
        existingSchools={schools}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
      />

      <SettingsRoleModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRole={currentRole}
        onChangeRole={handleChangeRole}
        teamMembers={teamMembers}
        onAddTeamMember={handleAddTeamMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onDeleteMember={handleDeleteMember}
        branding={branding}
        onUpdateBranding={handleUpdateBranding}
        onResetBranding={handleResetBranding}
        currentUser={currentUser}
        onLogout={handleLogout}
        schoolsCount={schools.length}
        onClearSampleData={handleClearSampleData}
        onRestoreSampleData={handleRestoreSampleData}
        onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
        onOpenAddSchool={() => setIsAddModalOpen(true)}
      />

      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        schools={schools}
        filteredSchools={filteredSchools}
        currentFilter={filter}
        executiveBrief={executiveBrief}
        branding={branding}
        onImportSchools={handleBulkImport}
      />

    </div>
  );
}
