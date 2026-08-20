import { School } from '../types';

export const INITIAL_SCHOOLS: School[] = [
  // ==================== KABUPATEN GARUT ====================
  {
    id: 'grt-smkn-1',
    npsn: '20209201',
    name: 'SMKN 1 Garut',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: 'Jl. Cimanuk No. 309A, Pataruman, Kec. Tarogong Kidul, Kab. Garut',
    latitude: -7.2178,
    longitude: 107.8992,
    totalStudents: 2650,
    maleStudents: 1120,
    femaleStudents: 1530,
    majors: [
      { name: 'Rekayasa Perangkat Lunak (RPL)', category: 'IT', studentCount: 480 },
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 520 },
      { name: 'Otomatisasi & Tata Kelola Perkantoran (OTKP)', category: 'Bisnis', studentCount: 460 },
      { name: 'Akuntansi dan Keuangan Lembaga (AKL)', category: 'Bisnis', studentCount: 510 },
      { name: 'Desain Komunikasi Visual (DKV)', category: 'Kreatif', studentCount: 380 },
      { name: 'Bisnis Daring & Pemasaran (BDP)', category: 'Bisnis', studentCount: 300 }
    ],
    accreditation: 'A',
    principal: 'Drs. H. Bejo Siswoyo, S.TP., M.Pd.',
    phone: '(0262) 233316',
    email: 'info@smknegeri1garut.sch.id',
    website: 'https://smknegeri1garut.sch.id',
    partnershipStatus: 'Mitra Aktif',
    priorityScore: 98,
    aktaraCompatibility: {
      fitScore: 96,
      recommendedPrograms: [
        'AKTARA AI & Full-Stack Bootcamp for Students',
        'Teacher Certification: AI-Assisted Pedagogy & Cloud Computing',
        'Industry Co-Curriculum: Web & Mobile App Development'
      ],
      strengths: ['Laboratorium Komputer Lengkap (6 Lab)', 'Minat IT & Desain Sangat Tinggi', 'Status SMK Pusat Keunggulan'],
      notes: 'Sekolah rujukan nomor 1 di Garut. Sangat strategis untuk program pilot talent pool AKTARA Group.'
    }
  },
  {
    id: 'grt-smkn-2',
    npsn: '20209202',
    name: 'SMKN 2 Garut',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kaler',
    address: 'Jl. Suherman No. 90, Jati, Kec. Tarogong Kaler, Kab. Garut',
    latitude: -7.1994,
    longitude: 107.8918,
    totalStudents: 2380,
    maleStudents: 2150,
    femaleStudents: 230,
    majors: [
      { name: 'Teknik Kendaraan Ringan Otomotif (TKRO)', category: 'Teknik', studentCount: 620 },
      { name: 'Teknik Pemesinan (TPM)', category: 'Teknik', studentCount: 540 },
      { name: 'Teknik Ketenagalistrikan (TITL)', category: 'Teknik', studentCount: 480 },
      { name: 'Teknik Komputer & Jaringan (TKJ)', category: 'IT', studentCount: 420 },
      { name: 'Desain Pemodelan & Informasi Bangunan (DPIB)', category: 'Teknik', studentCount: 320 }
    ],
    accreditation: 'A',
    principal: 'Drs. Dadang Johar Arifin, M.M.',
    phone: '(0262) 232888',
    email: 'kontak@smkn2garut.sch.id',
    website: 'https://smkn2garut.sch.id',
    partnershipStatus: 'Dijadwalkan',
    priorityScore: 92,
    aktaraCompatibility: {
      fitScore: 89,
      recommendedPrograms: [
        'IoT & Smart Automation in Engineering Workshop',
        'Computer-Aided Design (CAD/CAM) & Industrial Software',
        'Industry Readiness & Soft Skill Bootcamp'
      ],
      strengths: ['Fasilitas Bengkel & Workshop Terbesar di Garut', 'Disiplin Siswa Tinggi', 'Alumni banyak di industri manufaktur'],
      notes: 'Fokuskan program pada integrasi IoT/Sistem Cerdas untuk siswa teknik dan workshop digital.'
    }
  },
  {
    id: 'grt-smkn-3',
    npsn: '20209203',
    name: 'SMKN 3 Garut',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: 'Jl. Merdeka No. 139, Jayaraga, Kec. Tarogong Kidul, Kab. Garut',
    latitude: -7.2115,
    longitude: 107.9045,
    totalStudents: 1720,
    maleStudents: 310,
    femaleStudents: 1410,
    majors: [
      { name: 'Tata Boga / Kuliner', category: 'Pariwisata', studentCount: 520 },
      { name: 'Tata Busana / Fashion Design', category: 'Kreatif', studentCount: 450 },
      { name: 'Perhotelan', category: 'Pariwisata', studentCount: 430 },
      { name: 'Tata Kecantikan', category: 'Pariwisata', studentCount: 320 }
    ],
    accreditation: 'A',
    principal: 'Hj. Lisye Nurbaeti, M.Pd.',
    phone: '(0262) 234120',
    email: 'info@smkn3garut.sch.id',
    partnershipStatus: 'Prospek',
    priorityScore: 84,
    aktaraCompatibility: {
      fitScore: 80,
      recommendedPrograms: [
        'Digital Marketing & E-Commerce for Hospitality & Culinary',
        'Creative Branding & Social Media Management'
      ],
      strengths: ['Sentra keahlian kreatif dan hospitality', 'Produk kreatif siswa aktif dipasarkan'],
      notes: 'Peluang kolaborasi inkubasi bisnis digital dan digital branding produk kuliner/fashion.'
    }
  },
  {
    id: 'grt-smkn-4',
    npsn: '20209204',
    name: 'SMKN 4 Garut',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Karangpawitan',
    address: 'Jl. Raya Karangpawitan No. 12, Karangpawitan, Kab. Garut',
    latitude: -7.2089,
    longitude: 107.9431,
    totalStudents: 1540,
    maleStudents: 820,
    femaleStudents: 720,
    majors: [
      { name: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', category: 'Teknik', studentCount: 420 },
      { name: 'Rekayasa Perangkat Lunak (RPL)', category: 'IT', studentCount: 410 },
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 430 },
      { name: 'Agribisnis Tanaman Pangan & Hortikultura', category: 'Teknik', studentCount: 280 }
    ],
    accreditation: 'A',
    principal: 'H. Asep Saepuloh, S.Pd., M.M.',
    phone: '(0262) 441029',
    partnershipStatus: 'Dijadwalkan',
    priorityScore: 88,
    aktaraCompatibility: {
      fitScore: 91,
      recommendedPrograms: [
        'Smart Agriculture & IoT Sensor Training',
        'AKTARA Coding & Web App Bootcamp'
      ],
      strengths: ['Kombinasi unik jurusan IT dan Agroteknologi modern', 'Lahan praktik luas'],
      notes: 'Sangat cocok untuk proyek percontohan Smart Agriculture berbasis IoT bersama AKTARA Group.'
    }
  },
  {
    id: 'grt-smk-yppt',
    npsn: '20209228',
    name: 'SMK YPPT Garut',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: 'Jl. Nusa Indah No. 33, Tarogong Kidul, Kab. Garut',
    latitude: -7.2142,
    longitude: 107.8925,
    totalStudents: 1980,
    maleStudents: 1750,
    femaleStudents: 230,
    majors: [
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 650 },
      { name: 'Teknik Kendaraan Ringan (TKR)', category: 'Teknik', studentCount: 580 },
      { name: 'Teknik Bisnis Sepeda Motor (TBSM)', category: 'Teknik', studentCount: 460 },
      { name: 'Teknik Pemesinan (TPM)', category: 'Teknik', studentCount: 290 }
    ],
    accreditation: 'A',
    principal: 'H. Teddy Suyatno, S.T., M.Kom.',
    phone: '(0262) 231578',
    email: 'info@smkypptgarut.sch.id',
    partnershipStatus: 'Prospek',
    priorityScore: 94,
    aktaraCompatibility: {
      fitScore: 93,
      recommendedPrograms: [
        'MikroTik & Cisco Enterprise Network Training',
        'AKTARA Student Internship & Industry Placement',
        'AI Tools & Prompt Engineering Workshop'
      ],
      strengths: ['SMK Swasta Teknik Terbesar di Garut', 'Jumlah siswa IT sangat masif (>600 siswa)'],
      notes: 'TARGET PRIORITAS UTAMA SMK SWASTA GARUT. Basis siswa besar dengan minat keahlian praktis tinggi.'
    }
  },
  {
    id: 'grt-smk-wikrama',
    npsn: '20258129',
    name: 'SMK Wikrama 1 Garut',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: 'Jl. Otista No. 278, Pasawahan, Kec. Tarogong Kidul, Kab. Garut',
    latitude: -7.2023,
    longitude: 107.8864,
    totalStudents: 920,
    maleStudents: 490,
    femaleStudents: 430,
    majors: [
      { name: 'Pengembangan Perangkat Lunak dan Gim (PPLG/RPL)', category: 'IT', studentCount: 380 },
      { name: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)', category: 'IT', studentCount: 320 },
      { name: 'Pemasaran Digital / Bisnis Digital', category: 'Bisnis', studentCount: 220 }
    ],
    accreditation: 'A',
    principal: 'Iin Imelda, M.Pd.',
    phone: '(0262) 241512',
    email: 'smkwikrama1garut@gmail.com',
    website: 'https://smkwikramagarut.sch.id',
    partnershipStatus: 'Mitra Aktif',
    priorityScore: 97,
    aktaraCompatibility: {
      fitScore: 98,
      recommendedPrograms: [
        'Advanced Next.js & AI Agent Accelerator',
        'Kelas Industri AKTARA Academy',
        'Direct Hiring / Fast-track Internship Pipeline'
      ],
      strengths: ['Kurikulum berbasis IT mutakhir', 'Budaya coding & portofolio siswa kuat', 'Manajemen inovatif'],
      notes: 'Sekolah mitra teladan. Portofolio siswa sering memenangkan LKS tingkat provinsi.'
    }
  },
  {
    id: 'grt-smk-fauzaniyyah',
    npsn: '20268412',
    name: 'SMK Fauzaniyyah',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Sukaresmi',
    address: 'Komplek Ponpes Fauzan, Sukaresmi, Kab. Garut',
    latitude: -7.2845,
    longitude: 107.8210,
    totalStudents: 780,
    maleStudents: 410,
    femaleStudents: 370,
    majors: [
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 390 },
      { name: 'Agribisnis Pengolahan Hasil Pertanian', category: 'Teknik', studentCount: 240 },
      { name: 'Tata Busana', category: 'Kreatif', studentCount: 150 }
    ],
    accreditation: 'B',
    principal: 'K.H. Aceng Hilman, M.Ag.',
    phone: '(0262) 571289',
    partnershipStatus: 'Belum Dikunjungi',
    priorityScore: 81,
    aktaraCompatibility: {
      fitScore: 82,
      recommendedPrograms: [
        'Pesantren Digital & Santri IT Literacy Program',
        'Digital Creative Skill & Freelancing Basics'
      ],
      strengths: ['Basis santri disiplin', 'Dukungan yayasan pondok pesantren kuat'],
      notes: 'Peluang program CSR dan Pelatihan Vokasi Santri Berdaya AKTARA.'
    }
  },
  {
    id: 'grt-smk-alfalah-biru',
    npsn: '20227481',
    name: 'SMK Plus Al-Falah Biru',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Banyuresmi',
    address: 'Jl. Biru No. 10, Mekargalih, Banyuresmi, Kab. Garut',
    latitude: -7.1687,
    longitude: 107.9254,
    totalStudents: 740,
    maleStudents: 480,
    femaleStudents: 260,
    majors: [
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 380 },
      { name: 'Teknik Bisnis Sepeda Motor (TBSM)', category: 'Teknik', studentCount: 360 }
    ],
    accreditation: 'B',
    principal: 'Drs. H. Deden Ramdani, M.Si.',
    phone: '(0262) 489102',
    partnershipStatus: 'Prospek',
    priorityScore: 78,
    aktaraCompatibility: {
      fitScore: 79,
      recommendedPrograms: ['Computer Hardware & Network Troubleshooting Workshop', 'Digital Entrepreneurship'],
      strengths: ['Sekolah rujukan wilayah Banyuresmi & Leuwigoong'],
      notes: 'Target ekspansi daerah Garut Utara.'
    }
  },
  {
    id: 'grt-smk-santana',
    npsn: '20253812',
    name: 'SMK Santana 1 Cibatu',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Cibatu',
    address: 'Jl. Raya Cibatu No. 45, Cibatu, Kab. Garut',
    latitude: -7.1120,
    longitude: 107.9890,
    totalStudents: 980,
    maleStudents: 710,
    femaleStudents: 270,
    majors: [
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 420 },
      { name: 'Teknik Kendaraan Ringan (TKR)', category: 'Teknik', studentCount: 390 },
      { name: 'Akuntansi', category: 'Bisnis', studentCount: 170 }
    ],
    accreditation: 'B',
    principal: 'Drs. Agus Hidayat, M.Pd.',
    phone: '(0262) 466112',
    partnershipStatus: 'Belum Dikunjungi',
    priorityScore: 82,
    aktaraCompatibility: {
      fitScore: 84,
      recommendedPrograms: ['AKTARA Roadshow: Digital Talent for Future', 'Basic Coding & Web Dev Workshop'],
      strengths: ['Pusat vokasi wilayah Cibatu & Limbangan'],
      notes: 'Area Garut Timur dengan akses stasiun kereta Cibatu.'
    }
  },
  {
    id: 'grt-sman-1',
    npsn: '20209210',
    name: 'SMAN 1 Garut',
    type: 'SMA',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Tarogong Kidul',
    address: 'Jl. Merdeka No. 91, Jayaraga, Tarogong Kidul, Kab. Garut',
    latitude: -7.2130,
    longitude: 107.9020,
    totalStudents: 1280,
    maleStudents: 540,
    femaleStudents: 740,
    majors: [
      { name: 'MIPA / Sains & Teknologi', category: 'Umum', studentCount: 780 },
      { name: 'IPS / Sosial & Humaniora', category: 'Umum', studentCount: 500 }
    ],
    accreditation: 'A',
    principal: 'Drs. H. Ridwan Ruswanda, M.Pd.',
    phone: '(0262) 233762',
    partnershipStatus: 'Prospek',
    priorityScore: 90,
    aktaraCompatibility: {
      fitScore: 88,
      recommendedPrograms: [
        'AI Preparation Camp for UTBK/SNBT & Top University Admission',
        'Computational Thinking & Informatics Olympiad Mentorship',
        'Introduction to Data Science & AI for High Schoolers'
      ],
      strengths: ['Siswa berprestasi akademik tinggi', 'Alumni tersebar di PTN ternama (ITB, UI, Unpad, IPB)'],
      notes: 'SMA Negeri unggulan utama Garut. Potensial untuk program AKTARA University Prep & AI Olympiad.'
    }
  },
  {
    id: 'grt-sman-11',
    npsn: '20209220',
    name: 'SMAN 11 Garut',
    type: 'SMA',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Garut',
    subDistrict: 'Garut Kota',
    address: 'Jl. Siliwangi No. 2, Pakuwon, Kec. Garut Kota, Kab. Garut',
    latitude: -7.2215,
    longitude: 107.9065,
    totalStudents: 1150,
    maleStudents: 490,
    femaleStudents: 660,
    majors: [
      { name: 'MIPA / Sains', category: 'Umum', studentCount: 680 },
      { name: 'IPS / Sosial', category: 'Umum', studentCount: 470 }
    ],
    accreditation: 'A',
    principal: 'Drs. Cecep Rahmat, M.Pd.',
    phone: '(0262) 231456',
    partnershipStatus: 'Belum Dikunjungi',
    priorityScore: 83,
    aktaraCompatibility: {
      fitScore: 82,
      recommendedPrograms: ['Career Guidance & Digital Skill Orientation', 'Web Design for Teens'],
      strengths: ['Lokasi pusat kota strategis di Garut Kota'],
      notes: 'Mudah diakses untuk seminar dan workshop kolaboratif.'
    }
  },

  // ==================== KOTA BANDUNG ====================
  {
    id: 'bdg-smkn-4',
    npsn: '20219150',
    name: 'SMKN 4 Bandung',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Bandung',
    subDistrict: 'Lengkong',
    address: 'Jl. Kliningan No. 6, Buahbatu, Kec. Lengkong, Kota Bandung',
    latitude: -6.9362,
    longitude: 107.6278,
    totalStudents: 2420,
    maleStudents: 1650,
    femaleStudents: 770,
    majors: [
      { name: 'Rekayasa Perangkat Lunak (RPL)', category: 'IT', studentCount: 620 },
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 580 },
      { name: 'Sistem Informatika, Jaringan dan Aplikasi (SIJA 4 Tahun)', category: 'IT', studentCount: 450 },
      { name: 'Teknik Audio Video (TAV)', category: 'Teknik', studentCount: 410 },
      { name: 'Teknik Otomasi Industri', category: 'Teknik', studentCount: 360 }
    ],
    accreditation: 'A',
    principal: 'Dr. Agus Rustiandi, M.Si.',
    phone: '(022) 7303736',
    email: 'info@smkn4bdg.sch.id',
    website: 'https://smkn4bdg.sch.id',
    partnershipStatus: 'Mitra Aktif',
    priorityScore: 99,
    aktaraCompatibility: {
      fitScore: 99,
      recommendedPrograms: [
        'AKTARA Enterprise AI Engine Lab',
        'Senior Full-Stack Cloud & DevOps Incubation',
        'Direct Industry Talent Pipeline'
      ],
      strengths: ['Pusat Keunggulan Vokasi IT Nasional', 'Program 4 Tahun SIJA', 'Juara rutin LKS Nasional Web Tech & IT Network'],
      notes: 'Mitra strategis tier-1 AKTARA untuk hub Bandung Raya.'
    }
  },
  {
    id: 'bdg-smkn-1',
    npsn: '20219145',
    name: 'SMKN 1 Bandung',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Bandung',
    subDistrict: 'Sumur Bandung',
    address: 'Jl. Wastukencana No. 3, Babakan Ciamis, Kota Bandung',
    latitude: -6.9125,
    longitude: 107.6080,
    totalStudents: 2180,
    maleStudents: 620,
    femaleStudents: 1560,
    majors: [
      { name: 'Akuntansi dan Keuangan Lembaga', category: 'Bisnis', studentCount: 650 },
      { name: 'Manajemen Perkantoran (MPLB)', category: 'Bisnis', studentCount: 580 },
      { name: 'Bisnis Digital & Pemasaran', category: 'Bisnis', studentCount: 510 },
      { name: 'Desain Komunikasi Visual (DKV)', category: 'Kreatif', studentCount: 440 }
    ],
    accreditation: 'A',
    principal: 'Drs. H. Cucu Saputra, M.M.Pd.',
    phone: '(022) 4204524',
    partnershipStatus: 'Dijadwalkan',
    priorityScore: 93,
    aktaraCompatibility: {
      fitScore: 91,
      recommendedPrograms: [
        'Fintech & Digital Business Intelligence Workshop',
        'Creative Agency Simulation with AKTARA Design Team'
      ],
      strengths: ['SMK Bisnis Manajemen tertua dan terkemuka di Jawa Barat'],
      notes: 'Sangat cocok untuk pelatihan Business Analytics dan Modern Digital Commerce.'
    }
  },
  {
    id: 'bdg-smk-telkom',
    npsn: '20256598',
    name: 'SMK Telkom Bandung',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Bandung',
    subDistrict: 'Dayeuhkolot',
    address: 'Jl. Radio Palasari, Citeureup, Kec. Dayeuhkolot, Kab. Bandung',
    latitude: -6.9745,
    longitude: 107.6315,
    totalStudents: 1450,
    maleStudents: 980,
    femaleStudents: 470,
    majors: [
      { name: 'Pengembangan Perangkat Lunak dan Gim (PPLG)', category: 'IT', studentCount: 520 },
      { name: 'Teknik Jaringan Akses Telekomunikasi (TJAT)', category: 'IT', studentCount: 480 },
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 450 }
    ],
    accreditation: 'A',
    principal: 'Rosyid, S.T., M.Kom.',
    phone: '(022) 5229478',
    email: 'info@smktelkom-bdg.sch.id',
    partnershipStatus: 'Mitra Aktif',
    priorityScore: 97,
    aktaraCompatibility: {
      fitScore: 97,
      recommendedPrograms: [
        'Telecommunication Cloud Infrastructure & Kubernetes',
        'AKTARA Hackathon & Seed Incubation',
        'Industry Mentorship Series'
      ],
      strengths: ['Infrastruktur Telkom University ecosystem', 'Standar pembelajaran teknologi terkini'],
      notes: 'Hub kolaborasi vokasi berkelas swasta dengan serapan kerja tinggi.'
    }
  },
  {
    id: 'bdg-sman-3',
    npsn: '20219240',
    name: 'SMAN 3 Bandung',
    type: 'SMA',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Bandung',
    subDistrict: 'Sumur Bandung',
    address: 'Jl. Belitung No. 8, Merdeka, Sumur Bandung, Kota Bandung',
    latitude: -6.9142,
    longitude: 107.6175,
    totalStudents: 1190,
    maleStudents: 520,
    femaleStudents: 670,
    majors: [
      { name: 'MIPA / Sains Teknologi', category: 'Umum', studentCount: 790 },
      { name: 'IPS / Humaniora', category: 'Umum', studentCount: 400 }
    ],
    accreditation: 'A',
    principal: 'Dr. Hj. Iwan Setiawan, M.Pd.',
    phone: '(022) 4235154',
    partnershipStatus: 'Prospek',
    priorityScore: 95,
    aktaraCompatibility: {
      fitScore: 92,
      recommendedPrograms: [
        'AI Research & Data Science Mentorship for High Schoolers',
        'International Science Project & Paper Mentoring'
      ],
      strengths: ['SMA top ranking nasional', 'Daya serap ITB/UI tertinggi di Jabar'],
      notes: 'Peluang kolaborasi program AKTARA Youth Scholar & AI Research.'
    }
  },

  // ==================== KOTA & KABUPATEN TASIKMALAYA ====================
  {
    id: 'tsk-smkn-1',
    npsn: '20224590',
    name: 'SMKN 1 Tasikmalaya',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Tasikmalaya',
    subDistrict: 'Tawang',
    address: 'Jl. Mancogeh No. 26, Nagarasari, Kec. Cipedes / Tawang, Kota Tasikmalaya',
    latitude: -7.3190,
    longitude: 108.2198,
    totalStudents: 2280,
    maleStudents: 780,
    femaleStudents: 1500,
    majors: [
      { name: 'Rekayasa Perangkat Lunak (RPL)', category: 'IT', studentCount: 490 },
      { name: 'Teknik Komputer dan Jaringan (TKJ)', category: 'IT', studentCount: 470 },
      { name: 'Akuntansi dan Keuangan', category: 'Bisnis', studentCount: 480 },
      { name: 'Manajemen Perkantoran', category: 'Bisnis', studentCount: 440 },
      { name: 'Desain Komunikasi Visual', category: 'Kreatif', studentCount: 400 }
    ],
    accreditation: 'A',
    principal: 'Dr. H. Wawan, S.Pd., M.M.',
    phone: '(0265) 331363',
    email: 'info@smkn1tasikmalaya.sch.id',
    partnershipStatus: 'Dijadwalkan',
    priorityScore: 94,
    aktaraCompatibility: {
      fitScore: 94,
      recommendedPrograms: [
        'AKTARA Priangan Timur Tech Talent Bootcamp',
        'UI/UX Design & Frontend Development Immersion'
      ],
      strengths: ['SMK Rujukan utama di Kota Tasikmalaya', 'Konektivitas Priangan Timur'],
      notes: 'Pintu gerbang ekspansi AKTARA untuk wilayah Priangan Timur.'
    }
  },
  {
    id: 'tsk-smkn-2',
    npsn: '20224591',
    name: 'SMKN 2 Tasikmalaya',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Tasikmalaya',
    subDistrict: 'Cipedes',
    address: 'Jl. Noenoeng Tisnasaputra, Kahuripan, Kec. Tawang / Cipedes, Kota Tasikmalaya',
    latitude: -7.3421,
    longitude: 108.2312,
    totalStudents: 2450,
    maleStudents: 2200,
    femaleStudents: 250,
    majors: [
      { name: 'Teknik Kendaraan Ringan Otomotif', category: 'Teknik', studentCount: 650 },
      { name: 'Teknik Pemesinan', category: 'Teknik', studentCount: 580 },
      { name: 'Teknik Ketenagalistrikan', category: 'Teknik', studentCount: 520 },
      { name: 'Teknik Audio Video', category: 'Teknik', studentCount: 410 },
      { name: 'Teknik Pengelasan', category: 'Teknik', studentCount: 290 }
    ],
    accreditation: 'A',
    principal: 'Drs. H. Anton Susanto, M.Pd.',
    phone: '(0265) 331839',
    partnershipStatus: 'Prospek',
    priorityScore: 89,
    aktaraCompatibility: {
      fitScore: 87,
      recommendedPrograms: ['Smart Industry & Robotics Workshop', 'Digital Workplace Safety'],
      strengths: ['Kapasitas teknik terbesar di Tasikmalaya'],
      notes: 'Kandidat mitra program vokasi engineering AKTARA Group.'
    }
  },
  {
    id: 'tsk-smk-bpn',
    npsn: '20253472',
    name: 'SMK Bina Putera Nusantara Tasikmalaya',
    type: 'SMK',
    status: 'Swasta',
    province: 'Jawa Barat',
    cityDistrict: 'Kota Tasikmalaya',
    subDistrict: 'Kawalu',
    address: 'Jl. Sukasukur No. 09, Kawalu, Kota Tasikmalaya',
    latitude: -7.3789,
    longitude: 108.2045,
    totalStudents: 1220,
    maleStudents: 590,
    femaleStudents: 630,
    majors: [
      { name: 'Farmasi Klinis & Komunitas', category: 'Kesehatan', studentCount: 460 },
      { name: 'Teknik Komputer dan Jaringan', category: 'IT', studentCount: 420 },
      { name: 'Teknik Kendaraan Ringan', category: 'Teknik', studentCount: 340 }
    ],
    accreditation: 'A',
    principal: 'H. Pian Sopyan Nurochman, S.Si., M.Pd.',
    phone: '(0265) 325178',
    partnershipStatus: 'Belum Dikunjungi',
    priorityScore: 87,
    aktaraCompatibility: {
      fitScore: 88,
      recommendedPrograms: ['Healthtech & Pharmacy Information System Demo', 'IT Networking Bootcamp'],
      strengths: ['Kombinasi prodi kesehatan dan IT yang unik di Tasikmalaya'],
      notes: 'SMK Swasta berkembang pesat di wilayah Tasikmalaya Selatan.'
    }
  },

  // ==================== KABUPATEN SUMEDANG ====================
  {
    id: 'smd-smkn-1',
    npsn: '20208390',
    name: 'SMKN 1 Sumedang',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Sumedang',
    subDistrict: 'Sumedang Selatan',
    address: 'Jl. Mayor Abdurakhman No. 209, Kotakaler, Sumedang Utara/Selatan',
    latitude: -6.8520,
    longitude: 107.9215,
    totalStudents: 1850,
    maleStudents: 1420,
    femaleStudents: 430,
    majors: [
      { name: 'Teknik Pemesinan', category: 'Teknik', studentCount: 480 },
      { name: 'Teknik Kendaraan Ringan', category: 'Teknik', studentCount: 450 },
      { name: 'Teknik Komputer dan Jaringan', category: 'IT', studentCount: 420 },
      { name: 'Teknik Instalasi Tenaga Listrik', category: 'Teknik', studentCount: 310 },
      { name: 'Rekayasa Perangkat Lunak', category: 'IT', studentCount: 190 }
    ],
    accreditation: 'A',
    principal: 'Dra. Hj. Elis Herawati, M.Pd.',
    phone: '(0261) 201531',
    partnershipStatus: 'Prospek',
    priorityScore: 88,
    aktaraCompatibility: {
      fitScore: 89,
      recommendedPrograms: ['Cloud Computing & Industrial IoT', 'Digital Literacy for Vocational Teachers'],
      strengths: ['Sekolah vokasi tertua di Sumedang dengan ikatan alumni kuat'],
      notes: 'Akses mudah dari Bandung melalui Tol Cisumdawu.'
    }
  },

  // ==================== KABUPATEN CIAMIS ====================
  {
    id: 'cms-smkn-1',
    npsn: '20211512',
    name: 'SMKN 1 Ciamis',
    type: 'SMK',
    status: 'Negeri',
    province: 'Jawa Barat',
    cityDistrict: 'Kabupaten Ciamis',
    subDistrict: 'Ciamis',
    address: 'Jl. Jend. Soedirman No. 269, Sindangrasa, Kec. Ciamis, Kab. Ciamis',
    latitude: -7.3298,
    longitude: 108.3490,
    totalStudents: 1780,
    maleStudents: 590,
    femaleStudents: 1190,
    majors: [
      { name: 'Rekayasa Perangkat Lunak (RPL)', category: 'IT', studentCount: 390 },
      { name: 'Akuntansi dan Keuangan Lembaga', category: 'Bisnis', studentCount: 470 },
      { name: 'Otomatisasi Tata Kelola Perkantoran', category: 'Bisnis', studentCount: 420 },
      { name: 'Perhotelan & Kuliner', category: 'Pariwisata', studentCount: 330 },
      { name: 'Tata Busana', category: 'Kreatif', studentCount: 170 }
    ],
    accreditation: 'A',
    principal: 'Drs. H. Asep Agus, M.Pd.',
    phone: '(0265) 771204',
    partnershipStatus: 'Belum Dikunjungi',
    priorityScore: 86,
    aktaraCompatibility: {
      fitScore: 87,
      recommendedPrograms: ['Full-Stack Web Dev Workshop', 'Business Automation with AI Tools'],
      strengths: ['Pusat pendidikan kejuruan bisnis & teknologi di Ciamis'],
      notes: 'Potensial untuk program ekspansi AKTARA Priangan Timur bagian timur.'
    }
  }
];

