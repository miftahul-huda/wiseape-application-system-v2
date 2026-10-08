const { Op } = require('sequelize');
const { RecruitmentMatrixTemplate } = require('../models');
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

    const { count, rows } = await RecruitmentMatrixTemplate.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sortBy, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']]
    });

    return success(res, rows, 'Daftar template matriks penilaian berhasil dimuat', 200, {
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
    const template = await RecruitmentMatrixTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template matriks penilaian tidak ditemukan');
    }
    return success(res, template, 'Detail template matriks penilaian berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, code, description, criteria, passScore = 70, isActive = true } = req.body;
    if (!name || !name.trim()) {
      return badRequest(res, 'Nama template matriks wajib diisi');
    }

    const template = await RecruitmentMatrixTemplate.create({
      name: name.trim(),
      code: code ? code.trim() : null,
      description: description ? description.trim() : null,
      criteria: Array.isArray(criteria) ? criteria : [],
      passScore: parseFloat(passScore) || 70,
      isActive
    });

    return created(res, template, 'Template matriks penilaian berhasil dibuat');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await RecruitmentMatrixTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template matriks penilaian tidak ditemukan');
    }

    const { name, code, description, criteria, passScore, isActive } = req.body;
    if (name !== undefined) template.name = name.trim();
    if (code !== undefined) template.code = code ? code.trim() : null;
    if (description !== undefined) template.description = description ? description.trim() : null;
    if (criteria !== undefined && Array.isArray(criteria)) template.criteria = criteria;
    if (passScore !== undefined) template.passScore = parseFloat(passScore) || 70;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();
    return success(res, template, 'Template matriks penilaian berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await RecruitmentMatrixTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Template matriks penilaian tidak ditemukan');
    }

    await template.destroy();
    return success(res, null, 'Template matriks penilaian berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
