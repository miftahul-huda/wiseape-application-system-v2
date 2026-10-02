const { JobLevel, JobPosition } = require('../models');
const { Op } = require('sequelize');

class JobLevelController {
  // GET /api/job-levels
  async list(req, res, next) {
    try {
      const { search, isActive, sortBy = 'level_number', sortOrder = 'ASC' } = req.query;
      const where = {};

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        where[Op.or] = [
          { code: { [Op.iLike]: term } },
          { name: { [Op.iLike]: term } },
          { description: { [Op.iLike]: term } }
        ];
      }

      if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') {
        where.isActive = isActive === 'true' || isActive === true;
      }

      const items = await JobLevel.findAll({
        where,
        order: [
          [sortBy === 'levelNumber' ? 'level_number' : sortBy, sortOrder.toUpperCase()],
          ['sort_order', 'ASC'],
          ['name', 'ASC']
        ]
      });

      res.json({
        success: true,
        data: items,
        meta: { total: items.length }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/job-levels/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobLevel.findByPk(id, {
        include: [
          { model: JobPosition, as: 'positions', attributes: ['id', 'code', 'title', 'is_active'] }
        ]
      });
      if (!item) {
        return res.status(404).json({ success: false, message: `Job level ID ${id} tidak ditemukan` });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/job-levels
  async create(req, res, next) {
    try {
      const { code, name, levelNumber = 1, description, isActive = true, sortOrder = 0 } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'code dan name jenjang jabatan wajib diisi' });
      }

      const existing = await JobLevel.findOne({ where: { code: code.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Kode jenjang jabatan '${code}' sudah ada` });
      }

      const item = await JobLevel.create({
        code: code.trim(),
        name: name.trim(),
        levelNumber: parseInt(levelNumber, 10) || 1,
        description: description || '',
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder, 10) || 0
      });

      res.status(201).json({
        success: true,
        message: 'Jenjang jabatan berhasil ditambahkan',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/job-levels/:id
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobLevel.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Job level ID ${id} tidak ditemukan` });
      }

      const { code, name, levelNumber, description, isActive, sortOrder } = req.body;

      if (code && code !== item.code) {
        const existing = await JobLevel.findOne({ where: { code: code.trim(), id: { [Op.ne]: id } } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Kode jenjang jabatan '${code}' sudah digunakan` });
        }
      }

      await item.update({
        ...(code ? { code: code.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(levelNumber !== undefined ? { levelNumber: parseInt(levelNumber, 10) || 1 } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) || 0 } : {})
      });

      res.json({
        success: true,
        message: 'Jenjang jabatan berhasil diperbarui',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/job-levels/:id/deactivate
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobLevel.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Job level ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: false });
      res.json({
        success: true,
        message: `Jenjang jabatan '${item.name}' dinonaktifkan`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/job-levels/:id/activate
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobLevel.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Job level ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: true });
      res.json({
        success: true,
        message: `Jenjang jabatan '${item.name}' diaktifkan kembali`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/job-levels/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobLevel.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Job level ID ${id} tidak ditemukan` });
      }
      await item.destroy();
      res.json({
        success: true,
        message: `Jenjang jabatan '${item.name}' berhasil dihapus`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobLevelController();
