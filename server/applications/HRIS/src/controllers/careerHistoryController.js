const { CareerHistory, Employee, sequelize } = require('../models');
const {
  success,
  created,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * List all internal career history of an employee
 * GET /api/employees/:employeeId/career-history
 */
exports.listByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { changeType } = req.query;

    const where = { employeeId };
    if (changeType) {
      where.changeType = changeType;
    }

    const histories = await CareerHistory.findAll({
      where,
      order: [['effectiveDate', 'DESC'], ['createdAt', 'DESC']]
    });

    return success(res, histories, 'Riwayat karir & organisasi internal berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get single career history entry by ID
 * GET /api/career-history/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await CareerHistory.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'nik', 'fullName', 'department', 'jobTitle']
        }
      ]
    });

    if (!item) {
      return notFound(res, `Data riwayat karir dengan ID ${id} tidak ditemukan`);
    }

    return success(res, item, 'Detail riwayat karir berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Add career history entry (optionally updates current employee job/salary if applyToEmployee=true)
 * POST /api/employees/:employeeId/career-history
 */
exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { employeeId } = req.params;
    const {
      changeType,
      effectiveDate,
      previousJobTitle,
      newJobTitle,
      previousDepartment,
      newDepartment,
      previousSalary,
      newSalary,
      referenceNumber,
      notes,
      applyToEmployee = false
    } = req.body;

    const employee = await Employee.findByPk(employeeId, { transaction });
    if (!employee) {
      await transaction.rollback();
      return notFound(res, `Karyawan dengan ID ${employeeId} tidak ditemukan`);
    }

    if (!changeType || !effectiveDate) {
      await transaction.rollback();
      return badRequest(res, 'Jenis perubahan (changeType) dan tanggal efektif (effectiveDate) wajib diisi');
    }

    const career = await CareerHistory.create(
      {
        employeeId,
        changeType,
        effectiveDate,
        previousJobTitle: previousJobTitle || employee.jobTitle,
        newJobTitle: newJobTitle || employee.jobTitle,
        previousDepartment: previousDepartment || employee.department,
        newDepartment: newDepartment || employee.department,
        previousSalary: previousSalary || employee.basicSalary,
        newSalary: newSalary !== undefined ? newSalary : employee.basicSalary,
        referenceNumber,
        notes
      },
      { transaction }
    );

    // If applyToEmployee is true, update the employee's current state
    if (applyToEmployee === true || applyToEmployee === 'true') {
      const updates = {};
      if (newJobTitle) updates.jobTitle = newJobTitle;
      if (newDepartment) updates.department = newDepartment;
      if (newSalary !== undefined) updates.basicSalary = newSalary;

      if (Object.keys(updates).length > 0) {
        await employee.update(updates, { transaction });
      }
    }

    await transaction.commit();

    return created(res, career, 'Riwayat karir berhasil ditambahkan');
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * Update career history
 * PUT /api/career-history/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const career = await CareerHistory.findByPk(id);

    if (!career) {
      return notFound(res, `Data riwayat karir dengan ID ${id} tidak ditemukan`);
    }

    await career.update(req.body);

    return success(res, career, 'Data riwayat karir berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete career history
 * DELETE /api/career-history/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const career = await CareerHistory.findByPk(id);

    if (!career) {
      return notFound(res, `Data riwayat karir dengan ID ${id} tidak ditemukan`);
    }

    await career.destroy();

    return success(res, null, 'Data riwayat karir berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
