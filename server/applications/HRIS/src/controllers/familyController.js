const { EmployeeFamily, Employee } = require('../models');
const {
  success,
  created,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * List all family members of an employee
 * GET /api/employees/:employeeId/family
 */
exports.listByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const family = await EmployeeFamily.findAll({
      where: { employeeId },
      order: [['id', 'ASC']]
    });

    return success(res, family, 'Data keluarga karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get family member by ID
 * GET /api/family/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await EmployeeFamily.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'nik', 'fullName', 'department']
        }
      ]
    });

    if (!item) {
      return notFound(res, `Data keluarga dengan ID ${id} tidak ditemukan`);
    }

    return success(res, item, 'Detail data keluarga berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Add family member for an employee
 * POST /api/employees/:employeeId/family
 */
exports.create = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      name,
      relationship,
      gender,
      idCardNumber,
      birthPlace,
      birthDate,
      educationLevel,
      occupation,
      phone,
      isEmergencyContact,
      isDependent,
      description
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return notFound(res, `Karyawan dengan ID ${employeeId} tidak ditemukan`);
    }

    if (!name) {
      return badRequest(res, 'Nama anggota keluarga wajib diisi');
    }

    const family = await EmployeeFamily.create({
      employeeId,
      name,
      relationship: relationship || 'Anak',
      gender: gender || 'Laki-laki',
      idCardNumber: idCardNumber || null,
      birthPlace: birthPlace || null,
      birthDate: birthDate || null,
      educationLevel: educationLevel || null,
      occupation: occupation || null,
      phone: phone || null,
      isEmergencyContact: isEmergencyContact === true || isEmergencyContact === 'true' || isEmergencyContact === 1,
      isDependent: isDependent !== false && isDependent !== 'false' && isDependent !== 0,
      description: description || null
    });

    return created(res, family, 'Data anggota keluarga berhasil ditambahkan');
  } catch (err) {
    next(err);
  }
};

/**
 * Update family member
 * PUT /api/family/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const family = await EmployeeFamily.findByPk(id);

    if (!family) {
      return notFound(res, `Data keluarga dengan ID ${id} tidak ditemukan`);
    }

    const payload = { ...req.body };
    if (payload.isEmergencyContact !== undefined) {
      payload.isEmergencyContact = payload.isEmergencyContact === true || payload.isEmergencyContact === 'true' || payload.isEmergencyContact === 1;
    }
    if (payload.isDependent !== undefined) {
      payload.isDependent = payload.isDependent === true || payload.isDependent === 'true' || payload.isDependent === 1;
    }

    await family.update(payload);

    return success(res, family, 'Data anggota keluarga berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete family member
 * DELETE /api/family/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const family = await EmployeeFamily.findByPk(id);

    if (!family) {
      return notFound(res, `Data keluarga dengan ID ${id} tidak ditemukan`);
    }

    await family.destroy();

    return success(res, null, 'Data anggota keluarga berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
