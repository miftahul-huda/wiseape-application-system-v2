const {
  sequelize,
  RecruitmentStageTemplate,
  RecruitmentMatrixTemplate,
  JobVacancy,
  JobApplicant,
  ApplicantProcess
} = require('../models');

async function seedRecruitmentData() {
  try {
    console.log('[Recruitment Seed] Starting seeding recruitment templates, vacancies, and applicants...');

    // 1. Seed Matrix Templates
    const countMatrix = await RecruitmentMatrixTemplate.count();
    let matrixHrd, matrixUser, matrixTest;

    if (countMatrix === 0) {
      matrixHrd = await RecruitmentMatrixTemplate.create({
        code: 'MTX-HRD-01',
        name: 'Matriks Wawancara HRD (Behavioral & Culture Fit)',
        description: 'Evaluasi keselarasan nilai budaya, kepribadian, gaya kerja, dan motivasi berkarir.',
        criteria: [
          { id: 'c1', criterion: 'Komunikasi & Artikulasi Ide', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Kelancaran dan kejelasan menyampaikan gagasan.' },
          { id: 'c2', criterion: 'Culture Fit & Nilai Budaya Perusahaan', weight: 25, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Kesesuaian dengan core values Wiseape.' },
          { id: 'c3', criterion: 'Motivasi & Komitmen Jangka Panjang', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Antusiasme peran dan kestabilan rencana karir.' },
          { id: 'c4', criterion: 'Kolaborasi & Kerjasama Tim', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Pengalaman berkoordinasi dan sinergi antar rekan.' },
          { id: 'c5', criterion: 'Resiliensi & Manajemen Stres', weight: 15, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Sikap menghadapi tekanan tenggat waktu kerja.' }
        ],
        passScore: 75.0,
        isActive: true
      });

      matrixUser = await RecruitmentMatrixTemplate.create({
        code: 'MTX-USR-01',
        name: 'Matriks Wawancara User (Kompetensi Teknis & Solusi)',
        description: 'Penilaian mendalam kemampuan teknis domain spesifik, arsitektur, dan pemecahan kasus nyata.',
        criteria: [
          { id: 'c1', criterion: 'Kedalaman Konsep Teknis & Arsitektur', weight: 30, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Penguasaan fundamental dan teknologi modern.' },
          { id: 'c2', criterion: 'Problem Solving & Critical Thinking', weight: 25, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Pendekatan analitis dalam memecahkan masalah.' },
          { id: 'c3', criterion: 'Portofolio & Rekam Jejak Proyek', weight: 25, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Kualitas hasil karya nyata dan dampak bisnisnya.' },
          { id: 'c4', criterion: 'Best Practice & Standar Rekayasa', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Penerapan standar kualitas, clean code & testing.' }
        ],
        passScore: 78.0,
        isActive: true
      });

      matrixTest = await RecruitmentMatrixTemplate.create({
        code: 'MTX-TST-01',
        name: 'Matriks Tes Praktik & Kemampuan Analisis',
        description: 'Penilaian obyektif hasil studi kasus / live coding / uji kompetensi teknis.',
        criteria: [
          { id: 'c1', criterion: 'Kebenaran Hasil & Output Logika', weight: 35, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Kesesuaian hasil terhadap skenario uji / test cases.' },
          { id: 'c2', criterion: 'Efisiensi Waktu & Struktur Solusi', weight: 25, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Struktur kode atau analisis yang efisien dan rapi.' },
          { id: 'c3', criterion: 'Standar Dokumentasi & Kerapian', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Keterbacaan dan penjelasan langkah kerja.' },
          { id: 'c4', criterion: 'Penanganan Edge Cases & Batasan Masalah', weight: 20, scaleType: '1-100', minScore: 0, maxScore: 100, description: 'Antisipasi terhadap kondisi anomali/ekstrem.' }
        ],
        passScore: 75.0,
        isActive: true
      });
      console.log('[Recruitment Seed] Matrix templates created.');
    } else {
      matrixHrd = await RecruitmentMatrixTemplate.findOne({ where: { code: 'MTX-HRD-01' } });
      matrixUser = await RecruitmentMatrixTemplate.findOne({ where: { code: 'MTX-USR-01' } });
      matrixTest = await RecruitmentMatrixTemplate.findOne({ where: { code: 'MTX-TST-01' } });
    }

    // 2. Seed Stage Templates
    const countStage = await RecruitmentStageTemplate.count();
    let stageTech, stageGeneral, stageExec;

    if (countStage === 0) {
      stageTech = await RecruitmentStageTemplate.create({
        code: 'STG-TECH-01',
        name: 'Alur Seleksi Software Engineering & IT',
        description: 'Pipeline rekrutmen standar untuk engineer perangkat lunak, developer, dan UI/UX designer.',
        stages: [
          { id: 's1', name: 'Screening CV & Portofolio', order: 1, description: 'Pemeriksaan berkas administrasi dan portofolio karya teknis.' },
          { id: 's2', name: 'Tes Praktik / Coding Challenge', order: 2, description: 'Uji kemampuan logika dan pemrograman kasus nyata.', matrixTemplateId: matrixTest ? matrixTest.id : null, matrixTemplateName: matrixTest ? matrixTest.name : '' },
          { id: 's3', name: 'Wawancara HRD & Budaya Kerja', order: 3, description: 'Evaluasi perilaku, kepribadian, dan komitmen.', matrixTemplateId: matrixHrd ? matrixHrd.id : null, matrixTemplateName: matrixHrd ? matrixHrd.name : '' },
          { id: 's4', name: 'Wawancara User & Tech Lead', order: 4, description: 'Wawancara teknis mendalam bersama lead divisi pengguna.', matrixTemplateId: matrixUser ? matrixUser.id : null, matrixTemplateName: matrixUser ? matrixUser.name : '' },
          { id: 's5', name: 'Offering Letter & Negosiasi', order: 5, description: 'Pemberian penawaran resmi paket kompensasi dan kontrak kerja.' }
        ],
        isActive: true
      });

      stageGeneral = await RecruitmentStageTemplate.create({
        code: 'STG-GEN-01',
        name: 'Alur Seleksi General Staff & Komersial',
        description: 'Pipeline rekrutmen untuk staf operasional, penjualan, pemasaran, dan administrasi.',
        stages: [
          { id: 's1', name: 'Screening CV & Berkas', order: 1, description: 'Verifikasi kesesuaian pengalaman dan riwayat pelamar.' },
          { id: 's2', name: 'Psikotes & Uji Kemampuan Umum', order: 2, description: 'Tes kemampuan numerik, logika verbal, dan kepribadian.' },
          { id: 's3', name: 'Wawancara HRD', order: 3, description: 'Penilaian motivasi dan latar belakang kerja.', matrixTemplateId: matrixHrd ? matrixHrd.id : null, matrixTemplateName: matrixHrd ? matrixHrd.name : '' },
          { id: 's4', name: 'Wawancara User / Manager', order: 4, description: 'Diskusi peran dan target divisi bersama manager terkait.' },
          { id: 's5', name: 'Offering Letter', order: 5, description: 'Penawaran kerja resmi.' }
        ],
        isActive: true
      });

      stageExec = await RecruitmentStageTemplate.create({
        code: 'STG-EXEC-01',
        name: 'Alur Seleksi Executive & Manajerial',
        description: 'Pipeline seleksi tingkat tinggi untuk posisi Manager, VP, dan General Manager.',
        stages: [
          { id: 's1', name: 'Executive Search & CV Screening', order: 1, description: 'Kurasi rekam jejak kepemimpinan.' },
          { id: 's2', name: 'Wawancara Head of People / HR Director', order: 2, description: 'Evaluasi visi kepemimpinan dan kesesuaian organisasi.' },
          { id: 's3', name: 'Wawancara Direksi (BOD Interview)', order: 3, description: 'Wawancara strategi bisnis dengan C-Level.' },
          { id: 's4', name: 'Background Check & Offering', order: 4, description: 'Verifikasi referensi profesional dan penawaran eksekutif.' }
        ],
        isActive: true
      });
      console.log('[Recruitment Seed] Stage templates created.');
    } else {
      stageTech = await RecruitmentStageTemplate.findOne({ where: { code: 'STG-TECH-01' } });
      stageGeneral = await RecruitmentStageTemplate.findOne({ where: { code: 'STG-GEN-01' } });
      stageExec = await RecruitmentStageTemplate.findOne({ where: { code: 'STG-EXEC-01' } });
    }

    // 3. Seed Job Vacancies
    const countVac = await JobVacancy.count();
    let vacTech, vacHr, vacSales;

    if (countVac === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const nextTwoMonths = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);

      vacTech = await JobVacancy.create({
        code: 'VAC-2026-001',
        title: 'Senior Frontend Engineer (React / Next.js / WAS)',
        department: 'Technology & Digital Innovation',
        division: 'Software Engineering',
        position: 'Senior Software Engineer',
        jobLevel: 'Senior Staff / Specialist',
        workLocation: 'Hybrid',
        employmentType: 'Tetap (PKWTT)',
        description: 'Kami mencari Senior Frontend Engineer berpengalaman untuk mengembangkan antarmuka aplikasi web perusahaan kelas enterprise berbasis arsitektur modular modern.\n\nTanggung Jawab:\n- Mengembangkan komponen web performa tinggi dengan Vanilla CSS & arsitektur state responsif.\n- Berkolaborasi dengan tim backend dalam integrasi RESTful microservices.\n- Memastikan kepatuhan terhadap standar visual sistem desain perusahaan.',
        startDate: today,
        endDate: nextTwoMonths,
        status: 'ACTIVE',
        stageTemplateId: stageTech ? stageTech.id : null,
        stages: stageTech ? stageTech.stages : [],
        isActive: true
      });

      vacHr = await JobVacancy.create({
        code: 'VAC-2026-002',
        title: 'Talent Acquisition & People Operations Specialist',
        department: 'Human Capital & General Affairs',
        division: 'Talent Acquisition & Learning',
        position: 'Talent Acquisition Officer',
        jobLevel: 'Staff / Entry Level',
        workLocation: 'Kantor Pusat',
        employmentType: 'Tetap (PKWTT)',
        description: 'Mengelola siklus lengkap rekrutmen talenta terbaik mulai dari job posting, sourcing, seleksi tes & wawancara, hingga proses onboarding karyawan baru di seluruh divisi.',
        startDate: today,
        endDate: nextMonth,
        status: 'ACTIVE',
        stageTemplateId: stageGeneral ? stageGeneral.id : null,
        stages: stageGeneral ? stageGeneral.stages : [],
        isActive: true
      });

      vacSales = await JobVacancy.create({
        code: 'VAC-2026-003',
        title: 'B2B Corporate Account Executive',
        department: 'Sales, Marketing & Commercial',
        division: 'B2B Enterprise Sales',
        position: 'B2B Account Executive',
        jobLevel: 'Staff / Entry Level',
        workLocation: 'Hybrid',
        employmentType: 'Kontrak (PKWT)',
        description: 'Bertanggung jawab memperluas akuisisi klien korporasi, mengelola portofolio akun enterprise, dan menyusun proposal solusi teknologi bisnis Wiseape.',
        startDate: today,
        endDate: nextMonth,
        status: 'ACTIVE',
        stageTemplateId: stageGeneral ? stageGeneral.id : null,
        stages: stageGeneral ? stageGeneral.stages : [],
        isActive: true
      });
      console.log('[Recruitment Seed] Job vacancies created.');
    } else {
      vacTech = await JobVacancy.findOne({ where: { code: 'VAC-2026-001' } });
      vacHr = await JobVacancy.findOne({ where: { code: 'VAC-2026-002' } });
      vacSales = await JobVacancy.findOne({ where: { code: 'VAC-2026-003' } });
    }

    // 4. Seed Applicants & Processes
    const countApplicants = await JobApplicant.count();
    if (countApplicants === 0 && vacTech) {
      // Applicant 1: Rian Pratama (Ongoing Tech)
      const app1 = await JobApplicant.create({
        jobVacancyId: vacTech.id,
        applicantNumber: 'APP-2026-0001',
        fullName: 'Rian Pratama, S.Kom.',
        email: 'rian.pratama@example.com',
        phone: '081299887766',
        gender: 'Laki-laki',
        birthDate: '1995-04-12',
        lastEducation: 'S1',
        major: 'Teknik Informatika',
        currentCompany: 'PT Inovasi Digital Nusantara',
        currentPosition: 'Frontend Engineer',
        expectedSalary: 16500000,
        status: 'IN_PROCESS',
        appliedDate: '2026-03-01',
        notes: 'Memiliki 5 tahun pengalaman web frontend modern, portfolio GitHub aktif dan sangat rapi.'
      });

      // Stages for App 1
      await ApplicantProcess.create({
        applicantId: app1.id,
        jobVacancyId: vacTech.id,
        stageName: 'Screening CV & Portofolio',
        stageOrder: 1,
        status: 'Done',
        scheduledDate: '2026-03-03',
        interviewerName: 'Nur Aisyah (HR Specialist)',
        result: 'PASSED',
        overallScore: 90.0,
        comments: 'Pengalaman sangat relevan dengan kebutuhan tech stack tim Software Engineering.'
      });

      await ApplicantProcess.create({
        applicantId: app1.id,
        jobVacancyId: vacTech.id,
        stageName: 'Tes Praktik / Coding Challenge',
        stageOrder: 2,
        status: 'Done',
        scheduledDate: '2026-03-07',
        interviewerName: 'Hendra Gunawan (Engineering Manager)',
        result: 'PASSED',
        overallScore: 87.5,
        matrixTemplateId: matrixTest ? matrixTest.id : null,
        evaluationMatrix: [
          { criterion: 'Kebenaran Hasil & Output Logika', weight: 35, score: 90, maxScore: 100, notes: 'Semua test cases terlewati tanpa kendala.' },
          { criterion: 'Efisiensi Waktu & Struktur Solusi', weight: 25, score: 85, maxScore: 100, notes: 'Kompleksitas O(n), implementasi bersih.' },
          { criterion: 'Standar Dokumentasi & Kerapian', weight: 20, score: 85, maxScore: 100, notes: 'Jelas dan mudah dipahami.' },
          { criterion: 'Penanganan Edge Cases & Batasan Masalah', weight: 20, score: 90, maxScore: 100, notes: 'Validasi input sangat lengkap.' }
        ],
        comments: 'Menyelesaikan tantangan coding tepat waktu dengan arsitektur modular yang solid.'
      });

      await ApplicantProcess.create({
        applicantId: app1.id,
        jobVacancyId: vacTech.id,
        stageName: 'Wawancara HRD & Budaya Kerja',
        stageOrder: 3,
        status: 'Done',
        scheduledDate: '2026-03-12',
        interviewerName: 'Wahyu Ramadhan (HR Manager)',
        result: 'PASSED',
        overallScore: 84.0,
        matrixTemplateId: matrixHrd ? matrixHrd.id : null,
        evaluationMatrix: [
          { criterion: 'Komunikasi & Artikulasi Ide', weight: 20, score: 85, maxScore: 100, notes: 'Komunikasi terstruktur dan lugas.' },
          { criterion: 'Culture Fit & Nilai Budaya Perusahaan', weight: 25, score: 85, maxScore: 100, notes: 'Sangat cocok dengan kultur agile Wiseape.' },
          { criterion: 'Motivasi & Komitmen Jangka Panjang', weight: 20, score: 80, maxScore: 100, notes: 'Memiliki visi pengembangan diri yang jelas.' },
          { criterion: 'Kolaborasi & Kerjasama Tim', weight: 20, score: 85, maxScore: 100, notes: 'Pengalaman cross-functional kuat.' },
          { criterion: 'Resiliensi & Manajemen Stres', weight: 15, score: 85, maxScore: 100, notes: 'Terbiasa dengan deadline dinamis.' }
        ],
        comments: 'Karakteristik sangat positif dan komunikatif, direkomendasikan lanjut ke user.'
      });

      await ApplicantProcess.create({
        applicantId: app1.id,
        jobVacancyId: vacTech.id,
        stageName: 'Wawancara User & Tech Lead',
        stageOrder: 4,
        status: 'Ongoing',
        scheduledDate: '2026-03-20',
        interviewerName: 'Dian Permatasari (Lead Software Engineer)',
        result: 'PENDING',
        overallScore: null,
        matrixTemplateId: matrixUser ? matrixUser.id : null,
        comments: 'Sesi wawancara teknis dan diskusi arsitektur sistem dijadwalkan via video call.'
      });

      await ApplicantProcess.create({
        applicantId: app1.id,
        jobVacancyId: vacTech.id,
        stageName: 'Offering Letter & Negosiasi',
        stageOrder: 5,
        status: 'Not Starting',
        result: 'PENDING',
        comments: 'Menunggu hasil wawancara user.'
      });

      // Applicant 2: Nadia Safitri (HR Vacancy)
      if (vacHr) {
        const app2 = await JobApplicant.create({
          jobVacancyId: vacHr.id,
          applicantNumber: 'APP-2026-0002',
          fullName: 'Nadia Safitri, S.Psi.',
          email: 'nadia.safitri@example.com',
          phone: '081377665544',
          gender: 'Perempuan',
          birthDate: '1997-09-18',
          lastEducation: 'S1',
          major: 'Psikologi',
          currentCompany: 'PT Megah Daya Insani',
          currentPosition: 'Junior Recruiter',
          expectedSalary: 9500000,
          status: 'IN_PROCESS',
          appliedDate: '2026-03-05',
          notes: 'Lulusan Psikologi dengan sertifikasi alat tes psikologi dan pengalaman sourcing LinkedIn.'
        });

        await ApplicantProcess.create({
          applicantId: app2.id,
          jobVacancyId: vacHr.id,
          stageName: 'Screening CV & Berkas',
          stageOrder: 1,
          status: 'Done',
          scheduledDate: '2026-03-06',
          interviewerName: 'Kevin Hartanto',
          result: 'PASSED',
          overallScore: 88.0,
          comments: 'Berkas lengkap dan sesuai kualifikasi.'
        });

        await ApplicantProcess.create({
          applicantId: app2.id,
          jobVacancyId: vacHr.id,
          stageName: 'Psikotes & Uji Kemampuan Umum',
          stageOrder: 2,
          status: 'Done',
          scheduledDate: '2026-03-10',
          interviewerName: 'Tim Psikologi',
          result: 'PASSED',
          overallScore: 82.0,
          comments: 'Hasil psikotes optimal.'
        });

        await ApplicantProcess.create({
          applicantId: app2.id,
          jobVacancyId: vacHr.id,
          stageName: 'Wawancara HRD',
          stageOrder: 3,
          status: 'Ongoing',
          scheduledDate: '2026-03-18',
          interviewerName: 'Wahyu Ramadhan',
          result: 'PENDING',
          comments: 'Jadwal wawancara mendalam kompetensi rekrutmen.'
        });

        await ApplicantProcess.create({
          applicantId: app2.id,
          jobVacancyId: vacHr.id,
          stageName: 'Wawancara User / Manager',
          stageOrder: 4,
          status: 'Not Starting',
          result: 'PENDING'
        });

        await ApplicantProcess.create({
          applicantId: app2.id,
          jobVacancyId: vacHr.id,
          stageName: 'Offering Letter',
          stageOrder: 5,
          status: 'Not Starting',
          result: 'PENDING'
        });
      }

      console.log('[Recruitment Seed] Sample applicants and processes created.');
    }

    console.log('[Recruitment Seed] Seeding completed successfully!');
  } catch (err) {
    console.error('[Recruitment Seed] Error during seeding:', err);
  }
}

module.exports = { seedRecruitmentData };

if (require.main === module) {
  sequelize.sync({ alter: true }).then(() => {
    seedRecruitmentData().then(() => {
      console.log('[Recruitment Seed] Done. Exiting.');
      process.exit(0);
    });
  });
}
