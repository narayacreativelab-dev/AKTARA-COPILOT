import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  Building2, 
  GraduationCap, 
  Layers, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { School } from '../types';

interface ExecutiveSummaryChartsProps {
  schools: School[];
  onSelectSchool: (school: School) => void;
}

export const ExecutiveSummaryCharts: React.FC<ExecutiveSummaryChartsProps> = ({
  schools,
  onSelectSchool
}) => {
  // Aggregate Metrics
  const totalSchools = schools.length;
  const negeriSchools = schools.filter(s => s.status === 'Negeri');
  const swastaSchools = schools.filter(s => s.status === 'Swasta');
  
  const totalStudents = schools.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
  const totalMale = schools.reduce((acc, s) => acc + (s.maleStudents || 0), 0);
  const totalFemale = schools.reduce((acc, s) => acc + (s.femaleStudents || 0), 0);

  // Status Distribution (Pie)
  const statusPieData = [
    { 
      name: 'Sekolah Negeri', 
      value: negeriSchools.length, 
      students: negeriSchools.reduce((acc, s) => acc + s.totalStudents, 0),
      color: '#0D5C75' 
    },
    { 
      name: 'Sekolah Swasta', 
      value: swastaSchools.length, 
      students: swastaSchools.reduce((acc, s) => acc + s.totalStudents, 0),
      color: '#D4AF37' 
    }
  ];

  // Gender Distribution (Pie)
  const genderPieData = [
    { name: 'Siswa Putra', value: totalMale, color: '#0D5C75' },
    { name: 'Siswa Putri', value: totalFemale, color: '#E5A93C' }
  ];

  // Top 6 Highest Density Schools (Bar Chart)
  const topSchoolsData = [...schools]
    .sort((a, b) => b.totalStudents - a.totalStudents)
    .slice(0, 6)
    .map(s => ({
      shortName: s.name.length > 22 ? s.name.substring(0, 20) + '...' : s.name,
      fullName: s.name,
      total: s.totalStudents,
      status: s.status,
      district: s.subDistrict,
      schoolObj: s
    }));

  // Major Distribution Aggregate
  const majorCounts: Record<string, number> = {};
  schools.forEach(s => {
    (s.majors || []).forEach(m => {
      let cluster = 'Lainnya';
      const name = m.name.toLowerCase();
      if (name.includes('rpl') || name.includes('tkj') || name.includes('informatika') || name.includes('multimedia') || name.includes('sistem informasi') || name.includes('dkv')) {
        cluster = 'Teknologi Informasi & Digital';
      } else if (name.includes('otomotif') || name.includes('mesin') || name.includes('tbsm') || name.includes('tkr') || name.includes('pengelasan')) {
        cluster = 'Teknik Mesin & Otomotif';
      } else if (name.includes('bisnis') || name.includes('akuntansi') || name.includes('pemasaran') || name.includes('perkantoran') || name.includes('keuangan')) {
        cluster = 'Bisnis & Manajemen';
      } else if (name.includes('kuliner') || name.includes('tata boga') || name.includes('perhotelan') || name.includes('wisata')) {
        cluster = 'Pariwisata & Kuliner';
      } else if (name.includes('listrik') || name.includes('elektronika') || name.includes('mekatronika')) {
        cluster = 'Kelistrikan & Elektronika';
      } else if (name.includes('kesehatan') || name.includes('keperawatan') || name.includes('farmasi')) {
        cluster = 'Kesehatan & Farmasi';
      }
      majorCounts[cluster] = (majorCounts[cluster] || 0) + (m.totalStudents || Math.round(s.totalStudents / Math.max(1, s.majors.length)));
    });
  });

  const majorBarData = Object.entries(majorCounts)
    .map(([cluster, count]) => ({
      cluster: cluster.length > 18 ? cluster.substring(0, 16) + '...' : cluster,
      fullCluster: cluster,
      students: count
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  return (
    <div id="executive-summary-charts-container" className="space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D5C75] to-[#07394A] text-[#D4AF37] flex items-center justify-center font-bold shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <span>Visualisasi Pasar & Distribusi Demografi Siswa</span>
              <span className="text-[10px] bg-[#FAF3DA] text-[#947518] px-2 py-0.5 rounded-full font-bold border border-[#F2E3B1]">
                Live BI
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Analisis visual sebaran status institusi, perbandingan gender, dan sekolah prioritas
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Chart 1: Donut Status Sekolah (Negeri vs Swasta) (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0D5C75]" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                Segmentasi Status Sekolah
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              {totalSchools} Institusi
            </span>
          </div>

          <div className="relative h-56 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = totalSchools > 0 ? Math.round((data.value / totalSchools) * 100) : 0;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-700">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-slate-300">{data.value} Sekolah ({percentage}%)</p>
                          <p className="text-[#D4AF37] font-semibold">{data.students.toLocaleString('id-ID')} Total Siswa</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 leading-tight">
                {totalSchools}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total SMK/SMA
              </span>
            </div>
          </div>

          {/* Legend Details */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-[#0D5C75] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 truncate">Negeri</div>
                <div className="text-xs font-extrabold text-slate-900">
                  {negeriSchools.length} <span className="text-[10px] font-normal text-slate-500">({totalSchools > 0 ? Math.round((negeriSchools.length / totalSchools) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-[#D4AF37] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 truncate">Swasta</div>
                <div className="text-xs font-extrabold text-slate-900">
                  {swastaSchools.length} <span className="text-[10px] font-normal text-slate-500">({totalSchools > 0 ? Math.round((swastaSchools.length / totalSchools) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Top 6 High Density Schools Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0D5C75]" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  Top 6 Sekolah Berpopulasi Terbesar
                </h4>
                <p className="text-[11px] text-slate-400">Target penetrasi program kemitraan skala prioritas</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#947518] bg-[#FAF3DA] border border-[#F2E3B1] px-2 py-0.5 rounded">
              High Impact
            </span>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSchoolsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis 
                  dataKey="shortName" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} 
                  width={115}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-[#D4AF37]">{data.fullName}</p>
                          <p className="text-slate-300">Kecamatan: <span className="text-white font-medium">{data.district}</span></p>
                          <p className="text-slate-300">Status: <span className="text-white font-medium">{data.status}</span></p>
                          <p className="text-emerald-400 font-bold">{data.total.toLocaleString('id-ID')} Siswa Aktif</p>
                          <p className="text-[10px] text-slate-400 pt-1 italic">Klik bar untuk membuka dossier sekolah</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#0D5C75" 
                  radius={[0, 6, 6, 0]}
                  onClick={(entry) => entry && entry.schoolObj && onSelectSchool(entry.schoolObj)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {topSchoolsData.map((entry, index) => (
                    <Cell 
                      key={`bar-${index}`} 
                      fill={index === 0 ? '#0D5C75' : index === 1 ? '#127494' : index === 2 ? '#1B8DAF' : '#0D5C75'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>💡 *Klik pada salah satu bar untuk membuka detail profil sekolah</span>
            <span className="font-semibold text-[#0D5C75]">{totalStudents.toLocaleString('id-ID')} Total Siswa Terdata</span>
          </div>
        </div>

      </div>

      {/* Row 2: Secondary Visual Indicators (Gender Breakdown & Rumpun Kejuruan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Gender Breakdown Bar / Donut */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
          <div className="space-y-1 max-w-[60%]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0D5C75]" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                Komposisi Gender Siswa
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              Rasio proporsi siswa putra dan putri di wilayah {schools[0]?.cityDistrict || 'Garut'}
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-[#0D5C75]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0D5C75]" />
                <span>Putra: {totalMale.toLocaleString('id-ID')} ({totalStudents > 0 ? Math.round((totalMale / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B38E22]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" />
                <span>Putri: {totalFemale.toLocaleString('id-ID')} ({totalStudents > 0 ? Math.round((totalFemale / totalStudents) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderPieData.map((entry, index) => (
                    <Cell key={`cell-gender-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-[11px] p-2 rounded shadow-md">
                          <p className="font-bold">{data.name}</p>
                          <p>{data.value.toLocaleString('id-ID')} siswa</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kejuruan Breakdown Summary */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                Klaster Vokasi Terbanyak
              </h4>
            </div>
            <span className="text-[10px] font-bold text-[#0D5C75]">
              Top 5 Rumpun
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            {majorBarData.map((m, idx) => {
              const maxVal = majorBarData[0]?.students || 1;
              const percent = Math.round((m.students / maxVal) * 100);
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{m.fullCluster}</span>
                    <span className="font-bold text-slate-900">{m.students.toLocaleString('id-ID')} Siswa</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${idx === 0 ? 'bg-[#0D5C75]' : idx === 1 ? 'bg-[#187A9A]' : 'bg-[#D4AF37]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
