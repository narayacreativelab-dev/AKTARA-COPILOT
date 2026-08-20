import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  X, 
  UserPlus, 
  Sparkles, 
  Sliders, 
  AlertCircle,
  Check,
  Building2,
  Trash2,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Type,
  Eye,
  EyeOff,
  RotateCcw,
  Palette,
  FileImage,
  Save,
  Tag,
  FileText,
  LogOut,
  UserCheck,
  UserX,
  Database,
  AlertTriangle,
  Loader2,
  HardDriveDownload,
  Plus,
  FileSpreadsheet,
  Mail,
  KeyRound,
  Send,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Edit3
} from 'lucide-react';
import { UserRole, TeamMember, AppBrandingConfig, DEFAULT_BRANDING, AuthUser, AppUserRecord } from '../types';
import { 
  createTeamUserViaSecondaryApp, 
  sendUserPasswordReset, 
  subscribeUsers, 
  updateUserRoleInFirestore, 
  toggleUserStatusInFirestore, 
  deleteUserFromFirestore,
  getDefaultDepartmentForRole 
} from '../services/firebase';

interface SettingsRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onChangeRole: (newRole: UserRole) => void;
  teamMembers: TeamMember[];
  onAddTeamMember: (member: Omit<TeamMember, 'id' | 'lastActive'>) => void;
  onUpdateMemberRole: (id: string, role: UserRole) => void;
  onDeleteMember: (id: string) => void;
  branding: AppBrandingConfig;
  onUpdateBranding: (branding: AppBrandingConfig) => void;
  onResetBranding: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  schoolsCount?: number;
  onClearSampleData?: () => Promise<void>;
  onRestoreSampleData?: () => Promise<void>;
  onOpenBulkUpload?: () => void;
  onOpenAddSchool?: () => void;
}

