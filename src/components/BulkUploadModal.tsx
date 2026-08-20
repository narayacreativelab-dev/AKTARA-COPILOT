import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  HelpCircle, 
  Building2, 
  Users, 
  Layers,
  Search,
  Filter,
  Check,
  ClipboardList,
  HardDrive,
  Flame
} from 'lucide-react';
import { School } from '../types';
import { 
  parseUploadFile, 
  parsePastedText, 
  processRawRows, 
  downloadCsvTemplate, 
  ParsedRowResult, 
  BulkUploadSummary 
} from '../utils/bulkUploadHelper';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkImport: (schoolsToImport: School[], conflictMode: 'update' | 'skip' | 'create_new') => void;
  existingSchools: School[];
  onOpenGoogleDrive?: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onBulkImport,
  existingSchools,
  onOpenGoogleDrive
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide'>('upload');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Results state
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null);
  
  // Preview Controls
  const [conflictMode, setConflictMode] = useState<'update' | 'skip' | 'create_new'>('update');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state
  const handleReset = () => {
    setSelectedFile(null);
    setPastedText('');
    setParsedRows([]);
    setSummary(null);
    setStep('input');
    setErrorMessage(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Listen for Escape key press to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [existingSchools]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const rawRows = await parseUploadFile(file);
      if (rawRows.length === 0) {
        throw new Error('File tidak memiliki data atau baris kosong.');
      }
      
      const { parsedRows: processed, summary: sum } = processRawRows(rawRows, existingSchools);
      setParsedRows(processed);
      setSummary(sum);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Silakan tempel teks atau data tabel terlebih dahulu.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const rawRows = parsePastedText(pastedText);
      if (rawRows.length === 0) {
        throw new Error('Tidak ada data tabel yang terdeteksi dari teks yang ditempel.');
      }

      const { parsedRows: processed, summary: sum } = processRawRows(rawRows, existingSchools);
      setParsedRows(processed);
      setSummary(sum);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses data teks.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    setIsImporting(true);

    const validItems = parsedRows.filter(r => r.isValid);
    
    let itemsToImport: School[] = [];

    if (conflictMode === 'skip') {
      itemsToImport = validItems
        .filter(r => !r.isDuplicate)
        .map(r => r.data as School);
    } else if (conflictMode === 'create_new') {
      itemsToImport = validItems.map(r => ({
        ...(r.data as School),
        id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      }));
    } else {
      // update / upsert mode
      itemsToImport = validItems.map(r => r.data as School);
    }

    setTimeout(() => {
      onBulkImport(itemsToImport, conflictMode);
      setIsImporting(false);
      handleClose();
    }, 400);
  };

  if (!isOpen) return null;

  // Filtered rows for preview table
  const displayedRows = parsedRows.filter(row => {
    if (previewFilter === 'valid' && !row.isValid) return false;
    if (previewFilter === 'invalid' && row.isValid) return false;
    if (previewFilter === 'duplicate' && !row.isDuplicate) return false;

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const name = (row.data.name || '').toLowerCase();
      const npsn = (row.data.npsn || '').toLowerCase();
      const city = (row.data.cityDistrict || '').toLowerCase();
      const sub = (row.data.subDistrict || '').toLowerCase();
      return name.includes(q) || npsn.includes(q) || city.includes(q) || sub.includes(q);
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#07394A] via-[#0D5C75] to-[#0a475b] text-white flex items-center justify-between border-b border-[#07394A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D4AF37] border border-white/15 flex items-center justify-center font-bold shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Upload Masal Data Sekolah
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1]">
                  CSV / Excel / Sheets
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Firestore Batch Write</span>
                </span>
              </div>
              <p className="text-xs text-slate-200">
                Impor ratusan database sekolah sekaligus dengan validasi otomatis & sinkronisasi batch Firestore
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (When in input step) */}
        {step === 'input' && (
          <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unggah File (CSV / XLSX)</span>
              </button>

              <button
                onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'paste'
                    ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Tempel Tabel / Text</span>
              </button>

              <button
                onClick={() => { setActiveTab('guide'); setErrorMessage(null); }}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'border-[#0D5C75] text-[#0D5C75] bg-white rounded-t-lg font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Panduan Kolom</span>
              </button>
            </div>

            <button
              onClick={downloadCsvTemplate}
              className="text-xs font-semibold text-[#0D5C75] hover:text-[#07394A] flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-[#EBF4F7] transition-colors border border-[#CCE3EA] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Unduh Template CSV</span>
            </button>
          </div>
        )}

        {/* Step Indicator when in preview */}
        {step === 'preview' && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-[#EBF4F7]/80 border-b border-[#CCE3EA] text-xs">
            <div className="flex items-center gap-2 text-[#0D5C75] font-bold">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Langkah 2: Validasi & Konfirmasi Data Sekolah</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-[#0D5C75] hover:text-[#07394A] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ganti File / Unggah Ulang</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Gagal memproses data: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* ==================== STEP 1: INPUT MODES ==================== */}
          {step === 'input' && activeTab === 'upload' && (
            <div className="space-y-4">
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, .json, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h4 className="text-base font-bold text-slate-800 mb-1">
                  Pilih atau Tarik File Spreadsheet ke Sini
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Mendukung format <strong>.CSV</strong>, <strong>.XLSX (Microsoft Excel)</strong>, <strong>.XLS</strong>, dan <strong>.JSON</strong>.
                </p>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors">
                    <span>Jelajahi File Komputer</span>
                  </div>

                  {onOpenGoogleDrive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                        onOpenGoogleDrive();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBF4F7] hover:bg-[#D8ECF2] text-[#0D5C75] border border-[#CCE3EA] font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4 text-[#0D5C75]" />
                      <span>Pilih dari Google Drive</span>
                    </button>
                  )}
                </div>

                {isProcessing && (
                  <div className="mt-4 text-xs font-semibold text-blue-600 animate-pulse">
                    Menganalisis dan memvalidasi struktur data...
                  </div>
                )}
              </div>

              {/* Quick Info & Template Download Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fitur Cerdas Impor AKTARA</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                    <li>Pendeteksian nama kolom fleksibel (Bahasa Indonesia & Inggris).</li>
                    <li>Auto-klasifikasi jurusan (IT, Teknik, Bisnis, Kreatif, dll).</li>
                    <li>Auto-geocoding koordinat centroid jika GPS belum tersedia.</li>
                    <li>Kalkulasi otomatis skor kompatibilitas & program vokasi.</li>
                  </ul>
                </div>

                <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3.5 space-y-2 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>Belum Punya Format Standar?</span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-1">
                      Gunakan template resmi kami yang sudah terisi contoh data SMK & SMA di Jawa Barat.
                    </p>
                  </div>
                  <button
                    onClick={downloadCsvTemplate}
                    className="w-full py-2 bg-white hover:bg-blue-50 text-blue-700 font-bold border border-blue-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template CSV Contoh (.csv)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {step === 'input' && activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Salin & Tempel Data dari Google Sheets / Excel / CSV:
                </label>
                <span className="text-[11px] text-slate-400">
                  Pastikan baris pertama berisi judul kolom (NPSN, Nama Sekolah, dll)
                </span>
              </div>

              <textarea
                rows={9}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`NPSN\tNama Sekolah\tBentuk\tStatus\tKabupaten/Kota\tKecamatan\tTotal Siswa\tJurusan\n20209220\tSMK Pelita Cendekia Garut\tSMK\tSwasta\tKabupaten Garut\tTarogong Kidul\t650\tRekayasa Perangkat Lunak, TKJ\n20209221\tSMKN 3 Bandung\tSMK\tNegeri\tKota Bandung\tLengkong\t1400\tAkuntansi, Bisnis Daring`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPastedText('')}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Bersihkan Teks
                </button>

                <button
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim() || isProcessing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Proses & Validasi Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'input' && activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Modul impor data sekolah AKTARA dirancang fleksibel. Anda tidak perlu menyusun kolom dengan urutan kaku—sistem akan mengenali header kolom secara otomatis berdasarkan sinonim bahasa Indonesia dan Inggris.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Kolom Standar</th>
                      <th className="p-2.5">Kewajiban</th>
                      <th className="p-2.5">Contoh Nilai Valid</th>
                      <th className="p-2.5">Penjelasan & Fallback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Nama Sekolah</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib</span></td>
                      <td className="p-2.5">SMKN 1 Garut</td>
                      <td className="p-2.5 text-slate-500">Nama lengkap satuan pendidikan.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">NPSN</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Dianjurkan</span></td>
                      <td className="p-2.5">20209201</td>
                      <td className="p-2.5 text-slate-500">Kunci unik sekolah. Jika kosong dibuatkan kode otomatis.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Bentuk / Tipe</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">SMK / SMA</td>
                      <td className="p-2.5 text-slate-500">Default: SMK. Dideteksi otomatis dari nama sekolah.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Status</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">Negeri / Swasta</td>
                      <td className="p-2.5 text-slate-500">Default: Swasta (atau Negeri jika ada kata 'Negeri').</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Kabupaten/Kota</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Dianjurkan</span></td>
                      <td className="p-2.5">Kabupaten Garut, Kota Bandung, dll</td>
                      <td className="p-2.5 text-slate-500">Mempengaruhi filter wilayah & visualisasi peta spasial.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Kecamatan</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">Tarogong Kidul, Lengkong, dll</td>
                      <td className="p-2.5 text-slate-500">Daftar kecamatan sesuai data wilayah Jawa Barat.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Latitude & Longitude</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">-7.2178, 107.8992</td>
                      <td className="p-2.5 text-slate-500">Jika kosong, di-geolocate ke centroid kabupaten/kota.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Total Siswa</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">1450</td>
                      <td className="p-2.5 text-slate-500">Jika kosong dialokasikan estimasi populasi standar.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">Jurusan</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Opsional</span></td>
                      <td className="p-2.5">RPL, TKJ, DKV, Akuntansi</td>
                      <td className="p-2.5 text-slate-500">Pisahkan dengan koma atau titik-koma.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: VALIDATION & PREVIEW ==================== */}
          {step === 'preview' && summary && (
            <div className="space-y-5">
              
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Baris</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{summary.totalRows}</div>
                  <span className="text-[10px] text-slate-500">Terdeteksi dalam file</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Baris Valid</span>
                  <div className="text-lg font-black text-emerald-800 mt-0.5">{summary.validRows}</div>
                  <span className="text-[10px] text-emerald-600">Siap diimpor</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total Populasi Siswa</span>
                  <div className="text-lg font-black text-blue-800 mt-0.5">
                    {summary.totalStudents.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-blue-600">{summary.negeriCount} Negeri • {summary.swastaCount} Swasta</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">NPSN Duplikat / Peringatan</span>
                  <div className="text-lg font-black text-amber-900 mt-0.5">{summary.duplicateRows}</div>
                  <span className="text-[10px] text-amber-700">Sudah ada di database</span>
                </div>

              </div>

              {/* Conflict Resolution Settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pengaturan Penanganan Data Duplikat (NPSN Sama):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  
                  <label className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                    conflictMode === 'update'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'update'}
                      onChange={() => setConflictMode('update')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs">Perbarui Data Yang Ada</div>
                      <div className="text-[10px] font-normal text-slate-500">Timpa profil dengan data terbaru (Rekomendasi)</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                    conflictMode === 'skip'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'skip'}
                      onChange={() => setConflictMode('skip')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs">Lewati Data Duplikat</div>
                      <div className="text-[10px] font-normal text-slate-500">Hanya tambahkan sekolah dengan NPSN baru</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                    conflictMode === 'create_new'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="conflictMode"
                      checked={conflictMode === 'create_new'}
                      onChange={() => setConflictMode('create_new')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs">Simpan Semua Sebagai Baru</div>
                      <div className="text-[10px] font-normal text-slate-500">Buat entri terpisah untuk setiap baris</div>
                    </div>
                  </label>

                </div>
              </div>

              {/* Table Controls (Search & Filter) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Cari nama / NPSN / wilayah..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto text-xs">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      previewFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      previewFilter === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Valid ({summary.validRows})
                  </button>
                  {summary.duplicateRows > 0 && (
                    <button
                      onClick={() => setPreviewFilter('duplicate')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        previewFilter === 'duplicate'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      Duplikat ({summary.duplicateRows})
                    </button>
                  )}
                  {summary.invalidRows > 0 && (
                    <button
                      onClick={() => setPreviewFilter('invalid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        previewFilter === 'invalid'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      Error ({summary.invalidRows})
                    </button>
                  )}
                </div>

              </div>

              {/* Interactive Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10">No</th>
                      <th className="p-2.5">NPSN</th>
                      <th className="p-2.5">Nama Sekolah</th>
                      <th className="p-2.5">Status & Tipe</th>
                      <th className="p-2.5">Wilayah</th>
                      <th className="p-2.5">Siswa</th>
                      <th className="p-2.5">Jurusan</th>
                      <th className="p-2.5">Status Impor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px] bg-white">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Tidak ada data yang sesuai filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-slate-400 font-mono">{row.rowNumber}</td>
                          <td className="p-2.5 font-mono font-medium text-slate-700">{row.data.npsn}</td>
                          <td className="p-2.5 font-bold text-slate-900 max-w-[180px] truncate">
                            {row.data.name || <span className="text-rose-500 italic">Nama Kosong</span>}
                          </td>
                          <td className="p-2.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.data.status === 'Negeri'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}>
                              {row.data.type} {row.data.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600">
                            <div>{row.data.cityDistrict}</div>
                            <div className="text-[10px] text-slate-400">{row.data.subDistrict}</div>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {(row.data.totalStudents || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 max-w-[160px] truncate text-slate-500" title={row.data.rawMajorsString}>
                            {row.data.rawMajorsString || `${row.data.majors?.length || 0} Jurusan`}
                          </td>
                          <td className="p-2.5">
                            {row.isValid ? (
                              row.isDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Duplikat</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Valid</span>
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={row.errors.join(', ')}>
                                <AlertCircle className="w-3 h-3" />
                                <span>Error</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {step === 'input' ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Batal
              </button>
              <div className="text-[11px] text-slate-500">
                Pilih file CSV / Excel untuk melanjutkan ke pratinjau
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembali / Ganti File</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Batal
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting || !summary || summary.validRows === 0}
                  className="px-6 py-2.5 bg-[#0D5C75] hover:bg-[#07394A] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md shadow-[#0D5C75]/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isImporting ? (
                    <span>Mengimpor Data...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                      <span>Impor {summary?.validRows || 0} Sekolah Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
