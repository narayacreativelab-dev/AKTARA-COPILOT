import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { School, MajorInfo } from '../types';

export interface ParsedRowResult {
  rowNumber: number;
  data: Partial<School> & {
    rawMajorsString?: string;
  };
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface BulkUploadSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  totalStudents: number;
  negeriCount: number;
  swastaCount: number;
  smkCount: number;
  smaCount: number;
}

// Centroid coordinates for cities/districts in Jawa Barat
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Kabupaten Garut': { lat: -7.2178, lng: 107.8992 },
  'Kota Bandung': { lat: -6.9175, lng: 107.6191 },
  'Kabupaten Bandung': { lat: -7.0253, lng: 107.5198 },
  'Kota Tasikmalaya': { lat: -7.3274, lng: 108.2207 },
  'Kabupaten Tasikmalaya': { lat: -7.3582, lng: 108.1065 },
  'Kabupaten Sumedang': { lat: -6.8587, lng: 107.9267 },
  'Kabupaten Ciamis': { lat: -7.3262, lng: 108.3537 }
};

// Column aliases to match flexible header names
const COLUMN_MAPPINGS = {
  npsn: ['npsn', 'nomor pokok sekolah nasional', 'kode npsn', 'id npsn', 'school id'],
  name: ['nama sekolah', 'nama', 'nama satuan pendidikan', 'school name', 'nama lembaga'],
  type: ['bentuk pendidikan', 'bentuk', 'jenjang', 'tipe', 'type', 'kategori sekolah'],
  status: ['status sekolah', 'status', 'status kepemilikan', 'negeri/swasta'],
  province: ['provinsi', 'propinsi', 'province'],
  cityDistrict: ['kabupaten/kota', 'kabupaten', 'kota', 'kab/kota', 'city', 'district'],
  subDistrict: ['kecamatan', 'subdistrict', 'sub district', 'distrik'],
  address: ['alamat', 'alamat jalan', 'address', 'lokasi'],
  latitude: ['latitude', 'lat', 'lintang', 'garis lintang', 'koordinat y'],
  longitude: ['longitude', 'lng', 'lon', 'long', 'bujur', 'garis bujur', 'koordinat x'],
  totalStudents: ['total siswa', 'jumlah siswa', 'total murid', 'total students', 'peserta didik', 'jumlah murid'],
  maleStudents: ['siswa laki-laki', 'laki-laki', 'siswa l', 'jumlah l', 'male', 'laki', 'pria'],
  femaleStudents: ['siswa perempuan', 'perempuan', 'siswa p', 'jumlah p', 'female', 'wanita'],
  majors: ['jurusan', 'peminatan', 'program keahlian', 'konsentrasi keahlian', 'kompetensi keahlian', 'majors'],
  accreditation: ['akreditasi', 'status akreditasi', 'nilai akreditasi', 'accreditation'],
  principal: ['kepala sekolah', 'nama kepala sekolah', 'kepsek', 'principal', 'nama kepsek'],
  phone: ['telepon', 'no telepon', 'no telp', 'kontak', 'phone', 'whatsapp', 'hp'],
  email: ['email', 'surel', 'e-mail', 'alamat email'],
  website: ['website', 'situs', 'web', 'link web', 'laman'],
  partnershipStatus: ['status kemitraan', 'partnership status', 'status mitra', 'prospek']
};

/**
 * Classify major name into categorized bucket
 */