export const REGIONS_DATA = {
  provinces: ['Jawa Barat'],
  cityDistricts: [
    'Semua Kabupaten/Kota',
    'Kabupaten Garut',
    'Kota Bandung',
    'Kabupaten Bandung',
    'Kota Tasikmalaya',
    'Kabupaten Tasikmalaya',
    'Kabupaten Sumedang',
    'Kabupaten Ciamis'
  ],
  subDistrictsByCity: {
    'Kabupaten Garut': [
      'Semua Kecamatan',
      'Tarogong Kidul',
      'Tarogong Kaler',
      'Garut Kota',
      'Karangpawitan',
      'Banyuresmi',
      'Cilawu',
      'Sukaresmi',
      'Cibatu',
      'Limbangan',
      'Kadungora',
      'Leles',
      'Wanaraja',
      'Samarang',
      'Pasirwangi',
      'Cikajang'
    ],
    'Kota Bandung': [
      'Semua Kecamatan',
      'Lengkong',
      'Sumur Bandung',
      'Coblong',
      'Kiaracondong',
      'Buahbatu',
      'Cicendo',
      'Astana Anyar',
      'Bandung Wetan'
    ],
    'Kabupaten Bandung': [
      'Semua Kecamatan',
      'Dayeuhkolot',
      'Baleendah',
      'Bojongsoang',
      'Soreang',
      'Katapang',
      'Margahayu',
      'Cileunyi'
    ],
    'Kota Tasikmalaya': [
      'Semua Kecamatan',
      'Tawang',
      'Cipedes',
      'Cihideung',
      'Kawalu',
      'Mangkubumi',
      'Indihiang'
    ],
    'Kabupaten Tasikmalaya': [
      'Semua Kecamatan',
      'Singaparna',
      'Mangunreja',
      'Ciawi',
      'Manonjaya',
      'Rajapolah'
    ],
    'Kabupaten Sumedang': [
      'Semua Kecamatan',
      'Sumedang Selatan',
      'Sumedang Utara',
      'Jatinangor',
      'Tanjungsari',
      'Situraja'
    ],
    'Kabupaten Ciamis': [
      'Semua Kecamatan',
      'Ciamis',
      'Baregbeg',
      'Cikoneng',
      'Kawali',
      'Panumbangan'
    ]
  }
};
