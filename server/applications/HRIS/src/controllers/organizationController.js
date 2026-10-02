const { Organization, JobPosition } = require('../models');
const { Op } = require('sequelize');

class OrganizationController {
  // GET /api/organizations
  async list(req, res, next) {
    try {
      const { type, search, isActive, parentId, sortBy = 'sort_order', sortOrder = 'ASC' } = req.query;
      const where = {};

      if (type && type !== 'ALL') {
        where.type = type;
      }

      if (parentId !== undefined && parentId !== 'ALL' && parentId !== '') {
        where.parentId = parentId === 'null' || parentId === 'root' ? null : parseInt(parentId, 10);
      }

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

      const items = await Organization.findAll({
        where,
        include: [
          { model: Organization, as: 'parent', attributes: ['id', 'code', 'name', 'type'] },
          { model: Organization, as: 'children', attributes: ['id', 'code', 'name', 'type'] }
        ],
        order: [
          [sortBy === 'sortOrder' ? 'sort_order' : sortBy, sortOrder.toUpperCase()],
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

  // GET /api/organizations/tree
  async getTree(req, res, next) {
    try {
      const allOrgs = await Organization.findAll({
        where: { isActive: true },
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      });

      const map = {};
      const tree = [];

      allOrgs.forEach((org) => {
        map[org.id] = { ...org.toJSON(), children: [] };
      });

      allOrgs.forEach((org) => {
        if (org.parentId && map[org.parentId]) {
          map[org.parentId].children.push(map[org.id]);
        } else {
          tree.push(map[org.id]);
        }
      });

      res.json({ success: true, data: tree });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/organizations/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await Organization.findByPk(id, {
        include: [
          { model: Organization, as: 'parent', attributes: ['id', 'code', 'name', 'type'] },
          { model: Organization, as: 'children', attributes: ['id', 'code', 'name', 'type'] },
          { model: JobPosition, as: 'positions', attributes: ['id', 'code', 'title', 'is_active'] }
        ]
      });
      if (!item) {
        return res.status(404).json({ success: false, message: `Organisasi ID ${id} tidak ditemukan` });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/organizations
  async create(req, res, next) {
    try {
      const { code, name, type = 'Department', parentId, leaderId, description, isActive = true, sortOrder = 0 } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'code dan name organisasi wajib diisi' });
      }

      const existing = await Organization.findOne({ where: { code: code.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Kode organisasi '${code}' sudah ada` });
      }

      const item = await Organization.create({
        code: code.trim(),
        name: name.trim(),
        type: type || 'Department',
        parentId: parentId ? parseInt(parentId, 10) : null,
        leaderId: leaderId ? parseInt(leaderId, 10) : null,
        description: description || '',
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder, 10) || 0
      });

      res.status(201).json({
        success: true,
        message: 'Organisasi berhasil ditambahkan',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/organizations/:id
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const item = await Organization.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Organisasi ID ${id} tidak ditemukan` });
      }

      const { code, name, type, parentId, leaderId, description, isActive, sortOrder } = req.body;

      if (code && code !== item.code) {
        const existing = await Organization.findOne({ where: { code: code.trim(), id: { [Op.ne]: id } } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Kode organisasi '${code}' sudah digunakan` });
        }
      }

      // Avoid circular parenting
      if (parentId && parseInt(parentId, 10) === parseInt(id, 10)) {
        return res.status(400).json({ success: false, message: 'Organisasi tidak dapat menjadi induk bagi dirinya sendiri' });
      }

      await item.update({
        ...(code ? { code: code.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(parentId !== undefined ? { parentId: parentId ? parseInt(parentId, 10) : null } : {}),
        ...(leaderId !== undefined ? { leaderId: leaderId ? parseInt(leaderId, 10) : null } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) || 0 } : {})
      });

      res.json({
        success: true,
        message: 'Organisasi berhasil diperbarui',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/organizations/:id/deactivate
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await Organization.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Organisasi ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: false });
      res.json({
        success: true,
        message: `Organisasi '${item.name}' dinonaktifkan`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/organizations/:id/activate
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await Organization.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Organisasi ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: true });
      res.json({
        success: true,
        message: `Organisasi '${item.name}' diaktifkan kembali`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/organizations/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const item = await Organization.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Organisasi ID ${id} tidak ditemukan` });
      }
      await item.destroy();
      res.json({
        success: true,
        message: `Organisasi '${item.name}' berhasil dihapus`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrganizationController();