export function classifyMajorCategory(majorName: string): MajorInfo['category'] {
  const lower = majorName.toLowerCase();
  if (
    lower.includes('rpl') ||
    lower.includes('rekayasa perangkat lunak') ||
    lower.includes('tkj') ||
    lower.includes('teknik komputer') ||
    lower.includes('informatika') ||
    lower.includes('software') ||
    lower.includes('sistem informasi') ||
    lower.includes('cyber') ||
    lower.includes('multimedia') ||
    lower.includes('animasi')
  ) {
    return 'IT';
  }
  if (
    lower.includes('otomotif') ||
    lower.includes('tkro') ||
    lower.includes('tbsm') ||
    lower.includes('mesin') ||
    lower.includes('pemesinan') ||
    lower.includes('tpm') ||
    lower.includes('listrik') ||
    lower.includes('ketenagalistrikan') ||
    lower.includes('titl') ||
    lower.includes('elektronika') ||
    lower.includes('bangunan') ||
    lower.includes('dpib') ||
    lower.includes('sipil') ||
    lower.includes('pengelasan') ||
    lower.includes('industri')
  ) {
    return 'Teknik';
  }
  if (
    lower.includes('akuntansi') ||
    lower.includes('akl') ||
    lower.includes('otkp') ||
    lower.includes('perkantoran') ||
    lower.includes('pemasaran') ||
    lower.includes('bdp') ||
    lower.includes('bisnis') ||
    lower.includes('manajemen') ||
    lower.includes('perbankan')
  ) {
    return 'Bisnis';
  }
  if (
    lower.includes('dkv') ||
    lower.includes('desain komunikasi') ||
    lower.includes('busana') ||
    lower.includes('tata busana') ||
    lower.includes('kriya') ||
    lower.includes('desain') ||
    lower.includes('seni') ||
    lower.includes('broadcasting')
  ) {
    return 'Kreatif';
  }
  if (
    lower.includes('farmasi') ||
    lower.includes('keperawatan') ||
    lower.includes('kesehatan') ||
    lower.includes('analis kesehatan')
  ) {
    return 'Kesehatan';
  }
  if (
    lower.includes('perhotelan') ||
    lower.includes('tata boga') ||
    lower.includes('kuliner') ||
    lower.includes('pariwisata') ||
    lower.includes('usaha perjalanan')
  ) {
    return 'Pariwisata';
  }
  return 'Umum';
}

/**
 * Parse a comma/semicolon/pipe separated string into structured MajorInfo array
 */
export function parseMajorsString(majorsStr: string, totalStudents: number): MajorInfo[] {
  if (!majorsStr || !majorsStr.trim()) {
    return [{ name: 'Reguler / Umum', category: 'Umum', studentCount: totalStudents || 300 }];
  }

  const parts = majorsStr
    .split(/[,;\n|/]/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parts.length === 0) {
    return [{ name: 'Reguler / Umum', category: 'Umum', studentCount: totalStudents || 300 }];
  }

  const countPerMajor = Math.round((totalStudents || 300) / parts.length);

  return parts.map(majorName => ({
    name: majorName,
    category: classifyMajorCategory(majorName),
    studentCount: countPerMajor
  }));
}

/**
 * Generate intelligent AKTARA compatibility data for newly uploaded school
 */
