import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Award, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Sparkles, 
  Compass, 
  Phone, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';
import { School } from '../types';

interface TableViewProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
  onOpenPitch: (school: School) => void;
  onLocateOnMap: (school: School) => void;
  onUpdateStatus: (schoolId: string, newStatus: School['partnershipStatus']) => void;
  onOpenBulkUpload?: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  schools,
  onSelectSchool,
  onOpenPitch,
  onLocateOnMap,
  onUpdateStatus,
  onOpenBulkUpload
}) => {
  const [sortField, setSortField] = useState<keyof School>('totalStudents');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSort = (field: keyof School) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedSchools = [...schools].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    if (typeof aVal === 'number') {
      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedSchools.length / itemsPerPage);
  const paginatedSchools = sortedSchools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      
      {/* Table Top Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Database Intelijen Sekolah & SMK/SMA</h3>
          <p className="text-xs text-slate-500">Direktori demografi, rumpun kejuruan, dan status penetrasi pasar</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Masal (CSV/Excel)</span>
            </button>
          )}
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Menampilkan <strong>{paginatedSchools.length}</strong> dari <strong>{schools.length}</strong> institusi
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>Nama Sekolah / NPSN</span>
                  {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('subDistrict')}>
                <div className="flex items-center gap-1">
                  <span>Wilayah & Kecamatan</span>
                  {sortField === 'subDistrict' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('totalStudents')}>
                <div className="flex items-center gap-1">
                  <span>Total Siswa (P/L)</span>
                  {sortField === 'totalStudents' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>
              <th scope="col" className="px-4 py-3">Jurusan / Rumpun Utama</th>
              <th scope="col" className="px-4 py-3">Status Kemitraan</th>
              <th scope="col" className="px-4 py-3 text-center">Fit Score</th>
              <th scope="col" className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedSchools.map((school) => {
              const isNegeri = school.status === 'Negeri';
              return (
                <tr 
                  key={school.id} 
                  className="hover:bg-[#EBF4F7]/40 transition-colors group"
                >
                  
                  {/* Name & NPSN */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#0D5C75] transition-colors cursor-pointer" onClick={() => onSelectSchool(school)}>
                      {school.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>NPSN: {school.npsn}</span>
                      <span>•</span>
                      <span>Akreditasi: <strong className="text-slate-700">{school.accreditation}</strong></span>
                    </div>
                  </td>

                  {/* Status Badge (Emerald for Negeri, Gold for Swasta) */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isNegeri
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#FAF3DA] text-[#B38E22] border border-[#F2E3B1]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isNegeri ? 'bg-emerald-600' : 'bg-[#D4AF37]'}`}></span>
                      {school.type} {school.status}
                    </span>
                  </td>

                  {/* Region */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{school.subDistrict}</div>
                    <div className="text-[11px] text-slate-500">{school.cityDistrict}</div>
                  </td>

                  {/* Student Count & Bar */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">
                      {school.totalStudents.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">siswa</span>
                    </div>
                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden flex mt-1">
                      <div 
                        style={{ width: `${(school.maleStudents / school.totalStudents) * 100}%` }} 
                        className="bg-[#0D5C75] h-full" 
                        title={`Putra: ${school.maleStudents}`}
                      />
                      <div 
                        style={{ width: `${(school.femaleStudents / school.totalStudents) * 100}%` }} 
                        className="bg-[#D4AF37] h-full" 
                        title={`Putri: ${school.femaleStudents}`}
                      />
                    </div>
                  </td>

                  {/* Majors */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {school.majors?.slice(0, 2).map((m, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[160px]">
                          {m.name.split('(')[0]}
                        </span>
                      ))}
                      {(school.majors?.length || 0) > 2 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{(school.majors?.length || 0) - 2} lagi
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Partnership Status Selector */}
                  <td className="px-4 py-3">
                    <select
                      value={school.partnershipStatus}
                      onChange={(e) => onUpdateStatus(school.id, e.target.value as any)}
                      className={`text-[11px] font-semibold rounded-md px-2 py-1 border transition-colors ${
                        school.partnershipStatus === 'Mitra Aktif'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : school.partnershipStatus === 'Dijadwalkan'
                          ? 'bg-[#EBF4F7] text-[#0D5C75] border-[#CCE3EA]'
                          : school.partnershipStatus === 'Prospek'
                          ? 'bg-[#FAF3DA] text-[#947518] border-[#F2E3B1]'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Mitra Aktif">Mitra Aktif</option>
                      <option value="Dijadwalkan">Dijadwalkan</option>
                      <option value="Prospek">Prospek</option>
                      <option value="Belum Dikunjungi">Belum Dikunjungi</option>
                    </select>
                  </td>

                  {/* Fit Score */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-black text-xs text-[#0D5C75] bg-[#EBF4F7] border border-[#CCE3EA] px-2 py-0.5 rounded">
                      {school.aktaraCompatibility?.fitScore || 85}%
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectSchool(school)}
                        title="Buka Intelligence Dossier"
                        className="p-1.5 text-slate-600 hover:text-[#0D5C75] hover:bg-[#EBF4F7] rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPitch(school)}
                        title="Generate AI Pitch Deck Points"
                        className="p-1.5 text-slate-600 hover:text-[#947518] hover:bg-[#FAF3DA] rounded transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      </button>
                      <button
                        onClick={() => onLocateOnMap(school)}
                        title="Lihat di Peta Spasial"
                        className="p-1.5 text-slate-600 hover:text-[#0D5C75] hover:bg-[#EBF4F7] rounded transition-colors cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
            {paginatedSchools.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 px-4">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Belum Ada Data Sekolah</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Database kosong atau tidak ada sekolah yang cocok dengan filter saat ini.
                      </p>
                    </div>
                    {onOpenBulkUpload && (
                      <button
                        onClick={onOpenBulkUpload}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#0D5C75] hover:bg-[#07394A] rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                        <span>Upload Data Sekolah (CSV / Excel)</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
