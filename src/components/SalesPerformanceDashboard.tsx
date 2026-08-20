import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Users, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Award, 
  PlusCircle, 
  Filter, 
  Search, 
  ChevronRight, 
  BarChart2, 
  Layers, 
  MapPin, 
  Phone, 
  Calendar,
  Flame,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { School, TeamMember, AuthUser, UserRole } from '../types';

interface SalesPerformanceDashboardProps {
  schools: School[];
  teamMembers?: TeamMember[];
  currentUser?: AuthUser | null;
  currentRole: UserRole;
  onOpenAddModal: () => void;
  onSelectSchool?: (school: School) => void;
  onOpenDossier?: (school: School) => void;
}

// Pipeline stage definitions
export type PipelineStage = 'Canvassing' | 'Visitasi' | 'Presentasi' | 'Deal';

interface SalesRepStats {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatarBg: string;
  totalSchools: number;
  canvassingCount: number;
  visitasiCount: number;
  presentasiCount: number;
  dealCount: number;
  totalStudents: number;
  conversionRate: number; // Deal / Total * 100
  score: number; // Weighted performance score
  rank?: number;
  schoolsList: School[];
}

export const SalesPerformanceDashboard: React.FC<SalesPerformanceDashboardProps> = ({
  schools,
  teamMembers = [],
  currentUser,
  currentRole,
  onOpenAddModal,
  onSelectSchool,
  onOpenDossier
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua Wilayah');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'deal' | 'total' | 'conversion'>('score');

  // Custom Region Targets State (persistent in memory/local)
  const [regionTargets, setRegionTargets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('aktara_region_targets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      'Kabupaten Garut': 45,
      'Kota Bandung': 30,
      'Kabupaten Bandung': 25,
      'Kota Tasikmalaya': 20,
      'Kabupaten Ciamis': 15,
      'Kabupaten Sumedang': 15
    };
  });

  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [targetDraft, setTargetDraft] = useState<Record<string, number>>(regionTargets);

  // Helper to determine school stage
  const getSchoolStage = (school: School): PipelineStage => {
    if (school.pipelineStage) return school.pipelineStage;
    if (school.partnershipStatus === 'Mitra Aktif') return 'Deal';
    if (school.partnershipStatus === 'Prospek') return 'Presentasi';
    if (school.partnershipStatus === 'Dijadwalkan') return 'Visitasi';
    return 'Canvassing';
  };

  // Helper to determine surveyor name
  const getSchoolSurveyor = (school: School, index: number, defaultReps: string[]): string => {
    if (school.surveyorName && school.surveyorName.trim()) {
      return school.surveyorName.trim();
    }
    // Deterministic distribution for initial sample schools without explicit surveyor
    const repName = defaultReps[index % defaultReps.length];
    return repName;
  };

  // Available regions list from schools
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    schools.forEach(s => {
      if (s.cityDistrict) set.add(s.cityDistrict);
    });
    return Array.from(set).sort();
  }, [schools]);

  // Filtered schools based on region & stage
  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      if (selectedRegion !== 'Semua Wilayah' && school.cityDistrict !== selectedRegion) {
        return false;
      }
      if (selectedStageFilter !== 'ALL') {
        const stage = getSchoolStage(school);
        if (stage !== selectedStageFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = school.name.toLowerCase().includes(q);
        const matchCity = school.cityDistrict.toLowerCase().includes(q);
        const matchNpsn = school.npsn.includes(q);
        const matchSurveyor = (school.surveyorName || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchNpsn && !matchSurveyor) return false;
      }
      return true;
    });
  }, [schools, selectedRegion, selectedStageFilter, searchQuery]);

  // Global Pipeline Summary
  const pipelineMetrics = useMemo(() => {
    let canvassing = 0;
    let visitasi = 0;
    let presentasi = 0;
    let deal = 0;
    let totalStudents = 0;

    filteredSchools.forEach(s => {
      const stage = getSchoolStage(s);
      if (stage === 'Canvassing') canvassing++;
      else if (stage === 'Visitasi') visitasi++;
      else if (stage === 'Presentasi') presentasi++;
      else if (stage === 'Deal') deal++;

      totalStudents += s.totalStudents || 0;
    });

    const total = filteredSchools.length;
    const conversionRate = total > 0 ? Math.round((deal / total) * 100) : 0;
    const activePipeline = visitasi + presentasi + deal;

    return {
      total,
      canvassing,
      visitasi,
      presentasi,
      deal,
      totalStudents,
      conversionRate,
      activePipeline
    };
  }, [filteredSchools]);

  // Calculate dynamic sales rep leaderboard
  const salesLeaderboard = useMemo(() => {
    // Base team list
    const repPool: { id: string; name: string; email: string; role: string; department: string; avatarBg: string }[] = [];

    // Add current user if available
    if (currentUser) {
      repPool.push({
        id: currentUser.id || 'curr-user',
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role === 'super_admin' ? 'Super Admin' : 'Sales Representative',
        department: currentUser.department || 'Field Intelligence',
        avatarBg: 'bg-[#0D5C75]'
      });
    }

    // Add registered team members
    teamMembers.forEach(tm => {
      if (!repPool.some(r => r.name.toLowerCase() === tm.name.toLowerCase())) {
        repPool.push({
          id: tm.id,
          name: tm.name,
          email: tm.email,
          role: tm.role === 'super_admin' ? 'Super Admin' : 'Account Executive',
          department: tm.department,
          avatarBg: tm.avatarBg || 'bg-indigo-600'
        });
      }
    });

    // Default sample field agents if list is small
    const fallbackAgents = [
      { id: 'rep-1', name: 'Rangga Prawira, S.Kom.', email: 'rangga.field@aktara.id', role: 'Senior Canvasser', department: 'Territory Garut & Jabar', avatarBg: 'bg-emerald-600' },
      { id: 'rep-2', name: 'Nadhira Aliyah, M.M.', email: 'nadhira.sales@aktara.id', role: 'Partnership Specialist', department: 'Vokasi Link & Match', avatarBg: 'bg-indigo-600' },
      { id: 'rep-3', name: 'Dimas Satria Wibowo', email: 'dimas.surveyor@aktara.id', role: 'Field Surveyor', department: 'East Priangan Ops', avatarBg: 'bg-blue-600' },
      { id: 'rep-4', name: 'Farhan Maulana Akbar', email: 'farhan.growth@aktara.id', role: 'Business Development', department: 'Institutional Growth', avatarBg: 'bg-amber-600' }
    ];

    fallbackAgents.forEach(fa => {
      if (!repPool.some(r => r.name.toLowerCase() === fa.name.toLowerCase())) {
        repPool.push(fa);
      }
    });

    const defaultNames = repPool.map(r => r.name);

    // Map stats per rep
    const statsMap: Record<string, SalesRepStats> = {};

    repPool.forEach(rep => {
      statsMap[rep.name] = {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        role: rep.role,
        department: rep.department,
        avatarBg: rep.avatarBg,
        totalSchools: 0,
        canvassingCount: 0,
        visitasiCount: 0,
        presentasiCount: 0,
        dealCount: 0,
        totalStudents: 0,
        conversionRate: 0,
        score: 0,
        schoolsList: []
      };
    });

    // Distribute school stats
    schools.forEach((school, index) => {
      const surveyor = getSchoolSurveyor(school, index, defaultNames);
      
      if (!statsMap[surveyor]) {
        statsMap[surveyor] = {
          id: `custom-rep-${index}`,
          name: surveyor,
          email: `${surveyor.toLowerCase().replace(/[^a-z0-9]/g, '.')}@aktara.id`,
          role: 'Field Representative',
          department: 'Wilayah Operasional',
          avatarBg: 'bg-slate-700',
          totalSchools: 0,
          canvassingCount: 0,
          visitasiCount: 0,
          presentasiCount: 0,
          dealCount: 0,
          totalStudents: 0,
          conversionRate: 0,
          score: 0,
          schoolsList: []
        };
      }

      const repStat = statsMap[surveyor];
      repStat.totalSchools += 1;
      repStat.totalStudents += school.totalStudents || 0;
      repStat.schoolsList.push(school);

      const stage = getSchoolStage(school);
      if (stage === 'Canvassing') repStat.canvassingCount += 1;
      else if (stage === 'Visitasi') repStat.visitasiCount += 1;
      else if (stage === 'Presentasi') repStat.presentasiCount += 1;
      else if (stage === 'Deal') repStat.dealCount += 1;
    });

    // Calculate score & conversion rate
    const list: SalesRepStats[] = Object.values(statsMap).map(rep => {
      const conversionRate = rep.totalSchools > 0 
        ? Math.round((rep.dealCount / rep.totalSchools) * 100) 
        : 0;

      // Score formula: Canvassing (10 pts) + Visitasi (25 pts) + Presentasi (50 pts) + Deal (100 pts)
      const score = (rep.canvassingCount * 10) + 
                    (rep.visitasiCount * 25) + 
                    (rep.presentasiCount * 50) + 
                    (rep.dealCount * 100);

      return {
        ...rep,
        conversionRate,
        score
      };
    });

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'deal') return b.dealCount - a.dealCount;
      if (sortBy === 'total') return b.totalSchools - a.totalSchools;
      if (sortBy === 'conversion') return b.conversionRate - a.conversionRate;
      return b.score - a.score;
    });

    // Assign rank
    return list.map((rep, idx) => ({
      ...rep,
      rank: idx + 1
    }));
  }, [schools, teamMembers, currentUser, sortBy]);

  // Selected Sales Rep details for drilldown
  const activeSelectedRep = useMemo(() => {
    if (!selectedRepId) return null;
    return salesLeaderboard.find(r => r.id === selectedRepId) || null;
  }, [selectedRepId, salesLeaderboard]);

  // Regional target progress computation
  const regionalProgress = useMemo(() => {
    const regionStats: Record<string, { total: number; deal: number; visitasi: number }> = {};

    schools.forEach(s => {
      const city = s.cityDistrict || 'Kabupaten Garut';
      if (!regionStats[city]) {
        regionStats[city] = { total: 0, deal: 0, visitasi: 0 };
      }
      regionStats[city].total += 1;
      const stage = getSchoolStage(s);
      if (stage === 'Deal') regionStats[city].deal += 1;
      if (stage === 'Visitasi' || stage === 'Presentasi') regionStats[city].visitasi += 1;
    });

    const regions = Object.keys(regionTargets);
    return regions.map(reg => {
      const target = regionTargets[reg] || 30;
      const actual = regionStats[reg]?.total || 0;
      const deals = regionStats[reg]?.deal || 0;
      const percentage = Math.min(Math.round((actual / Math.max(target, 1)) * 100), 100);

      let statusText = 'Perlu Akselerasi';
      let statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      if (percentage >= 100) {
        statusText = 'Target Tercapai!';
        statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      } else if (percentage >= 60) {
        statusText = 'On Track';
        statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
      }

      return {
        region: reg,
        target,
        actual,
        deals,
        percentage,
        statusText,
        statusColor
      };
    });
  }, [schools, regionTargets]);

  // Total global target & achievement
  const totalTargetSchools = useMemo(() => {
    return Object.values(regionTargets).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
  }, [regionTargets]);

  const globalTargetPercentage = totalTargetSchools > 0 
    ? Math.min(Math.round((schools.length / totalTargetSchools) * 100), 100) 
    : 0;

  // Save targets
  const handleSaveTargets = () => {
    setRegionTargets(targetDraft);
    localStorage.setItem('aktara_region_targets', JSON.stringify(targetDraft));
    setIsEditingTargets(false);
  };

  // Export CSV summary
  const handleExportCsv = () => {
    const headers = ['Peringkat', 'Nama Sales / Surveyor', 'Role', 'Departemen', 'Total Sekolah', 'Canvassing', 'Visitasi', 'Presentasi', 'Deal / Mitra', 'Conversion Rate', 'Poin Skor'];
    const rows = salesLeaderboard.map(r => [
      r.rank,
      `"${r.name}"`,
      `"${r.role}"`,
      `"${r.department}"`,
      r.totalSchools,
      r.canvassingCount,
      r.visitasiCount,
      r.presentasiCount,
      r.dealCount,
      `${r.conversionRate}%`,
      r.score
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AKTARA_Sales_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-gradient-to-br from-[#0D5C75]/10 to-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-[#0D5C75] text-white tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[#D4AF37]" />
                SALES & PIPELINE INTELLIGENCE
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF3DA] text-[#947518] border border-[#F2E3B1]">
                Live Real-Time Sync
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pencapaian Sales & Leaderboard Canvassing
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Monitoring performa representatif lapangan, visualisasi tahapan pipeline dari pendataan canvassing awal hingga penandatanganan kemitraan (deal), serta progres target per wilayah.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Input Canvassing Baru</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar to Overall Regional Target */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#0D5C75]" />
                <span>Total Target Wilayah Priangan & Jabar: {schools.length} dari {totalTargetSchools} Sekolah Terdata</span>
              </span>
              <span className="font-extrabold text-[#0D5C75] text-sm">{globalTargetPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#0D5C75] via-teal-600 to-emerald-500 transition-all duration-500 shadow-xs"
                style={{ width: `${globalTargetPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditingTargets(!isEditingTargets)}
              className="w-full md:w-auto px-3 py-1.5 text-[11px] font-semibold text-[#0D5C75] bg-[#EBF4F7] hover:bg-[#D8ECF2] border border-[#CCE3EA] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isEditingTargets ? 'Tutup Target' : 'Atur Target Wilayah'}</span>
            </button>
          </div>
        </div>

        {/* Target Editor Drawer */}
        {isEditingTargets && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Konfigurasi Target Kuota Sekolah per Kabupaten/Kota
              </h4>
              <button
                onClick={handleSaveTargets}
                className="px-3 py-1 bg-[#0D5C75] hover:bg-[#07394A] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Simpan Target
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.keys(targetDraft).map(reg => (
                <div key={reg} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 truncate block">{reg}</label>
                  <input
                    type="number"
                    min="1"
                    value={targetDraft[reg] || 0}
                    onChange={(e) => setTargetDraft(p => ({ ...p, [reg]: Math.max(1, Number(e.target.value)) }))}
                    className="w-full p-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Pipeline Funnel KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Total Canvassing */}
        <div 
          onClick={() => setSelectedStageFilter(selectedStageFilter === 'Canvassing' ? 'ALL' : 'Canvassing')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            selectedStageFilter === 'Canvassing'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${selectedStageFilter === 'Canvassing' ? 'text-slate-300' : 'text-slate-500'}`}>
              1. Canvassing
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black">{pipelineMetrics.canvassing}</div>
          <p className={`text-[11px] mt-1 truncate ${selectedStageFilter === 'Canvassing' ? 'text-slate-300' : 'text-slate-500'}`}>
            Sekolah Teridentifikasi
          </p>
        </div>

        {/* Card 2: Visitasi */}
        <div 
          onClick={() => setSelectedStageFilter(selectedStageFilter === 'Visitasi' ? 'ALL' : 'Visitasi')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            selectedStageFilter === 'Visitasi'
              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${selectedStageFilter === 'Visitasi' ? 'text-blue-200' : 'text-blue-700'}`}>
              2. Visitasi
            </span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black">{pipelineMetrics.visitasi}</div>
          <p className={`text-[11px] mt-1 truncate ${selectedStageFilter === 'Visitasi' ? 'text-blue-100' : 'text-slate-500'}`}>
            Kunjungan Lapangan
          </p>
        </div>

        {/* Card 3: Presentasi */}
        <div 
          onClick={() => setSelectedStageFilter(selectedStageFilter === 'Presentasi' ? 'ALL' : 'Presentasi')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            selectedStageFilter === 'Presentasi'
              ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${selectedStageFilter === 'Presentasi' ? 'text-amber-200' : 'text-amber-700'}`}>
              3. Presentasi
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black">{pipelineMetrics.presentasi}</div>
          <p className={`text-[11px] mt-1 truncate ${selectedStageFilter === 'Presentasi' ? 'text-amber-100' : 'text-slate-500'}`}>
            Audiensi & Prospek
          </p>
        </div>

        {/* Card 4: Deal / Mitra Aktif */}
        <div 
          onClick={() => setSelectedStageFilter(selectedStageFilter === 'Deal' ? 'ALL' : 'Deal')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            selectedStageFilter === 'Deal'
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${selectedStageFilter === 'Deal' ? 'text-emerald-200' : 'text-emerald-700'}`}>
              4. Deal (Mitra)
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black">{pipelineMetrics.deal}</div>
          <p className={`text-[11px] mt-1 truncate ${selectedStageFilter === 'Deal' ? 'text-emerald-100' : 'text-slate-500'}`}>
            MoU / Kemitraan Aktif
          </p>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Konversi Deal
            </span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{pipelineMetrics.conversionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Rasio Deal vs Canvassing
          </p>
        </div>

        {/* Card 6: Total Students Reach */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Audience Siswa
            </span>
            <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {pipelineMetrics.totalStudents.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Siswa Terjangkau
          </p>
        </div>

      </div>

      {/* 3. Main Grid: Pipeline Funnel Flow & Progress Bar Target Wilayah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Visual Pipeline Funnel Flow */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75] text-white flex items-center justify-center shadow-xs">
                <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Pipeline Funnel Konversi Kemitraan
                </h3>
                <p className="text-[11px] text-slate-500">
                  Visualisasi aliran konversi dari kontak awal hingga peresmian MoU
                </p>
              </div>
            </div>

            {selectedStageFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedStageFilter('ALL')}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filter Tahap
              </button>
            )}
          </div>

          {/* Interactive Funnel Horizontal Diagram */}
          <div className="space-y-3 pt-2">
            
            {/* Step 1: Canvassing */}
            <div 
              onClick={() => setSelectedStageFilter(selectedStageFilter === 'Canvassing' ? 'ALL' : 'Canvassing')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStageFilter === 'Canvassing' 
                  ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                  <span className="font-extrabold text-slate-800">Canvassing (Tahap Identifikasi)</span>
                </div>
                <span className="font-bold text-slate-900">{pipelineMetrics.canvassing} Sekolah ({pipelineMetrics.total > 0 ? Math.round((pipelineMetrics.canvassing/pipelineMetrics.total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-700 rounded-full transition-all" 
                  style={{ width: `${pipelineMetrics.total > 0 ? (pipelineMetrics.canvassing / pipelineMetrics.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1.5">
                Sekolah baru hasil entri tim surveyor, profiling NPSN, dan pemetaan demografi awal.
              </p>
            </div>

            {/* Step 2: Visitasi */}
            <div 
              onClick={() => setSelectedStageFilter(selectedStageFilter === 'Visitasi' ? 'ALL' : 'Visitasi')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStageFilter === 'Visitasi' 
                  ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                  <span className="font-extrabold text-blue-900">Visitasi (Kunjungan & Penjadwalan)</span>
                </div>
                <span className="font-bold text-blue-900">{pipelineMetrics.visitasi} Sekolah ({pipelineMetrics.total > 0 ? Math.round((pipelineMetrics.visitasi/pipelineMetrics.total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all" 
                  style={{ width: `${pipelineMetrics.total > 0 ? (pipelineMetrics.visitasi / pipelineMetrics.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1.5">
                Kunjungan langsung representatif AKTARA ke pihak kepala sekolah / wakasek humas dan kurikulum.
              </p>
            </div>

            {/* Step 3: Presentasi */}
            <div 
              onClick={() => setSelectedStageFilter(selectedStageFilter === 'Presentasi' ? 'ALL' : 'Presentasi')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStageFilter === 'Presentasi' 
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                  <span className="font-extrabold text-amber-900">Presentasi (Audiensi Prospek & Kurikulum)</span>
                </div>
                <span className="font-bold text-amber-900">{pipelineMetrics.presentasi} Sekolah ({pipelineMetrics.total > 0 ? Math.round((pipelineMetrics.presentasi/pipelineMetrics.total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-600 rounded-full transition-all" 
                  style={{ width: `${pipelineMetrics.total > 0 ? (pipelineMetrics.presentasi / pipelineMetrics.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1.5">
                Pemaparan proposal sertifikasi guru, AI bootcamp siswa, dan sinkronisasi kurikulum industri vokasi.
              </p>
            </div>

            {/* Step 4: Deal / Mitra Aktif */}
            <div 
              onClick={() => setSelectedStageFilter(selectedStageFilter === 'Deal' ? 'ALL' : 'Deal')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStageFilter === 'Deal' 
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                  <span className="font-extrabold text-emerald-900">Deal (MoU / Mitra Aktif AKTARA)</span>
                </div>
                <span className="font-bold text-emerald-900">{pipelineMetrics.deal} Sekolah ({pipelineMetrics.total > 0 ? Math.round((pipelineMetrics.deal/pipelineMetrics.total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all" 
                  style={{ width: `${pipelineMetrics.total > 0 ? (pipelineMetrics.deal / pipelineMetrics.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-1.5">
                Kesepakatan kemitraan formal aktif, pelaksanaan program pelatihan, dan integrasi talenta vokasi.
              </p>
            </div>

          </div>
        </div>

        {/* Right Column (5 cols): Progress Bar Target Wilayah */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Target & Kuota Wilayah
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pencapaian vs kuota target per kabupaten/kota
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditingTargets(true)}
              className="text-[11px] font-bold text-[#0D5C75] hover:underline"
            >
              Ubah Target
            </button>
          </div>

          {/* Regional Progress List */}
          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {regionalProgress.map(item => (
              <div 
                key={item.region} 
                onClick={() => setSelectedRegion(selectedRegion === item.region ? 'Semua Wilayah' : item.region)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedRegion === item.region 
                    ? 'border-[#0D5C75] bg-[#EBF4F7]/40 shadow-xs' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">{item.region}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold">{item.actual}/{item.target}</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${item.statusColor}`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      item.percentage >= 100 
                        ? 'bg-emerald-500' 
                        : item.percentage >= 60 
                          ? 'bg-[#0D5C75]' 
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>{item.deals} Sekolah Berstatus Deal</span>
                  <span className="font-semibold text-slate-700">{item.statusText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Top Performer Leaderboard Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAF3DA] to-[#F2E3B1] border border-[#E5CE85] text-[#947518] flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5 text-[#B38E22]" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                Top Performer Leaderboard Lapangan
              </h3>
              <p className="text-xs text-slate-500">
                Peringkat kontribusi anggota tim berdasarkan akumulasi sekolah, visitasi, dan keberhasilan deal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Region Selector */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:ring-1 focus:ring-[#0D5C75] cursor-pointer"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                {availableRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:ring-1 focus:ring-[#0D5C75] cursor-pointer"
              >
                <option value="score">Urutkan: Skor Poin Tertinggi</option>
                <option value="deal">Urutkan: Deal Terbanyak</option>
                <option value="total">Urutkan: Total Sekolah</option>
                <option value="conversion">Urutkan: Rasio Konversi %</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari representatif/sekolah..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#0D5C75] text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Podium Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {salesLeaderboard.slice(0, 3).map((rep, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            return (
              <div 
                key={rep.id}
                onClick={() => setSelectedRepId(selectedRepId === rep.id ? null : rep.id)}
                className={`relative rounded-2xl p-5 border transition-all cursor-pointer space-y-3.5 overflow-hidden ${
                  selectedRepId === rep.id
                    ? 'border-[#0D5C75] ring-2 ring-[#0D5C75] shadow-md'
                    : isFirst
                      ? 'border-[#E5CE85] bg-gradient-to-b from-[#FAF3DA]/40 to-white shadow-xs hover:shadow-md'
                      : isSecond
                        ? 'border-slate-300 bg-gradient-to-b from-slate-50 to-white shadow-2xs hover:shadow-xs'
                        : 'border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Badge Rank Top Corner */}
                <div className="flex items-center justify-between">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                    isFirst 
                      ? 'bg-[#B38E22] text-white' 
                      : isSecond 
                        ? 'bg-slate-600 text-white' 
                        : 'bg-amber-700 text-white'
                  }`}>
                    {isFirst && <Trophy className="w-3.5 h-3.5 text-yellow-200" />}
                    <span>Juara #{rep.rank}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Skor</span>
                    <span className="text-lg font-black text-[#0D5C75]">{rep.score.toLocaleString()} Pts</span>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${rep.avatarBg} text-white flex items-center justify-center font-black text-base shadow-sm shrink-0`}>
                    {rep.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate leading-tight">{rep.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{rep.role}</p>
                    <p className="text-[10px] text-slate-400 truncate">{rep.department}</p>
                  </div>
                </div>

                {/* Breakdown Stats Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-center">
                  <div className="p-1.5 bg-slate-50 rounded-lg">
                    <span className="text-[9.5px] text-slate-400 block font-semibold">Total</span>
                    <span className="text-xs font-black text-slate-800">{rep.totalSchools}</span>
                  </div>
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <span className="text-[9.5px] text-blue-600 block font-semibold">Visit</span>
                    <span className="text-xs font-black text-blue-900">{rep.visitasiCount}</span>
                  </div>
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <span className="text-[9.5px] text-amber-600 block font-semibold">Pres.</span>
                    <span className="text-xs font-black text-amber-900">{rep.presentasiCount}</span>
                  </div>
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <span className="text-[9.5px] text-emerald-600 block font-semibold">Deal</span>
                    <span className="text-xs font-black text-emerald-900">{rep.dealCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Rasio Konversi: <strong className="text-slate-800">{rep.conversionRate}%</strong></span>
                  <span className="text-[#0D5C75] font-bold flex items-center gap-0.5">
                    <span>Lihat Portofolio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Leaderboard Table for All Members */}
        <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Nama Representatif</th>
                  <th className="py-3 px-4 text-center">Canvassing</th>
                  <th className="py-3 px-4 text-center">Visitasi</th>
                  <th className="py-3 px-4 text-center">Presentasi</th>
                  <th className="py-3 px-4 text-center">Deal (MoU)</th>
                  <th className="py-3 px-4 text-center">Total Sekolah</th>
                  <th className="py-3 px-4 text-center">Konversi %</th>
                  <th className="py-3 px-4 text-right">Skor Poin</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {salesLeaderboard.map((rep) => {
                  const isSelected = selectedRepId === rep.id;
                  return (
                    <tr 
                      key={rep.id}
                      onClick={() => setSelectedRepId(isSelected ? null : rep.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#EBF4F7]/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-black ${
                          rep.rank === 1 ? 'bg-[#B38E22] text-white' :
                          rep.rank === 2 ? 'bg-slate-600 text-white' :
                          rep.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {rep.rank}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${rep.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {rep.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{rep.name}</span>
                              {currentUser?.name === rep.name && (
                                <span className="text-[9px] font-bold bg-[#FAF3DA] text-[#947518] px-1.5 py-0.2 rounded border border-[#F2E3B1]">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-400">{rep.department}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-700">{rep.canvassingCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700">{rep.visitasiCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{rep.presentasiCount}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-700">{rep.dealCount}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900">{rep.totalSchools}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700">
                          {rep.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-[#0D5C75] text-sm">
                        {rep.score.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRepId(isSelected ? null : rep.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#0D5C75] hover:bg-[#EBF4F7] rounded-lg transition-colors"
                        >
                          {isSelected ? 'Tutup' : 'Detail'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drilldown Section: Schools Managed by Selected Representative */}
        {activeSelectedRep && (
          <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activeSelectedRep.avatarBg} text-white flex items-center justify-center font-black text-sm`}>
                  {activeSelectedRep.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Portofolio Sekolah Dikelola: {activeSelectedRep.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Total {activeSelectedRep.schoolsList.length} Sekolah • {activeSelectedRep.dealCount} Deal Sukses • {activeSelectedRep.totalStudents.toLocaleString()} Siswa Terjangkau
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRepId(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs"
              >
                Tutup Detail
              </button>
            </div>

            {activeSelectedRep.schoolsList.length === 0 ? (
              <div className="p-6 bg-white rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                Belum ada sekolah yang dialokasikan atau di-input oleh representatif ini. Klik <strong>+ Input Canvassing Baru</strong> untuk menambahkan sekolah.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSelectedRep.schoolsList.map((school) => {
                  const stage = getSchoolStage(school);
                  return (
                    <div 
                      key={school.id}
                      onClick={() => onOpenDossier ? onOpenDossier(school) : onSelectSchool && onSelectSchool(school)}
                      className="bg-white border border-slate-200 hover:border-[#0D5C75] rounded-xl p-3.5 space-y-2 cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                          stage === 'Deal' ? 'bg-emerald-100 text-emerald-800' :
                          stage === 'Presentasi' ? 'bg-amber-100 text-amber-800' :
                          stage === 'Visitasi' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {stage.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{school.type} • {school.status}</span>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-[#0D5C75] transition-colors line-clamp-1">
                          {school.name}
                        </h5>
                        <p className="text-[10.5px] text-slate-500 truncate">
                          {school.subDistrict}, {school.cityDistrict}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-500">{school.totalStudents} Siswa</span>
                        <span className="font-bold text-[#0D5C75] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