export function generateAktaraCompatibility(school: Partial<School>): {
  priorityScore: number;
  aktaraCompatibility: School['aktaraCompatibility'];
} {
  const isSMK = school.type === 'SMK';
  const isA = school.accreditation === 'A';
  const isNegeri = school.status === 'Negeri';
  const studentCount = Number(school.totalStudents) || 500;
  
  let fitScore = 70;
  let priorityScore = 70;

  if (isSMK) {
    fitScore += 15;
    priorityScore += 10;
  }
  if (isA) {
    fitScore += 8;
    priorityScore += 10;
  }
  if (studentCount > 1000) {
    priorityScore += 8;
  }
  if (isNegeri) {
    priorityScore += 5;
  }

  fitScore = Math.min(Math.max(fitScore, 65), 98);
  priorityScore = Math.min(Math.max(priorityScore, 60), 99);

  const programs: string[] = [];
  const strengths: string[] = [];

  const hasIT = school.majors?.some(m => m.category === 'IT');
  const hasTeknik = school.majors?.some(m => m.category === 'Teknik');
  const hasBisnis = school.majors?.some(m => m.category === 'Bisnis');
  const hasKreatif = school.majors?.some(m => m.category === 'Kreatif');

  if (hasIT) {
    programs.push('AKTARA AI & Full-Stack Coding Bootcamp');
    programs.push('Industry Certification: AI-Assisted Pedagogy & Cloud');
    strengths.push('Potensi kurikulum digital & talenta software tinggi');
  }
  if (hasTeknik) {
    programs.push('IoT & Industrial Automation Workshop');
    strengths.push('Kesiapan fasilitas lab & disiplin vokasi teknik kuat');
  }
  if (hasBisnis) {
    programs.push('Digital Marketing & Financial Technology Masterclass');
    strengths.push('Minat kewirausahaan digital dan administrasi modern');
  }
  if (hasKreatif) {
    programs.push('Generative AI for Visual Media & Design Thinking');
    strengths.push('Kreativitas visual & portofolio digital');
  }

  if (programs.length === 0) {
    programs.push('AKTARA Digital Talent Accelerator', 'Vocational Readiness & Soft Skills');
  }
  if (strengths.length === 0) {
    strengths.push(`Populasi siswa potensial (${studentCount} peserta didik)`, 'Kesiapan adopsi program kemitraan baru');
  }

  return {
    priorityScore,
    aktaraCompatibility: {
      fitScore,
      recommendedPrograms: programs,
      strengths,
      notes: `Data diimpor melalui modul Bulk Upload. Teridentifikasi ${school.majors?.length || 1} program studi aktif.`
    }
  };
}

/**
 * Normalize and match header keys to canonical School fields
 */
function findMappedField(header: string): string | null {
  const clean = header.trim().toLowerCase().replace(/[_\-]/g, ' ');
  for (const [canonical, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some(alias => clean === alias || clean.includes(alias))) {
      return canonical;
    }
  }
  return null;
}

/**
 * Parse raw objects into validated School items
 */
