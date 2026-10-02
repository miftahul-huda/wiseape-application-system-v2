const { MasterData, Organization, JobLevel, JobPosition } = require('../models');

async function seedMasterData() {
  console.log('[HRIS Seed] Starting master data seeding...');

  // 1. GENDER
  const genders = [
    { code: 'MALE', name: 'Laki-laki', description: 'Gender Pria / Laki-laki', sortOrder: 1 },
    { code: 'FEMALE', name: 'Perempuan', description: 'Gender Wanita / Perempuan', sortOrder: 2 }
  ];
  for (const item of genders) {
    await MasterData.findOrCreate({
      where: { dataType: 'GENDER', code: item.code },
      defaults: { ...item, dataType: 'GENDER', isActive: true }
    });
  }

  // 2. RELIGION
  const religions = [
    { code: 'ISLAM', name: 'Islam', description: 'Agama Islam', sortOrder: 1 },
    { code: 'KRISTEN', name: 'Kristen Protestan', description: 'Agama Kristen Protestan', sortOrder: 2 },
    { code: 'KATOLIK', name: 'Kristen Katolik', description: 'Agama Kristen Katolik', sortOrder: 3 },
    { code: 'HINDU', name: 'Hindu', description: 'Agama Hindu', sortOrder: 4 },
    { code: 'BUDDHA', name: 'Buddha', description: 'Agama Buddha', sortOrder: 5 },
    { code: 'KONGHUCU', name: 'Konghucu', description: 'Agama Konghucu', sortOrder: 6 },
    { code: 'LAINNYA', name: 'Lainnya', description: 'Aliran Kepercayaan / Lainnya', sortOrder: 7 }
  ];
  for (const item of religions) {
    await MasterData.findOrCreate({
      where: { dataType: 'RELIGION', code: item.code },
      defaults: { ...item, dataType: 'RELIGION', isActive: true }
    });
  }

  // 3. RELATIONSHIP (Family / Emergency Contact)
  const relationships = [
    { code: 'SUAMI', name: 'Suami', description: 'Pasangan Suami', sortOrder: 1 },
    { code: 'ISTRI', name: 'Istri', description: 'Pasangan Istri', sortOrder: 2 },
    { code: 'ANAK', name: 'Anak Kandung', description: 'Anak Kandung', sortOrder: 3 },
    { code: 'ORANG_TUA', name: 'Orang Tua', description: 'Ayah / Ibu Kandung', sortOrder: 4 },
    { code: 'SAUDARA', name: 'Saudara Kandung', description: 'Kakak / Adik Kandung', sortOrder: 5 },
    { code: 'MERTUA', name: 'Mertua', description: 'Ayah / Ibu Mertua', sortOrder: 6 },
    { code: 'LAINNYA', name: 'Lainnya / Kerabat', description: 'Kerabat / Wali / Lainnya', sortOrder: 7 }
  ];
  for (const item of relationships) {
    await MasterData.findOrCreate({
      where: { dataType: 'RELATIONSHIP', code: item.code },
      defaults: { ...item, dataType: 'RELATIONSHIP', isActive: true }
    });
  }

  // 4. EMPLOYMENT STATUS
  const employmentStatuses = [
    { code: 'PERMANENT', name: 'Tetap (PKWTT)', description: 'Karyawan Tetap Perjanjian Kerja Waktu Tidak Tertentu', sortOrder: 1 },
    { code: 'CONTRACT', name: 'Kontrak (PKWT)', description: 'Karyawan Kontrak Perjanjian Kerja Waktu Tertentu', sortOrder: 2 },
    { code: 'PROBATION', name: 'Probation / Masa Percobaan', description: 'Karyawan dalam masa evaluasi percobaan (3 bulan)', sortOrder: 3 },
    { code: 'INTERNSHIP', name: 'Magang (Internship)', description: 'Peserta Magang Akademik / Program Industri', sortOrder: 4 },
    { code: 'FREELANCE', name: 'Freelance / Mitra', description: 'Pekerja Lepas / Tenaga Ahli Lepas', sortOrder: 5 },
    { code: 'CONSULTANT', name: 'Konsultan', description: 'Konsultan Spesialis Eksternal', sortOrder: 6 }
  ];
  for (const item of employmentStatuses) {
    await MasterData.findOrCreate({
      where: { dataType: 'EMPLOYMENT_STATUS', code: item.code },
      defaults: { ...item, dataType: 'EMPLOYMENT_STATUS', isActive: true }
    });
  }

  // 5. WORK LOCATION
  const workLocations = [
    { code: 'HO_JKT', name: 'Head Office (Jakarta Selatan)', description: 'Kantor Pusat Wisma Sejahtera Lantai 12', sortOrder: 1 },
    { code: 'BO_SBY', name: 'Branch Office (Surabaya)', description: 'Kantor Cabang Jawa Timur - Jl. Pemuda', sortOrder: 2 },
    { code: 'BO_BDG', name: 'Branch Office (Bandung)', description: 'Kantor Cabang Jawa Barat - Jl. Dago', sortOrder: 3 },
    { code: 'BO_MDN', name: 'Branch Office (Medan)', description: 'Kantor Cabang Sumatera Utara - Jl. Gajah Mada', sortOrder: 4 },
    { code: 'BO_SMG', name: 'Branch Office (Semarang)', description: 'Kantor Cabang Jawa Tengah - Jl. Pandanaran', sortOrder: 5 },
    { code: 'REMOTE', name: 'Remote / Work From Anywhere', description: 'Kerja Jarak Jauh (WFH/WFA)', sortOrder: 6 },
    { code: 'SITE', name: 'Site Operation & Warehouse', description: 'Pusat Operasional Logistik & Gudang', sortOrder: 7 }
  ];
  for (const item of workLocations) {
    await MasterData.findOrCreate({
      where: { dataType: 'WORK_LOCATION', code: item.code },
      defaults: { ...item, dataType: 'WORK_LOCATION', isActive: true }
    });
  }

  // 6. BANK
  const banks = [
    { code: 'BCA', name: 'Bank Central Asia (BCA)', description: 'PT Bank Central Asia Tbk', sortOrder: 1, metadata: { swiftCode: 'CENAIDJA' } },
    { code: 'MANDIRI', name: 'Bank Mandiri', description: 'PT Bank Mandiri (Persero) Tbk', sortOrder: 2, metadata: { swiftCode: 'BMRIIDJA' } },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', description: 'PT Bank Negara Indonesia (Persero) Tbk', sortOrder: 3, metadata: { swiftCode: 'BNINIDJA' } },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', description: 'PT Bank Rakyat Indonesia (Persero) Tbk', sortOrder: 4, metadata: { swiftCode: 'BRINIDJA' } },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)', description: 'PT Bank Syariah Indonesia Tbk', sortOrder: 5, metadata: { swiftCode: 'BSMDIDJA' } },
    { code: 'CIMB', name: 'CIMB Niaga', description: 'PT Bank CIMB Niaga Tbk', sortOrder: 6, metadata: { swiftCode: 'BNGAIDJA' } },
    { code: 'PERMATA', name: 'Permata Bank', description: 'PT Bank Permata Tbk', sortOrder: 7, metadata: { swiftCode: 'BBBAIDJA' } },
    { code: 'DANAMON', name: 'Bank Danamon', description: 'PT Bank Danamon Indonesia Tbk', sortOrder: 8, metadata: { swiftCode: 'BDINIDJA' } },
    { code: 'MEGA', name: 'Bank Mega', description: 'PT Bank Mega Tbk', sortOrder: 9, metadata: { swiftCode: 'MEGAIDJA' } },
    { code: 'BTPN', name: 'Bank BTPN / Jenius', description: 'PT Bank BTPN Tbk', sortOrder: 10, metadata: { swiftCode: 'BTPNIDJA' } },
    { code: 'OCBC', name: 'OCBC NISP', description: 'PT Bank OCBC NISP Tbk', sortOrder: 11, metadata: { swiftCode: 'NISPIDJA' } }
  ];
  for (const item of banks) {
    await MasterData.findOrCreate({
      where: { dataType: 'BANK', code: item.code },
      defaults: { ...item, dataType: 'BANK', isActive: true }
    });
  }

  // 7. DOCUMENT TYPE
  const documentTypes = [
    { code: 'KTP', name: 'Kartu Tanda Penduduk (KTP)', description: 'Identitas Kependudukan Resmi WNI', sortOrder: 1 },
    { code: 'NPWP', name: 'Nomor Pokok Wajib Pajak (NPWP)', description: 'Dokumen Perpajakan Karyawan', sortOrder: 2 },
    { code: 'KK', name: 'Kartu Keluarga (KK)', description: 'Dokumen Data Susunan Anggota Keluarga', sortOrder: 3 },
    { code: 'IJAZAH', name: 'Ijazah Terakhir', description: 'Sertifikat Kelulusan Pendidikan Formal Terakhir', sortOrder: 4 },
    { code: 'TRANSKRIP', name: 'Transkrip Nilai Akademik', description: 'Daftar Nilai / Prestasi Akademik Resmi', sortOrder: 5 },
    { code: 'PKWT', name: 'Surat Perjanjian Kerja (PKWT/PKWTT)', description: 'Kontrak Resmi Hubungan Kerja Karyawan & Perusahaan', sortOrder: 6 },
    { code: 'SERTIFIKAT', name: 'Sertifikat Keahlian / Kompetensi', description: 'Sertifikasi Profesi dan Pelatihan Terakreditasi', sortOrder: 7 },
    { code: 'FOTO', name: 'Pas Foto Resmi Karyawan', description: 'Foto Formal Background Biru / Merah', sortOrder: 8 },
    { code: 'REKENING', name: 'Buku Tabungan / Rekening Bank', description: 'Konfirmasi Nomor Rekening Payroll Karyawan', sortOrder: 9 },
    { code: 'BPJS_KES', name: 'Kartu BPJS Kesehatan', description: 'Jaminan Kesehatan Nasional', sortOrder: 10 },
    { code: 'BPJS_TK', name: 'Kartu BPJS Ketenagakerjaan', description: 'Jaminan Hari Tua & Kecelakaan Kerja', sortOrder: 11 },
    { code: 'SKCK', name: 'Surat Keterangan Catatan Kepolisian (SKCK)', description: 'Surat Rekam Jejak Kepolisian', sortOrder: 12 },
    { code: 'SURAT_SEHAT', name: 'Surat Keterangan Sehat / MCU', description: 'Hasil Tes Kesehatan / Medical Check-up', sortOrder: 13 }
  ];
  for (const item of documentTypes) {
    await MasterData.findOrCreate({
      where: { dataType: 'DOCUMENT_TYPE', code: item.code },
      defaults: { ...item, dataType: 'DOCUMENT_TYPE', isActive: true }
    });
  }

  // 8. DEGREE LEVEL
  const degreeLevels = [
    { code: 'SMA', name: 'SMA / SMK Sederajat', description: 'Pendidikan Menengah Atas / Kejuruan', sortOrder: 1 },
    { code: 'D1', name: 'Diploma 1 (D1)', description: 'Program Pendidikan Ahli Pratama', sortOrder: 2 },
    { code: 'D2', name: 'Diploma 2 (D2)', description: 'Program Pendidikan Ahli Muda', sortOrder: 3 },
    { code: 'D3', name: 'Diploma 3 (D3)', description: 'Program Pendidikan Ahli Madya', sortOrder: 4 },
    { code: 'D4', name: 'Diploma 4 / Sarjana Terapan (D4)', description: 'Program Sarjana Terapan Vokasi', sortOrder: 5 },
    { code: 'S1', name: 'Sarjana (S1)', description: 'Program Pendidikan Strata 1 / Bachelor Degree', sortOrder: 6 },
    { code: 'S2', name: 'Magister (S2)', description: 'Program Pendidikan Strata 2 / Master Degree', sortOrder: 7 },
    { code: 'S3', name: 'Doktor (S3)', description: 'Program Pendidikan Strata 3 / Doctoral Degree', sortOrder: 8 },
    { code: 'NON_FORMAL', name: 'Non-Formal / Bootcamp', description: 'Pendidikan Non Formal / Kursus Profesional', sortOrder: 9 }
  ];
  for (const item of degreeLevels) {
    await MasterData.findOrCreate({
      where: { dataType: 'DEGREE_LEVEL', code: item.code },
      defaults: { ...item, dataType: 'DEGREE_LEVEL', isActive: true }
    });
  }

  console.log('[HRIS Seed] MasterData seeded successfully.');

  // 9. JOB LEVELS
  const jobLevels = [
    { code: 'LVL-01', name: 'Staff / Entry Level', levelNumber: 1, description: 'Tingkat pelaksana tugas operasional dan teknis dasar', sortOrder: 1 },
    { code: 'LVL-02', name: 'Senior Staff / Specialist', levelNumber: 2, description: 'Spesialis teknis dengan pengalaman dan keahlian mendalam', sortOrder: 2 },
    { code: 'LVL-03', name: 'Team Lead / Officer', levelNumber: 3, description: 'Koordinator tim kerja dan pelaksana proyek operasional', sortOrder: 3 },
    { code: 'LVL-04', name: 'Supervisor', levelNumber: 4, description: 'Penyelia operasional harian dan evaluasi kinerja tim', sortOrder: 4 },
    { code: 'LVL-05', name: 'Assistant Manager', levelNumber: 5, description: 'Membantu pengelolaan departemen dan alur kerja fungsional', sortOrder: 5 },
    { code: 'LVL-06', name: 'Manager', levelNumber: 6, description: 'Penanggung jawab strategi departemen dan pencapaian target', sortOrder: 6 },
    { code: 'LVL-07', name: 'Senior Manager / Head of Dept', levelNumber: 7, description: 'Kepala departemen utama dan pengambil keputusan taktikal', sortOrder: 7 },
    { code: 'LVL-08', name: 'General Manager / Vice President', levelNumber: 8, description: 'Pemimpin divisi lintas departemen dan strategi bisnis', sortOrder: 8 },
    { code: 'LVL-09', name: 'Director / C-Level', levelNumber: 9, description: 'Dewan Direksi & Eksekutif penentu arah strategis korporasi', sortOrder: 9 }
  ];
  const levelMap = {};
  for (const lvl of jobLevels) {
    const [instance] = await JobLevel.findOrCreate({
      where: { code: lvl.code },
      defaults: { ...lvl, isActive: true }
    });
    levelMap[lvl.code] = instance.id;
  }
  console.log('[HRIS Seed] JobLevels seeded successfully.');

  // 10. ORGANIZATIONS (Divisions & Departments)
  const divisions = [
    { code: 'DIV-EXEC', name: 'Executive & Corporate Strategy', type: 'Division', description: 'Direksi dan Manajemen Eksekutif Perusahaan', sortOrder: 1 },
    { code: 'DIV-HRGA', name: 'Human Capital & General Affairs', type: 'Division', description: 'Divisi Sumber Daya Manusia dan Layanan Umum', sortOrder: 2 },
    { code: 'DIV-TECH', name: 'Technology & Digital Innovation', type: 'Division', description: 'Divisi Rekayasa Perangkat Lunak & Infrastruktur IT', sortOrder: 3 },
    { code: 'DIV-FIN', name: 'Finance, Tax & Accounting', type: 'Division', description: 'Divisi Keuangan, Akuntansi, Pajak dan Kas Korporat', sortOrder: 4 },
    { code: 'DIV-SALES', name: 'Sales, Marketing & Commercial', type: 'Division', description: 'Divisi Penjualan Korporat, Pemasaran dan Pertumbuhan Bisnis', sortOrder: 5 },
    { code: 'DIV-OPS', name: 'Operations & Customer Experience', type: 'Division', description: 'Divisi Operasional Harian, Pelayanan Pelanggan dan Logistik', sortOrder: 6 }
  ];

  const orgMap = {};
  for (const div of divisions) {
    const [instance] = await Organization.findOrCreate({
      where: { code: div.code },
      defaults: { ...div, isActive: true }
    });
    orgMap[div.code] = instance.id;
  }

  const departments = [
    // HRGA
    { code: 'DEPT-HR', name: 'People Operations & HR', type: 'Department', parentCode: 'DIV-HRGA', description: 'Departemen HR & Personalia', sortOrder: 1 },
    { code: 'DEPT-TALENT', name: 'Talent Acquisition & Learning', type: 'Department', parentCode: 'DIV-HRGA', description: 'Rekrutmen dan Pengembangan SDM', sortOrder: 2 },
    { code: 'DEPT-GA', name: 'General Affairs & Facilities', type: 'Department', parentCode: 'DIV-HRGA', description: 'Layanan Umum, Aset, & Pengadaan Kantor', sortOrder: 3 },
    // TECH
    { code: 'DEPT-ENG', name: 'Software Engineering', type: 'Department', parentCode: 'DIV-TECH', description: 'Pengembangan Aplikasi Frontend & Backend', sortOrder: 1 },
    { code: 'DEPT-INFRA', name: 'Cloud Infrastructure & DevOps', type: 'Department', parentCode: 'DIV-TECH', description: 'Infrastruktur Cloud, Keamanan & CI/CD', sortOrder: 2 },
    { code: 'DEPT-QA', name: 'Quality Assurance & Security', type: 'Department', parentCode: 'DIV-TECH', description: 'Pengujian Mutu Sistem & Keamanan Siber', sortOrder: 3 },
    { code: 'DEPT-PROD', name: 'Product Management & UI/UX', type: 'Department', parentCode: 'DIV-TECH', description: 'Perencanaan Produk Digital & Desain UI/UX', sortOrder: 4 },
    // FINANCE
    { code: 'DEPT-FIN', name: 'Finance & Treasury', type: 'Department', parentCode: 'DIV-FIN', description: 'Pengelolaan Kas & Anggaran Perusahaan', sortOrder: 1 },
    { code: 'DEPT-ACC', name: 'Accounting & Tax Compliance', type: 'Department', parentCode: 'DIV-FIN', description: 'Laporan Keuangan & Kepatuhan Pajak', sortOrder: 2 },
    // SALES
    { code: 'DEPT-B2B', name: 'B2B Enterprise Sales', type: 'Department', parentCode: 'DIV-SALES', description: 'Penjualan Solusi ke Klien Korporasi', sortOrder: 1 },
    { code: 'DEPT-MKTG', name: 'Digital Marketing & Branding', type: 'Department', parentCode: 'DIV-SALES', description: 'Pemasaran Digital & Kampanye Merek', sortOrder: 2 },
    // OPS
    { code: 'DEPT-CS', name: 'Customer Support & Success', type: 'Department', parentCode: 'DIV-OPS', description: 'Layanan Bantuan & Kepuasan Pelanggan', sortOrder: 1 },
    { code: 'DEPT-LOG', name: 'Supply Chain & Logistics', type: 'Department', parentCode: 'DIV-OPS', description: 'Pengiriman, Inventori & Logistik', sortOrder: 2 }
  ];

  for (const dept of departments) {
    const parentId = orgMap[dept.parentCode] || null;
    const [instance] = await Organization.findOrCreate({
      where: { code: dept.code },
      defaults: {
        code: dept.code,
        name: dept.name,
        type: dept.type,
        parentId,
        description: dept.description,
        sortOrder: dept.sortOrder,
        isActive: true
      }
    });
    orgMap[dept.code] = instance.id;
  }
  console.log('[HRIS Seed] Organizations seeded successfully.');

  // 11. JOB POSITIONS (Jabatan)
  const positions = [
    { code: 'POS-DIR-TECH', title: 'Director of Technology', orgCode: 'DIV-TECH', levelCode: 'LVL-09', dept: 'Technology & Digital Innovation', sortOrder: 1 },
    { code: 'POS-DIR-HR', title: 'Director of Human Resources', orgCode: 'DIV-HRGA', levelCode: 'LVL-09', dept: 'Human Capital & General Affairs', sortOrder: 2 },
    { code: 'POS-MGR-ENG', title: 'Engineering Manager', orgCode: 'DEPT-ENG', levelCode: 'LVL-06', dept: 'Software Engineering', sortOrder: 3 },
    { code: 'POS-TECH-LEAD', title: 'Technical Lead', orgCode: 'DEPT-ENG', levelCode: 'LVL-03', dept: 'Software Engineering', sortOrder: 4 },
    { code: 'POS-SR-SWE', title: 'Senior Software Engineer', orgCode: 'DEPT-ENG', levelCode: 'LVL-02', dept: 'Software Engineering', sortOrder: 5 },
    { code: 'POS-SWE', title: 'Software Engineer', orgCode: 'DEPT-ENG', levelCode: 'LVL-01', dept: 'Software Engineering', sortOrder: 6 },
    { code: 'POS-DEVOPS', title: 'DevOps & Cloud Engineer', orgCode: 'DEPT-INFRA', levelCode: 'LVL-02', dept: 'Cloud Infrastructure & DevOps', sortOrder: 7 },
    { code: 'POS-QA-ENG', title: 'QA Automation Engineer', orgCode: 'DEPT-QA', levelCode: 'LVL-01', dept: 'Quality Assurance & Security', sortOrder: 8 },
    { code: 'POS-UIUX', title: 'UI/UX Product Designer', orgCode: 'DEPT-PROD', levelCode: 'LVL-02', dept: 'Product Management & UI/UX', sortOrder: 9 },
    { code: 'POS-MGR-HR', title: 'HR & People Operations Manager', orgCode: 'DEPT-HR', levelCode: 'LVL-06', dept: 'People Operations & HR', sortOrder: 10 },
    { code: 'POS-HR-SPEC', title: 'HR Generalist Specialist', orgCode: 'DEPT-HR', levelCode: 'LVL-02', dept: 'People Operations & HR', sortOrder: 11 },
    { code: 'POS-TALENT-ACQ', title: 'Talent Acquisition Officer', orgCode: 'DEPT-TALENT', levelCode: 'LVL-01', dept: 'Talent Acquisition & Learning', sortOrder: 12 },
    { code: 'POS-GA-OFFICER', title: 'General Affairs Officer', orgCode: 'DEPT-GA', levelCode: 'LVL-01', dept: 'General Affairs & Facilities', sortOrder: 13 },
    { code: 'POS-MGR-FIN', title: 'Finance & Treasury Manager', orgCode: 'DEPT-FIN', levelCode: 'LVL-06', dept: 'Finance & Treasury', sortOrder: 14 },
    { code: 'POS-ACC-SPEC', title: 'Senior Accountant', orgCode: 'DEPT-ACC', levelCode: 'LVL-02', dept: 'Accounting & Tax Compliance', sortOrder: 15 },
    { code: 'POS-TAX-SPEC', title: 'Tax Compliance Specialist', orgCode: 'DEPT-ACC', levelCode: 'LVL-02', dept: 'Accounting & Tax Compliance', sortOrder: 16 },
    { code: 'POS-SALES-EXEC', title: 'B2B Account Executive', orgCode: 'DEPT-B2B', levelCode: 'LVL-01', dept: 'B2B Enterprise Sales', sortOrder: 17 },
    { code: 'POS-MKTG-SPEC', title: 'Digital Marketing Specialist', orgCode: 'DEPT-MKTG', levelCode: 'LVL-01', dept: 'Digital Marketing & Branding', sortOrder: 18 },
    { code: 'POS-CS-SPEC', title: 'Customer Support Specialist', orgCode: 'DEPT-CS', levelCode: 'LVL-01', dept: 'Customer Support & Success', sortOrder: 19 },
    { code: 'POS-LOG-SUPV', title: 'Logistics Supervisor', orgCode: 'DEPT-LOG', levelCode: 'LVL-04', dept: 'Supply Chain & Logistics', sortOrder: 20 }
  ];

  for (const pos of positions) {
    const orgId = orgMap[pos.orgCode] || null;
    const levelId = levelMap[pos.levelCode] || null;
    await JobPosition.findOrCreate({
      where: { code: pos.code },
      defaults: {
        code: pos.code,
        title: pos.title,
        organizationId: orgId,
        jobLevelId: levelId,
        department: pos.dept,
        isActive: true,
        sortOrder: pos.sortOrder
      }
    });
  }

  console.log('[HRIS Seed] JobPositions seeded successfully.');
  console.log('[HRIS Seed] All Master, Organization, JobLevel, and Position tables seeded successfully!');
}

module.exports = { seedMasterData };

if (require.main === module) {
  const { sequelize } = require('../models');
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      await seedMasterData();
      process.exit(0);
    } catch (err) {
      console.error('Error running seedMasterData script:', err);
      process.exit(1);
    }
  })();
}
