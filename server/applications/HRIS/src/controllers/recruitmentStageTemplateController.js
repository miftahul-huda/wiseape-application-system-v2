const { Op } = require('sequelize');
const { RecruitmentStageTemplate } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/responseHelper');

exports.findAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'id',
      sortOrder = 'ASC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const { count, rows } = await RecruitmentStageTemplate.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sortBy, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']]
    });

    return success(res, rows, 'Daftar template proses recruitment berhasil dimuat', 200, {
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
    const template = await RecruitmentStageTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template proses recruitment tidak ditemukan');
    }
    return success(res, template, 'Detail template proses recruitment berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, code, description, stages, isActive = true } = req.body;
    if (!name || !name.trim()) {
      return badRequest(res, 'Nama template proses wajib diisi');
    }

    const template = await RecruitmentStageTemplate.create({
      name: name.trim(),
      code: code ? code.trim() : null,
      description: description ? description.trim() : null,
      stages: Array.isArray(stages) ? stages : [],
      isActive
    });

    return created(res, template, 'Template proses recruitment berhasil dibuat');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await RecruitmentStageTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template proses recruitment tidak ditemukan');
    }

    const { name, code, description, stages, isActive } = req.body;
    if (name !== undefined) template.name = name.trim();
    if (code !== undefined) template.code = code ? code.trim() : null;
    if (description !== undefined) template.description = description ? description.trim() : null;
    if (stages !== undefined && Array.isArray(stages)) template.stages = stages;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();
    return success(res, template, 'Template proses recruitment berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await RecruitmentStageTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template proses recruitment tidak ditemukan');
    }

    await template.destroy();
    return success(res, null, 'Template proses recruitment berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