export function processRawRows(
  rawRows: Array<Record<string, any>>,
  existingSchools: School[]
): {
  parsedRows: ParsedRowResult[];
  summary: BulkUploadSummary;
} {
  const existingNpsnMap = new Map<string, School>();
  existingSchools.forEach(s => existingNpsnMap.set(s.npsn.trim(), s));

  const parsedRows: ParsedRowResult[] = [];
  let totalStudents = 0;
  let negeriCount = 0;
  let swastaCount = 0;
  let smkCount = 0;
  let smaCount = 0;

  rawRows.forEach((row, index) => {
    // Map columns
    const mapped: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      const field = findMappedField(key);
      if (field) {
        mapped[field] = row[key];
      }
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. NPSN
    let npsn = String(mapped.npsn || row.npsn || row.NPSN || '').trim();
    if (!npsn) {
      npsn = `GEN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      warnings.push('NPSN tidak ditemukan, dibuatkan kode acak otomatis.');
    }

    // 2. Name
    const name = String(mapped.name || row.name || row.Nama || row['Nama Sekolah'] || '').trim();
    if (!name) {
      errors.push('Nama sekolah wajib diisi.');
    }

    // 3. Type (SMK vs SMA)
    let type: 'SMK' | 'SMA' = 'SMK';
    const rawType = String(mapped.type || row.type || row.Bentuk || '').toUpperCase();
    if (rawType.includes('SMA') || name.toUpperCase().includes('SMA') || name.toUpperCase().includes('SMAN')) {
      type = 'SMA';
    } else {
      type = 'SMK';
    }

    // 4. Status (Negeri vs Swasta)
    let status: 'Negeri' | 'Swasta' = 'Swasta';
    const rawStatus = String(mapped.status || row.status || row.Status || '').toLowerCase();
    if (rawStatus.includes('negeri') || name.toLowerCase().includes('negeri') || name.toLowerCase().includes('smkn') || name.toLowerCase().includes('sman')) {
      status = 'Negeri';
    } else {
      status = 'Swasta';
    }

    // 5. Province & City & Subdistrict
    const province = String(mapped.province || row.province || 'Jawa Barat').trim() || 'Jawa Barat';
    let cityDistrict = String(mapped.cityDistrict || row.cityDistrict || row.Kabupaten || row.Kota || 'Kabupaten Garut').trim();
    if (!cityDistrict.startsWith('Kabupaten') && !cityDistrict.startsWith('Kota')) {
      if (cityDistrict.toLowerCase().includes('bandung')) {
        cityDistrict = cityDistrict.toLowerCase().includes('kota') ? 'Kota Bandung' : 'Kabupaten Bandung';
      } else if (cityDistrict.toLowerCase().includes('tasik')) {
        cityDistrict = cityDistrict.toLowerCase().includes('kota') ? 'Kota Tasikmalaya' : 'Kabupaten Tasikmalaya';
      } else if (cityDistrict.toLowerCase().includes('sumedang')) {
        cityDistrict = 'Kabupaten Sumedang';
      } else if (cityDistrict.toLowerCase().includes('ciamis')) {
        cityDistrict = 'Kabupaten Ciamis';
      } else {
        cityDistrict = `Kabupaten ${cityDistrict}`;
      }
    }

    const subDistrict = String(mapped.subDistrict || row.subDistrict || row.Kecamatan || 'Tarogong Kidul').trim() || 'Tarogong Kidul';
    const address = String(mapped.address || row.address || row.Alamat || `${subDistrict}, ${cityDistrict}, ${province}`).trim();

    // 6. Coordinates (with fallback & slight jitter so pins don't overlap exactly)
    let lat = Number(mapped.latitude || row.latitude || row.lat);
    let lng = Number(mapped.longitude || row.longitude || row.lng);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      const cityCenter = CITY_COORDINATES[cityDistrict] || { lat: -7.2178, lng: 107.8992 };
      // add small random offset +- 0.03 deg (~3km)
      const jitterLat = (Math.random() - 0.5) * 0.04;
      const jitterLng = (Math.random() - 0.5) * 0.04;
      lat = Number((cityCenter.lat + jitterLat).toFixed(6));
      lng = Number((cityCenter.lng + jitterLng).toFixed(6));
      warnings.push(`Koordinat GPS tidak lengkap, menggunakan estimasi centroid ${cityDistrict}.`);
    }

    // 7. Student counts
    let total = Number(mapped.totalStudents || row.totalStudents || row['Total Siswa']) || 0;
    let male = Number(mapped.maleStudents || row.maleStudents || row['Siswa Laki-laki']) || 0;
    let female = Number(mapped.femaleStudents || row.femaleStudents || row['Siswa Perempuan']) || 0;

    if (total <= 0) {
      if (male > 0 || female > 0) {
        total = male + female;
      } else {
        total = status === 'Negeri' ? 1200 : 650;
        warnings.push('Jumlah siswa kosong, dialokasikan estimasi berdasarkan status.');
      }
    }

    if (male <= 0 && female <= 0) {
      male = Math.round(total * 0.52);
      female = total - male;
    } else if (male <= 0) {
      male = Math.max(0, total - female);
    } else if (female <= 0) {
      female = Math.max(0, total - male);
    }

    // 8. Majors
    const rawMajorsStr = String(mapped.majors || row.majors || row.Jurusan || (type === 'SMK' ? 'Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, Akuntansi' : 'IPA, IPS')).trim();
    const majors = parseMajorsString(rawMajorsStr, total);

    // 9. Accreditation
    let accreditation: School['accreditation'] = 'B';
    const rawAcc = String(mapped.accreditation || row.accreditation || row.Akreditasi || '').toUpperCase().trim();
    if (rawAcc === 'A') accreditation = 'A';
    else if (rawAcc === 'B') accreditation = 'B';
    else if (rawAcc === 'C') accreditation = 'C';
    else if (rawAcc.includes('BELUM')) accreditation = 'Belum Terakreditasi';
    else accreditation = 'B';

    // 10. Principal & Contacts
    const principal = String(mapped.principal || row.principal || row['Kepala Sekolah'] || 'Kepala Sekolah').trim();
    const phone = String(mapped.phone || row.phone || row.Telepon || '(0262) 123456').trim();
    const email = mapped.email || row.email || `info@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.sch.id`;
    const website = mapped.website || row.website || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.sch.id`;

    // 11. Partnership Status
    let partnershipStatus: School['partnershipStatus'] = 'Belum Dikunjungi';
    const rawPartnership = String(mapped.partnershipStatus || row.partnershipStatus || row['Status Kemitraan'] || '').toLowerCase();
    if (rawPartnership.includes('mitra') || rawPartnership.includes('aktif')) {
      partnershipStatus = 'Mitra Aktif';
    } else if (rawPartnership.includes('jadwal') || rawPartnership.includes('dijadwalkan')) {
      partnershipStatus = 'Dijadwalkan';
    } else if (rawPartnership.includes('prospek')) {
      partnershipStatus = 'Prospek';
    } else {
      partnershipStatus = 'Belum Dikunjungi';
    }

    // Duplicate check
    const isDuplicate = existingNpsnMap.has(npsn);
    if (isDuplicate) {
      warnings.push(`NPSN ${npsn} sudah terdaftar di sistem (akan diperbarui jika mode Update dipilih).`);
    }

    // Intelligence generation
    const partialSchool: Partial<School> = {
      npsn,
      name,
      type,
      status,
      province,
      cityDistrict,
      subDistrict,
      address,
      latitude: lat,
      longitude: lng,
      totalStudents: total,
      maleStudents: male,
      femaleStudents: female,
      majors,
      accreditation,
      principal,
      phone,
      email,
      website,
      partnershipStatus
    };

    const intel = generateAktaraCompatibility(partialSchool);

    const fullSchoolData: Partial<School> & { rawMajorsString?: string } = {
      ...partialSchool,
      id: isDuplicate ? existingNpsnMap.get(npsn)!.id : `bulk-${Date.now()}-${index}`,
      priorityScore: intel.priorityScore,
      aktaraCompatibility: intel.aktaraCompatibility,
      rawMajorsString: rawMajorsStr
    };

    const isValid = errors.length === 0;

    if (isValid) {
      totalStudents += total;
      if (status === 'Negeri') negeriCount++;
      else swastaCount++;
      if (type === 'SMK') smkCount++;
      else smaCount++;
    }

    parsedRows.push({
      rowNumber: index + 1,
      data: fullSchoolData,
      isValid,
      errors,
      warnings,
      isDuplicate
    });
  });

  const validRows = parsedRows.filter(r => r.isValid).length;
  const invalidRows = parsedRows.length - validRows;
  const duplicateRows = parsedRows.filter(r => r.isDuplicate).length;

  return {
    parsedRows,
    summary: {
      totalRows: parsedRows.length,
      validRows,
      invalidRows,
      duplicateRows,
      totalStudents,
      negeriCount,
      swastaCount,
      smkCount,
      smaCount
    }
  };
}

/**
 * Parse File (CSV or Excel) into JSON objects
 */
export async function parseUploadFile(file: File): Promise<Array<Record<string, any>>> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'txt') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          resolve(results.data as Array<Record<string, any>>);
        },
        error: (err) => {
          reject(new Error(`Gagal membaca file CSV: ${err.message}`));
        }
      });
    });
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          resolve(json as Array<Record<string, any>>);
        } catch (err: any) {
          reject(new Error(`Gagal membaca file Excel: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    });
  }

  if (extension === 'json') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            resolve(json);
          } else if (json.schools && Array.isArray(json.schools)) {
            resolve(json.schools);
          } else {
            resolve([json]);
          }
        } catch (err: any) {
          reject(new Error(`Gagal membaca file JSON: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsText(file);
    });
  }

  throw new Error('Format file tidak didukung. Harap unggah file .CSV, .XLSX, .XLS, atau .JSON');
}

