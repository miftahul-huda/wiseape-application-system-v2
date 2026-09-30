const { Op } = require('sequelize');
const {
  sequelize,
  Employee,
  EmployeeDocument,
  WorkExperience,
  EducationHistory,
  CareerHistory,
  EmployeeFamily
} = require('../models');
const {
  success,
  created,
  error,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * Get all employees with pagination, search, filters, and sorting
 * GET /api/employees
 */
exports.findAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      jobTitle,
      jobLevel,
      employmentStatus,
      workLocation,
      isActive,
      status,
      sortBy = 'id',
      sortOrder = 'ASC',
      withDetails = false
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    // Search keyword across full name, nickname, NIK, phone, email
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { nickname: { [Op.iLike]: `%${search}%` } },
        { nik: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
        { personalEmail: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { jobTitle: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Specific filters
    if (department) where.department = department;
    if (jobTitle) where.jobTitle = jobTitle;
    if (jobLevel) where.jobLevel = jobLevel;
    if (employmentStatus) where.employmentStatus = employmentStatus;
    if (workLocation) where.workLocation = workLocation;
    if (status) where.status = status;
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Includes
    const include = [];
    if (withDetails === 'true' || withDetails === true) {
      include.push(
        { model: EmployeeDocument, as: 'documents' },
        { model: WorkExperience, as: 'workExperiences' },
        { model: EducationHistory, as: 'educationHistories' },
        { model: CareerHistory, as: 'careerHistories' },
        { model: EmployeeFamily, as: 'familyMembers' },
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'nik', 'fullName', 'jobTitle', 'department']
        }
      );
    } else {
      // Include lightweight manager summary
      include.push({
        model: Employee,
        as: 'manager',
        attributes: ['id', 'nik', 'fullName', 'jobTitle', 'department']
      });
    }

    // Safe sorting column
    const validSortColumns = [
      'id',
      'fullName',
      'nik',
      'jobTitle',
      'department',
      'employmentStatus',
      'joinDate',
      'basicSalary',
      'createdAt',
      'updatedAt'
    ];
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include,
      limit: limitNum,
      offset,
      order: [[orderColumn, orderDirection]],
      distinct: true
    });

    const totalPages = Math.ceil(count / limitNum);

    return success(res, rows, 'Daftar karyawan berhasil diambil', 200, {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get employee statistics for dashboard
 * GET /api/employees/statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.count();
    const activeEmployees = await Employee.count({ where: { isActive: true } });
    const inactiveEmployees = await Employee.count({ where: { isActive: false } });

    // Count by department
    const departmentStats = await Employee.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    // Count by employment status
    const employmentStatusStats = await Employee.findAll({
      attributes: [
        'employmentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['employmentStatus'],
      raw: true
    });

    // Count by job level
    const jobLevelStats = await Employee.findAll({
      attributes: [
        'jobLevel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['jobLevel'],
      raw: true
    });

    return success(res, {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      byDepartment: departmentStats,
      byEmploymentStatus: employmentStatusStats,
      byJobLevel: jobLevelStats
    }, 'Statistik data karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get single employee by ID or NIK with all associated data
 * GET /api/employees/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if queried by numeric ID or NIK
    const isNumericId = /^\d+$/.test(id);
    const whereCondition = isNumericId ? { id: parseInt(id, 10) } : { nik: id };

    const employee = await Employee.findOne({
      where: whereCondition,
      include: [
        {
          model: EmployeeDocument,
          as: 'documents'
        },
        {
          model: WorkExperience,
          as: 'workExperiences',
          order: [['startDate', 'DESC']]
        },
        {
          model: EducationHistory,
          as: 'educationHistories',
          order: [['graduationDate', 'DESC']]
        },
        {
          model: CareerHistory,
          as: 'careerHistories',
          order: [['effectiveDate', 'DESC']]
        },
        {
          model: EmployeeFamily,
          as: 'familyMembers',
          order: [['id', 'ASC']]
        },
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'nik', 'fullName', 'jobTitle', 'department']
        },
        {
          model: Employee,
          as: 'subordinates',
          attributes: ['id', 'nik', 'fullName', 'jobTitle', 'department', 'status']
        }
      ]
    });

    if (!employee) {
      return notFound(res, `Karyawan dengan pengenal '${id}' tidak ditemukan`);
    }

    return success(res, employee, 'Data detail karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new employee (supports nested creation for experiences, education, etc.)
 * POST /api/employees
 */
exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      workExperiences,
      educationHistories,
      careerHistories,
      ...employeeData
    } = req.body;

    if (!employeeData.fullName) {
      await transaction.rollback();
      return badRequest(res, 'Nama lengkap karyawan wajib diisi');
    }

    if (!employeeData.nik) {
      await transaction.rollback();
      return badRequest(res, 'NIK / ID Karyawan wajib diisi');
    }

    // Check duplicate NIK
    const existing = await Employee.findOne({
      where: { nik: employeeData.nik },
      transaction
    });
    if (existing) {
      await transaction.rollback();
      return badRequest(res, `NIK '${employeeData.nik}' sudah terdaftar di sistem`);
    }

    // Create employee
    const newEmployee = await Employee.create(employeeData, { transaction });

    // Nested creation of work experiences if provided
    if (Array.isArray(workExperiences) && workExperiences.length > 0) {
      const expItems = workExperiences.map(item => ({
        ...item,
        employeeId: newEmployee.id
      }));
      await WorkExperience.bulkCreate(expItems, { transaction });
    }

    // Nested creation of education histories if provided
    if (Array.isArray(educationHistories) && educationHistories.length > 0) {
      const eduItems = educationHistories.map(item => ({
        ...item,
        employeeId: newEmployee.id
      }));
      await EducationHistory.bulkCreate(eduItems, { transaction });
    }

    // Nested creation of career histories if provided
    if (Array.isArray(careerHistories) && careerHistories.length > 0) {
      const carItems = careerHistories.map(item => ({
        ...item,
        employeeId: newEmployee.id
      }));
      await CareerHistory.bulkCreate(carItems, { transaction });
    }

    await transaction.commit();

    // Fetch full created employee with relations
    const createdEmployee = await Employee.findByPk(newEmployee.id, {
      include: [
        { model: EmployeeDocument, as: 'documents' },
        { model: WorkExperience, as: 'workExperiences' },
        { model: EducationHistory, as: 'educationHistories' },
        { model: CareerHistory, as: 'careerHistories' }
      ]
    });

    return created(res, createdEmployee, 'Data karyawan baru berhasil ditambahkan');
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * Update employee information
 * PUT /api/employees/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${id} tidak ditemukan`);
    }

    // Check unique NIK if NIK changed
    if (req.body.nik && req.body.nik !== employee.nik) {
      const duplicate = await Employee.findOne({
        where: {
          nik: req.body.nik,
          id: { [Op.ne]: id }
        }
      });
      if (duplicate) {
        return badRequest(res, `NIK '${req.body.nik}' sudah digunakan oleh karyawan lain`);
      }
    }

    // Prevent direct manager cycle (cannot set manager to self)
    if (req.body.managerId && parseInt(req.body.managerId, 10) === parseInt(id, 10)) {
      return badRequest(res, 'Karyawan tidak dapat menjadi atasan untuk dirinya sendiri');
    }

    await employee.update(req.body);

    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: EmployeeDocument, as: 'documents' },
        { model: WorkExperience, as: 'workExperiences' },
        { model: EducationHistory, as: 'educationHistories' },
        { model: CareerHistory, as: 'careerHistories' },
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'nik', 'fullName', 'jobTitle', 'department']
        }
      ]
    });

    return success(res, updatedEmployee, 'Data karyawan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Deactivate employee (Soft status deactivation)
 * PATCH /api/employees/:id/deactivate
 */
exports.deactivate = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason, effectiveDate, status = 'Nonaktif' } = req.body;

    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return notFound(res, `Karyawan dengan ID ${id} tidak ditemukan`);
    }

    const previousStatus = employee.status;

    await employee.update(
      {
        isActive: false,
        status: status,
        endDate: effectiveDate || new Date()
      },
      { transaction }
    );

    // Record deactivation in career history
    await CareerHistory.create(
      {
        employeeId: employee.id,
        changeType: status, // 'Resign', 'PHK', 'Nonaktif', etc.
        effectiveDate: effectiveDate || new Date(),
        previousJobTitle: employee.jobTitle,
        previousDepartment: employee.department,
        notes: reason || `Status kepegawaian dinonaktifkan dari '${previousStatus}' menjadi '${status}'`
      },
      { transaction }
    );

    await transaction.commit();

    return success(res, employee, `Karyawan ${employee.fullName} berhasil dinonaktifkan`);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * Reactivate employee
 * PATCH /api/employees/:id/activate
 */
exports.activate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${id} tidak ditemukan`);
    }

    await employee.update({
      isActive: true,
      status: 'Aktif'
    });

    return success(res, employee, `Karyawan ${employee.fullName} berhasil diaktifkan kembali`);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete employee (Soft delete or hard delete if ?force=true)
 * DELETE /api/employees/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    const employee = await Employee.findByPk(id, { paranoid: false });

    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${id} tidak ditemukan`);
    }

    const isForce = force === 'true' || force === true;
    await employee.destroy({ force: isForce });

    return success(
      res,
      null,
      `Karyawan ${employee.fullName} (${employee.nik}) berhasil ${isForce ? 'dihapus permanen' : 'dihapus (soft-delete)'}`
    );
  } catch (err) {
    next(err);
  }
};