export const SettingsRoleModal: React.FC<SettingsRoleModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onChangeRole,
  teamMembers,
  onAddTeamMember,
  onUpdateMemberRole,
  onDeleteMember,
  branding,
  onUpdateBranding,
  onResetBranding,
  currentUser,
  onLogout,
  schoolsCount = 0,
  onClearSampleData,
  onRestoreSampleData,
  onOpenBulkUpload,
  onOpenAddSchool
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'database' | 'roles' | 'matrix' | 'members'>('branding');
  
  // User Management State (Firestore users/{uid} & Firebase Auth)
  const [usersList, setUsersList] = useState<AppUserRecord[]>(() => {
    return teamMembers.map((m) => ({
      id: m.id,
      uid: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      department: m.department,
      status: m.status || 'active',
      createdAt: m.createdAt || new Date().toISOString(),
      avatarBg: m.avatarBg || 'bg-[#0D5C75]'
    }));
  });

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserPassword, setFormUserPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formUserRole, setFormUserRole] = useState<UserRole>('tim_lapangan');
  const [formUserDept, setFormUserDept] = useState(getDefaultDepartmentForRole('tim_lapangan'));

  const [userActionMessage, setUserActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'super_admin' | 'tim_lapangan' | 'surveyor' | 'role_tim'>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  const [resetPasswordLoadingEmail, setResetPasswordLoadingEmail] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AppUserRecord | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>('tim_lapangan');
  const [editUserDept, setEditUserDept] = useState('');
  const [isSavingRoleEdit, setIsSavingRoleEdit] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUserRecord | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Database management state
  const [isClearingData, setIsClearingData] = useState(false);
  const [isRestoringData, setIsRestoringData] = useState(false);
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState('');
  const [dbActionMessage, setDbActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local state for branding form
  const [formBranding, setFormBranding] = useState<AppBrandingConfig>(branding);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when modal opens or prop changes
  useEffect(() => {
    setFormBranding(branding);
  }, [branding, isOpen]);

  // Subscribe to real-time users collection in Firestore
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeUsers(
      (firestoreUsers) => {
        if (firestoreUsers && firestoreUsers.length > 0) {
          setUsersList(firestoreUsers);
        } else if (teamMembers && teamMembers.length > 0) {
          setUsersList(teamMembers.map((m) => ({
            id: m.id,
            uid: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            department: m.department,
            status: m.status || 'active',
            createdAt: m.createdAt || new Date().toISOString(),
            avatarBg: m.avatarBg || 'bg-[#0D5C75]'
          })));
        }
      },
      (err) => {
        console.warn('Firestore users subscription fallback:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, teamMembers]);

  // Listen for Escape key press to close modal smoothly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        if (showClearConfirmDialog) {
          setShowClearConfirmDialog(false);
          return;
        }
        if (editingUser) {
          setEditingUser(null);
          return;
        }
        if (deleteConfirmUser) {
          setDeleteConfirmUser(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showClearConfirmDialog, editingUser, deleteConfirmUser, onClose]);

  // Auto update department suggestion when role changes in add form
  const handleRoleSelectionChange = (newRole: UserRole) => {
    setFormUserRole(newRole);
    setFormUserDept(getDefaultDepartmentForRole(newRole));
  };

  // Submit Handler: Add User via secondary Firebase Auth App + Firestore users/{uid}
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMessage(null);

    const cleanName = formUserName.trim();
    const cleanEmail = formUserEmail.trim().toLowerCase();
    const cleanPassword = formUserPassword.trim();
    const cleanDept = formUserDept.trim() || getDefaultDepartmentForRole(formUserRole);

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setUserActionMessage({ type: 'error', text: 'Nama lengkap, email, dan kata sandi awal wajib diisi.' });
      return;
    }

    if (cleanPassword.length < 6) {
      setUserActionMessage({ type: 'error', text: 'Kata sandi awal minimal 6 karakter kombinasi.' });
      return;
    }

    setIsCreatingUser(true);
    try {
      const newUser = await createTeamUserViaSecondaryApp({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: formUserRole,
        department: cleanDept
      });

      // User is synced in real-time via subscribeUsers without mutating local Super Admin session

      setUserActionMessage({
        type: 'success',
        text: `Akun "${cleanEmail}" (${newUser.role.toUpperCase()}) berhasil dibuat di Firebase Auth & disinkronkan ke Firestore users/${newUser.uid}. Super Admin tetap aktif masuk.`
      });

      // Reset form
      setFormUserName('');
      setFormUserEmail('');
      setFormUserPassword('');
      setShowAddUserForm(false);
    } catch (err: any) {
      console.error('Error creating user via secondary app:', err);
      setUserActionMessage({
        type: 'error',
        text: err?.message || 'Gagal membuat akun pengguna. Silakan periksa kembali data Anda.'
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Reset Password Handler via Firebase Auth SDK (sendPasswordResetEmail)
  const handleTriggerPasswordReset = async (targetEmail: string, userName: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    setUserActionMessage(null);
    setResetPasswordLoadingEmail(cleanEmail);
    try {
      await sendUserPasswordReset(cleanEmail);
      setUserActionMessage({
        type: 'success',
        text: `Email instruksi reset kata sandi telah berhasil dikirim ke ${cleanEmail} (${userName}) melalui Firebase Auth.`
      });
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setUserActionMessage({
        type: 'error',
        text: err?.message || `Gagal mengirim email reset kata sandi ke ${cleanEmail}.`
      });
    } finally {
      setResetPasswordLoadingEmail(null);
    }
  };

  // Edit Role & Department Handler
  const handleOpenEditRole = (user: AppUserRecord) => {
    setEditingUser(user);
    setEditUserRole(user.role);
    setEditUserDept(user.department || getDefaultDepartmentForRole(user.role));
  };

  const handleSaveEditRole = async () => {
    if (!editingUser) return;

    setIsSavingRoleEdit(true);
    try {
      await updateUserRoleInFirestore(editingUser.id, editUserRole, editUserDept);
      onUpdateMemberRole(editingUser.id, editUserRole);

      // Local update
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, role: editUserRole, department: editUserDept, updatedAt: new Date().toISOString() }
            : u
        )
      );

      setUserActionMessage({
        type: 'success',
        text: `Wewenang akun ${editingUser.email} berhasil diperbarui menjadi ${editUserRole.toUpperCase()} di Firestore.`
      });
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating role in Firestore:', err);
      setUserActionMessage({
        type: 'error',
        text: 'Gagal memperbarui wewenang pengguna di Firestore.'
      });
    } finally {
      setIsSavingRoleEdit(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleUserStatus = async (user: AppUserRecord) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await toggleUserStatusInFirestore(user.id, newStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      setUserActionMessage({
        type: 'info',
        text: `Status akun ${user.email} diubah menjadi ${newStatus === 'active' ? 'AKTIF' : 'NONAKTIF'}.`
      });
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setUserActionMessage({
        type: 'error',
        text: 'Gagal mengubah status akun pengguna di Firestore.'
      });
    }
  };

  // Delete User Confirmation & Execution
  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    setIsDeletingUser(true);
    try {
      await deleteUserFromFirestore(deleteConfirmUser.id);
      onDeleteMember(deleteConfirmUser.id);

      setUsersList((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      setUserActionMessage({
        type: 'success',
        text: `Akun ${deleteConfirmUser.email} berhasil dihapus dari koleksi Firestore users/{uid}.`
      });
      setDeleteConfirmUser(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setUserActionMessage({
        type: 'error',
        text: 'Gagal menghapus akun pengguna dari Firestore.'
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Logo file processor (converts to base64 data URL)
  const handleLogoFile = (file: File) => {
    setUploadError(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format file tidak didukung. Harap upload format PNG, JPG, SVG, atau WebP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi 5MB. Harap gunakan file gambar yang lebih ringkas.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setFormBranding(prev => ({
          ...prev,
          logoUrl: e.target?.result as string
        }));
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormBranding(prev => ({
      ...prev,
      logoUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Banner file processor (converts to base64 data URL)
  const handleBannerFile = (file: File) => {
    setBannerUploadError(null);

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBannerUploadError('Format file banner tidak didukung. Harap upload PNG, JPG, atau WebP.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setBannerUploadError('Ukuran file banner melebihi 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setFormBranding(prev => ({
          ...prev,
          bannerUrl: e.target?.result as string,
          bannerImageUrl: e.target?.result as string
        }));
      }
    };
    reader.onerror = () => {
      setBannerUploadError('Gagal membaca file gambar banner.');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBannerFile(file);
    }
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(true);
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleBannerFile(file);
    }
  };

  const handleRemoveBanner = () => {
    setFormBranding(prev => ({
      ...prev,
      bannerUrl: '',
      bannerImageUrl: ''
    }));
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
  };

  // Database clear & restore handlers
  const handleExecuteClearData = async () => {
    if (!onClearSampleData) return;
    setIsClearingData(true);
    setDbActionMessage(null);
    try {
      await onClearSampleData();
      setShowClearConfirmDialog(false);
      setConfirmInputText('');
      setDbActionMessage({
        type: 'success',
        text: 'Seluruh data sekolah sampel berhasil dihapus dari Firestore. Database kini siap diisi data riil dari nol!'
      });
    } catch (err: any) {
      setDbActionMessage({
        type: 'error',
        text: `Gagal membersihkan database: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
    } finally {
      setIsClearingData(false);
    }
  };

  const handleExecuteRestoreData = async () => {
    if (!onRestoreSampleData) return;
    setIsRestoringData(true);
    setDbActionMessage(null);
    try {
      await onRestoreSampleData();
      setDbActionMessage({
        type: 'success',
        text: '30 data sekolah sampel standar Jawa Barat berhasil dimuat ulang ke Firestore!'
      });
    } catch (err: any) {
      setDbActionMessage({
        type: 'error',
        text: `Gagal memuat ulang data sampel: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
    } finally {
      setIsRestoringData(false);
    }
  };

  // Save branding changes
  const handleSaveBranding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateBranding(formBranding);
    setIsSaveSuccess(true);
    setTimeout(() => setIsSaveSuccess(false), 3500);
  };

  // Reset branding to factory default
  const handleResetToDefault = () => {
    setFormBranding(DEFAULT_BRANDING);
    onResetBranding();
    setIsSaveSuccess(true);
    setTimeout(() => setIsSaveSuccess(false), 3500);
  };

  // Presets for quick headline templates
  const headlinePresets = [
    {
      label: 'Ekspansi Garut & Jawa Barat',
      headline: 'EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS',
      subheadline: 'Analisis Intelijen Spasial & Rekomendasi Penetrasi Pasar Terpadu',
      badge: 'GARUT & JABAR EXPANSION',
      tagline: 'School & Market Intelligence System'
    },
    {
      label: 'Kemitraan Vokasi & Industri',
      headline: 'PEMETAAN KEMITRAAN SEKOLAH & LINK AND MATCH INDUSTRI',
      subheadline: 'Dashboard Analisis Potensi Kerjasama Siswa SMK & SMA dengan Dunia Usaha/Industri',
      badge: 'VOKASI INDUSTRY 4.0',
      tagline: 'Vocational Education Partnership Platform'
    },
    {
      label: 'Monitoring PPDB & SPMB',
      headline: 'INTELIJEN DEMOGRAFI KELULUSAN & SEBARAN CALON SISWA',
      subheadline: 'Pemetaan Spasial Kapasitas Sekolah, Akreditasi, dan Konsentrasi Jurusan Prioritas',
      badge: 'PPDB & SPMB RADAR',
      tagline: 'Student Enrollment & Demographics'
    }
  ];

  const applyPreset = (preset: typeof headlinePresets[0]) => {
    setFormBranding(prev => ({
      ...prev,
      bannerHeadline: preset.headline,
      bannerSubheadline: preset.subheadline,
      badgeText: preset.badge,
      appTagline: preset.tagline
    }));
  };

  const permissionMatrix = [
    {
      module: 'Dashboard Executive Summary',
      description: 'Melihat ringkasan eksekutif, KPI utama, visualisasi donat/bar, dan ekspor PDF',
      superAdmin: true,
      roleTim: true,
      category: 'Modul Utama'
    },
    {
      module: 'Peta Spasial (GIS)',
      description: 'Eksplorasi peta interaktif, radius penetrasi, filter spasial, dan sebaran koordinat',
      superAdmin: true,
      roleTim: true,
      category: 'Modul Utama'
    },
    {
      module: 'Data Analytics (BI)',
      description: 'Grafik demografi siswa, rasio gender, sebaran akreditasi, dan proporsi jurusan',
      superAdmin: true,
      roleTim: true,
      category: 'Modul Utama'
    },
    {
      module: 'Database Direktori Sekolah',
      description: 'Akses tabel lengkap seluruh sekolah, kontak kepala sekolah, dan dossier detail',
      superAdmin: true,
      roleTim: false,
      category: 'Modul Database'
    },
    {
      module: 'AI Intelligence Copilot',
      description: 'Konsultasi interaktif dengan Gemini AI, instruksi pencarian kustom, dan pitch generator',
      superAdmin: true,
      roleTim: false,
      category: 'Fitur AI'
    },
    {
      module: 'Tambah Sekolah Manual',
      description: 'Menambahkan data institusi baru ke dalam database sistem secara manual',
      superAdmin: true,
      roleTim: false,
      category: 'Operasi Data'
    },
    {
      module: 'Upload Masal (CSV / Excel)',
      description: 'Mengimpor puluhan hingga ratusan data sekolah sekaligus menggunakan file spreadsheet',
      superAdmin: true,
      roleTim: false,
      category: 'Operasi Data'
    },
    {
      module: 'Ekspor Data Mentah (CSV)',
      description: 'Mengunduh seluruh database sekolah terfilter ke format spreadsheet CSV',
      superAdmin: true,
      roleTim: false,
      category: 'Operasi Data'
    },
    {
      module: 'Pengaturan Role & Hak Akses',
      description: 'Mengelola hak akses tim, mengubah konfigurasi wewenang, dan menambah anggota',
      superAdmin: true,
      roleTim: false,
      category: 'Administrasi'
    },
    {
      module: 'Pengaturan Logo & Headline Banner',
      description: 'Mengubah logo instansi, judul aplikasi, dan headline banner eksekutif',
      superAdmin: true,
      roleTim: false,
      category: 'Administrasi'
    }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 relative z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#07394A] to-[#0D5C75] text-white flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Pengaturan Sistem & Personalisasi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F2E3B1] border border-[#D4AF37]/40 uppercase tracking-wide">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-normal mt-0.5">
                Kelola <strong>Logo & Headline Banner</strong>, wewenang <strong>Role Akses</strong>, dan daftar <strong>Anggota Tim</strong>.
              </p>
            </div>
          </div>
          {/* Tombol Close Modal (Silang X) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Tutup Pengaturan"
            className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer relative z-50 focus:outline-none focus:ring-2 focus:ring-white/50 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto sticky top-[80px] z-30">
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/70'
            }`}
          >
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span>Logo & Headline Banner</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/70'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Database Sekolah ({schoolsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#0D5C75]" />
            <span>Role Aktif ({currentRole === 'super_admin' ? 'Super Admin' : 'Role Tim'})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/70'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Matriks Izin</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/70'
            }`}
          >
            <Users className="w-4 h-4 text-[#0D5C75]" />
            <span>Manajemen Pengguna & Akses Tim ({usersList.length})</span>
            {currentRole !== 'super_admin' && (
              <Lock className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 0: LOGO & HEADLINE BANNER CUSTOMIZATION */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              
              {/* Success Notification Banner */}
              {isSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="font-semibold">
                    Pengaturan Logo & Headline Banner berhasil diperbarui dan disimpan ke sistem!
                  </div>
                </div>
              )}

              {/* SECTION 1: UPLOAD LOGO APLIKASI & BANNER INSTANSI */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF4F7] text-[#0D5C75] flex items-center justify-center font-bold">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Logo & Banner Visual Instansi</h4>
                      <p className="text-xs text-slate-500">
                        Upload logo instansi dan banner header untuk disinkronkan secara permanen ke Firebase Firestore (<code className="text-[#0D5C75] font-bold">settings/branding</code>).
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Firestore: settings/branding</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item 1: Logo Instansi */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#0D5C75]" />
                        <span>Logo Utama Instansi</span>
                      </span>
                      {formBranding.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                        {formBranding.logoUrl ? (
                          <img 
                            src={formBranding.logoUrl} 
                            alt="Logo Aplikasi" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-[#0D5C75] flex items-center justify-center text-white shadow-2xs">
                            <span className="text-[#D4AF37] font-black text-xl">A</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-all ${
                            isDraggingLogo 
                              ? 'border-[#0D5C75] bg-[#EBF4F7]/60' 
                              : 'border-slate-300 hover:border-[#0D5C75] bg-white'
                          }`}
                        >
                          <Upload className="w-4 h-4 text-[#0D5C75] mx-auto mb-1" />
                          <div className="text-[11px] font-bold text-slate-700">Pilih / Drag Logo</div>
                          <div className="text-[9.5px] text-slate-400">PNG, JPG, SVG, WebP (maks 5MB)</div>
                        </div>
                      </div>
                    </div>

                    {/* Optional URL Input for Logo */}
                    <div>
                      <input
                        type="url"
                        placeholder="Atau tempel URL gambar logo..."
                        value={formBranding.logoUrl?.startsWith('data:') ? '' : (formBranding.logoUrl || '')}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C75] text-slate-700"
                      />
                    </div>

                    {uploadError && (
                      <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 p-1.5 bg-rose-50 rounded border border-rose-100">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>

                  {/* Item 2: Banner Instansi / Header Image */}
                  <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileImage className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Banner Header / Background</span>
                      </span>
                      {(formBranding.bannerUrl || formBranding.bannerImageUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveBanner}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 h-16 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1 overflow-hidden shrink-0 bg-slate-100">
                        {(formBranding.bannerUrl || formBranding.bannerImageUrl) ? (
                          <img 
                            src={formBranding.bannerUrl || formBranding.bannerImageUrl} 
                            alt="Banner Instansi" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-r from-[#07394A] to-[#0D5C75] flex items-center justify-center text-white p-1 text-center">
                            <span className="text-[9px] font-bold text-[#F2E3B1] leading-tight">Default Gradient</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <input 
                          ref={bannerFileInputRef}
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp" 
                          onChange={handleBannerFileChange}
                          className="hidden" 
                        />
                        <div
                          onDragOver={handleBannerDragOver}
                          onDragLeave={handleBannerDragLeave}
                          onDrop={handleBannerDrop}
                          onClick={() => bannerFileInputRef.current?.click()}
                          className={`border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-all ${
                            isDraggingBanner 
                              ? 'border-[#0D5C75] bg-[#EBF4F7]/60' 
                              : 'border-slate-300 hover:border-[#0D5C75] bg-white'
                          }`}
                        >
                          <Upload className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                          <div className="text-[11px] font-bold text-slate-700">Pilih / Drag Banner</div>
                          <div className="text-[9.5px] text-slate-400">Rasio horizontal (maks 8MB)</div>
                        </div>
                      </div>
                    </div>

                    {/* Optional URL Input for Banner */}
                    <div>
                      <input
                        type="url"
                        placeholder="Atau tempel URL gambar banner..."
                        value={(formBranding.bannerUrl?.startsWith('data:') ? '' : (formBranding.bannerUrl || ''))}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, bannerUrl: e.target.value, bannerImageUrl: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C75] text-slate-700"
                      />
                    </div>

                    {bannerUploadError && (
                      <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 p-1.5 bg-rose-50 rounded border border-rose-100">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{bannerUploadError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: EDIT HEADLINE BANNER & TEKS IDENTITAS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF3DA] text-[#947518] flex items-center justify-center font-bold">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Edit Headline Banner & Teks Identitas</h4>
                      <p className="text-xs text-slate-500">
                        Kustomisasi teks banner ringkasan eksekutif, judul aplikasi, dan sub-headline.
                      </p>
                    </div>
                  </div>

                  {/* Preset Selector */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Template Cepat:</span>
                    <select
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        if (!isNaN(idx) && headlinePresets[idx]) {
                          applyPreset(headlinePresets[idx]);
                        }
                      }}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:ring-1 focus:ring-[#0D5C75] cursor-pointer"
                    >
                      <option value="">Pilih Preset...</option>
                      {headlinePresets.map((p, idx) => (
                        <option key={idx} value={idx}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3.5">
                  
                  {/* Headline Banner Utama */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Headline Banner Eksekutif (H1) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">{formBranding.bannerHeadline.length} karakter</span>
                    </label>
                    <input
                      type="text"
                      value={formBranding.bannerHeadline}
                      onChange={(e) => setFormBranding(prev => ({ ...prev, bannerHeadline: e.target.value }))}
                      placeholder="Contoh: EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS"
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-slate-900"
                    />
                  </div>

                  {/* Sub-headline Banner */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Sub-headline / Deskripsi Banner *</span>
                      <span className="text-[10px] text-slate-400 font-normal">{formBranding.bannerSubheadline.length} karakter</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formBranding.bannerSubheadline}
                      onChange={(e) => setFormBranding(prev => ({ ...prev, bannerSubheadline: e.target.value }))}
                      placeholder="Contoh: Analisis Intelijen Spasial & Rekomendasi Penetrasi Pasar Terpadu"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-slate-800"
                    />
                  </div>

                  {/* 2-column Grid for App Title & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Aplikasi (App Title)
                      </label>
                      <input
                        type="text"
                        value={formBranding.appTitle}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, appTitle: e.target.value }))}
                        placeholder="Contoh: AKTARA INTELLIGENCE"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Badge Teks Banner
                      </label>
                      <input
                        type="text"
                        value={formBranding.badgeText}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, badgeText: e.target.value }))}
                        placeholder="Contoh: GARUT & JABAR EXPANSION"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-[#947518] font-bold"
                      />
                    </div>
                  </div>

                  {/* 2-column Grid for Tagline & Organization Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tagline Aplikasi (Sidebar)
                      </label>
                      <input
                        type="text"
                        value={formBranding.appTagline}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, appTagline: e.target.value }))}
                        placeholder="Contoh: School & Market Intelligence System"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Institusi / Perusahaan (PDF)
                      </label>
                      <input
                        type="text"
                        value={formBranding.organizationName}
                        onChange={(e) => setFormBranding(prev => ({ ...prev, organizationName: e.target.value }))}
                        placeholder="Contoh: PT AKTARA EDUKASI INDONESIA"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] text-slate-700 font-semibold"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3: LIVE INTERACTIVE PREVIEW */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0D5C75]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Live Preview Banner & Header
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tampilan Real-time</span>
                </div>

                {/* Banner Simulation Card */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      {formBranding.logoUrl ? (
                        <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center p-1 bg-white shrink-0">
                          <img src={formBranding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#EBF4F7] border border-[#CCE3EA] flex items-center justify-center text-[#0D5C75] font-bold shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                            {formBranding.bannerHeadline || 'EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS'}
                          </h2>
                          <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#B38E22] border border-[#D4AF37]/35 tracking-wider">
                            {formBranding.badgeText || 'AKTARA COPILOT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {formBranding.bannerSubheadline || 'Analisis Intelijen Spasial & Rekomendasi Penetrasi Pasar Terpadu'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-slate-600 text-[11px] leading-relaxed">
                    Ringkasan eksekutif dan rekomendasi strategis akan tampil di bawah banner ini secara otomatis.
                  </div>
                </div>

              </div>

              {/* Action Buttons for Branding Tab */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Default Pabrik</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBranding()}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>Simpan Perubahan Branding</span>
                </button>
              </div>

            </div>
          )}
          
          {/* TAB: DATABASE SEKOLAH & MANAJEMEN DATA */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Notification Banner */}
              {dbActionMessage && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed border ${
                    dbActionMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {dbActionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold mb-0.5">
                      {dbActionMessage.type === 'success' ? 'Operasi Berhasil' : 'Pemberitahuan Sistem'}
                    </strong>
                    {dbActionMessage.text}
                  </div>
                </div>
              )}

              {/* Database Overview Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#0D5C75] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Database className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base">
                          Status Database Sekolah
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Firestore Live Sync
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Koleksi <code className="text-[#0D5C75] font-mono font-semibold">schools</code> terhubung dengan Google Cloud Firestore.
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {schoolsCount}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Total Sekolah di Firestore
                    </span>
                  </div>
                </div>

                {/* Quick Add / Upload Actions */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBulkUpload?.();
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0D5C75] border border-slate-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#0D5C75]" />
                    <span>Upload Masal (CSV / Excel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddSchool?.();
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Input Sekolah Tunggal</span>
                  </button>
                </div>
              </div>

              {/* SUPER ADMIN EXCLUSIVE: Clear Sample Data Section */}
              <div className="p-5 bg-white border border-rose-200/80 rounded-2xl shadow-2xs relative overflow-hidden">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Bersihkan Seluruh Data Sampel (Clear Sample Data)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Khusus Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Opsi ini akan menghapus seluruh data sekolah sampel/dummy dari Google Cloud Firestore. Gunakan opsi ini saat Anda siap menginput dan mengimpor 100% data sekolah riil instansi Anda dari nol tanpa tercampur data sampel bawaan.
                    </p>

                    {currentRole === 'super_admin' ? (
                      <div className="mt-4 space-y-3">
                        {!showClearConfirmDialog ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setShowClearConfirmDialog(true)}
                              disabled={schoolsCount === 0 || isClearingData}
                              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Hapus Seluruh Data Sekolah ({schoolsCount})</span>
                            </button>

                            {schoolsCount === 0 && (
                              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Database sudah bersih dan siap diisi data riil dari nol!
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in">
                            <div className="flex items-start gap-2.5 text-rose-900">
                              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <h5 className="font-bold text-xs">
                                  Konfirmasi Pengosongan Database
                                </h5>
                                <p className="text-xs text-rose-800 mt-0.5">
                                  Tindakan ini akan menghapus <strong>{schoolsCount} data sekolah</strong> secara permanen dari Firestore. Database akan kosong dan siap diisi data riil.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={handleExecuteClearData}
                                disabled={isClearingData}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                {isClearingData ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menghapus dari Firestore...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Ya, Bersihkan Database Sekarang</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowClearConfirmDialog(false)}
                                disabled={isClearingData}
                                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-xl transition-colors cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-slate-500 text-xs">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          Wewenang saat ini: <strong>Role Tim</strong>. Fitur pembersihan database hanya dapat dioperasikan oleh akun dengan hak akses <strong>Super Admin</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RESTORE SAMPLE DATA SECTION */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Muat Ulang Data Sampel (Restore Sample Data)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Opsional
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Memuat kembali 30 dataset sekolah sampel standar Jawa Barat (Garut, Bandung, dsb.) jika Anda ingin melakukan demonstrasi fitur atau uji coba sistem.
                    </p>

                    {currentRole === 'super_admin' ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleExecuteRestoreData}
                          disabled={isRestoringData || isClearingData}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                          {isRestoringData ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Memuat data sampel ke Firestore...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Muat Ulang 30 Sekolah Sampel</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-slate-500 text-xs">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Hanya Super Admin yang dapat memuat ulang dataset sampel bawaan.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
          
          {/* TAB 1: ROLES SELECTION & SWITCHER */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              
              {/* Authenticated User Session Card */}
              {currentUser && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0D5C75] text-white flex items-center justify-center font-bold text-sm">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{currentUser.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1]">
                          {currentUser.role === 'super_admin' ? 'Super Admin' : 'Role Tim'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {currentUser.email} • {currentUser.department}
                      </div>
                    </div>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}
                </div>
              )}

              <div className="bg-[#FAF3DA] border border-[#F2E3B1] rounded-xl p-3.5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#947518] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-[#07394A]">
                    Mode Simulasi Role Pengguna Saat Ini
                  </p>
                  <p>
                    Anda dapat beralih role secara instan di bawah ini untuk menguji bagaimana antarmuka sistem menyesuaikan hak akses pengguna secara real-time.
                  </p>
                </div>
              </div>

              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Super Admin Card */}
                <div 
                  onClick={() => onChangeRole('super_admin')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all space-y-4 relative ${
                    currentRole === 'super_admin'
                      ? 'border-[#0D5C75] bg-[#EBF4F7]/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {currentRole === 'super_admin' && (
                    <div className="absolute top-3.5 right-3.5 bg-[#0D5C75] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#D4AF37]" />
                      <span>Role Aktif</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0D5C75] text-white flex items-center justify-center font-bold shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">Super Admin</h4>
                      <p className="text-xs text-slate-500 font-medium">Akses Penuh (100% Fitur & Data)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wewenang tertinggi untuk pimpinan eksekutif dan administrator data utama. Memiliki izin membaca, mengunggah data masal, mengedit, menghapus, serta menggunakan AI Copilot.
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Cakupan Akses:</div>
                    <div className="grid grid-cols-2 gap-1 text-[11.5px] text-slate-600">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Executive Summary</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Peta Spasial (GIS)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Data Analytics (BI)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Database Sekolah</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>AI Copilot Assistant</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Upload & Edit Data</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeRole('super_admin');
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      currentRole === 'super_admin'
                        ? 'bg-[#0D5C75] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {currentRole === 'super_admin' ? 'Sedang Aktif' : 'Pilih Super Admin'}
                  </button>
                </div>

                {/* 2. Role Tim Card */}
                <div 
                  onClick={() => onChangeRole('role_tim')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all space-y-4 relative ${
                    currentRole === 'role_tim'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {currentRole === 'role_tim' && (
                    <div className="absolute top-3.5 right-3.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-white" />
                      <span>Role Aktif</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">Role Tim</h4>
                      <p className="text-xs text-slate-500 font-medium">Akses Terfokus (3 Modul Utama)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dikhususkan untuk tim operasional & surveyor lapangan yang bertugas memantau visualisasi spasial, statistik wilayah, dan KPI tanpa mengubah struktur database.
                  </p>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Cakupan Akses:</div>
                    <div className="grid grid-cols-2 gap-1 text-[11.5px] text-slate-600">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Executive Summary</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Peta Spasial (GIS)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Data Analytics (BI)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 line-through">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Database Sekolah</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 line-through">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>AI Copilot Assistant</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 line-through">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Upload & Edit Data</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeRole('role_tim');
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      currentRole === 'role_tim'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {currentRole === 'role_tim' ? 'Sedang Aktif' : 'Pilih Role Tim'}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              
              <div className="text-xs text-slate-600">
                Berikut adalah perbandingan hak akses menyeluruh antara <strong>Super Admin</strong> dan <strong>Role Tim</strong> untuk setiap modul dan aksi dalam platform AKTARA:
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4">Modul / Fitur Sistem</th>
                      <th className="py-3 px-3 text-center w-28 bg-[#EBF4F7] text-[#0D5C75]">
                        <div className="flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Super Admin</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center w-28 bg-indigo-50 text-indigo-700">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>Role Tim</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permissionMatrix.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{item.module}</div>
                          <div className="text-[11px] text-slate-500">{item.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#EBF4F7]/30">
                          {item.superAdmin ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-indigo-50/20">
                          {item.roleTim ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                              <Lock className="w-3 h-3 text-slate-400" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: USER MANAGEMENT & TEAM ACCESS (COLLECTION: users/{uid}) */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              
              {/* Action Feedback Banner */}
              {userActionMessage && (
                <div className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs animate-in fade-in ${
                  userActionMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : userActionMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {userActionMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    {userActionMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                    {userActionMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                    <div className="font-semibold leading-relaxed">
                      {userActionMessage.text}
                    </div>
                  </div>
                  <button 
                    onClick={() => setUserActionMessage(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* NON-SUPER ADMIN GATE */}
              {currentRole !== 'super_admin' ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h4 className="font-extrabold text-base text-slate-900">
                      Wewenang Khusus Super Admin
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Panel <strong>Manajemen Pengguna & Akses Tim</strong> hanya dapat diakses dan dikonfigurasi oleh akun dengan role <strong>Super Admin</strong>. Anda saat ini masuk dengan role <strong>Role Tim</strong>.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => onChangeRole('super_admin')}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span>Beralih ke Role Super Admin</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* SUPER ADMIN: METRICS & HEADER */}
                  <div className="bg-gradient-to-br from-slate-900 via-[#07394A] to-[#0D5C75] text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold tracking-tight">
                            Manajemen Pengguna & Akses Tim
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Firebase Auth & Firestore
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1">
                          Kelola registrasi akun pengguna baru, reset password, wewenang role, dan status aktif personil tim.
                        </p>
                      </div>

                      {!showAddUserForm && (
                        <button
                          onClick={() => setShowAddUserForm(true)}
                          className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-[#D4AF37] hover:bg-[#c49f2e] rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0 self-start sm:self-auto font-semibold"
                        >
                          <UserPlus className="w-4 h-4 text-slate-900" />
                          <span>Tambah Pengguna Baru</span>
                        </button>
                      )}
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
                      <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                        <div className="text-slate-300 text-[11px]">Total Pengguna</div>
                        <div className="text-base font-extrabold mt-0.5">{usersList.length} Akun</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                        <div className="text-amber-200 text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                          <span>Super Admin</span>
                        </div>
                        <div className="text-base font-extrabold mt-0.5">
                          {usersList.filter(u => u.role === 'super_admin').length}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                        <div className="text-cyan-200 text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span>Tim Lapangan</span>
                        </div>
                        <div className="text-base font-extrabold mt-0.5">
                          {usersList.filter(u => u.role === 'tim_lapangan' || u.role === 'role_tim').length}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                        <div className="text-emerald-200 text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          <span>Surveyor Data</span>
                        </div>
                        <div className="text-base font-extrabold mt-0.5">
                          {usersList.filter(u => u.role === 'surveyor').length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ADD USER FORM (Firebase Auth Secondary Instance + Firestore Sync) */}
                  {showAddUserForm && (
                    <form 
                      onSubmit={handleCreateUserSubmit} 
                      className="bg-slate-50 border-2 border-[#0D5C75]/30 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0D5C75] text-white flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-900">Form Tambah Pengguna Baru</h5>
                            <p className="text-[11px] text-slate-500">
                              Dibuat via Firebase Auth SDK tanpa memutus sesi Super Admin. Profil disimpan di <code>users/&#123;uid&#125;</code>.
                            </p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowAddUserForm(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Nama Lengkap */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Lengkap <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formUserName}
                            onChange={(e) => setFormUserName(e.target.value)}
                            placeholder="Contoh: Rian Hendrawan, S.T"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75] focus:outline-none"
                          />
                        </div>

                        {/* 2. Email Akun */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Alamat Email (Firebase Auth) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={formUserEmail}
                              onChange={(e) => setFormUserEmail(e.target.value)}
                              placeholder="rian.hendrawan@aktara.id"
                              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75] focus:outline-none"
                            />
                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        {/* 3. Password Awal */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Password Awal <span className="text-rose-500">*</span></span>
                            <span className="text-[10px] text-slate-400 font-normal">Min. 6 Karakter</span>
                          </label>
                          <div className="relative">
                            <input
                              type={formShowPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              value={formUserPassword}
                              onChange={(e) => setFormUserPassword(e.target.value)}
                              placeholder="Masukkan password awal..."
                              className="w-full pl-8 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75] focus:outline-none"
                            />
                            <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <button
                              type="button"
                              onClick={() => setFormShowPassword(!formShowPassword)}
                              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1.5 cursor-pointer"
                            >
                              {formShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* 4. Pilihan Role */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pilihan Wewenang Role <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={formUserRole}
                            onChange={(e) => handleRoleSelectionChange(e.target.value as UserRole)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75] font-bold text-slate-800"
                          >
                            <option value="super_admin">🔴 Super Admin - Akses Penuh Sistem & Database</option>
                            <option value="tim_lapangan">🔵 Tim Lapangan - Operasional & Kemitraan</option>
                            <option value="surveyor">🟢 Surveyor - Input & Pemutakhiran Data</option>
                          </select>
                        </div>

                        {/* 5. Divisi / Wilayah Tugas */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Divisi / Wilayah Tugas
                          </label>
                          <input
                            type="text"
                            value={formUserDept}
                            onChange={(e) => setFormUserDept(e.target.value)}
                            placeholder="Contoh: Operasional Wilayah Garut Selatan"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setShowAddUserForm(false)}
                          disabled={isCreatingUser}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingUser}
                          className="px-5 py-2 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isCreatingUser ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mendaftarkan ke Firebase...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Buat & Daftarkan Akun</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SEARCH & FILTERS FOR USERS TABLE */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0D5C75]"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filter:</span>
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:ring-1 focus:ring-[#0D5C75]"
                      >
                        <option value="ALL">Semua Role ({usersList.length})</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="tim_lapangan">Tim Lapangan</option>
                        <option value="surveyor">Surveyor</option>
                      </select>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as any)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:ring-1 focus:ring-[#0D5C75]"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  {/* TABEL DAFTAR PENGGUNA */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                            <th className="py-3 px-3.5">Pengguna & Email</th>
                            <th className="py-3 px-3">Role Akses</th>
                            <th className="py-3 px-3">Divisi / Penugasan</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Tanggal Dibuat</th>
                            <th className="py-3 px-3.5 text-right">Aksi Manajemen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {usersList
                            .filter((u) => {
                              const matchSearch = 
                                u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                              
                              const matchRole = 
                                userRoleFilter === 'ALL' ||
                                u.role === userRoleFilter ||
                                (userRoleFilter === 'tim_lapangan' && u.role === 'role_tim');

                              const matchStatus = 
                                userStatusFilter === 'ALL' ||
                                (u.status || 'active') === userStatusFilter;

                              return matchSearch && matchRole && matchStatus;
                            })
                            .map((user) => {
                              const isCurrentUser = currentUser?.email?.toLowerCase() === user.email.toLowerCase();
                              const isResetLoading = resetPasswordLoadingEmail === user.email.toLowerCase();
                              const isSuper = user.role === 'super_admin';
                              const isSurveyor = user.role === 'surveyor';

                              return (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Col 1: Pengguna & Email */}
                                  <td className="py-3 px-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shrink-0 text-xs ${
                                        isSuper 
                                          ? 'bg-[#0D5C75]' 
                                          : isSurveyor 
                                          ? 'bg-emerald-600' 
                                          : 'bg-indigo-600'
                                      }`}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900 truncate">{user.name}</span>
                                          {isCurrentUser && (
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                              Anda
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>{user.email}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 2: Role Akses */}
                                  <td className="py-3 px-3">
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                                      isSuper
                                        ? 'bg-[#FAF3DA] text-[#947518] border-[#F2E3B1]'
                                        : isSurveyor
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {isSuper && <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />}
                                      {isSurveyor && <Building2 className="w-3 h-3 text-emerald-600" />}
                                      {!isSuper && !isSurveyor && <Users className="w-3 h-3 text-blue-600" />}
                                      <span>
                                        {isSuper ? 'Super Admin' : isSurveyor ? 'Surveyor' : 'Tim Lapangan'}
                                      </span>
                                    </span>
                                  </td>

                                  {/* Col 3: Divisi */}
                                  <td className="py-3 px-3 text-slate-600 text-xs">
                                    {user.department || '-'}
                                  </td>

                                  {/* Col 4: Status */}
                                  <td className="py-3 px-3">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleUserStatus(user)}
                                      title="Klik untuk mengubah status aktif/nonaktif"
                                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                                        user.status === 'inactive'
                                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        user.status === 'inactive' ? 'bg-slate-400' : 'bg-emerald-500'
                                      }`} />
                                      <span>{user.status === 'inactive' ? 'Nonaktif' : 'Aktif'}</span>
                                    </button>
                                  </td>

                                  {/* Col 5: Tanggal Terdaftar */}
                                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    }) : 'Terdaftar'}
                                  </td>

                                  {/* Col 6: Aksi Cepat */}
                                  <td className="py-3 px-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* 1. Reset Password Trigger */}
                                      <button
                                        type="button"
                                        onClick={() => handleTriggerPasswordReset(user.email, user.name)}
                                        disabled={isResetLoading}
                                        title="Kirim Link Reset Kata Sandi via Firebase Auth"
                                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-[#0D5C75] bg-slate-100 hover:bg-[#EBF4F7] border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      >
                                        {isResetLoading ? (
                                          <Loader2 className="w-3 h-3 animate-spin text-[#0D5C75]" />
                                        ) : (
                                          <KeyRound className="w-3 h-3 text-[#0D5C75]" />
                                        )}
                                        <span className="hidden md:inline">Reset Password</span>
                                      </button>

                                      {/* 2. Edit Role */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditRole(user)}
                                        title="Edit Role & Divisi"
                                        className="p-1.5 text-slate-600 hover:text-[#0D5C75] hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* 3. Delete / Remove User */}
                                      {!isCurrentUser && (
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmUser(user)}
                                          title="Hapus Pengguna dari Firestore"
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Empty State */}
                    {usersList.length === 0 && (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-400" />
                        <div className="text-xs font-semibold">Belum ada pengguna terdaftar.</div>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          )}

          {/* EDIT ROLE MODAL DIALOG */}
          {editingUser && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0D5C75] text-[#D4AF37] flex items-center justify-center">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">Ubah Wewenang Role Akun</h5>
                      <p className="text-[11px] text-slate-500">{editingUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Role Baru
                    </label>
                    <select
                      value={editUserRole}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setEditUserRole(r);
                        setEditUserDept(getDefaultDepartmentForRole(r));
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#0D5C75]"
                    >
                      <option value="super_admin">🔴 Super Admin - Hak Akses Penuh</option>
                      <option value="tim_lapangan">🔵 Tim Lapangan - Operasional & Kemitraan</option>
                      <option value="surveyor">🟢 Surveyor - Input & Pemutakhiran Data</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Divisi / Wilayah Tugas
                    </label>
                    <input
                      type="text"
                      value={editUserDept}
                      onChange={(e) => setEditUserDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0D5C75]"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Perubahan wewenang akan langsung tersinkronkan ke dokumen <code>users/{editingUser.id}</code> di Firestore dan memengaruhi hak akses aplikasi secara realtime.</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    disabled={isSavingRoleEdit}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditRole}
                    disabled={isSavingRoleEdit}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSavingRoleEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan Role</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE USER CONFIRMATION DIALOG */}
          {deleteConfirmUser && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Pengguna</h5>
                    <p className="text-xs text-slate-500">Tindakan ini akan menghapus dokumen profil dari Firestore.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <div><strong>Nama:</strong> {deleteConfirmUser.name}</div>
                  <div><strong>Email:</strong> {deleteConfirmUser.email}</div>
                  <div><strong>Role:</strong> {deleteConfirmUser.role.toUpperCase()}</div>
                </div>

                <div className="text-xs text-rose-700 font-semibold">
                  Apakah Anda yakin ingin menghapus data pengguna ini dari sistem AKTARA?
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmUser(null)}
                    disabled={isDeletingUser}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteUser}
                    disabled={isDeletingUser}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isDeletingUser ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Pengguna</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 relative z-20">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Role Aktif: <strong>{currentRole === 'super_admin' ? 'Super Admin' : 'Role Tim'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Firestore: Connected (us-west1)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Tutup Pengaturan"
            className="px-5 py-2 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] active:scale-95 rounded-xl transition-all cursor-pointer shadow-xs relative z-50 focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/50"
          >
            Tutup Pengaturan
          </button>
        </div>

      </div>
    </div>
  );
};
