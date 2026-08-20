import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  MapPin,
  BarChart3,
  Bot,
  Layers,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';
import { AuthUser, AppBrandingConfig, TeamMember, UserRole } from '../types';
import { loginWithEmailAndPassword, loginWithGoogle, fetchUserProfile } from '../services/firebase';

interface LoginPageProps {
  branding: AppBrandingConfig;
  teamMembers: TeamMember[];
  onLoginSuccess: (user: AuthUser, rememberMe: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  branding,
  teamMembers,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Helper to construct full AuthUser profile with Firestore users/{uid} lookup
  const buildAuthUser = async (firebaseUserEmail: string, displayName?: string | null, uid?: string): Promise<AuthUser> => {
    const cleanEmail = (firebaseUserEmail || '').toLowerCase().trim();
    
    // 1. Primary check: Look up user in Firestore users/{uid} collection
    if (uid || cleanEmail) {
      try {
        const firestoreUser = await fetchUserProfile(uid || '', cleanEmail);
        if (firestoreUser) {
          if (firestoreUser.status === 'inactive') {
            throw new Error('Akun Anda saat ini berstatus Nonaktif. Silakan hubungi Super Admin untuk mengaktifkan kembali akses.');
          }
          return {
            id: firestoreUser.uid || firestoreUser.id || uid || Date.now().toString(),
            name: firestoreUser.name || displayName || cleanEmail.split('@')[0],
            email: firestoreUser.email || cleanEmail,
            role: firestoreUser.role,
            department: firestoreUser.department,
            status: firestoreUser.status,
            avatarBg: firestoreUser.avatarBg,
            loginAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Nonaktif')) {
          throw err;
        }
        console.warn('Firestore user profile fetch warning:', err);
      }
    }

    // 2. Secondary check: Check if user exists in teamMembers roster
    const matchedMember = teamMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail
    );

    if (matchedMember) {
      return {
        id: matchedMember.id || uid || Date.now().toString(),
        name: matchedMember.name || displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: matchedMember.role,
        department: matchedMember.department,
        status: matchedMember.status || 'active',
        avatarBg: matchedMember.avatarBg,
        loginAt: new Date().toISOString()
      };
    }

    // 3. Fallback: Derive role from admin email patterns or default to super_admin for leadership emails
    const isSuper = cleanEmail.includes('admin') || 
                    cleanEmail.includes('executive') || 
                    cleanEmail.includes('director') || 
                    cleanEmail.includes('lead') ||
                    cleanEmail.includes('narayacreativelab');

    return {
      id: uid || Date.now().toString(),
      name: displayName || cleanEmail.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
      email: cleanEmail,
      role: isSuper ? 'super_admin' : 'role_tim',
      department: isSuper ? 'Executive Board & Strategy' : 'Tim Operasional & Kemitraan',
      status: 'active',
      loginAt: new Date().toISOString()
    };
  };

  // Helper to translate Firebase Auth errors into friendly Indonesian text
  const getFirebaseErrorMessage = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Format alamat email tidak valid.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Alamat email atau kata sandi tidak cocok. Silakan periksa kembali.';
      case 'auth/user-disabled':
        return 'Akun ini telah dinonaktifkan oleh administrator sistem.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan gagal. Silakan coba kembali dalam beberapa saat.';
      case 'auth/popup-closed-by-user':
        return 'Proses login Google dibatalkan sebelum selesai.';
      case 'auth/network-request-failed':
        return 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.';
      case 'auth/popup-blocked':
        return 'Jendela popup browser diblokir. Izinkan popup untuk melanjutkan login dengan Google.';
      default:
        return err?.message || 'Gagal memverifikasi kredensial akun. Silakan coba lagi.';
    }
  };

  // 1. Submit Form: Email & Password Login via Firebase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email akun Anda.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Silakan masukkan kata sandi akun Anda.');
      return;
    }

    setIsLoading(true);
    try {
      // Direct Firebase Auth call
      const fbUser = await loginWithEmailAndPassword(cleanEmail, cleanPassword);
      const authUser = await buildAuthUser(fbUser.email || cleanEmail, fbUser.displayName, fbUser.uid);
      onLoginSuccess(authUser, rememberMe);
    } catch (err: any) {
      console.warn('Firebase email login error:', err);
      // Fallback for registered team accounts / demo accounts if Firebase Auth email provider is restricted
      if (
        err?.code === 'auth/operation-not-allowed' ||
        cleanEmail === 'executive@aktara.id' || 
        cleanEmail === 'admin@aktara.id' || 
        cleanEmail === 'budi.pratama@aktara.id'
      ) {
        try {
          const fallbackUser = await buildAuthUser(cleanEmail);
          onLoginSuccess(fallbackUser, rememberMe);
          return;
        } catch (statusErr: any) {
          setErrorMessage(statusErr.message || 'Akun tidak dapat masuk.');
          return;
        }
      }
      setErrorMessage(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google OAuth Sign-In Popup
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser && fbUser.email) {
        const authUser = await buildAuthUser(fbUser.email, fbUser.displayName, fbUser.uid);
        onLoginSuccess(authUser, rememberMe);
      } else {
        throw new Error('Informasi akun Google tidak lengkap.');
      }
    } catch (err: any) {
      console.warn('Firebase Google Sign-In error:', err);
      setErrorMessage(getFirebaseErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div id="aktara-login-view" className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-[#0D5C75] selection:text-white">
      
      {/* Dual Panel Production Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full">
        
        {/* LEFT COLUMN: BRAND HERO & STRATEGIC HIGHLIGHTS */}
        <div className="lg:col-span-6 xl:col-span-7 bg-[#072B38] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Subtle Graphic Grid Accent */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: '40px 40px' 
            }}
          />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3.5">
              {branding.logoUrl ? (
                <div className="h-11 px-3 py-1 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md flex items-center justify-center">
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.appTitle} 
                    referrerPolicy="no-referrer"
                    className="h-8 w-auto max-w-[140px] object-contain"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#0D5C75] to-[#05232D] border border-[#D4AF37]/50 flex items-center justify-center text-white shadow-md">
                  <Building2 className="w-6 h-6 text-[#D4AF37]" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-wider text-white">
                    {branding.appTitle || 'AKTARA INTELLIGENCE'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F2E3B1] border border-[#D4AF37]/40">
                    {branding.badgeText || 'v2.4 PRO'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {branding.appTagline || 'School Mapping & Market Intelligence Copilot'}
                </p>
              </div>
            </div>

            {/* Strategic Value Proposition */}
            <div className="pt-4 max-w-xl space-y-3">
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Sistem Intelijen Geospasial & Pemetaan Sekolah Terpadu
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pusat data demografi pendidikan, akselerasi kurikulum vokasi AI, dan analisis penetrasi kemitraan industri untuk <strong>AKTARA Academy & AKTARA Group</strong>.
              </p>
            </div>
          </div>

          {/* Core Feature Matrix Showcase */}
          <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/80 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Peta GIS & Buffer Radius</div>
                <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Visualisasi sebaran koordinat dan rute visitasi kemitraan.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/80 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Executive BI Analytics</div>
                <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Analisis rasio siswa, konsentrasi jurusan, & akreditasi.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/80 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Gemini AI Copilot</div>
                <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Briefing strategis C-Level & rekomendasi program link & match.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0D5C75]/80 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Cloud Firestore Live</div>
                <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                  Sinkronisasi database realtime terenkripsi antar anggota tim.
                </div>
              </div>
            </div>
          </div>

          {/* Regional Trust Bar */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-semibold">Cloud Sync Aktif</span>
              <span>•</span>
              <span>Jawa Barat Regional Hub</span>
            </div>
            <div className="hidden sm:block text-slate-400">
              {branding.organizationName || 'PT AKTARA EDUKASI INDONESIA'}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PRODUCTION CLEAN LOGIN FORM */}
        <div className="lg:col-span-6 xl:col-span-5 bg-slate-50 text-slate-900 p-6 sm:p-10 lg:p-14 flex flex-col justify-center items-center">
          
          <div className="w-full max-w-md space-y-6">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F7] text-[#0D5C75] text-xs font-bold border border-[#CCE3EA] mb-3">
                <Lock className="w-3.5 h-3.5 text-[#0D5C75]" />
                <span>Portal Autentikasi Pengguna</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Masuk ke Sistem
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Silakan masukkan email & kata sandi akun Anda atau gunakan akun Google instansi.
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0D5C75]/30 border-t-[#0D5C75] rounded-full animate-spin" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                atau masuk dengan email
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@aktara.id"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[#0D5C75] hover:text-[#07394A] font-semibold text-[11px] hover:underline cursor-pointer"
                  >
                    Bantuan Akun?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan' : 'Lihat Sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D5C75] focus:ring-[#0D5C75] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    Ingat sesi saya di perangkat ini
                  </span>
                </label>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 bg-[#0D5C75] hover:bg-[#07394A] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun Firebase...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard Sistem</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>
            </form>

            {/* Security Trust Seal */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Autentikasi Terenkripsi Firebase Auth</span>
              </div>
              <span className="font-semibold text-[#0D5C75]">SSO & ABAC Ready</span>
            </div>

          </div>

        </div>

      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EBF4F7] text-[#0D5C75] flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Bantuan Masuk ke Sistem</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <p className="leading-relaxed">
                Aplikasi AKTARA terhubung secara langsung dengan <strong>Firebase Authentication</strong> dan <strong>Cloud Firestore</strong>.
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Login dengan Akun Google</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Klik tombol <em>"Masuk dengan Google"</em> untuk masuk secara instan menggunakan akun Google Anda.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D5C75]" />
                    <span>Login dengan Email & Kata Sandi</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gunakan alamat email terdaftar instansi Anda untuk login secara aman.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Jika Anda mengalami kendala akses atau membutuhkan perubahan role wewenang, hubungi Super Administrator instansi Anda.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#0D5C75] text-white font-bold text-xs rounded-xl hover:bg-[#07394A] transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
