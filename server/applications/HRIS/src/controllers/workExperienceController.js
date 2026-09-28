const { WorkExperience, Employee } = require('../models');
const {
  success,
  created,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * List all work experiences of an employee
 * GET /api/employees/:employeeId/work-experiences
 */
exports.listByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const experiences = await WorkExperience.findAll({
      where: { employeeId },
      order: [['startDate', 'DESC'], ['endDate', 'DESC']]
    });

    return success(res, experiences, 'Riwayat pekerjaan sebelumnya berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get work experience by ID
 * GET /api/work-experiences/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experience = await WorkExperience.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'nik', 'fullName', 'department']
        }
      ]
    });

    if (!experience) {
      return notFound(res, `Data riwayat pekerjaan dengan ID ${id} tidak ditemukan`);
    }

    return success(res, experience, 'Detail riwayat pekerjaan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Add work experience to an employee
 * POST /api/employees/:employeeId/work-experiences
 */
exports.create = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      companyName,
      position,
      startDate,
      endDate,
      isCurrentJob,
      lastSalary,
      description
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${employeeId} tidak ditemukan`);
    }

    if (!companyName || !position) {
      return badRequest(res, 'Nama perusahaan dan posisi/jabatan wajib diisi');
    }

    const experience = await WorkExperience.create({
      employeeId,
      companyName,
      position,
      startDate: startDate || null,
      endDate: endDate || null,
      isCurrentJob: isCurrentJob || false,
      lastSalary: lastSalary || null,
      description
    });

    return created(res, experience, 'Riwayat pekerjaan sebelumnya berhasil ditambahkan');
  } catch (err) {
    next(err);
  }
};

/**
 * Update work experience
 * PUT /api/work-experiences/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experience = await WorkExperience.findByPk(id);

    if (!experience) {
      return notFound(res, `Data riwayat pekerjaan dengan ID ${id} tidak ditemukan`);
    }

    await experience.update(req.body);

    return success(res, experience, 'Data riwayat pekerjaan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete work experience
 * DELETE /api/work-experiences/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experience = await WorkExperience.findByPk(id);

    if (!experience) {
      return notFound(res, `Data riwayat pekerjaan dengan ID ${id} tidak ditemukan`);
    }

    await experience.destroy();

    return success(res, null, 'Data riwayat pekerjaan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
