import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { 
  Building2, 
  Users, 
  Award, 
  TrendingUp, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Zap,
  Briefcase
} from 'lucide-react';
import { School } from '../types';

interface AnalyticsViewProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  schools,
  onSelectSchool
}) => {
  // Aggregate Metrics
  const totalSchools = schools.length;
  const negeriSchools = schools.filter(s => s.status === 'Negeri');
  const swastaSchools = schools.filter(s => s.status === 'Swasta');
  
  const totalStudents = schools.reduce((acc, s) => acc + s.totalStudents, 0);
  const totalMale = schools.reduce((acc, s) => acc + s.maleStudents, 0);
  const totalFemale = schools.reduce((acc, s) => acc + s.femaleStudents, 0);

  // Status Pie Data
  const statusPieData = [
    { name: 'SMK/SMA Negeri', value: negeriSchools.length, color: '#16A34A' },
    { name: 'SMK/SMA Swasta', value: swastaSchools.length, color: '#D4AF37' }
  ];

  // Gender Data
  const genderPieData = [
    { name: 'Siswa Putra', value: totalMale, color: '#0D5C75' },
    { name: 'Siswa Putri', value: totalFemale, color: '#D4AF37' }
  ];

  // Top 10 High Density Schools
  const top10Schools = [...schools]
    .sort((a, b) => b.totalStudents - a.totalStudents)
    .slice(0, 8)
    .map(s => ({
      name: s.name.replace('Sekolah Menengah Kejuruan', 'SMK').replace('Negeri', 'N'),
      fullName: s.name,
      total: s.totalStudents,
      putra: s.maleStudents,
      putri: s.femaleStudents,
      status: s.status,
      schoolObj: s
    }));

  // Major Categories Aggregation
  const majorCategoriesCount: Record<string, number> = {
    'Informatika (IT)': 0,
    'Teknik & Rekayasa': 0,
    'Bisnis & Manajemen': 0,
    'Seni & Kreatif': 0,
    'Pariwisata & Kuliner': 0,
    'Kesehatan': 0,
    'Akademik/Umum': 0
  };

  schools.forEach(school => {
    school.majors?.forEach(major => {
      if (major.category === 'IT') majorCategoriesCount['Informatika (IT)'] += major.studentCount;
      else if (major.category === 'Teknik') majorCategoriesCount['Teknik & Rekayasa'] += major.studentCount;
      else if (major.category === 'Bisnis') majorCategoriesCount['Bisnis & Manajemen'] += major.studentCount;
      else if (major.category === 'Kreatif') majorCategoriesCount['Seni & Kreatif'] += major.studentCount;
      else if (major.category === 'Pariwisata') majorCategoriesCount['Pariwisata & Kuliner'] += major.studentCount;
      else if (major.category === 'Kesehatan') majorCategoriesCount['Kesehatan'] += major.studentCount;
      else majorCategoriesCount['Akademik/Umum'] += major.studentCount;
    });
  });

  const majorBarData = Object.entries(majorCategoriesCount)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Sub-district Aggregation
  const subDistrictCounts: Record<string, { total: number; schoolsCount: number }> = {};
  schools.forEach(s => {
    if (!subDistrictCounts[s.subDistrict]) {
      subDistrictCounts[s.subDistrict] = { total: 0, schoolsCount: 0 };
    }
    subDistrictCounts[s.subDistrict].total += s.totalStudents;
    subDistrictCounts[s.subDistrict].schoolsCount += 1;
  });

  const subDistrictBarData = Object.entries(subDistrictCounts)
    .map(([subDistrict, data]) => ({
      subDistrict,
      students: data.total,
      schools: data.schoolsCount
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 7);

  // Partnership Status Funnel
  const partnershipCounts = {
    'Mitra Aktif': schools.filter(s => s.partnershipStatus === 'Mitra Aktif').length,
    'Dijadwalkan': schools.filter(s => s.partnershipStatus === 'Dijadwalkan').length,
    'Prospek': schools.filter(s => s.partnershipStatus === 'Prospek').length,
    'Belum Dikunjungi': schools.filter(s => s.partnershipStatus === 'Belum Dikunjungi').length
  };

  return (
    <div className="space-y-4">
      
      {/* Top 4 Looker Studio Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Tile 1 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Institusi</span>
            <Building2 className="w-4 h-4 text-[#0D5C75]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalSchools}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-emerald-700">{negeriSchools.length} Negeri</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-[#947518]">{swastaSchools.length} Swasta</span>
          </div>
        </div>

        {/* Tile 2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Akumulasi Siswa</span>
            <Users className="w-4 h-4 text-[#0D5C75]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalStudents.toLocaleString('id-ID')}
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
            <span>Rata-rata:</span>
            <span className="font-bold text-slate-800">
              {totalSchools > 0 ? Math.round(totalStudents / totalSchools).toLocaleString('id-ID') : 0} Siswa/Sekolah
            </span>
          </div>
        </div>

        {/* Tile 3 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Siswa Rumpun IT</span>
            <Zap className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0D5C75]">
            {majorCategoriesCount['Informatika (IT)'].toLocaleString('id-ID')}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {totalStudents > 0 ? Math.round((majorCategoriesCount['Informatika (IT)'] / totalStudents) * 100) : 0}% Target Core Talent AKTARA
          </div>
        </div>

        {/* Tile 4 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Mitra Aktif & Prospek</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {partnershipCounts['Mitra Aktif'] + partnershipCounts['Dijadwalkan']}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {partnershipCounts['Prospek']} Sekolah Dalam Pipeline Prospek
          </div>
        </div>

      </div>

      {/* Row 1: Charts - Public vs Private & Top Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Market Share Donut Chart */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Market Share: Negeri vs Swasta</h3>
              <p className="text-xs text-slate-500">Komposisi status institusi pendidikan</p>
            </div>
            <Award className="w-4 h-4 text-[#D4AF37]" />
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} Sekolah (${totalSchools > 0 ? Math.round((value/totalSchools)*100) : 0}%)`, 'Jumlah']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{totalSchools}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="text-slate-700">Negeri: <strong>{negeriSchools.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37]"></span>
              <span className="text-slate-700">Swasta: <strong>{swastaSchools.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Top High Density Schools Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Top Sekolah Berpopulasi Terbesar</h3>
              <p className="text-xs text-slate-500">Target prioritas dengan densitas siswa tertinggi</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#0D5C75]" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Schools} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={120} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('id-ID')} Siswa`, 'Total Siswa']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#0D5C75" 
                  radius={[0, 6, 6, 0]} 
                  onClick={(data: any) => onSelectSchool(data.schoolObj)}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 text-right pt-1">
            *Klik bar untuk membuka dossier sekolah
          </div>
        </div>

      </div>

      {/* Row 2: Charts - Major Distribution & Sub-district Density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Majors / Kejuruan Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sebaran Siswa Berdasarkan Rumpun Kejuruan</h3>
              <p className="text-xs text-slate-500">Potensi serapan program AKTARA (Bootcamp, Sertifikasi, dll.)</p>
            </div>
            <BookOpen className="w-4 h-4 text-[#0D5C75]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={majorBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" angle={-25} textAnchor="end" tick={{ fontSize: 10, fill: '#475569' }} height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('id-ID')} Siswa`, 'Akumulasi']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-District Distribution */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Densitas Siswa per Kecamatan Teratas</h3>
              <p className="text-xs text-slate-500">Klaster wilayah untuk efisiensi rute visitasi</p>
            </div>
            <Building2 className="w-4 h-4 text-[#0D5C75]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subDistrictBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subDistrict" angle={-20} textAnchor="end" tick={{ fontSize: 10, fill: '#475569' }} height={40} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'students' ? `${value.toLocaleString('id-ID')} Siswa` : `${value} Sekolah`,
                    name === 'students' ? 'Total Siswa' : 'Jumlah Sekolah'
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="students" fill="#0D5C75" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: AKTARA Partnership Pipeline Cards */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Status Kemitraan & Penetrasi AKTARA</h3>
            <p className="text-xs text-slate-500">Pipeline konversi sekolah menuju kerjasama program</p>
          </div>
          <Briefcase className="w-4 h-4 text-[#0D5C75]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5">
            <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Mitra Aktif
            </div>
            <div className="text-2xl font-black text-emerald-950">
              {partnershipCounts['Mitra Aktif']} <span className="text-xs font-normal text-emerald-700">Sekolah</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Sudah menjalankan kelas industri atau sertifikasi
            </p>
          </div>

          <div className="border border-[#CCE3EA] bg-[#EBF4F7]/50 rounded-xl p-3.5">
            <div className="text-xs font-semibold text-[#0D5C75] flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0D5C75]"></span>
              Dijadwalkan Visitasi
            </div>
            <div className="text-2xl font-black text-[#07394A]">
              {partnershipCounts['Dijadwalkan']} <span className="text-xs font-normal text-[#0D5C75]">Sekolah</span>
            </div>
            <p className="text-[11px] text-[#0D5C75] mt-1">
              Jadwal audiensi kepala sekolah telah ditetapkan
            </p>
          </div>

          <div className="border border-[#F2E3B1] bg-[#FAF3DA]/60 rounded-xl p-3.5">
            <div className="text-xs font-semibold text-[#947518] flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
              Prospek Penetrasi
            </div>
            <div className="text-2xl font-black text-slate-900">
              {partnershipCounts['Prospek']} <span className="text-xs font-normal text-[#947518]">Sekolah</span>
            </div>
            <p className="text-[11px] text-[#947518] mt-1">
              Potensi tinggi, proposal dalam persiapan
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-3.5">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Belum Dikunjungi
            </div>
            <div className="text-2xl font-black text-slate-900">
              {partnershipCounts['Belum Dikunjungi']} <span className="text-xs font-normal text-slate-600">Sekolah</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Target eksplorasi rute berikutnya
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
