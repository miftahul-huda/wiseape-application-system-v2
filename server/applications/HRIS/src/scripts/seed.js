const {
  sequelize,
  Employee,
  EmployeeDocument,
  WorkExperience,
  EducationHistory,
  CareerHistory
} = require('../models');

async function seedData() {
  const transaction = await sequelize.transaction();
  try {
    console.log('[HRIS Seeder] Starting database seed...');

    // Clean existing records if any
    await CareerHistory.destroy({ where: {}, force: true, transaction });
    await EducationHistory.destroy({ where: {}, force: true, transaction });
    await WorkExperience.destroy({ where: {}, force: true, transaction });
    await EmployeeDocument.destroy({ where: {}, force: true, transaction });
    await Employee.destroy({ where: {}, force: true, transaction });

    // 1. Create Director / Manager first
    const manager1 = await Employee.create(
      {
        fullName: 'Bambang Sudarmono, S.Kom., M.M.',
        nickname: 'Bambang',
        birthPlace: 'Semarang',
        birthDate: '1985-04-12',
        gender: 'Laki-laki',
        religion: 'Islam',
        currentAddress: 'Jl. Kemang Selatan No. 45, Jakarta Selatan',
        idCardAddress: 'Jl. Diponegoro No. 12, Semarang, Jawa Tengah',
        phoneNumber: '081234567890',
        personalEmail: 'bambang.sudarmono@example.com',
        emergencyContactName: 'Sri Wahyuni',
        emergencyContactRelation: 'Istri',
        emergencyContactPhone: '081298765432',

        nik: 'EMP-2020-001',
        jobTitle: 'Director of Technology',
        jobLevel: 'Director / C-Level',
        department: 'Technology & Digital Innovation',
        division: '',
        employmentStatus: 'Tetap (PKWTT)',
        joinDate: '2020-01-15',
        workLocation: 'Kantor Pusat',
        isActive: true,
        status: 'Aktif',

        bankName: 'BCA',
        bankAccountNumber: '8720192837',
        bankAccountHolder: 'Bambang Sudarmono',
        basicSalary: 28000000,
        allowancePosition: 5000000,
        allowanceTransport: 2000000,
        allowanceMeal: 1500000,
        allowanceOther: 1000000,
        taxStatus: 'K/2',
        npwp: '09.123.456.7-012.000',
        bpjsKesehatan: '0001234567891',
        bpjsKetenagakerjaan: '19028374650'
      },
      { transaction }
    );

    // 2. Create Employee 2 (Senior Software Engineer reporting to manager1)
    const emp2 = await Employee.create(
      {
        fullName: 'Raden Ayu Annisa Putri, S.T.',
        nickname: 'Annisa',
        birthPlace: 'Yogyakarta',
        birthDate: '1994-08-20',
        gender: 'Perempuan',
        religion: 'Islam',
        currentAddress: 'Apartemen Kalibata City Tower Kemuning, Jakarta Selatan',
        idCardAddress: 'Jl. Malioboro No. 88, Danurejan, Yogyakarta',
        phoneNumber: '085712345678',
        personalEmail: 'annisa.putri@example.com',
        emergencyContactName: 'Budi Santoso',
        emergencyContactRelation: 'Ayah',
        emergencyContactPhone: '081328901234',

        nik: 'EMP-2022-015',
        jobTitle: 'Senior Software Engineer',
        jobLevel: 'Senior Staff / Specialist',
        department: 'Technology & Digital Innovation',
        division: 'Software Engineering',
        employmentStatus: 'Tetap (PKWTT)',
        joinDate: '2022-03-01',
        managerId: manager1.id,
        managerName: manager1.fullName,
        workLocation: 'Hybrid',
        isActive: true,
        status: 'Aktif',

        bankName: 'Bank Mandiri',
        bankAccountNumber: '1570008928374',
        bankAccountHolder: 'Raden Ayu Annisa Putri',
        basicSalary: 18500000,
        allowancePosition: 2000000,
        allowanceTransport: 1500000,
        allowanceMeal: 1200000,
        allowanceOther: 500000,
        taxStatus: 'TK/0',
        npwp: '12.345.678.9-021.000',
        bpjsKesehatan: '0002345678912',
        bpjsKetenagakerjaan: '20019283746'
      },
      { transaction }
    );

    // 3. Create Employee 3 (HR Specialist)
    const emp3 = await Employee.create(
      {
        fullName: 'Dewi Lestari Chandra, S.Psi.',
        nickname: 'Dewi',
        birthPlace: 'Bandung',
        birthDate: '1996-11-05',
        gender: 'Perempuan',
        religion: 'Katolik',
        currentAddress: 'Jl. Tebet Barat Raya No. 19, Jakarta Selatan',
        idCardAddress: 'Jl. Dago Asri No. 15, Bandung, Jawa Barat',
        phoneNumber: '081198761234',
        personalEmail: 'dewi.chandra@example.com',
        emergencyContactName: 'Chandra Gunawan',
        emergencyContactRelation: 'Suami',
        emergencyContactPhone: '081287654321',

        nik: 'EMP-2023-042',
        jobTitle: 'Talent Acquisition Officer',
        jobLevel: 'Staff / Entry Level',
        department: 'Human Capital & General Affairs',
        division: 'Talent Acquisition & Learning',
        employmentStatus: 'Kontrak (PKWT)',
        joinDate: '2023-06-15',
        endDate: '2025-06-14',
        workLocation: 'Kantor Pusat',
        isActive: true,
        status: 'Aktif',

        bankName: 'BCA',
        bankAccountNumber: '5420981726',
        bankAccountHolder: 'Dewi Lestari Chandra',
        basicSalary: 9500000,
        allowancePosition: 500000,
        allowanceTransport: 1000000,
        allowanceMeal: 1000000,
        allowanceOther: 0,
        taxStatus: 'K/0',
        npwp: '23.456.789.0-031.000',
        bpjsKesehatan: '0003456789123',
        bpjsKetenagakerjaan: '21029384756'
      },
      { transaction }
    );

    // ==========================================
    // Seed Work Experiences (Organisasi Sebelumnya)
    // ==========================================
    await WorkExperience.bulkCreate(
      [
        {
          employeeId: manager1.id,
          companyName: 'PT Telkom Indonesia (Persero) Tbk',
          position: 'Lead Solution Architect',
          startDate: '2015-02-01',
          endDate: '2019-12-31',
          isCurrentJob: false,
          lastSalary: 23000000,
          description: 'Memimpin tim arsitek sistem dalam pengembangan platform enterprise cloud dan integrasi API skala nasional.'
        },
        {
          employeeId: manager1.id,
          companyName: 'PT Astra Graphia Information Technology',
          position: 'Senior Software Engineer',
          startDate: '2011-06-01',
          endDate: '2015-01-31',
          isCurrentJob: false,
          lastSalary: 14000000,
          description: 'Mengembangkan aplikasi ERP dan sistem supply chain berbasis Java dan Oracle.'
        },
        {
          employeeId: emp2.id,
          companyName: 'PT GoTo Gojek Tokopedia Tbk',
          position: 'Fullstack Software Engineer',
          startDate: '2019-09-01',
          endDate: '2022-02-15',
          isCurrentJob: false,
          lastSalary: 15000000,
          description: 'Mengembangkan microservices untuk layanan logistik dan integrasi payment gateway menggunakan Node.js dan React.'
        },
        {
          employeeId: emp3.id,
          companyName: 'PT Kalbe Farma Tbk',
          position: 'HR Recruitment Officer',
          startDate: '2020-03-01',
          endDate: '2023-05-31',
          isCurrentJob: false,
          lastSalary: 7500000,
          description: 'Menangani end-to-end proses rekrutmen talenta nasional dan onboarding karyawan baru.'
        }
      ],
      { transaction }
    );

    // ==========================================
    // Seed Education Histories
    // ==========================================
    await EducationHistory.bulkCreate(
      [
        {
          employeeId: manager1.id,
          institutionName: 'Institut Teknologi Bandung (ITB)',
          degree: 'S2',
          major: 'Magister Manajemen Teknologi Informasi',
          startDate: '2008-08-01',
          graduationDate: '2010-10-20',
          gpa: 3.85,
          description: 'Lulus dengan predikat Cumlaude. Tesis mengenai strategi modernisasi arsitektur microservices.'
        },
        {
          employeeId: manager1.id,
          institutionName: 'Universitas Diponegoro',
          degree: 'S1',
          major: 'Teknik Informatika',
          startDate: '2003-08-01',
          graduationDate: '2007-09-15',
          gpa: 3.65,
          description: 'Aktif di Himpunan Mahasiswa Informatika dan asisten laboratorium pemrograman.'
        },
        {
          employeeId: emp2.id,
          institutionName: 'Universitas Gadjah Mada (UGM)',
          degree: 'S1',
          major: 'Teknologi Informasi',
          startDate: '2012-08-01',
          graduationDate: '2016-08-25',
          gpa: 3.78,
          description: 'Juara 2 Gemastik Kategori Desain Perangkat Lunak tingkat Nasional.'
        },
        {
          employeeId: emp3.id,
          institutionName: 'Universitas Padjadjaran (UNPAD)',
          degree: 'S1',
          major: 'Psikologi',
          startDate: '2014-08-01',
          graduationDate: '2018-11-10',
          gpa: 3.72,
          description: 'Peminatan Psikologi Industri dan Organisasi (PIO).'
        }
      ],
      { transaction }
    );

    // ==========================================
    // Seed Documents (Legalitas & Compliance)
    // ==========================================
    await EmployeeDocument.bulkCreate(
      [
        {
          employeeId: manager1.id,
          documentType: 'KTP',
          title: 'Kartu Tanda Penduduk - Bambang Sudarmono',
          fileName: 'ktp_bambang.pdf',
          filePath: '/uploads/documents/1/ktp_bambang.pdf',
          fileUrl: '/uploads/documents/1/ktp_bambang.pdf',
          fileSize: 450200,
          mimeType: 'application/pdf',
          documentNumber: '3374011204850001',
          issueDate: '2012-05-10',
          description: 'KTP Elektronik seumur hidup'
        },
        {
          employeeId: manager1.id,
          documentType: 'NPWP',
          title: 'Kartu NPWP - Bambang Sudarmono',
          fileName: 'npwp_bambang.pdf',
          filePath: '/uploads/documents/1/npwp_bambang.pdf',
          fileUrl: '/uploads/documents/1/npwp_bambang.pdf',
          fileSize: 310500,
          mimeType: 'application/pdf',
          documentNumber: '09.123.456.7-012.000',
          description: 'NPWP Terverifikasi KPP Pratama Jakarta Kebayoran Baru'
        },
        {
          employeeId: emp2.id,
          documentType: 'Kontrak Kerja',
          title: 'Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)',
          fileName: 'kontrak_pkwtt_annisa.pdf',
          filePath: '/uploads/documents/2/kontrak_pkwtt_annisa.pdf',
          fileUrl: '/uploads/documents/2/kontrak_pkwtt_annisa.pdf',
          fileSize: 850000,
          mimeType: 'application/pdf',
          documentNumber: 'PKWTT/HRD/2023/044',
          issueDate: '2023-03-01',
          description: 'Kontrak Karyawan Tetap ditandatangani kedua belah pihak'
        },
        {
          employeeId: emp2.id,
          documentType: 'Sertifikat',
          title: 'AWS Certified Solutions Architect - Associate',
          fileName: 'aws_cert_annisa.pdf',
          filePath: '/uploads/documents/2/aws_cert_annisa.pdf',
          fileUrl: '/uploads/documents/2/aws_cert_annisa.pdf',
          fileSize: 520000,
          mimeType: 'application/pdf',
          documentNumber: 'AWS-SAA-291048',
          issueDate: '2023-01-10',
          expiryDate: '2026-01-10',
          description: 'Lisensi sertifikasi cloud architecture'
        },
        {
          employeeId: emp3.id,
          documentType: 'KK',
          title: 'Kartu Keluarga - Dewi Lestari Chandra',
          fileName: 'kk_dewi.pdf',
          filePath: '/uploads/documents/3/kk_dewi.pdf',
          fileUrl: '/uploads/documents/3/kk_dewi.pdf',
          fileSize: 410000,
          mimeType: 'application/pdf',
          documentNumber: '3174092011180005',
          issueDate: '2021-02-14',
          description: 'Kartu Keluarga pembaruan pernikahan'
        }
      ],
      { transaction }
    );

    // ==========================================
    // Seed Career Histories (Promosi & Penyesuaian)
    // ==========================================
    await CareerHistory.bulkCreate(
      [
        {
          employeeId: emp2.id,
          changeType: 'Promosi',
          effectiveDate: '2024-01-01',
          previousJobTitle: 'Software Engineer',
          newJobTitle: 'Senior Fullstack Engineer',
          previousDepartment: 'Technology',
          newDepartment: 'Technology',
          previousSalary: 15500000,
          newSalary: 18500000,
          referenceNumber: 'SK/DIR/HR/2024/008',
          notes: 'Promosi atas kontribusi luar biasa pada peluncuran core platform microservices.'
        },
        {
          employeeId: emp2.id,
          changeType: 'Penghargaan',
          effectiveDate: '2023-12-20',
          previousJobTitle: 'Software Engineer',
          newJobTitle: 'Software Engineer',
          previousDepartment: 'Technology',
          newDepartment: 'Technology',
          referenceNumber: 'AWARD/2023/Q4-01',
          notes: 'Best Engineer of The Quarter Q4-2023'
        }
      ],
      { transaction }
    );

    await transaction.commit();
    console.log('[HRIS Seeder] Database seeded successfully with 3 rich Indonesian employee profiles!');
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('[HRIS Seeder] Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
