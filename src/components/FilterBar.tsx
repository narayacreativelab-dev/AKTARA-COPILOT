import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Filter, 
  X, 
  Loader2, 
  MapPin, 
  Building2, 
  GraduationCap, 
  Users, 
  BookOpen,
  Award
} from 'lucide-react';
import { RegionFilter } from '../types';
import { REGIONS_DATA } from '../data/schoolsData';

interface FilterBarProps {
  filter: RegionFilter;
  setFilter: React.Dispatch<React.SetStateAction<RegionFilter>>;
  onParseNlQuery: (query: string) => Promise<void>;
  isParsingNl: boolean;
  activeFilterCount: number;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  onParseNlQuery,
  isParsingNl,
  activeFilterCount,
  onReset
}) => {
  const [nlQueryInput, setNlQueryInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCityChange = (city: string) => {
    setFilter(prev => ({
      ...prev,
      cityDistrict: city,
      subDistrict: 'Semua Kecamatan'
    }));
  };

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQueryInput.trim()) return;
    onParseNlQuery(nlQueryInput);
  };

  const subDistrictOptions = filter.cityDistrict && REGIONS_DATA.subDistrictsByCity[filter.cityDistrict as keyof typeof REGIONS_DATA.subDistrictsByCity]
    ? REGIONS_DATA.subDistrictsByCity[filter.cityDistrict as keyof typeof REGIONS_DATA.subDistrictsByCity]
    : ['Semua Kecamatan'];

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        
        {/* Top: Natural Language Search & Smart Query Bar */}
        <div className="flex flex-col md:flex-row gap-2">
          
          {/* Smart NLP Search */}
          <form onSubmit={handleNlSubmit} className="flex-1 relative flex items-center">
            <div className="absolute left-3 flex items-center pointer-events-none text-[#0D5C75]">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={nlQueryInput}
              onChange={(e) => setNlQueryInput(e.target.value)}
              placeholder="Cari cerdas NLP... (contoh: 'SMK Swasta di Garut dengan siswa >800 yang ada jurusan RPL atau TKJ')"
              className="w-full pl-9 pr-24 py-2 text-xs sm:text-sm bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:border-[#0D5C75] transition-all"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {nlQueryInput && (
                <button
                  type="button"
                  onClick={() => setNlQueryInput('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isParsingNl || !nlQueryInput.trim()}
                className="px-2.5 py-1 text-xs font-semibold bg-[#0D5C75] text-white hover:bg-[#07394A] disabled:opacity-50 disabled:pointer-events-none rounded-md transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {isParsingNl ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <span>Terapkan AI</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Keyword / NPSN Search */}
          <div className="relative w-full md:w-72">
            <div className="absolute left-3 top-2.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filter.searchQuery}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Cari Nama Sekolah / NPSN..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:border-[#0D5C75] transition-all"
            />
            {filter.searchQuery && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-[#EBF4F7] text-[#0D5C75] border-[#CCE3EA]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0D5C75] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

        </div>

        {/* Primary Cascading Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          
          {/* 1. Kabupaten/Kota */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0D5C75]" />
              <span>Kabupaten/Kota</span>
            </label>
            <select
              value={filter.cityDistrict}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white transition-all font-medium"
            >
              {REGIONS_DATA.cityDistricts.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* 2. Kecamatan */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>Kecamatan</span>
            </label>
            <select
              value={filter.subDistrict}
              onChange={(e) => setFilter(prev => ({ ...prev, subDistrict: e.target.value }))}
              disabled={filter.cityDistrict === 'Semua Kabupaten/Kota'}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white disabled:opacity-50 transition-all font-medium"
            >
              {subDistrictOptions.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 3. Status (Negeri / Swasta) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" />
              <span>Status Sekolah</span>
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white transition-all font-medium"
            >
              <option value="ALL">Semua Status (Negeri & Swasta)</option>
              <option value="Negeri">Hanya Negeri (🟢 Hijau)</option>
              <option value="Swasta">Hanya Swasta (🟡 Emas)</option>
            </select>
          </div>

          {/* 4. Skala Jumlah Siswa */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Users className="w-3 h-3 text-[#0D5C75]" />
              <span>Skala Populasi Siswa</span>
            </label>
            <select
              value={filter.studentScale}
              onChange={(e) => setFilter(prev => ({ ...prev, studentScale: e.target.value as any }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white transition-all font-medium"
            >
              <option value="ALL">Semua Ukuran Siswa</option>
              <option value="Large">Large (&gt; 1.000 Siswa)</option>
              <option value="Medium">Medium (500 - 1.000 Siswa)</option>
              <option value="Small">Small (&lt; 500 Siswa)</option>
            </select>
          </div>

          {/* 5. Tingkat (SMK vs SMA) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#0D5C75]" />
              <span>Tingkat / Bentuk</span>
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white transition-all font-medium"
            >
              <option value="ALL">Semua Tingkat (SMK & SMA)</option>
              <option value="SMK">Khusus SMK (Vokasi)</option>
              <option value="SMA">Khusus SMA (Akademik)</option>
            </select>
          </div>

          {/* 6. Rumpun Kejuruan */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#D4AF37]" />
              <span>Rumpun Kejuruan</span>
            </label>
            <select
              value={filter.majorCategory}
              onChange={(e) => setFilter(prev => ({ ...prev, majorCategory: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C75] focus:bg-white transition-all font-medium"
            >
              <option value="Semua Jurusan">Semua Rumpun</option>
              <option value="IT">Informatika & Komputer (RPL/TKJ)</option>
              <option value="Teknik">Teknik & Rekayasa (Mesin/Otomotif)</option>
              <option value="Bisnis">Bisnis & Manajemen (AKL/OTKP)</option>
              <option value="Kreatif">Seni & Kreatif (DKV/Busana)</option>
              <option value="Pariwisata">Pariwisata & Kuliner</option>
              <option value="Kesehatan">Kesehatan & Farmasi</option>
            </select>
          </div>

        </div>

        {/* Extended Advanced Filters (when expanded) */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            
            {/* Akreditasi */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Akreditasi</label>
              <select
                value={filter.accreditation}
                onChange={(e) => setFilter(prev => ({ ...prev, accreditation: e.target.value }))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:bg-white"
              >
                <option value="Semua Akreditasi">Semua Akreditasi</option>
                <option value="A">Terakreditasi A (Unggul)</option>
                <option value="B">Terakreditasi B (Baik)</option>
                <option value="C">Terakreditasi C</option>
              </select>
            </div>

            {/* Status Kemitraan AKTARA */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Status Kemitraan AKTARA</label>
              <select
                value={filter.partnershipStatus}
                onChange={(e) => setFilter(prev => ({ ...prev, partnershipStatus: e.target.value }))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:bg-white"
              >
                <option value="Semua Status Kemitraan">Semua Status Kemitraan</option>
                <option value="Mitra Aktif">Mitra Aktif AKTARA</option>
                <option value="Dijadwalkan">Dijadwalkan Visitasi</option>
                <option value="Prospek">Prospek Penetrasi</option>
                <option value="Belum Dikunjungi">Belum Dikunjungi</option>
              </select>
            </div>

            {/* Reset All Quick Trigger */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={onReset}
                className="w-full py-1.5 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
              >
                Bersihkan Semua Filter
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
