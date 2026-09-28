const { app } = require('../../app');
const { sequelize } = require('../models');

async function runTests() {
  console.log('[HRIS Tests] Starting automated API integration tests...');

  // Start server on random ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`[HRIS Tests] Test server running at ${baseUrl}`);

  let testEmployeeId = null;

  try {
    // Test 1: Service Root & Health
    console.log('\n--- Test 1: GET /api (Service Information) ---');
    const resRoot = await fetch(`${baseUrl}`);
    const rootData = await resRoot.json();
    console.log(`Status: ${resRoot.status} | Service: ${rootData.service} | Status: ${rootData.status}`);
    if (resRoot.status !== 200 || rootData.status !== 'ONLINE') {
      throw new Error('Test 1 failed: Service root not returning 200 ONLINE');
    }

    // Test 2: Employees List (findAll)
    console.log('\n--- Test 2: GET /api/employees (Find All) ---');
    const resList = await fetch(`${baseUrl}/employees?page=1&limit=5`);
    const listData = await resList.json();
    console.log(`Status: ${resList.status} | Total Records: ${listData.meta?.total} | Returned: ${listData.data?.length}`);
    if (resList.status !== 200 || !Array.isArray(listData.data)) {
      throw new Error('Test 2 failed: findAll did not return array data');
    }

    // Test 3: Employees Statistics
    console.log('\n--- Test 3: GET /api/employees/statistics (Dashboard stats) ---');
    const resStats = await fetch(`${baseUrl}/employees/statistics`);
    const statsData = await resStats.json();
    console.log(`Status: ${resStats.status} | Total: ${statsData.data?.totalEmployees} | Active: ${statsData.data?.activeEmployees}`);
    if (resStats.status !== 200 || statsData.data?.totalEmployees === undefined) {
      throw new Error('Test 3 failed: Statistics endpoint failed');
    }

    // Test 4: Get Employee by ID with nested details
    console.log('\n--- Test 4: GET /api/employees/1 (Get by ID with all relations) ---');
    const resGetOne = await fetch(`${baseUrl}/employees/1`);
    const getOneData = await resGetOne.json();
    const emp = getOneData.data;
    console.log(`Status: ${resGetOne.status} | Found: ${emp?.fullName} (${emp?.nik})`);
    console.log(`- Tenure: ${emp?.tenure?.formatted}`);
    console.log(`- Total Salary: Rp ${emp?.totalSalary?.toLocaleString('id-ID')}`);
    console.log(`- Documents: ${emp?.documents?.length}`);
    console.log(`- Work Experiences: ${emp?.workExperiences?.length}`);
    console.log(`- Education Histories: ${emp?.educationHistories?.length}`);
    if (resGetOne.status !== 200 || !emp) {
      throw new Error('Test 4 failed: Failed to get employee by ID');
    }

    // Test 5: Create New Employee with nested details
    console.log('\n--- Test 5: POST /api/employees (Create Employee with nested records) ---');
    const newEmpPayload = {
      fullName: 'Muhammad Fadhil Pratama',
      nickname: 'Fadhil',
      birthPlace: 'Surabaya',
      birthDate: '1998-05-14',
      gender: 'Laki-laki',
      religion: 'Islam',
      currentAddress: 'Jl. Margonda Raya No. 100, Depok',
      idCardAddress: 'Jl. Raya Darmo No. 45, Surabaya',
      phoneNumber: '081234567899',
      personalEmail: 'fadhil.pratama@example.com',
      emergencyContactName: 'Hj. Siti Aminah',
      emergencyContactRelation: 'Ibu Kandung',
      emergencyContactPhone: '081299887766',

      nik: 'EMP-2024-099',
      jobTitle: 'Junior Frontend Developer',
      jobLevel: 'Staff',
      department: 'Technology',
      division: 'Frontend Team',
      employmentStatus: 'Kontrak/PKWT',
      joinDate: '2024-02-01',
      workLocation: 'Remote',

      bankName: 'BCA',
      bankAccountNumber: '6041928374',
      bankAccountHolder: 'Muhammad Fadhil Pratama',
      basicSalary: 8500000,
      allowancePosition: 500000,
      allowanceTransport: 1000000,
      allowanceMeal: 800000,
      taxStatus: 'TK/0',
      npwp: '31.234.567.8-041.000',
      bpjsKesehatan: '0004567891234',
      bpjsKetenagakerjaan: '22038475619',

      workExperiences: [
        {
          companyName: 'PT Digital Solusindo Studio',
          position: 'Web Developer Intern',
          startDate: '2023-03-01',
          endDate: '2023-09-30',
          description: 'Mengembangkan frontend landing page dan dashboard admin Vue.js.'
        }
      ],
      educationHistories: [
        {
          institutionName: 'Institut Teknologi Sepuluh Nopember (ITS)',
          degree: 'S1',
          major: 'Sistem Informasi',
          startDate: '2019-08-01',
          graduationDate: '2023-09-15',
          gpa: 3.68,
          description: 'Skripsi mengenai perancangan arsitektur antarmuka berbasis micro-frontend.'
        }
      ]
    };

    const resCreate = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEmpPayload)
    });
    const createData = await resCreate.json();
    console.log(`Status: ${resCreate.status} | Created ID: ${createData.data?.id} | Name: ${createData.data?.fullName}`);
    if (resCreate.status !== 201 || !createData.data?.id) {
      throw new Error(`Test 5 failed: Create employee failed: ${JSON.stringify(createData)}`);
    }
    testEmployeeId = createData.data.id;

    // Test 6: Update Employee Information
    console.log(`\n--- Test 6: PUT /api/employees/${testEmployeeId} (Update Employee) ---`);
    const updatePayload = {
      jobTitle: 'Frontend Engineer (Promoted)',
      basicSalary: 9500000,
      allowancePosition: 1000000
    };
    const resUpdate = await fetch(`${baseUrl}/employees/${testEmployeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const updateData = await resUpdate.json();
    console.log(`Status: ${resUpdate.status} | Updated Title: ${updateData.data?.jobTitle} | New Basic: Rp ${updateData.data?.basicSalary}`);
    if (resUpdate.status !== 200 || updateData.data?.jobTitle !== updatePayload.jobTitle) {
      throw new Error('Test 6 failed: Update employee failed');
    }

    // Test 7: Add Career History
    console.log(`\n--- Test 7: POST /api/employees/${testEmployeeId}/career-history ---`);
    const careerPayload = {
      changeType: 'Promosi',
      effectiveDate: '2024-08-01',
      previousJobTitle: 'Junior Frontend Developer',
      newJobTitle: 'Frontend Engineer',
      previousSalary: 8500000,
      newSalary: 9500000,
      notes: 'Penilaian kinerja luar biasa dalam masa percobaan (probation).'
    };
    const resCareer = await fetch(`${baseUrl}/employees/${testEmployeeId}/career-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(careerPayload)
    });
    const careerData = await resCareer.json();
    console.log(`Status: ${resCareer.status} | Career Record ID: ${careerData.data?.id} | Type: ${careerData.data?.changeType}`);
    if (resCareer.status !== 201) {
      throw new Error('Test 7 failed: Create career history failed');
    }

    // Test 8: Deactivate Employee
    console.log(`\n--- Test 8: PATCH /api/employees/${testEmployeeId}/deactivate ---`);
    const resDeact = await fetch(`${baseUrl}/employees/${testEmployeeId}/deactivate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Cuti',
        reason: 'Mengambil cuti di luar tanggungan untuk melanjutkan studi'
      })
    });
    const deactData = await resDeact.json();
    console.log(`Status: ${resDeact.status} | Is Active: ${deactData.data?.isActive} | Status: ${deactData.data?.status}`);
    if (resDeact.status !== 200 || deactData.data?.isActive !== false) {
      throw new Error('Test 8 failed: Deactivate failed');
    }

    // Test 9: Reactivate Employee
    console.log(`\n--- Test 9: PATCH /api/employees/${testEmployeeId}/activate ---`);
    const resAct = await fetch(`${baseUrl}/employees/${testEmployeeId}/activate`, {
      method: 'PATCH'
    });
    const actData = await resAct.json();
    console.log(`Status: ${resAct.status} | Is Active: ${actData.data?.isActive} | Status: ${actData.data?.status}`);
    if (resAct.status !== 200 || actData.data?.isActive !== true) {
      throw new Error('Test 9 failed: Reactivate failed');
    }

    // Test 10: Delete Employee (Soft-delete & Hard-delete)
    console.log(`\n--- Test 10: DELETE /api/employees/${testEmployeeId}?force=true ---`);
    const resDel = await fetch(`${baseUrl}/employees/${testEmployeeId}?force=true`, {
      method: 'DELETE'
    });
    const delData = await resDel.json();
    console.log(`Status: ${resDel.status} | Message: ${delData.message}`);
    if (resDel.status !== 200) {
      throw new Error('Test 10 failed: Delete employee failed');
    }

    console.log('\n=============================================');
    console.log(' ALL 10 REST API TESTS PASSED SUCCESSFULLY! ');
    console.log('=============================================\n');

    server.close();
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('\n[HRIS Tests] Test failed with error:', err);
    server.close();
    await sequelize.close();
    process.exit(1);
  }
}

runTests();
