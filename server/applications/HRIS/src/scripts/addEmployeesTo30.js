const { sequelize, Employee } = require('../models');

// Additive seed: tops up the employees table to 30 rows without touching
// existing records (unlike seed.js, which wipes everything first).
const CANDIDATES = [
  ['Agus Setiawan', 'Agus', 'Laki-laki', 'Surabaya', '1988-02-10', 'Islam', 'Technical Lead', 'Team Lead / Officer', 'Technology & Digital Innovation', 'Software Engineering', 'Tetap (PKWTT)', '2019-05-02', 'Hybrid', 16000000],
  ['Siti Nurhaliza', 'Siti', 'Perempuan', 'Medan', '1992-07-19', 'Islam', 'Software Engineer', 'Staff / Entry Level', 'Technology & Digital Innovation', 'Software Engineering', 'Tetap (PKWTT)', '2021-02-15', 'Hybrid', 13000000],
  ['Made Wirawan', 'Made', 'Laki-laki', 'Denpasar', '1990-11-03', 'Hindu', 'QA Automation Engineer', 'Staff / Entry Level', 'Technology & Digital Innovation', 'Quality Assurance & Security', 'Tetap (PKWTT)', '2020-09-01', 'Kantor Pusat', 11500000],
  ['Fitriani Rahmawati', 'Fitri', 'Perempuan', 'Malang', '1995-03-27', 'Islam', 'DevOps & Cloud Engineer', 'Senior Staff / Specialist', 'Technology & Digital Innovation', 'Cloud Infrastructure & DevOps', 'Tetap (PKWTT)', '2022-01-10', 'Remote', 17000000],
  ['Yohanes Pratama', 'Yohanes', 'Laki-laki', 'Manado', '1993-06-14', 'Kristen', 'UI/UX Product Designer', 'Senior Staff / Specialist', 'Technology & Digital Innovation', 'Product Management & UI/UX', 'Tetap (PKWTT)', '2021-08-16', 'Kantor Pusat', 12500000],
  ['Rina Kusumawardani', 'Rina', 'Perempuan', 'Semarang', '1997-09-05', 'Islam', 'DevOps & Cloud Engineer', 'Staff / Entry Level', 'Technology & Digital Innovation', 'Cloud Infrastructure & DevOps', 'Kontrak (PKWT)', '2023-04-03', 'Kantor Pusat', 7500000],
  ['Hendra Gunawan', 'Hendra', 'Laki-laki', 'Palembang', '1987-12-22', 'Buddha', 'Engineering Manager', 'Manager', 'Technology & Digital Innovation', 'Software Engineering', 'Tetap (PKWTT)', '2018-03-19', 'Kantor Pusat', 26000000],
  ['Dian Permatasari', 'Dian', 'Perempuan', 'Jakarta', '1994-01-30', 'Islam', 'Senior Software Engineer', 'Senior Staff / Specialist', 'Technology & Digital Innovation', 'Software Engineering', 'Tetap (PKWTT)', '2021-11-08', 'Hybrid', 15500000],
  ['Bagus Kurniawan', 'Bagus', 'Laki-laki', 'Yogyakarta', '1996-04-17', 'Islam', 'Software Engineer', 'Staff / Entry Level', 'Technology & Digital Innovation', 'Software Engineering', 'Tetap (PKWTT)', '2022-06-20', 'Hybrid', 13500000],

  ['Nur Aisyah', 'Aisyah', 'Perempuan', 'Bandung', '1991-05-08', 'Islam', 'HR Generalist Specialist', 'Senior Staff / Specialist', 'Human Capital & General Affairs', 'People Operations & HR', 'Tetap (PKWTT)', '2020-02-17', 'Kantor Pusat', 12000000],
  ['Kevin Hartanto', 'Kevin', 'Laki-laki', 'Jakarta', '1993-10-25', 'Kristen', 'Talent Acquisition Officer', 'Staff / Entry Level', 'Human Capital & General Affairs', 'Talent Acquisition & Learning', 'Tetap (PKWTT)', '2022-07-04', 'Kantor Pusat', 9500000],
  ['Ayu Lestari', 'Ayu', 'Perempuan', 'Solo', '1998-08-12', 'Islam', 'HR Generalist Specialist', 'Staff / Entry Level', 'Human Capital & General Affairs', 'People Operations & HR', 'Kontrak (PKWT)', '2023-09-11', 'Kantor Pusat', 8500000],
  ['Wahyu Ramadhan', 'Wahyu', 'Laki-laki', 'Makassar', '1989-02-28', 'Islam', 'HR & People Operations Manager', 'Manager', 'Human Capital & General Affairs', 'People Operations & HR', 'Tetap (PKWTT)', '2019-10-14', 'Kantor Pusat', 15000000],

  ['Lukas Simanjuntak', 'Lukas', 'Laki-laki', 'Medan', '1990-06-01', 'Kristen', 'Finance & Treasury Manager', 'Senior Staff / Specialist', 'Finance, Tax & Accounting', 'Finance & Treasury', 'Tetap (PKWTT)', '2020-05-11', 'Kantor Pusat', 14500000],
  ['Melati Anggraini', 'Melati', 'Perempuan', 'Surabaya', '1995-12-09', 'Islam', 'Senior Accountant', 'Staff / Entry Level', 'Finance, Tax & Accounting', 'Accounting & Tax Compliance', 'Tetap (PKWTT)', '2021-04-19', 'Kantor Pusat', 10500000],
  ['Fajar Nugroho', 'Fajar', 'Laki-laki', 'Semarang', '1988-09-16', 'Islam', 'Tax Compliance Specialist', 'Senior Staff / Specialist', 'Finance, Tax & Accounting', 'Accounting & Tax Compliance', 'Tetap (PKWTT)', '2020-11-02', 'Kantor Pusat', 11000000],
  ['Christina Wijaya', 'Christina', 'Perempuan', 'Jakarta', '1992-03-21', 'Katolik', 'Finance & Treasury Manager', 'Senior Staff / Specialist', 'Finance, Tax & Accounting', 'Finance & Treasury', 'Tetap (PKWTT)', '2019-08-26', 'Kantor Pusat', 14000000],
  ['Rizky Firmansyah', 'Rizky', 'Laki-laki', 'Bekasi', '1994-07-07', 'Islam', 'Finance & Treasury Manager', 'Manager', 'Finance, Tax & Accounting', 'Finance & Treasury', 'Tetap (PKWTT)', '2018-06-04', 'Kantor Pusat', 24000000],

  ['Putri Ramadhani', 'Putri', 'Perempuan', 'Depok', '1996-10-30', 'Islam', 'Digital Marketing Specialist', 'Staff / Entry Level', 'Sales, Marketing & Commercial', 'Digital Marketing & Branding', 'Tetap (PKWTT)', '2022-03-07', 'Hybrid', 11000000],
  ['Bayu Aditya', 'Bayu', 'Laki-laki', 'Bogor', '1993-01-13', 'Islam', 'Digital Marketing Specialist', 'Staff / Entry Level', 'Sales, Marketing & Commercial', 'Digital Marketing & Branding', 'Kontrak (PKWT)', '2023-02-20', 'Hybrid', 8500000],
  ['Clara Angelina', 'Clara', 'Perempuan', 'Manado', '1991-04-04', 'Kristen', 'Digital Marketing Specialist', 'Senior Staff / Specialist', 'Sales, Marketing & Commercial', 'Digital Marketing & Branding', 'Tetap (PKWTT)', '2020-07-13', 'Kantor Pusat', 13000000],

  ['Doni Saputra', 'Doni', 'Laki-laki', 'Palembang', '1990-08-19', 'Islam', 'B2B Account Executive', 'Staff / Entry Level', 'Sales, Marketing & Commercial', 'B2B Enterprise Sales', 'Tetap (PKWTT)', '2021-05-24', 'Hybrid', 10500000],
  ['Yulia Anggraeni', 'Yulia', 'Perempuan', 'Jakarta', '1989-11-11', 'Islam', 'B2B Account Executive', 'Manager', 'Sales, Marketing & Commercial', 'B2B Enterprise Sales', 'Tetap (PKWTT)', '2017-09-18', 'Kantor Pusat', 23000000],
  ['Reza Firdaus', 'Reza', 'Laki-laki', 'Bandung', '1997-02-02', 'Islam', 'B2B Account Executive', 'Staff / Entry Level', 'Sales, Marketing & Commercial', 'B2B Enterprise Sales', 'Magang (Internship)', '2024-01-08', 'Kantor Pusat', 4500000],

  ['Indra Kusuma', 'Indra', 'Laki-laki', 'Cirebon', '1986-05-23', 'Islam', 'General Affairs Officer', 'Senior Staff / Specialist', 'Human Capital & General Affairs', 'General Affairs & Facilities', 'Tetap (PKWTT)', '2018-12-03', 'Kantor Pusat', 13500000],
  ['Sri Wahyuningsih', 'Sri', 'Perempuan', 'Yogyakarta', '1992-09-27', 'Islam', 'Logistics Supervisor', 'Supervisor', 'Operations & Customer Experience', 'Supply Chain & Logistics', 'Tetap (PKWTT)', '2021-10-05', 'Kantor Pusat', 11500000],

  ['Gunawan Santoso', 'Gunawan', 'Laki-laki', 'Jakarta', '1985-03-15', 'Konghucu', 'Customer Support Specialist', 'Senior Staff / Specialist', 'Operations & Customer Experience', 'Customer Support & Success', 'Tetap (PKWTT)', '2019-01-21', 'Kantor Pusat', 16500000],

  ['Amanda Puspita', 'Amanda', 'Perempuan', 'Jakarta', '1995-06-06', 'Islam', 'UI/UX Product Designer', 'Senior Staff / Specialist', 'Technology & Digital Innovation', 'Product Management & UI/UX', 'Tetap (PKWTT)', '2021-03-15', 'Hybrid', 19000000],
  ['Fikri Hidayat', 'Fikri', 'Laki-laki', 'Bandung', '1998-12-01', 'Islam', 'UI/UX Product Designer', 'Staff / Entry Level', 'Technology & Digital Innovation', 'Product Management & UI/UX', 'Kontrak (PKWT)', '2023-07-17', 'Remote', 9500000]
];

