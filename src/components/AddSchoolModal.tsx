import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Building2, 
  MapPin, 
  Users, 
  BookOpen, 
  Check, 
  Upload, 
  UploadCloud,
  Award,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { School, AuthUser, TeamMember } from '../types';
import { REGIONS_DATA } from '../data/schoolsData';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSchool: (newSchool: School) => void;
  onOpenBulkUpload?: () => void;
  currentUser?: AuthUser | null;
  teamMembers?: TeamMember[];
}

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  isOpen,
  onClose,
  onAddSchool,
  onOpenBulkUpload,
  currentUser,
  teamMembers = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    npsn: '',
    type: 'SMK' as 'SMK' | 'SMA',
    status: 'Swasta' as 'Negeri' | 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: '',
    latitude: -7.2178,
    longitude: 107.8992,
    totalStudents: 850,
    maleStudents: 450,
    femaleStudents: 400,
    accreditation: 'A' as 'A' | 'B' | 'C',
    principal: '',
    phone: '',
    majorsString: 'Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, Akuntansi',
    partnershipStatus: 'Prospek' as School['partnershipStatus'],
    pipelineStage: 'Canvassing' as 'Canvassing' | 'Visitasi' | 'Presentasi' | 'Deal',
    surveyorName: currentUser?.name || 'Tim Lapangan AKTARA',
    notes: ''
  });

  useEffect(() => {
    if (currentUser?.name && !formData.name) {
      setFormData(prev => ({
        ...prev,
        surveyorName: currentUser.name
      }));
    }
  }, [currentUser]);

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.npsn.trim()) return;

    const parsedMajors = formData.majorsString.split(',').map(m => {
      const trimmed = m.trim();
      let category: any = 'Teknik';
      if (trimmed.toLowerCase().includes('rpl') || trimmed.toLowerCase().includes('tkj') || trimmed.toLowerCase().includes('informatika') || trimmed.toLowerCase().includes('software')) {
        category = 'IT';
      } else if (trimmed.toLowerCase().includes('akuntansi') || trimmed.toLowerCase().includes('pemasaran') || trimmed.toLowerCase().includes('bisnis') || trimmed.toLowerCase().includes('otkp')) {
        category = 'Bisnis';
      } else if (trimmed.toLowerCase().includes('dkv') || trimmed.toLowerCase().includes('busana') || trimmed.toLowerCase().includes('desain')) {
        category = 'Kreatif';
      }
      return {
        name: trimmed,
        category,
        studentCount: Math.round(Number(formData.totalStudents) / Math.max(formData.majorsString.split(',').length, 1))
      };
    });

    const newSchool: School = {
      id: `custom-${Date.now()}`,
      npsn: formData.npsn,
      name: formData.name,
      type: formData.type,
      status: formData.status,
      province: formData.province,
      cityDistrict: formData.cityDistrict,
      subDistrict: formData.subDistrict,
      address: formData.address || `${formData.subDistrict}, ${formData.cityDistrict}`,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      totalStudents: Number(formData.totalStudents),
      maleStudents: Number(formData.maleStudents),
      femaleStudents: Number(formData.femaleStudents),
      majors: parsedMajors,
      accreditation: formData.accreditation as any,
      principal: formData.principal || 'Kepala Sekolah',
      phone: formData.phone || '(0262) 123456',
      partnershipStatus: formData.partnershipStatus,
      pipelineStage: formData.pipelineStage,
      surveyorName: formData.surveyorName || (currentUser?.name ?? 'Tim Lapangan AKTARA'),
      surveyorId: currentUser?.id,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      priorityScore: 85,
      aktaraCompatibility: {
        fitScore: 88,
        recommendedPrograms: ['AKTARA AI Literacy Workshop', 'Vocational Industry Linkage'],
        strengths: ['Potensi ekspansi wilayah baru', 'Kebutuhan adaptasi kurikulum industri tinggi'],
        notes: `Data sekolah ditambahkan oleh ${formData.surveyorName || 'Tim Lapangan AKTARA'}.`
      }
    };

    onAddSchool(newSchool);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#07394A] to-[#0D5C75] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-sm sm:text-base text-white">Tambah Data Sekolah Baru</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs text-slate-800">
          
          {onOpenBulkUpload && (
            <div className="p-3 bg-[#FAF3DA] border border-[#F2E3B1] rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#947518]">
                <UploadCloud className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-[11px] font-semibold">Punya banyak data di Excel / CSV?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBulkUpload();
                }}
                className="px-2.5 py-1 bg-[#0D5C75] hover:bg-[#07394A] text-white font-bold rounded-lg text-[10px] whitespace-nowrap shadow-2xs cursor-pointer transition-colors"
              >
                Buka Upload Masal
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Nama Sekolah *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Contoh: SMK Karya Taruna Garut"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0D5C75]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">NPSN *</label>
              <input
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => setFormData(p => ({ ...p, npsn: e.target.value }))}
                placeholder="2020XXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Status & Tingkat</label>
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                >
                  <option value="Swasta">Swasta</option>
                  <option value="Negeri">Negeri</option>
                </select>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as any }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                >
                  <option value="SMK">SMK</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kabupaten/Kota</label>
              <select
                value={formData.cityDistrict}
                onChange={(e) => setFormData(p => ({ ...p, cityDistrict: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              >
                {REGIONS_DATA.cityDistricts.filter(c => c !== 'Semua Kabupaten/Kota').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kecamatan</label>
              <input
                type="text"
                value={formData.subDistrict}
                onChange={(e) => setFormData(p => ({ ...p, subDistrict: e.target.value }))}
                placeholder="Tarogong Kidul"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Total Siswa</label>
              <input
                type="number"
                value={formData.totalStudents}
                onChange={(e) => setFormData(p => ({ ...p, totalStudents: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Siswa Putra</label>
              <input
                type="number"
                value={formData.maleStudents}
                onChange={(e) => setFormData(p => ({ ...p, maleStudents: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Siswa Putri</label>
              <input
                type="number"
                value={formData.femaleStudents}
                onChange={(e) => setFormData(p => ({ ...p, femaleStudents: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Daftar Jurusan (Pisahkan dengan koma)</label>
            <input
              type="text"
              value={formData.majorsString}
              onChange={(e) => setFormData(p => ({ ...p, majorsString: e.target.value }))}
              placeholder="RPL, TKJ, Akuntansi, Teknik Kendaraan Ringan"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Koordinat Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData(p => ({ ...p, latitude: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Koordinat Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData(p => ({ ...p, longitude: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label className="font-semibold text-slate-700 block">Tahapan Pipeline Sales:</label>
              <select
                value={formData.pipelineStage}
                onChange={(e) => {
                  const stage = e.target.value as 'Canvassing' | 'Visitasi' | 'Presentasi' | 'Deal';
                  let status: School['partnershipStatus'] = 'Belum Dikunjungi';
                  if (stage === 'Canvassing') status = 'Belum Dikunjungi';
                  else if (stage === 'Visitasi') status = 'Dijadwalkan';
                  else if (stage === 'Presentasi') status = 'Prospek';
                  else if (stage === 'Deal') status = 'Mitra Aktif';
                  setFormData(p => ({ ...p, pipelineStage: stage, partnershipStatus: status }));
                }}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 font-bold text-[#0D5C75]"
              >
                <option value="Canvassing">1. Canvassing (Baru Diidentifikasi)</option>
                <option value="Visitasi">2. Visitasi (Telah Dijadwalkan/Kunjungan)</option>
                <option value="Presentasi">3. Presentasi (Audiensi Prospek)</option>
                <option value="Deal">4. Deal / MoU (Mitra Aktif)</option>
              </select>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label className="font-semibold text-slate-700 block">PIC / Surveyor Canvassing:</label>
              <input
                type="text"
                list="team-members-list"
                value={formData.surveyorName}
                onChange={(e) => setFormData(p => ({ ...p, surveyorName: e.target.value }))}
                placeholder="Nama PIC / Sales Rep"
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 font-semibold text-slate-800"
              />
              <datalist id="team-members-list">
                {currentUser?.name && <option value={currentUser.name} />}
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Status Kemitraan:</span>
            <select
              value={formData.partnershipStatus}
              onChange={(e) => {
                const status = e.target.value as School['partnershipStatus'];
                let stage: 'Canvassing' | 'Visitasi' | 'Presentasi' | 'Deal' = 'Canvassing';
                if (status === 'Belum Dikunjungi') stage = 'Canvassing';
                else if (status === 'Dijadwalkan') stage = 'Visitasi';
                else if (status === 'Prospek') stage = 'Presentasi';
                else if (status === 'Mitra Aktif') stage = 'Deal';
                setFormData(p => ({ ...p, partnershipStatus: status, pipelineStage: stage }));
              }}
              className="bg-white border border-slate-300 rounded-md p-1 font-semibold"
            >
              <option value="Belum Dikunjungi">Belum Dikunjungi (Canvassing)</option>
              <option value="Dijadwalkan">Dijadwalkan (Visitasi)</option>
              <option value="Prospek">Prospek (Presentasi)</option>
              <option value="Mitra Aktif">Mitra Aktif (Deal)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0D5C75] hover:bg-[#07394A] text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Simpan Sekolah</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
