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
  ArrowLeft,
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
  ChevronDown,
  Percent,
  Compass,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { School, TeamMember, AuthUser, UserRole } from '../types';

export interface SalesIntelligenceViewProps {
  schools: School[];
  teamMembers?: TeamMember[];
  currentUser?: AuthUser | null;
  currentRole: UserRole;
  onOpenAddModal: () => void;
  onSelectSchool?: (school: School) => void;
  onOpenDossier?: (school: School) => void;
  onBackToDashboard?: () => void;
}

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

export const SalesIntelligenceView: React.FC<SalesIntelligenceViewProps> = ({
  schools,
  teamMembers = [],
  currentUser,
  currentRole,
  onOpenAddModal,
  onSelectSchool,
  onOpenDossier,
  onBackToDashboard
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua Wilayah');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'deal' | 'total' | 'conversion'>('score');
  const [timePeriod, setTimePeriod] = useState<'ALL' | 'THIS_MONTH' | 'THIS_QUARTER'>('ALL');

  // Custom Region Targets State (persistent in memory/localStorage)
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
  const [tempTargets, setTempTargets] = useState<Record<string, number>>(regionTargets);

  // Helper to extract or derive pipeline stage for a school
  const getSchoolStage = (school: School): PipelineStage => {
    const anySchool = school as any;
    if (anySchool.pipelineStage) {
      return anySchool.pipelineStage as PipelineStage;
    }
    if (anySchool.partnershipStatus === 'Mitra Aktif' || anySchool.partnershipStatus === 'MoU Signed' || anySchool.dealStatus === 'Deal') {
      return 'Deal';
    }
    if (anySchool.partnershipStatus === 'Presentasi' || anySchool.partnershipStatus === 'Penjajakan Lanjut') {
      return 'Presentasi';
    }
    if (anySchool.partnershipStatus === 'Visitasi' || anySchool.partnershipStatus === 'Prospek Hangat') {
      return 'Visitasi';
    }
    return 'Canvassing';
  };

  // Helper to get surveyor/PIC name
  const getSchoolPic = (school: School): string => {
    const anySchool = school as any;
    if (anySchool.surveyorName && typeof anySchool.surveyorName === 'string' && anySchool.surveyorName.trim()) {
      return anySchool.surveyorName.trim();
    }
    if (anySchool.picName && typeof anySchool.picName === 'string' && anySchool.picName.trim()) {
      return anySchool.picName.trim();
    }
    // Deterministic assignment based on school name hash for existing sample schools without explicit PIC
    const names = [
      'Budi Santoso', 
      'Rina Wijaya', 
      'Dedi Hendrawan', 
      'Siti Nurhaliza', 
      'Fajar Pratama', 
      'Ahmad Fauzi'
    ];
    let hash = 0;
    for (let i = 0; i < school.name.length; i++) {
      hash = (hash << 5) - hash + school.name.charCodeAt(i);
      hash |= 0;
    }
    return names[Math.abs(hash) % names.length];
  };

  // Available unique regions
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    schools.forEach(s => {
      if (s.city) set.add(s.city);
    });
    return ['Semua Wilayah', ...Array.from(set).sort()];
  }, [schools]);

  // Aggregate Pipeline Metrics for Filtered Schools
  const pipelineMetrics = useMemo(() => {
    let filtered = schools;
    if (selectedRegion !== 'Semua Wilayah') {
      filtered = filtered.filter(s => s.city === selectedRegion);
    }

    let canvassing = 0;
    let visitasi = 0;
    let presentasi = 0;
    let deal = 0;
    let totalStudentsCanvassed = 0;
    let dealStudents = 0;

    filtered.forEach(school => {
      const stage = getSchoolStage(school);
      const students = school.totalStudents || 0;
      totalStudentsCanvassed += students;

      if (stage === 'Canvassing') canvassing++;
      else if (stage === 'Visitasi') visitasi++;
      else if (stage === 'Presentasi') presentasi++;
      else if (stage === 'Deal') {
        deal++;
        dealStudents += students;
      }
    });

    const total = filtered.length;
    const conversionRate = total > 0 ? (deal / total) * 100 : 0;
    const visitasiRate = total > 0 ? ((visitasi + presentasi + deal) / total) * 100 : 0;
    const presentasiRate = (visitasi + presentasi + deal) > 0 ? ((presentasi + deal) / (visitasi + presentasi + deal)) * 100 : 0;
    const dealCloseRate = (presentasi + deal) > 0 ? (deal / (presentasi + deal)) * 100 : 0;

    return {
      total,
      canvassing,
      visitasi,
      presentasi,
      deal,
      totalStudentsCanvassed,
      dealStudents,
      conversionRate,
      visitasiRate,
      presentasiRate,
      dealCloseRate
    };
  }, [schools, selectedRegion]);

  // Aggregate Reps & Leaderboard Data
  const repLeaderboard = useMemo(() => {
    const map = new Map<string, SalesRepStats>();

    // Initialize with team members if available
    const palette = [
      'bg-[#0D5C75] text-white',
      'bg-amber-600 text-white',
      'bg-emerald-600 text-white',
      'bg-indigo-600 text-white',
      'bg-rose-600 text-white',
      'bg-teal-600 text-white',
      'bg-purple-600 text-white',
      'bg-blue-600 text-white'
    ];

    teamMembers.forEach((tm, idx) => {
      map.set(tm.name, {
        id: tm.id,
        name: tm.name,
        email: tm.email,
        role: tm.role === 'super_admin' ? 'Super Admin / Lead' : 'Field Sales / Canvasser',
        department: tm.department || 'Sales & Partnership',
        avatarBg: palette[idx % palette.length],
        totalSchools: 0,
        canvassingCount: 0,
        visitasiCount: 0,
        presentasiCount: 0,
        dealCount: 0,
        totalStudents: 0,
        conversionRate: 0,
        score: 0,
        schoolsList: []
      });
    });

    // Populate data from schools
    schools.forEach(school => {
      const pic = getSchoolPic(school);
      const stage = getSchoolStage(school);
      const students = school.totalStudents || 0;

      if (!map.has(pic)) {
        const idx = map.size;
        map.set(pic, {
          id: `rep-${idx}`,
          name: pic,
          email: `${pic.toLowerCase().replace(/\s+/g, '.')}@aktara.id`,
          role: 'Field Representative',
          department: 'Field Sales',
          avatarBg: palette[idx % palette.length],
          totalSchools: 0,
          canvassingCount: 0,
          visitasiCount: 0,
          presentasiCount: 0,
          dealCount: 0,
          totalStudents: 0,
          conversionRate: 0,
          score: 0,
          schoolsList: []
        });
      }

      const rep = map.get(pic)!;
      rep.totalSchools += 1;
      rep.totalStudents += students;
      rep.schoolsList.push(school);

      if (stage === 'Canvassing') rep.canvassingCount += 1;
      else if (stage === 'Visitasi') rep.visitasiCount += 1;
      else if (stage === 'Presentasi') rep.presentasiCount += 1;
      else if (stage === 'Deal') rep.dealCount += 1;
    });

    // Calculate score & conversion rate
    // Weighting: Deal = 100 pts, Presentasi = 40 pts, Visitasi = 20 pts, Canvassing = 5 pts
    const result: SalesRepStats[] = Array.from(map.values()).map(rep => {
      const conversion = rep.totalSchools > 0 ? (rep.dealCount / rep.totalSchools) * 100 : 0;
      const score = (rep.dealCount * 100) + 
                    (rep.presentasiCount * 40) + 
                    (rep.visitasiCount * 20) + 
                    (rep.canvassingCount * 5);

      return {
        ...rep,
        conversionRate: conversion,
        score: score
      };
    });

    // Sort by criteria
    result.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'deal') return b.dealCount - a.dealCount;
      if (sortBy === 'conversion') return b.conversionRate - a.conversionRate;
      return b.totalSchools - a.totalSchools;
    });

    // Assign rank
    return result.map((r, index) => ({
      ...r,
      rank: index + 1
    }));
  }, [schools, teamMembers, sortBy]);

  // Filtered schools for the pipeline view
  const activeSchools = useMemo(() => {
    let list = schools;

    if (selectedRegion !== 'Semua Wilayah') {
      list = list.filter(s => s.city === selectedRegion);
    }

    if (selectedStageFilter !== 'ALL') {
      list = list.filter(s => getSchoolStage(s) === selectedStageFilter);
    }

    if (selectedRepId) {
      const rep = repLeaderboard.find(r => r.id === selectedRepId);
      if (rep) {
        list = list.filter(s => getSchoolPic(s) === rep.name);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.subDistrict.toLowerCase().includes(q) ||
        getSchoolPic(s).toLowerCase().includes(q)
      );
    }

    return list;
  }, [schools, selectedRegion, selectedStageFilter, selectedRepId, searchQuery, repLeaderboard]);

  // Regional target progress breakdown
  const regionalAchievements = useMemo(() => {
    const counts: Record<string, { total: number; deals: number; students: number }> = {};

    schools.forEach(s => {
      const city = s.city || 'Lainnya';
      if (!counts[city]) {
        counts[city] = { total: 0, deals: 0, students: 0 };
      }
      counts[city].total += 1;
      counts[city].students += (s.totalStudents || 0);
      if (getSchoolStage(s) === 'Deal') {
        counts[city].deals += 1;
      }
    });

    const regions = Object.keys(regionTargets);
    return regions.map(reg => {
      const target = regionTargets[reg] || 20;
      const current = counts[reg]?.total || 0;
      const deals = counts[reg]?.deals || 0;
      const percentage = Math.min(100, Math.round((current / target) * 100));
      return {
        region: reg,
        target,
        current,
        deals,
        percentage,
        isCompleted: current >= target
      };
    });
  }, [schools, regionTargets]);

  // Total global target & achievement
  const totalTargetSchools = useMemo(() => {
    return Object.values(regionTargets).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
  }, [regionTargets]);

  const globalTargetPercentage = totalTargetSchools > 0 
    ? Math.min(100, Math.round((pipelineMetrics.total / totalTargetSchools) * 100))
    : 0;

  // Handle saving target adjustments
  const handleSaveTargets = () => {
    setRegionTargets(tempTargets);
    localStorage.setItem('aktara_region_targets', JSON.stringify(tempTargets));
    setIsEditingTargets(false);
  };

  // Export report to CSV
  const handleExportCsv = () => {
    const headers = ['Peringkat', 'Nama Canvasser / PIC', 'Total Sekolah', 'Canvassing', 'Visitasi', 'Presentasi', 'Deal/MoU', 'Rasio Konversi (%)', 'Weighted Score', 'Siswa Terjangkau'];
    const rows = repLeaderboard.map(r => [
      r.rank,
      `"${r.name}"`,
      r.totalSchools,
      r.canvassingCount,
      r.visitasiCount,
      r.presentasiCount,
      r.dealCount,
      `${r.conversionRate.toFixed(1)}%`,
      r.score,
      r.totalStudents
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Pencapaian_Sales_AKTARA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="sales-intelligence-view" className="space-y-6 pb-14 max-w-7xl mx-auto">
      
      {/* 0. BREADCRUMB & BACK BUTTON */}
      {onBackToDashboard && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            id="sales-back-to-dashboard-btn"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-[#0D5C75] border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-[#0D5C75] group-hover:-translate-x-1 transition-transform" />
            <span>← Kembali ke Dashboard Utama</span>
          </button>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2 font-medium">
            <span>Navigasi:</span>
            <button 
              onClick={onBackToDashboard}
              className="text-slate-600 hover:text-[#0D5C75] font-semibold underline decoration-slate-300 hover:decoration-[#0D5C75] cursor-pointer"
            >
              Executive Summary
            </button>
            <span>/</span>
            <span className="font-bold text-[#0D5C75]">Sales Intelligence</span>
          </div>
        </div>
      )}

      {/* 1. HERO TITLE & ACTION BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>SALES INTELLIGENCE & CANVASSING HUB</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Real-time Sync Active</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pencapaian Sales & Leaderboard Canvassing
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Monitoring performa rep lapangan, konversi funnel kemitraan B2B/B2G, evaluasi pipeline per tahapan, dan akselerasi kuota target penetrasi sekolah.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              id="sales-export-csv-btn"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Rekapan (.CSV)</span>
            </button>

            <button
              id="sales-edit-targets-btn"
              onClick={() => {
                setTempTargets(regionTargets);
                setIsEditingTargets(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#0D5C75]" />
              <span>Atur Target Wilayah</span>
            </button>

            <button
              id="sales-add-canvassing-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C75] text-white text-xs font-extrabold hover:bg-[#094356] transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>+ Entri Canvassing Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS BAR TARGET GLOBAL & REGIONAL KUOTA */}
      <div className="bg-gradient-to-br from-slate-900 via-[#07394A] to-[#0D5C75] rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Top Info row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-400 shrink-0">
                <Target className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Capaian Target Global</span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{pipelineMetrics.total}</span>
                  <span className="text-sm font-medium text-slate-300">/ {totalTargetSchools} Sekolah Target</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-xl">
                <div className="text-[11px] text-slate-300 font-medium">Mitra Deal (MoU)</div>
                <div className="text-lg font-black text-amber-300">{pipelineMetrics.deal} Sekolah</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-xl">
                <div className="text-[11px] text-slate-300 font-medium">Siswa Terjangkau</div>
                <div className="text-lg font-black text-emerald-300">{pipelineMetrics.totalStudentsCanvassed.toLocaleString('id-ID')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-xl">
                <div className="text-[11px] text-slate-300 font-medium">Overall Conversion</div>
                <div className="text-lg font-black text-white">{pipelineMetrics.conversionRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Main Global Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-200 flex items-center gap-1.5">
                <span>Progress Penetrasi Pasar Jawa Barat</span>
                <span className="text-amber-300 text-[11px]">({globalTargetPercentage}% Tercapai)</span>
              </span>
              <span className="text-amber-300 font-black text-sm">{pipelineMetrics.total} / {totalTargetSchools} Sekolah</span>
            </div>
            
            <div className="w-full bg-black/30 rounded-full h-4 p-0.5 overflow-hidden border border-white/20">
              <div 
                className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, globalTargetPercentage)}%` }}
              />
            </div>
          </div>

          {/* Regional Progress Grid */}
          <div className="pt-2">
            <div className="text-xs font-extrabold uppercase text-slate-300 tracking-wider mb-3 flex items-center justify-between">
              <span>Rincian Target Kuota Per Wilayah Target</span>
              <span className="text-[11px] text-slate-400 lowercase">klik untuk filter wilayah</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {regionalAchievements.map(item => {
                const isSelected = selectedRegion === item.region;
                return (
                  <div 
                    key={item.region}
                    onClick={() => setSelectedRegion(isSelected ? 'Semua Wilayah' : item.region)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white/20 border-amber-400 ring-2 ring-amber-400/40 shadow-sm' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-white truncate max-w-[170px]">{item.region}</span>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        item.percentage >= 100 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                          : item.percentage >= 60 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      }`}>
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 100 
                            ? 'bg-emerald-400' 
                            : item.percentage >= 60 
                              ? 'bg-amber-400' 
                              : 'bg-blue-400'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>{item.current} / {item.target} Sekolah</span>
                      <span className="text-amber-200 font-semibold">{item.deals} Deal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 3. METRIC CARDS: 4 PIPELINE STAGES (SPACIOUS & MODERN) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0D5C75]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Statistik Tahapan Pipeline Kemitraan
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Wilayah: <strong className="text-slate-800">{selectedRegion}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Canvassing */}
          <div 
            onClick={() => setSelectedStageFilter(selectedStageFilter === 'Canvassing' ? 'ALL' : 'Canvassing')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
              selectedStageFilter === 'Canvassing'
                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/90 hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                  1
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Tahap Awal
                </span>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Canvassing & Kontak</h4>
              <div className="text-3xl font-black text-slate-900 mt-1">{pipelineMetrics.canvassing}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sekolah telah diidentifikasi dan dihubungi via telepon / pesan perkenalan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>{pipelineMetrics.total > 0 ? ((pipelineMetrics.canvassing / pipelineMetrics.total) * 100).toFixed(0) : 0}% dari total</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Visitasi */}
          <div 
            onClick={() => setSelectedStageFilter(selectedStageFilter === 'Visitasi' ? 'ALL' : 'Visitasi')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
              selectedStageFilter === 'Visitasi'
                ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200/90 hover:border-indigo-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                  2
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Kunjungan
                </span>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Visitasi Lapangan</h4>
              <div className="text-3xl font-black text-slate-900 mt-1">{pipelineMetrics.visitasi}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Telah dikunjungi langsung oleh surveyor untuk audiensi tatap muka.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>{pipelineMetrics.total > 0 ? ((pipelineMetrics.visitasi / pipelineMetrics.total) * 100).toFixed(0) : 0}% dari total</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Presentasi */}
          <div 
            onClick={() => setSelectedStageFilter(selectedStageFilter === 'Presentasi' ? 'ALL' : 'Presentasi')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
              selectedStageFilter === 'Presentasi'
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200/90 hover:border-amber-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                  3
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Demo & Pitch
                </span>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Presentasi / Pitching</h4>
              <div className="text-3xl font-black text-slate-900 mt-1">{pipelineMetrics.presentasi}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pitching resmi ke Kepala Sekolah / Waka Kurikulum & proposal diajukan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800">
              <span>{pipelineMetrics.total > 0 ? ((pipelineMetrics.presentasi / pipelineMetrics.total) * 100).toFixed(0) : 0}% dari total</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Deal / Mitra Aktif */}
          <div 
            onClick={() => setSelectedStageFilter(selectedStageFilter === 'Deal' ? 'ALL' : 'Deal')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
              selectedStageFilter === 'Deal'
                ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200/90 hover:border-emerald-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  4
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  SUCCESS DEAL
                </span>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Deal & MoU Signed</h4>
              <div className="text-3xl font-black text-emerald-700 mt-1">{pipelineMetrics.deal}</div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Kerja sama disepakati, MoU ditandatangani, dan aktif onboard ke ekosistem.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-700">
              <span>{pipelineMetrics.totalStudentsCanvassed > 0 ? ((pipelineMetrics.dealStudents / pipelineMetrics.totalStudentsCanvassed) * 100).toFixed(0) : 0}% Siswa deal</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. VISUAL SALES FUNNEL CONVERSION SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0D5C75]" />
              <h3 className="text-base font-extrabold text-slate-900">
                Funnel Konversi Kemitraan (B2B Conversion Pipeline)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi rasio lolos tahapan dari kontak pertama hingga penandatanganan kesepakatan.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Total Prospek:</span>
            <span className="font-black text-[#0D5C75] bg-[#0D5C75]/10 px-2.5 py-1 rounded-lg">
              {pipelineMetrics.total} Sekolah
            </span>
          </div>
        </div>

        {/* Funnel Visual Bars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-600 mb-1">
                <span>1. Canvassing</span>
                <span className="text-slate-900 font-black">{pipelineMetrics.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                <div className="bg-blue-600 h-full rounded-full w-full" />
              </div>
              <div className="text-[11px] text-slate-500">
                100% dari basis target sekolah yang dieksplorasi.
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] font-bold text-blue-700 flex items-center justify-between">
              <span>Konversi ke Visit</span>
              <span>{pipelineMetrics.visitasiRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-600 mb-1">
                <span>2. Visitasi Lapangan</span>
                <span className="text-slate-900 font-black">{pipelineMetrics.visitasi + pipelineMetrics.presentasi + pipelineMetrics.deal}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${pipelineMetrics.visitasiRate}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500">
                Sekolah yang sukses dijangkau dengan kunjungan fisik.
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] font-bold text-indigo-700 flex items-center justify-between">
              <span>Konversi ke Pitch</span>
              <span>{pipelineMetrics.presentasiRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-600 mb-1">
                <span>3. Presentasi Demo</span>
                <span className="text-slate-900 font-black">{pipelineMetrics.presentasi + pipelineMetrics.deal}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${pipelineMetrics.total > 0 ? (((pipelineMetrics.presentasi + pipelineMetrics.deal) / pipelineMetrics.total) * 100) : 0}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500">
                Sekolah yang telah menerima demo & kalkulasi biaya/benefit.
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] font-bold text-amber-700 flex items-center justify-between">
              <span>Close Rate (Deal)</span>
              <span>{pipelineMetrics.dealCloseRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900 mb-1">
                <span>4. Deal / MoU Resmi</span>
                <span className="text-emerald-900 font-black">{pipelineMetrics.deal}</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${pipelineMetrics.conversionRate}%` }}
                />
              </div>
              <div className="text-[11px] text-emerald-800">
                Kemitraan resmi terlaksana dengan sukses.
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200 text-[11px] font-black text-emerald-900 flex items-center justify-between">
              <span>End-to-End Rate</span>
              <span>{pipelineMetrics.conversionRate.toFixed(1)}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* 5. TOP 3 PODIUM LEADERBOARD (LUXURY GOLD/SILVER/BRONZE) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-extrabold text-slate-900">
                Podium Canvasser Terbaik (Top Performers)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Apresiasi dan ranking performa tim canvasser berdasarkan capaian deal dan poin bobot aktivitas.
            </p>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs focus:ring-1 focus:ring-[#0D5C75] cursor-pointer"
            >
              <option value="score">Weighted Performance Score</option>
              <option value="deal">Jumlah Deal Tertinggi</option>
              <option value="conversion">Tingkat Konversi (%)</option>
              <option value="total">Total Sekolah Diinput</option>
            </select>
          </div>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {repLeaderboard.slice(0, 3).map((rep, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const badgeBg = isFirst 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-300/50' 
              : isSecond 
                ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-300/50'
                : 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-amber-700/50';

            const cardBorder = isFirst 
              ? 'border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white' 
              : isSecond
                ? 'border-slate-300 bg-gradient-to-b from-slate-50/40 via-white to-white'
                : 'border-amber-200/80 bg-white';

            return (
              <div 
                key={rep.id}
                onClick={() => setSelectedRepId(selectedRepId === rep.id ? null : rep.id)}
                className={`rounded-2xl border ${cardBorder} p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  selectedRepId === rep.id ? 'ring-2 ring-[#0D5C75]' : ''
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ${badgeBg}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{rep.name}</h4>
                      <p className="text-xs text-slate-500">{rep.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {rep.score} PTS
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Deal Kemitraan</span>
                    <span className="font-black text-emerald-700 text-sm">{rep.dealCount} Sekolah</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Prospek</span>
                    <span className="font-black text-slate-800 text-sm">{rep.totalSchools} Sekolah</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Konversi</span>
                    <span className="font-black text-amber-800 text-sm">{rep.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Siswa Jangkauan</span>
                    <span className="font-black text-slate-800 text-sm">{rep.totalStudents.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D5C75]">
                  <span>{selectedRepId === rep.id ? 'Filter Aktif (Klik Reset)' : 'Filter Sekolah Canvasser Ini'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. FULL LEADERBOARD TABLE & DETAIL EXPLORATION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        
        {/* Table Filter and Search Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Tabel Lengkap Peringkat & Aktivitas Canvasser
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian seluruh anggota tim lapangan beserta breakdown tahapan pipeline yang dikelola.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari canvasser / sekolah..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0D5C75] w-52 sm:w-60 font-medium"
              />
            </div>

            {/* Region select */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:ring-1 focus:ring-[#0D5C75]"
            >
              {availableRegions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>

            {/* Reset Filter Button if any active */}
            {(selectedRepId || selectedStageFilter !== 'ALL' || selectedRegion !== 'Semua Wilayah' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedRepId(null);
                  setSelectedStageFilter('ALL');
                  setSelectedRegion('Semua Wilayah');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">Rank</th>
                <th className="py-3.5 px-4">Nama Canvasser / PIC</th>
                <th className="py-3.5 px-3 text-center">Canvassing</th>
                <th className="py-3.5 px-3 text-center">Visitasi</th>
                <th className="py-3.5 px-3 text-center">Presentasi</th>
                <th className="py-3.5 px-3 text-center">Deal (MoU)</th>
                <th className="py-3.5 px-3 text-center">Total Prospek</th>
                <th className="py-3.5 px-3 text-center">Konversi</th>
                <th className="py-3.5 px-4 text-right">Score Points</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {repLeaderboard.map((rep) => {
                const isSelected = selectedRepId === rep.id;
                return (
                  <tr 
                    key={rep.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-amber-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-black text-slate-700">
                      {rep.rank === 1 ? '🥇 1' : rep.rank === 2 ? '🥈 2' : rep.rank === 3 ? '🥉 3' : `#${rep.rank}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${rep.avatarBg}`}>
                          {rep.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{rep.name}</div>
                          <div className="text-[11px] text-slate-400">{rep.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-blue-700">{rep.canvassingCount}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-indigo-700">{rep.visitasiCount}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-800">{rep.presentasiCount}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {rep.dealCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-black text-slate-800">{rep.totalSchools}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded-full ${
                        rep.conversionRate >= 30 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : rep.conversionRate >= 15 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rep.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#0D5C75]">
                      {rep.score} pts
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedRepId(isSelected ? null : rep.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#0D5C75] text-white shadow-2xs' 
                            : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Tutup Filter' : 'Lihat Sekolah'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 7. PIPELINE SCHOOLS LIST / DIRECTORY ACCORDION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0D5C75]" />
              <h3 className="text-base font-extrabold text-slate-900">
                Daftar Sekolah Terkait Filter Pipeline ({activeSchools.length} Sekolah)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik pada sekolah untuk melihat dossier intelijen profil atau memulai pembuatan pitch proposal kemitraan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Filter Tahap:</span>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:ring-1 focus:ring-[#0D5C75]"
            >
              <option value="ALL">Semua Tahap</option>
              <option value="Canvassing">1. Canvassing</option>
              <option value="Visitasi">2. Visitasi</option>
              <option value="Presentasi">3. Presentasi</option>
              <option value="Deal">4. Deal / MoU</option>
            </select>
          </div>
        </div>

        {/* School Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {activeSchools.slice(0, 12).map((school) => {
            const stage = getSchoolStage(school);
            const pic = getSchoolPic(school);

            const stageBadge = 
              stage === 'Deal' 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                : stage === 'Presentasi' 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : stage === 'Visitasi' 
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                    : 'bg-blue-100 text-blue-900 border-blue-300';

            return (
              <div 
                key={school.id}
                className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 hover:border-[#0D5C75] hover:bg-white transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${stageBadge}`}>
                      {stage}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {school.city}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0D5C75] transition-colors line-clamp-1">
                    {school.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{school.status}</span>
                    <span>•</span>
                    <span>{school.totalStudents?.toLocaleString('id-ID')} Siswa</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Akreditasi {school.accreditation || '-'}</span>
                  </p>

                  <div className="mt-3 p-2 bg-white rounded-lg border border-slate-100 text-[11px] flex items-center justify-between text-slate-600">
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      PIC Canvasser:
                    </span>
                    <strong className="text-slate-800 font-bold">{pic}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSchool && onSelectSchool(school)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Profil</span>
                  </button>

                  <button
                    onClick={() => onOpenDossier && onOpenDossier(school)}
                    className="text-xs font-extrabold text-[#0D5C75] hover:text-[#094356] cursor-pointer flex items-center gap-1"
                  >
                    <span>Pitch Proposal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {activeSchools.length > 12 && (
          <div className="text-center pt-3 text-xs text-slate-500 font-medium">
            Menampilkan 12 dari {activeSchools.length} sekolah. Gunakan filter pencarian untuk mempersempit daftar.
          </div>
        )}
      </div>

      {/* 8. MODAL ATUR TARGET WILAYAH */}
      {isEditingTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#0D5C75]" />
                <h3 className="font-extrabold text-base text-slate-900">Konfigurasi Target Kuota Wilayah</h3>
              </div>
              <button 
                onClick={() => setIsEditingTargets(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tentukan kuota target jumlah sekolah sasaran per kabupaten / kota untuk memonitor progress bar ketercapaian tim sales.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {Object.keys(tempTargets).map(region => (
                <div key={region} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{region}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={tempTargets[region] || 0}
                      onChange={(e) => setTempTargets({
                        ...tempTargets,
                        [region]: Math.max(1, parseInt(e.target.value) || 0)
                      })}
                      className="w-20 px-2.5 py-1 text-xs font-black text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C75]"
                    />
                    <span className="text-xs text-slate-500 font-medium">Sekolah</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEditingTargets(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTargets}
                className="px-5 py-2 text-xs font-extrabold text-white bg-[#0D5C75] hover:bg-[#094356] rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