async function run() {
  await sequelize.authenticate();

  const target = 30;
  const currentCount = await Employee.count();
  console.log(`[HRIS Seeder] Current employee count: ${currentCount}`);

  if (currentCount >= target) {
    console.log(`[HRIS Seeder] Already at or above ${target} employees. Nothing to do.`);
    process.exit(0);
  }

  const needed = target - currentCount;
  const picks = CANDIDATES.slice(0, needed);

  const existingNiks = new Set((await Employee.findAll({ attributes: ['nik'] })).map((e) => e.nik));
  const usedInThisBatch = new Set();

  const rows = picks.map(([
    fullName, nickname, gender, birthPlace, birthDate, religion,
    jobTitle, jobLevel, department, division, employmentStatus, joinDate,
    workLocation, basicSalary
  ]) => {
    const joinYear = joinDate.slice(0, 4);
    let seq = 100;
    let nik = `EMP-${joinYear}-${seq}`;
    while (existingNiks.has(nik) || usedInThisBatch.has(nik)) {
      seq += 1;
      nik = `EMP-${joinYear}-${seq}`;
    }
    usedInThisBatch.add(nik);

    const slug = nickname.toLowerCase().replace(/[^a-z]/g, '');

    return {
      fullName,
      nickname,
      birthPlace,
      birthDate,
      gender,
      religion,
      phoneNumber: `08${Math.floor(1000000000 + Math.random() * 899999999)}`,
      personalEmail: `${slug}.${slug}@example.com`,
      nik,
      jobTitle,
      jobLevel,
      department,
      division,
      employmentStatus,
      joinDate,
      workLocation,
      isActive: true,
      status: 'Aktif',
      bankName: ['BCA', 'Bank Mandiri', 'BNI', 'BRI'][Math.floor(Math.random() * 4)],
      bankAccountNumber: String(Math.floor(1000000000 + Math.random() * 8999999999)),
      bankAccountHolder: fullName,
      basicSalary,
      allowancePosition: jobLevel === 'Manager' ? 3000000 : jobLevel === 'Supervisor' ? 1500000 : 500000,
      allowanceTransport: 1000000,
      allowanceMeal: 1000000,
      allowanceOther: 0,
      taxStatus: 'TK/0'
    };
  });

  const transaction = await sequelize.transaction();
  try {
    await Employee.bulkCreate(rows, { transaction, validate: true });
    await transaction.commit();
    console.log(`[HRIS Seeder] Added ${rows.length} employees. Total should now be ${currentCount + rows.length}.`);
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('[HRIS Seeder] Failed to add employees:', err);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[HRIS Seeder] Unexpected error:', err);
  process.exit(1);
});
