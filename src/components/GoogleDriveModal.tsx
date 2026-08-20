import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  HardDrive,
  FolderPlus,
  Folder,
  FileSpreadsheet,
  FileText,
  FileDown,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Trash2,
  Download,
  Database,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LogOut,
  FolderOpen,
  Plus,
  Check,
  Loader2,
  FileCode,
  Tag
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  getDriveAccessToken 
} from '../services/googleDriveAuth';
import { 
  DriveFile, 
  DriveAboutInfo, 
  listDriveFiles, 
  getDriveAbout, 
  findOrCreateAppFolder, 
  createDriveFolder, 
  uploadFileToDrive, 
  downloadDriveFile, 
  deleteDriveFile,
  FOLDER_MIME_TYPE
} from '../services/googleDriveApi';
import { School, AiExecutiveBrief, RegionFilter, AppBrandingConfig } from '../types';
import { parseUploadFile, ParsedRowResult, BulkUploadSummary, processRawRows } from '../utils/bulkUploadHelper';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  filteredSchools: School[];
  currentFilter: RegionFilter;
  executiveBrief: AiExecutiveBrief | null;
  branding?: AppBrandingConfig;
  onImportSchoolsFromDrive: (schools: School[], conflictMode: 'update' | 'skip' | 'create_new') => void;
  onOpenBulkUploadModalWithFile?: (file: File) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  schools,
  filteredSchools,
  currentFilter,
  executiveBrief,
  branding,
  onImportSchoolsFromDrive,
  onOpenBulkUploadModalWithFile
}) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'export' | 'upload'>('browser');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);

  // File browser state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'spreadsheets' | 'documents' | 'folders'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([
    { id: undefined, name: 'My Drive' }
  ]);

  // Operations state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [lastExportedLink, setLastExportedLink] = useState<string | null>(null);

  // Import from Drive state
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // New folder state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Upload local file to Drive state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // Destructive Action Confirmation Modal state (Mandatory per Skill guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check initial token on open
  useEffect(() => {
    if (isOpen) {
      getDriveAccessToken().then(token => {
        if (token) {
          setAccessToken(token);
          loadDriveDetails(token);
        }
      });
    }
  }, [isOpen]);

  // Load drive info and file list
  const loadDriveDetails = async (token: string) => {
    setIsLoadingFiles(true);
    setAuthError(null);
    try {
      const [about, filesResult] = await Promise.all([
        getDriveAbout(token).catch(() => null),
        listDriveFiles(token, {
          folderId: currentFolderId,
          query: fileSearchQuery,
          mimeTypeFilter: mimeFilter
        })
      ]);

      if (about) {
        setAboutInfo(about);
      }
      setFiles(filesResult.files || []);
    } catch (err: any) {
      console.error('Error loading Google Drive data:', err);
      setAuthError(err.message || 'Gagal terhubung dengan Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Trigger reload when filter or folder changes
  useEffect(() => {
    if (accessToken && isOpen) {
      loadDriveDetails(accessToken);
    }
  }, [accessToken, currentFolderId, mimeFilter, isOpen]);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleDrive();
      setUser(result.user);
      setAccessToken(result.accessToken);
      await loadDriveDetails(result.accessToken);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    try {
      await signOutGoogleDrive();
      setUser(null);
      setAccessToken(null);
      setFiles([]);
      setAboutInfo(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  // Folder navigation
  const handleOpenFolder = (folder: DriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const target = folderHistory[index];
    setCurrentFolderId(target.id);
    setFolderHistory(prev => prev.slice(0, index + 1));
  };

  // Create new folder in Drive
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newFolderName.trim()) return;

    try {
      setIsCreatingFolder(true);
      await createDriveFolder(accessToken, newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadDriveDetails(accessToken);
    } catch (err: any) {
      alert('Gagal membuat folder: ' + err.message);
      setIsCreatingFolder(false);
    }
  };

  // Export School Database to Google Drive
  const handleExportDatabaseToDrive = async (format: 'csv' | 'json', scope: 'all' | 'filtered') => {
    if (!accessToken) return;
    setIsExporting(true);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    setLastExportedLink(null);

    try {
      const dataToExport = scope === 'all' ? schools : filteredSchools;
      const appFolder = await findOrCreateAppFolder(accessToken, 'AKTARA School Intelligence');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Database_Sekolah_${scope === 'all' ? 'Lengkap' : 'Terfilter'}_${timestamp}.${format}`;

      let content: string;
      let mimeType: string;

      if (format === 'csv') {
        const flatData = dataToExport.map(s => ({
          NPSN: s.npsn,
          'Nama Sekolah': s.name,
          Bentuk: s.type,
          Status: s.status,
          Kabupaten: s.cityDistrict,
          Kecamatan: s.subDistrict,
          Alamat: s.address,
          Akreditasi: s.accreditation,
          'Total Siswa': s.totalStudents,
          'Siswa Laki-laki': s.maleStudents,
          'Siswa Perempuan': s.femaleStudents,
          Jurusan: s.majors.map(m => `${m.name} (${m.students})`).join('; '),
          Latitude: s.latitude,
          Longitude: s.longitude,
          'Kepala Sekolah': s.principal,
          Telepon: s.phone,
          Email: s.email,
          'Status Kemitraan': s.partnershipStatus
        }));
        content = Papa.unparse(flatData);
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
      }

      const uploaded = await uploadFileToDrive(accessToken, {
        name: filename,
        content,
        mimeType,
        folderId: appFolder.id,
        description: `Export data sekolah AKTARA (${dataToExport.length} data) pada ${new Date().toLocaleString('id-ID')}`
      });

      setExportSuccessMessage(`Berhasil menyimpan "${filename}" ke folder "AKTARA School Intelligence" di Google Drive!`);
      if (uploaded.webViewLink) {
        setLastExportedLink(uploaded.webViewLink);
      }
      loadDriveDetails(accessToken);
    } catch (err: any) {
      console.error('Export Error:', err);
      setExportErrorMessage(err.message || 'Gagal mengekspor file ke Google Drive.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Executive Brief to Google Drive
  const handleExportBriefToDrive = async () => {
    if (!accessToken || !executiveBrief) return;
    setIsExporting(true);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);
    setLastExportedLink(null);

    try {
      const appFolder = await findOrCreateAppFolder(accessToken, 'AKTARA School Intelligence');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Executive_Brief_${currentFilter.cityDistrict || 'Jawa_Barat'}_${timestamp}.md`;

      const content = `# ${branding?.bannerHeadline || 'EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS'}
**Wilayah:** ${currentFilter.cityDistrict || 'Seluruh Jawa Barat'}
**Tanggal Analisis:** ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
**Total Sekolah Dianalisis:** ${filteredSchools.length} Sekolah
**Institusi:** ${branding?.organizationName || 'PT AKTARA EDUKASI INDONESIA'}

---

## 1. Ringkasan Eksekutif (Executive Summary)
${executiveBrief.summary}

---

## 2. Temuan Kunci (Key Findings)
${executiveBrief.keyFindings.map((f, i) => `${i + 1}. **${f}**`).join('\n')}

---

## 3. Rekomendasi Strategis Penetrasi Pasar
${executiveBrief.recommendations.map((r, i) => `${i + 1}. **${r.title}** (${r.priority.toUpperCase()} PRIORITY)
   - Deskripsi: ${r.description}
   - Estimasi Dampak: ${r.impact}
   - Wilayah Target: ${r.targetRegion}`).join('\n\n')}

---

## 4. Sekolah Prioritas & Target Utama
${executiveBrief.topSchoolsTarget.map((s, i) => `${i + 1}. **${s.name}** (${s.potential})
   - Alasan: ${s.reason}`).join('\n')}

---
*Dihasilkan oleh AKTARA School & Market Intelligence Copilot*
`;

      const uploaded = await uploadFileToDrive(accessToken, {
        name: filename,
        content,
        mimeType: 'text/markdown',
        folderId: appFolder.id,
        description: `Executive Brief Dossier wilayah ${currentFilter.cityDistrict || 'Jabar'} dibuat otomatis oleh AKTARA Copilot.`
      });

      setExportSuccessMessage(`Dossier Executive Brief berhasil disimpan ke Google Drive ("${filename}")!`);
      if (uploaded.webViewLink) {
        setLastExportedLink(uploaded.webViewLink);
      }
      loadDriveDetails(accessToken);
    } catch (err: any) {
      console.error('Export Brief Error:', err);
      setExportErrorMessage(err.message || 'Gagal mengekspor Executive Brief ke Google Drive.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import Spreadsheet / CSV File directly from Google Drive into Database
  const handleImportDriveFile = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsImportingFile(true);
    setImportStatusMessage(`Mengunduh dan memproses "${file.name}" dari Google Drive...`);

    try {
      const downloaded = await downloadDriveFile(accessToken, file.id, file.mimeType);
      
      let reconstructedFile: File;
      if (downloaded.blob) {
        reconstructedFile = new File([downloaded.blob], file.name, { type: file.mimeType });
      } else if (downloaded.text) {
        reconstructedFile = new File([new Blob([downloaded.text], { type: 'text/csv' })], file.name, { type: 'text/csv' });
      } else if (downloaded.arrayBuffer) {
        reconstructedFile = new File([downloaded.arrayBuffer], file.name, { type: file.mimeType });
      } else {
        throw new Error('Gagal membaca data file dari Google Drive');
      }

      // If parent supplied a direct open handler for Bulk Upload Modal
      if (onOpenBulkUploadModalWithFile) {
        onClose();
        onOpenBulkUploadModalWithFile(reconstructedFile);
        return;
      }

      // Or parse directly
      const rawRows = await parseUploadFile(reconstructedFile);
      const { parsedRows } = processRawRows(rawRows, schools);
      const validSchools = parsedRows.filter(r => r.isValid).map(r => r.data);
      if (validSchools.length === 0) {
        throw new Error('File tidak memiliki data baris sekolah yang valid untuk diimpor.');
      }

      onImportSchoolsFromDrive(validSchools, 'update');
      setImportStatusMessage(`Berhasil mengimpor ${validSchools.length} sekolah dari "${file.name}" ke database AKTARA!`);
      setTimeout(() => {
        setImportStatusMessage(null);
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error('Import Drive File Error:', err);
      alert('Gagal mengimpor file: ' + err.message);
    } finally {
      setIsImportingFile(false);
    }
  };

  // Upload Local File into current Drive folder
  const handleUploadLocalFileToDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadFile) return;

    setIsUploadingToDrive(true);
    setUploadProgressMsg(`Mengunggah "${uploadFile.name}" ke Google Drive...`);

    try {
      const arrayBuffer = await uploadFile.arrayBuffer();
      await uploadFileToDrive(accessToken, {
        name: uploadFile.name,
        content: arrayBuffer,
        mimeType: uploadFile.type || 'application/octet-stream',
        folderId: currentFolderId,
        description: 'Uploaded via AKTARA Intelligence System'
      });

      setUploadProgressMsg(`File "${uploadFile.name}" berhasil diunggah ke Google Drive!`);
      setUploadFile(null);
      if (localFileInputRef.current) localFileInputRef.current.value = '';
      loadDriveDetails(accessToken);
      setTimeout(() => setUploadProgressMsg(null), 3000);
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert('Gagal mengunggah file ke Google Drive: ' + err.message);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Execute Destructive Delete Action with Confirmation Dialog
  const handleConfirmDelete = async () => {
    if (!accessToken || !fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      setFileToDelete(null);
      await loadDriveDetails(accessToken);
    } catch (err: any) {
      alert('Gagal menghapus file: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  // Helper to get friendly file icon & badge
  const getFileIcon = (file: DriveFile) => {
    if (file.mimeType === FOLDER_MIME_TYPE) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-100 shrink-0" />;
    }
    if (
      file.mimeType.includes('spreadsheet') || 
      file.mimeType.includes('csv') || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.xlsx')
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (file.mimeType.includes('pdf') || file.name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (file.mimeType.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.md')) {
      return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
    }
    return <FileCode className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  const isSpreadsheetFile = (file: DriveFile) => {
    return (
      file.mimeType.includes('spreadsheet') ||
      file.mimeType.includes('csv') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#07394A] to-[#0D5C75] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <HardDrive className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Google Drive Cloud Hub
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F2E3B1] border border-[#D4AF37]/40 uppercase tracking-wider">
                  Sync & Backup
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kelola file spreadsheet, cadangkan database sekolah, dan ekspor dossier eksekutif ke Google Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account & Connection Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          {accessToken ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-300">
                  {aboutInfo?.user?.displayName ? aboutInfo.user.displayName.charAt(0) : 'G'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">
                    {aboutInfo?.user?.displayName || user?.displayName || 'Google Drive Terhubung'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {aboutInfo?.user?.emailAddress || user?.email || 'Akun Google Aktif'}
                  </span>
                </div>
              </div>

              {aboutInfo?.storageQuota?.limit && (
                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span>Penyimpanan:</span>
                  <strong className="text-slate-700">
                    {(Number(aboutInfo.storageQuota.usage || 0) / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </strong>
                  <span>dari</span>
                  <span>
                    {(Number(aboutInfo.storageQuota.limit || 0) / (1024 * 1024 * 1024)).toFixed(0)} GB
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#0D5C75]" />
              <span>Hubungkan akun Google Anda untuk mengaktifkan akses Google Drive.</span>
            </div>
          )}

          <div>
            {accessToken ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1 text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isAuthenticating}
                onClick={handleSignIn}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D5C75]" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Masuk dengan Akun Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('browser')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Jelajahi & Impor File ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Database className="w-4 h-4 text-[#D4AF37]" />
            <span>Cadangkan & Ekspor ke Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#0D5C75] border-[#0D5C75] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Berkas ke Drive</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Auth Banner if not authenticated */}
          {!accessToken && (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-4 my-2">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF4F7] text-[#0D5C75] border border-[#CCE3EA] flex items-center justify-center mx-auto shadow-sm">
                <HardDrive className="w-8 h-8 text-[#0D5C75]" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-base font-extrabold text-slate-900">
                  Google Drive Belum Terhubung
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masuk dengan akun Google Anda untuk menjelajahi spreadsheet sekolah dari Drive, membuat folder pencadangan otomatis, dan mengekspor dossier eksekutif ke cloud.
                </p>
              </div>

              {authError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 max-w-md mx-auto flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isAuthenticating}
                onClick={handleSignIn}
                className="px-6 py-2.5 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                )}
                <span>Izinkan Akses Google Drive</span>
              </button>
            </div>
          )}

          {/* TAB 1: FILE BROWSER & DIRECT IMPORT */}
          {accessToken && activeTab === 'browser' && (
            <div className="space-y-4">
              
              {/* Status Message Notification */}
              {importStatusMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{importStatusMessage}</span>
                </div>
              )}

              {/* Breadcrumb & Create Folder Row */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs flex-wrap font-medium">
                  {folderHistory.map((f, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-slate-300">/</span>}
                      <button
                        onClick={() => handleNavigateBreadcrumb(idx)}
                        className={`hover:text-[#0D5C75] hover:underline cursor-pointer ${
                          idx === folderHistory.length - 1 ? 'font-bold text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {f.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                {/* Folder Actions */}
                <div className="flex items-center gap-2">
                  {!isCreatingFolder ? (
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#0D5C75]" />
                      <span>Buat Folder</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Nama folder baru..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0D5C75]"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-[#0D5C75] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingFolder(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  <button
                    onClick={() => loadDriveDetails(accessToken)}
                    disabled={isLoadingFiles}
                    className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Segarkan File"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Cari file di Google Drive..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75]"
                  />
                  {fileSearchQuery && (
                    <button 
                      onClick={() => setFileSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setMimeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      mimeFilter === 'all' 
                        ? 'bg-[#0D5C75] text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setMimeFilter('spreadsheets')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      mimeFilter === 'spreadsheets' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Spreadsheet / CSV</span>
                  </button>
                  <button
                    onClick={() => setMimeFilter('documents')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      mimeFilter === 'documents' 
                        ? 'bg-[#0D5C75] text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Dokumen & PDF
                  </button>
                  <button
                    onClick={() => setMimeFilter('folders')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      mimeFilter === 'folders' 
                        ? 'bg-[#0D5C75] text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Folder
                  </button>
                </div>

              </div>

              {/* File List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {isLoadingFiles ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#0D5C75]" />
                    <p className="text-xs">Memuat daftar file dari Google Drive...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">Tidak ada file yang ditemukan</p>
                    <p className="text-[11px]">Folder kosong atau tidak sesuai dengan kata kunci pencarian.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {files.map((file) => {
                      const isFolder = file.mimeType === FOLDER_MIME_TYPE;
                      const isSpreadsheet = isSpreadsheetFile(file);

                      return (
                        <div 
                          key={file.id}
                          className="p-3 hover:bg-slate-50/90 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div 
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => isFolder && handleOpenFolder(file)}
                          >
                            {getFileIcon(file)}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold truncate ${isFolder ? 'text-[#0D5C75] hover:underline' : 'text-slate-900'}`}>
                                  {file.name}
                                </span>
                                {isSpreadsheet && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                                    Spreadsheet
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                {file.modifiedTime && (
                                  <span>Diubah {new Date(file.modifiedTime).toLocaleDateString('id-ID')}</span>
                                )}
                                {file.size && (
                                  <span>• {(Number(file.size) / 1024).toFixed(1)} KB</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSpreadsheet && (
                              <button
                                type="button"
                                disabled={isImportingFile}
                                onClick={() => handleImportDriveFile(file)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Impor data sekolah dari file ini ke database AKTARA"
                              >
                                <Database className="w-3 h-3 text-emerald-600" />
                                <span>Impor ke DB</span>
                              </button>
                            )}

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-[#0D5C75] hover:bg-slate-100 rounded-lg transition-colors"
                                title="Buka di Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus file dari Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT TO GOOGLE DRIVE */}
          {accessToken && activeTab === 'export' && (
            <div className="space-y-5">
              
              {/* Notification Banners */}
              {exportSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">{exportSuccessMessage}</div>
                      {lastExportedLink && (
                        <a 
                          href={lastExportedLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-emerald-700 underline font-semibold text-[11px] mt-0.5 inline-flex items-center gap-1"
                        >
                          <span>Buka File di Google Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {exportErrorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{exportErrorMessage}</span>
                </div>
              )}

              {/* Card 1: Backup Database Sekolah ke Drive */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Cadangkan Database Direktori Sekolah ke Google Drive
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Simpan seluruh data master sekolah (NPSN, alamat, koordinat GIS, kontak kepala sekolah, siswa, dan jurusan) langsung ke folder <strong>AKTARA School Intelligence</strong> di Google Drive Anda.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Database Master Lengkap</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#0D5C75] text-white rounded-full font-extrabold">
                        {schools.length} Sekolah
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => handleExportDatabaseToDrive('csv', 'all')}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ekspor CSV</span>
                      </button>
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => handleExportDatabaseToDrive('json', 'all')}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Ekspor JSON</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Data Terfilter Wilayah Aktif</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37] text-slate-900 rounded-full font-extrabold">
                        {filteredSchools.length} Sekolah
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => handleExportDatabaseToDrive('csv', 'filtered')}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ekspor CSV</span>
                      </button>
                      <button
                        type="button"
                        disabled={isExporting}
                        onClick={() => handleExportDatabaseToDrive('json', 'filtered')}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Ekspor JSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Simpan Dossier Executive Brief ke Google Drive */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#947518] border border-amber-200 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Simpan Dossier Executive Brief & AI Recommendations
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Unggah laporan ringkasan eksekutif, temuan analisis intelijen pasar, dan rekomendasi penetrasi strategis ke Google Drive sebagai dokumen terstruktur.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-slate-600">
                    Target Wilayah: <strong className="text-slate-900">{currentFilter.cityDistrict || 'Semua Wilayah Jawa Barat'}</strong>
                  </div>

                  <button
                    type="button"
                    disabled={isExporting || !executiveBrief}
                    onClick={handleExportBriefToDrive}
                    className="px-4 py-2 bg-[#0D5C75] hover:bg-[#07394A] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span>Simpan Brief ke Google Drive (.md / Docs)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: UPLOAD LOCAL FILE TO GOOGLE DRIVE */}
          {accessToken && activeTab === 'upload' && (
            <div className="space-y-4">
              
              <div className="text-xs text-slate-600">
                Unggah file dokumen, berkas data survei lapangan, atau spreadsheet laporan dari perangkat lokal Anda langsung ke Google Drive:
              </div>

              {uploadProgressMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{uploadProgressMsg}</span>
                </div>
              )}

              <form onSubmit={handleUploadLocalFileToDrive} className="space-y-4">
                
                <input
                  ref={localFileInputRef}
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />

                <div
                  onClick={() => localFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#0D5C75] rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-[#EBF4F7]/30 transition-all space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#0D5C75] shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {uploadFile ? uploadFile.name : 'Klik untuk memilih berkas dari komputer Anda'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'Mendukung CSV, XLSX, PDF, DOCX, TXT, dan gambar'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Folder Tujuan: <strong className="text-slate-800">{folderHistory[folderHistory.length - 1]?.name || 'Root'}</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || isUploadingToDrive}
                    className="px-5 py-2 bg-[#0D5C75] hover:bg-[#07394A] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isUploadingToDrive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span>Unggah Sekarang</span>
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Terintegrasi Resmi dengan Google Workspace Drive API</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE OPERATIONS */}
      {fileToDelete && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setFileToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Berkas</h4>
                <p className="text-xs text-slate-500">Tindakan ini memerlukan persetujuan eksplisit Anda.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas <strong className="text-slate-900">"{fileToDelete.name}"</strong> dari Google Drive Anda? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Ya, Hapus Berkas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
