const { EducationHistory, Employee } = require('../models');
const {
  success,
  created,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * List all education histories of an employee
 * GET /api/employees/:employeeId/education
 */
exports.listByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const education = await EducationHistory.findAll({
      where: { employeeId },
      order: [['graduationDate', 'DESC'], ['startDate', 'DESC']]
    });

    return success(res, education, 'Riwayat pendidikan karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get education history by ID
 * GET /api/education/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await EducationHistory.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'nik', 'fullName', 'department']
        }
      ]
    });

    if (!item) {
      return notFound(res, `Data riwayat pendidikan dengan ID ${id} tidak ditemukan`);
    }

    return success(res, item, 'Detail riwayat pendidikan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Add education history for an employee
 * POST /api/employees/:employeeId/education
 */
exports.create = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      institutionName,
      degree,
      major,
      startDate,
      graduationDate,
      gpa,
      description
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${employeeId} tidak ditemukan`);
    }

    if (!institutionName) {
      return badRequest(res, 'Nama institusi pendidikan wajib diisi');
    }

    const education = await EducationHistory.create({
      employeeId,
      institutionName,
      degree,
      major,
      startDate: startDate || null,
      graduationDate: graduationDate || null,
      gpa: gpa || null,
      description
    });

    return created(res, education, 'Riwayat pendidikan berhasil ditambahkan');
  } catch (err) {
    next(err);
  }
};

/**
 * Update education history
 * PUT /api/education/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const education = await EducationHistory.findByPk(id);

    if (!education) {
      return notFound(res, `Data riwayat pendidikan dengan ID ${id} tidak ditemukan`);
    }

    await education.update(req.body);

    return success(res, education, 'Data riwayat pendidikan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete education history
 * DELETE /api/education/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const education = await EducationHistory.findByPk(id);

    if (!education) {
      return notFound(res, `Data riwayat pendidikan dengan ID ${id} tidak ditemukan`);
    }

    await education.destroy();

    return success(res, null, 'Data riwayat pendidikan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
