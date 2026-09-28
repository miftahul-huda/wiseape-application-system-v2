const fs = require('fs');
const path = require('path');
const { EmployeeDocument, Employee } = require('../models');
const {
  success,
  created,
  error,
  notFound,
  badRequest
} = require('../utils/responseHelper');

/**
 * List all documents of an employee
 * GET /api/employees/:employeeId/documents
 */
exports.listByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { documentType } = req.query;

    const where = { employeeId };
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await EmployeeDocument.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    return success(res, documents, 'Daftar dokumen karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Get document details by ID
 * GET /api/documents/:id
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'nik', 'fullName', 'department']
        }
      ]
    });

    if (!document) {
      return notFound(res, `Dokumen dengan ID ${id} tidak ditemukan`);
    }

    return success(res, document, 'Detail dokumen berhasil diambil');
  } catch (err) {
    next(err);
  }
};

/**
 * Upload new document for an employee
 * POST /api/employees/:employeeId/documents
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const {
      documentType,
      title,
      documentNumber,
      issueDate,
      expiryDate,
      description
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      // Remove uploaded file if employee is not found
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return notFound(res, `Karyawan dengan ID ${employeeId} tidak ditemukan`);
    }

    if (!documentType) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return badRequest(res, 'Tipe dokumen (documentType) wajib diisi (e.g. KTP, KK, NPWP, Kontrak Kerja, dll)');
    }

    const docTitle = title || `${documentType} - ${employee.fullName}`;

    let fileName = null;
    let filePath = null;
    let fileUrl = null;
    let fileSize = null;
    let mimeType = null;

    if (req.file) {
      fileName = req.file.filename;
      filePath = req.file.path;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
      // Construct public URL
      fileUrl = `/uploads/documents/${employeeId}/${req.file.filename}`;
    }

    const document = await EmployeeDocument.create({
      employeeId,
      documentType,
      title: docTitle,
      fileName,
      filePath,
      fileUrl,
      fileSize,
      mimeType,
      documentNumber,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      description
    });

    return created(res, document, 'Dokumen karyawan berhasil diunggah dan disimpan');
  } catch (err) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
};

/**
 * Download / stream document file
 * GET /api/documents/:id/download
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id);

    if (!document) {
      return notFound(res, `Dokumen dengan ID ${id} tidak ditemukan`);
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return notFound(res, 'File dokumen fisik tidak ditemukan di server');
    }

    return res.download(document.filePath, document.fileName || path.basename(document.filePath));
  } catch (err) {
    next(err);
  }
};

/**
 * Update document metadata
 * PUT /api/documents/:id
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id);

    if (!document) {
      return notFound(res, `Dokumen dengan ID ${id} tidak ditemukan`);
    }

    const {
      documentType,
      title,
      documentNumber,
      issueDate,
      expiryDate,
      description
    } = req.body;

    await document.update({
      documentType: documentType !== undefined ? documentType : document.documentType,
      title: title !== undefined ? title : document.title,
      documentNumber: documentNumber !== undefined ? documentNumber : document.documentNumber,
      issueDate: issueDate !== undefined ? issueDate : document.issueDate,
      expiryDate: expiryDate !== undefined ? expiryDate : document.expiryDate,
      description: description !== undefined ? description : document.description
    });

    return success(res, document, 'Data informasi dokumen berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete document and remove physical file
 * DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id);

    if (!document) {
      return notFound(res, `Dokumen dengan ID ${id} tidak ditemukan`);
    }

    // Try to remove physical file
    if (document.filePath && fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (err) {
        console.warn(`[HRIS Warning] Gagal menghapus file fisik ${document.filePath}:`, err.message);
      }
    }

    await document.destroy();

    return success(res, null, `Dokumen '${document.title}' berhasil dihapus`);
  } catch (err) {
    next(err);
  }
};