/**
 * Parse raw pasted text (e.g. from Google Sheets or Excel)
 */
export function parsePastedText(text: string): Array<Record<string, any>> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Check if it's JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      return Array.isArray(json) ? json : [json];
    } catch {
      // Fall through to delimiter parser
    }
  }

  const parseResult = Papa.parse(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: trimmed.includes('\t') ? '\t' : undefined
  });

  return parseResult.data as Array<Record<string, any>>;
}

/**
 * Generate and trigger download of standard CSV template
 */
export function downloadCsvTemplate(): void {
  const sampleData = [
    {
      'NPSN': '20209210',
      'Nama Sekolah': 'SMKN 1 Bandung',
      'Bentuk': 'SMK',
      'Status': 'Negeri',
      'Provinsi': 'Jawa Barat',
      'Kabupaten/Kota': 'Kota Bandung',
      'Kecamatan': 'Lengkong',
      'Alamat': 'Jl. Wastukencana No. 3, Babakan Ciamis, Kec. Sumur Bandung',
      'Latitude': '-6.9125',
      'Longitude': '107.6089',
      'Total Siswa': '1850',
      'Siswa Laki-laki': '980',
      'Siswa Perempuan': '870',
      'Jurusan': 'Rekayasa Perangkat Lunak, Teknik Komputer Jaringan, Bisnis Daring',
      'Akreditasi': 'A',
      'Kepala Sekolah': 'Drs. H. Mulyana, M.Pd.',
      'Telepon': '(022) 4203874',
      'Email': 'info@smkn1bandung.sch.id',
      'Website': 'https://smkn1bandung.sch.id',
      'Status Kemitraan': 'Prospek'
    },
    {
      'NPSN': '20209211',
      'Nama Sekolah': 'SMK IT Al-Fityan Garut',
      'Bentuk': 'SMK',
      'Status': 'Swasta',
      'Provinsi': 'Jawa Barat',
      'Kabupaten/Kota': 'Kabupaten Garut',
      'Kecamatan': 'Tarogong Kaler',
      'Alamat': 'Jl. Raya Garut - Bandung No. 45, Tarogong Kaler',
      'Latitude': '-7.1852',
      'Longitude': '107.8821',
      'Total Siswa': '720',
      'Siswa Laki-laki': '400',
      'Siswa Perempuan': '320',
      'Jurusan': 'Rekayasa Perangkat Lunak, Desain Komunikasi Visual, Otomotif',
      'Akreditasi': 'A',
      'Kepala Sekolah': 'H. Ahmad Fauzi, S.Kom., M.T.',
      'Telepon': '(0262) 541290',
      'Email': 'kontak@alfityan-garut.sch.id',
      'Website': 'https://alfityan-garut.sch.id',
      'Status Kemitraan': 'Dijadwalkan'
    },
    {
      'NPSN': '20209212',
      'Nama Sekolah': 'SMKN 1 Tasikmalaya',
      'Bentuk': 'SMK',
      'Status': 'Negeri',
      'Provinsi': 'Jawa Barat',
      'Kabupaten/Kota': 'Kota Tasikmalaya',
      'Kecamatan': 'Tawang',
      'Alamat': 'Jl. Mancogeh No. 26, Nagarasari, Kec. Cipedes',
      'Latitude': '-7.3188',
      'Longitude': '108.2165',
      'Total Siswa': '2100',
      'Siswa Laki-laki': '1150',
      'Siswa Perempuan': '950',
      'Jurusan': 'Teknik Komputer dan Jaringan, Rekayasa Perangkat Lunak, Akuntansi, DKV',
      'Akreditasi': 'A',
      'Kepala Sekolah': 'Dr. H. Endang Suryana, M.M.',
      'Telepon': '(0265) 331422',
      'Email': 'smkn1tasik@sch.id',
      'Website': 'https://smkn1tasikmalaya.sch.id',
      'Status Kemitraan': 'Mitra Aktif'
    }
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_Upload_Masal_Sekolah_AKTARA_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
