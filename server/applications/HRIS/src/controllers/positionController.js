const { JobPosition, Organization, JobLevel } = require('../models');
const { Op } = require('sequelize');

class PositionController {
  // GET /api/positions
  async list(req, res, next) {
    try {
      const { organizationId, jobLevelId, department, search, isActive, sortBy = 'sort_order', sortOrder = 'ASC' } = req.query;
      const where = {};

      if (organizationId && organizationId !== 'ALL') {
        where.organizationId = parseInt(organizationId, 10);
      }

      if (jobLevelId && jobLevelId !== 'ALL') {
        where.jobLevelId = parseInt(jobLevelId, 10);
      }

      if (department && department !== 'ALL' && department !== '') {
        where.department = department;
      }

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        where[Op.or] = [
          { code: { [Op.iLike]: term } },
          { title: { [Op.iLike]: term } },
          { department: { [Op.iLike]: term } },
          { description: { [Op.iLike]: term } }
        ];
      }

      if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') {
        where.isActive = isActive === 'true' || isActive === true;
      }

      const items = await JobPosition.findAll({
        where,
        include: [
          { model: Organization, as: 'organization', attributes: ['id', 'code', 'name', 'type'] },
          { model: JobLevel, as: 'jobLevel', attributes: ['id', 'code', 'name', 'level_number'] }
        ],
        order: [
          [sortBy === 'sortOrder' ? 'sort_order' : sortBy, sortOrder.toUpperCase()],
          ['title', 'ASC']
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

  // GET /api/positions/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobPosition.findByPk(id, {
        include: [
          { model: Organization, as: 'organization', attributes: ['id', 'code', 'name', 'type'] },
          { model: JobLevel, as: 'jobLevel', attributes: ['id', 'code', 'name', 'level_number'] }
        ]
      });
      if (!item) {
        return res.status(404).json({ success: false, message: `Jabatan ID ${id} tidak ditemukan` });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/positions
  async create(req, res, next) {
    try {
      const { code, title, organizationId, jobLevelId, department, description, requirements, isActive = true, sortOrder = 0 } = req.body;
      if (!code || !title) {
        return res.status(400).json({ success: false, message: 'code dan title jabatan wajib diisi' });
      }

      const existing = await JobPosition.findOne({ where: { code: code.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Kode jabatan '${code}' sudah ada` });
      }

      // If department is not provided but organizationId is, resolve department name
      let resolvedDept = department;
      if (!resolvedDept && organizationId) {
        const org = await Organization.findByPk(organizationId);
        if (org) resolvedDept = org.name;
      }

      const item = await JobPosition.create({
        code: code.trim(),
        title: title.trim(),
        organizationId: organizationId ? parseInt(organizationId, 10) : null,
        jobLevelId: jobLevelId ? parseInt(jobLevelId, 10) : null,
        department: resolvedDept || '',
        description: description || '',
        requirements: requirements || '',
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder, 10) || 0
      });

      res.status(201).json({
        success: true,
        message: 'Jabatan berhasil ditambahkan',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/positions/:id
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobPosition.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Jabatan ID ${id} tidak ditemukan` });
      }

      const { code, title, organizationId, jobLevelId, department, description, requirements, isActive, sortOrder } = req.body;

      if (code && code !== item.code) {
        const existing = await JobPosition.findOne({ where: { code: code.trim(), id: { [Op.ne]: id } } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Kode jabatan '${code}' sudah digunakan` });
        }
      }

      let resolvedDept = department;
      if (resolvedDept === undefined && organizationId) {
        const org = await Organization.findByPk(organizationId);
        if (org) resolvedDept = org.name;
      }

      await item.update({
        ...(code ? { code: code.trim() } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(organizationId !== undefined ? { organizationId: organizationId ? parseInt(organizationId, 10) : null } : {}),
        ...(jobLevelId !== undefined ? { jobLevelId: jobLevelId ? parseInt(jobLevelId, 10) : null } : {}),
        ...(resolvedDept !== undefined ? { department: resolvedDept } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(requirements !== undefined ? { requirements } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) || 0 } : {})
      });

      res.json({
        success: true,
        message: 'Jabatan berhasil diperbarui',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/positions/:id/deactivate
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobPosition.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Jabatan ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: false });
      res.json({
        success: true,
        message: `Jabatan '${item.title}' dinonaktifkan`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/positions/:id/activate
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobPosition.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Jabatan ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: true });
      res.json({
        success: true,
        message: `Jabatan '${item.title}' diaktifkan kembali`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/positions/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const item = await JobPosition.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Jabatan ID ${id} tidak ditemukan` });
      }
      await item.destroy();
      res.json({
        success: true,
        message: `Jabatan '${item.title}' berhasil dihapus`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PositionController();
