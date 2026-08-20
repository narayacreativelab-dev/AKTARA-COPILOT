export interface MajorInfo {
  name: string;
  category: 'IT' | 'Teknik' | 'Bisnis' | 'Kreatif' | 'Kesehatan' | 'Pariwisata' | 'Umum';
  studentCount: number;
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  type: 'SMK' | 'SMA';
  status: 'Negeri' | 'Swasta';
  province: string;
  cityDistrict: string;
  subDistrict: string;
  address: string;
  latitude: number;
  longitude: number;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  majors: MajorInfo[];
  accreditation: 'A' | 'B' | 'C' | 'Belum Terakreditasi';
  principal: string;
  phone: string;
  email?: string;
  website?: string;
  partnershipStatus: 'Belum Dikunjungi' | 'Prospek' | 'Dijadwalkan' | 'Mitra Aktif';
  pipelineStage?: 'Canvassing' | 'Visitasi' | 'Presentasi' | 'Deal';
  surveyorName?: string;
  surveyorId?: string;
  dealValueEstimate?: number;
  lastContactDate?: string;
  priorityScore: number; // 1 to 100
  aktaraCompatibility: {
    fitScore: number; // 1 to 100
    recommendedPrograms: string[];
    strengths: string[];
    notes: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  verifiedAt?: string;
  yearEstablished?: number;
}

export interface RegionFilter {
  province: string;
  cityDistrict: string;
  subDistrict: string;
  status: 'ALL' | 'Negeri' | 'Swasta';
  type: 'ALL' | 'SMK' | 'SMA';
  studentScale: 'ALL' | 'Large' | 'Medium' | 'Small';
  majorCategory: string;
  accreditation: string;
  partnershipStatus: string;
  searchQuery: string;
  minStudents?: number;
  maxStudents?: number;
  minPriorityScore?: number;
}

export interface AiExecutiveBrief {
  executiveBrief: string;
  keyMetrics: {
    totalSchools: number;
    negeriCount: number;
    swastaCount: number;
    totalStudents: number;
    maleStudents: number;
    femaleStudents: number;
    marketDominance: string;
    negeriPercentage: number;
    swastaPercentage: number;
  };
  strategicRecommendations: string[];
  targetSchoolsHighlight: Array<{
    name: string;
    subDistrict: string;
    studentCount: number;
    reason: string;
    actionPlan: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parsedFilter?: Partial<RegionFilter>;
  structuredBrief?: AiExecutiveBrief;
}

export type UserRole = 'super_admin' | 'role_tim' | 'tim_lapangan' | 'surveyor';

export interface AppUserRecord {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  avatarBg?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status?: 'active' | 'inactive';
  avatarBg?: string;
  loginAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  lastActive: string;
  status?: 'active' | 'inactive';
  avatarBg?: string;
  createdAt?: string;
}

export interface RolePermissions {
  canAccessSummary: boolean;
  canAccessMap: boolean;
  canAccessAnalytics: boolean;
  canAccessSales: boolean;
  canAccessTable: boolean;
  canAccessCopilot: boolean;
  canAddSchool: boolean;
  canBulkUpload: boolean;
  canExportCsv: boolean;
  canExportPdf: boolean;
  canManageRoles: boolean;
}

export interface AppBrandingConfig {
  logoUrl?: string;
  bannerUrl?: string;
  bannerImageUrl?: string;
  appTitle: string;
  appTagline: string;
  badgeText: string;
  bannerHeadline: string;
  bannerSubheadline: string;
  organizationName: string;
  updatedAt?: string;
}

export const DEFAULT_BRANDING: AppBrandingConfig = {
  logoUrl: '',
  bannerUrl: '',
  bannerImageUrl: '',
  appTitle: 'AKTARA INTELLIGENCE',
  appTagline: 'School & Market Intelligence System',
  badgeText: 'GARUT & JABAR EXPANSION',
  bannerHeadline: 'EXECUTIVE BRIEF & STRATEGIC RECOMMENDATIONS',
  bannerSubheadline: 'Analisis Intelijen Spasial & Rekomendasi Penetrasi Pasar Terpadu',
  organizationName: 'PT AKTARA EDUKASI INDONESIA'
};
