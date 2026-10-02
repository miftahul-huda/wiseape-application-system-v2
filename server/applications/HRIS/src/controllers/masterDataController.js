const { MasterData } = require('../models');
const { Op } = require('sequelize');

class MasterDataController {
  // GET /api/master-data
  async list(req, res, next) {
    try {
      const { dataType, search, isActive, sortBy = 'sort_order', sortOrder = 'ASC' } = req.query;
      const where = {};

      if (dataType && dataType !== 'ALL') {
        where.dataType = dataType.toUpperCase();
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

      const items = await MasterData.findAll({
        where,
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

  // GET /api/master-data/types
  async listCategories(req, res, next) {
    try {
      const types = [
        { key: 'RELATIONSHIP', label: 'Hubungan Keluarga (Relationship)', icon: '👨‍👩‍👧‍👦' },
        { key: 'RELIGION', label: 'Agama (Religion)', icon: '🕊️' },
        { key: 'EMPLOYMENT_STATUS', label: 'Status Kepegawaian (Employment Status)', icon: '📋' },
        { key: 'WORK_LOCATION', label: 'Lokasi Kerja (Work Location)', icon: '📍' },
        { key: 'BANK', label: 'Bank Payroll (Bank)', icon: '🏦' },
        { key: 'DOCUMENT_TYPE', label: 'Jenis Dokumen (Document Type)', icon: '📄' },
        { key: 'DEGREE_LEVEL', label: 'Jenjang Pendidikan (Degree Level)', icon: '🎓' },
        { key: 'GENDER', label: 'Jenis Kelamin (Gender)', icon: '🚻' }
      ];
      res.json({ success: true, data: types });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/master-data/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MasterData.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Master data ID ${id} tidak ditemukan` });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/master-data
  async create(req, res, next) {
    try {
      const { dataType, code, name, description, isActive = true, sortOrder = 0, metadata } = req.body;
      if (!dataType || !code || !name) {
        return res.status(400).json({ success: false, message: 'dataType, code, dan name wajib diisi' });
      }

      // Check unique code per dataType
      const existing = await MasterData.findOne({
        where: { dataType: dataType.toUpperCase(), code: code.trim() }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: `Kode '${code}' sudah digunakan untuk kategori '${dataType}'` });
      }

      const item = await MasterData.create({
        dataType: dataType.toUpperCase(),
        code: code.trim(),
        name: name.trim(),
        description: description || '',
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder, 10) || 0,
        metadata: metadata || {}
      });

      res.status(201).json({
        success: true,
        message: 'Master data berhasil ditambahkan',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/master-data/:id
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MasterData.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Master data ID ${id} tidak ditemukan` });
      }

      const { dataType, code, name, description, isActive, sortOrder, metadata } = req.body;

      if (code && code !== item.code) {
        const checkType = (dataType || item.dataType).toUpperCase();
        const existing = await MasterData.findOne({
          where: { dataType: checkType, code: code.trim(), id: { [Op.ne]: id } }
        });
        if (existing) {
          return res.status(400).json({ success: false, message: `Kode '${code}' sudah digunakan untuk kategori '${checkType}'` });
        }
      }

      await item.update({
        ...(dataType ? { dataType: dataType.toUpperCase() } : {}),
        ...(code ? { code: code.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder, 10) || 0 } : {}),
        ...(metadata !== undefined ? { metadata } : {})
      });

      res.json({
        success: true,
        message: 'Master data berhasil diperbarui',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/master-data/:id/deactivate
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MasterData.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Master data ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: false });
      res.json({
        success: true,
        message: `Master data '${item.name}' dinonaktifkan`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/master-data/:id/activate
  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MasterData.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Master data ID ${id} tidak ditemukan` });
      }
      await item.update({ isActive: true });
      res.json({
        success: true,
        message: `Master data '${item.name}' diaktifkan kembali`,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/master-data/:id
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MasterData.findByPk(id);
      if (!item) {
        return res.status(404).json({ success: false, message: `Master data ID ${id} tidak ditemukan` });
      }
      await item.destroy();
      res.json({
        success: true,
        message: `Master data '${item.name}' berhasil dihapus`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MasterDataController();
