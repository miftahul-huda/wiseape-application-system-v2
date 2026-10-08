const { Op } = require('sequelize');
const { JobVacancy, JobApplicant, RecruitmentStageTemplate, sequelize } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/responseHelper');

exports.findAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      department,
      status,
      isActive,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { division: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const { count, rows } = await JobVacancy.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sortBy, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']],
      include: [
        {
          model: JobApplicant,
          as: 'applicants',
          attributes: ['id']
        }
      ]
    });

    const formattedRows = rows.map((vac) => {
      const v = vac.toJSON();
      v.applicantCount = (v.applicants || []).length;
      delete v.applicants;
      return v;
    });

    return success(res, formattedRows, 'Daftar lowongan pekerjaan berhasil dimuat', 200, {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

exports.findById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vacancy = await JobVacancy.findByPk(id, {
      include: [
        {
          model: JobApplicant,
          as: 'applicants',
          attributes: ['id', 'fullName', 'status', 'appliedDate', 'email', 'phone']
        }
      ]
    });

    if (!vacancy) {
      return notFound(res, 'Data lowongan pekerjaan tidak ditemukan');
    }

    const v = vacancy.toJSON();
    v.applicantCount = (v.applicants || []).length;
    return success(res, v, 'Detail lowongan pekerjaan berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      title,
      code,
      department,
      division,
      position,
      jobLevel,
      workLocation,
      employmentType = 'Tetap (PKWTT)',
      description,
      startDate,
      endDate,
      status = 'ACTIVE',
      stageTemplateId,
      stages = [],
      isActive = true
    } = req.body;

    if (!title || !title.trim()) {
      return badRequest(res, 'Judul lowongan pekerjaan wajib diisi');
    }

    // Auto generate code if empty
    let vacancyCode = code;
    if (!vacancyCode || !vacancyCode.trim()) {
      const year = new Date().getFullYear();
      const countTotal = await JobVacancy.count();
      vacancyCode = `VAC-${year}-${String(countTotal + 1).padStart(3, '0')}`;
    }

    let resolvedStages = Array.isArray(stages) && stages.length > 0 ? stages : [];
    if (resolvedStages.length === 0 && stageTemplateId) {
      const template = await RecruitmentStageTemplate.findByPk(stageTemplateId);
      if (template && Array.isArray(template.stages)) {
        resolvedStages = template.stages;
      }
    }

    const vacancy = await JobVacancy.create({
      code: vacancyCode.trim(),
      title: title.trim(),
      department: department ? department.trim() : '',
      division: division ? division.trim() : '',
      position: position ? position.trim() : '',
      jobLevel: jobLevel ? jobLevel.trim() : '',
      workLocation: workLocation ? workLocation.trim() : 'Kantor Pusat',
      employmentType,
      description: description ? description.trim() : '',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || null,
      status,
      stageTemplateId: stageTemplateId ? parseInt(stageTemplateId, 10) : null,
      stages: resolvedStages,
      isActive
    });

    return created(res, vacancy, 'Lowongan pekerjaan berhasil diposting');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vacancy = await JobVacancy.findByPk(id);
    if (!vacancy) {
      return notFound(res, 'Data lowongan pekerjaan tidak ditemukan');
    }

    const {
      title,
      code,
      department,
      division,
      position,
      jobLevel,
      workLocation,
      employmentType,
      description,
      startDate,
      endDate,
      status,
      stageTemplateId,
      stages,
      isActive
    } = req.body;

    if (title !== undefined) vacancy.title = title.trim();
    if (code !== undefined) vacancy.code = code.trim();
    if (department !== undefined) vacancy.department = department ? department.trim() : '';
    if (division !== undefined) vacancy.division = division ? division.trim() : '';
    if (position !== undefined) vacancy.position = position ? position.trim() : '';
    if (jobLevel !== undefined) vacancy.jobLevel = jobLevel ? jobLevel.trim() : '';
    if (workLocation !== undefined) vacancy.workLocation = workLocation ? workLocation.trim() : '';
    if (employmentType !== undefined) vacancy.employmentType = employmentType;
    if (description !== undefined) vacancy.description = description ? description.trim() : '';
    if (startDate !== undefined) vacancy.startDate = startDate;
    if (endDate !== undefined) vacancy.endDate = endDate;
    if (status !== undefined) vacancy.status = status;
    if (stageTemplateId !== undefined) vacancy.stageTemplateId = stageTemplateId ? parseInt(stageTemplateId, 10) : null;
    if (stages !== undefined && Array.isArray(stages)) vacancy.stages = stages;
    if (isActive !== undefined) vacancy.isActive = isActive;

    await vacancy.save();
    return success(res, vacancy, 'Data lowongan pekerjaan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vacancy = await JobVacancy.findByPk(id);
    if (!vacancy) {
      return notFound(res, 'Data lowongan pekerjaan tidak ditemukan');
    }

    await vacancy.destroy();
    return success(res, null, 'Data lowongan pekerjaan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
