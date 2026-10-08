const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { ApplicantProcess, JobApplicant, JobVacancy, RecruitmentDocument, RecruitmentMatrixTemplate } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/responseHelper');

exports.findByApplicantId = async (req, res, next) => {
  try {
    const { applicantId } = req.params;
    const processes = await ApplicantProcess.findAll({
      where: { applicantId: parseInt(applicantId, 10) },
      order: [['stageOrder', 'ASC']]
    });

    return success(res, processes, 'Daftar proses recruitment pelamar berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.findById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const processItem = await ApplicantProcess.findByPk(id, {
      include: [
        {
          model: JobApplicant,
          as: 'applicant',
          attributes: ['id', 'fullName', 'email', 'phone', 'status', 'jobVacancyId']
        },
        {
          model: JobVacancy,
          as: 'vacancy',
          attributes: ['id', 'title', 'code', 'department', 'position']
        }
      ]
    });

    if (!processItem) {
      return notFound(res, 'Proses recruitment tidak ditemukan');
    }

    return success(res, processItem, 'Detail proses recruitment berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      applicantId,
      jobVacancyId,
      stageName,
      stageOrder,
      status = 'Not Starting',
      scheduledDate,
      interviewerName,
      result = 'PENDING',
      overallScore,
      matrixTemplateId,
      evaluationMatrix = [],
      comments = '',
      documents = []
    } = req.body;

    if (!applicantId) {
      return badRequest(res, 'applicantId wajib disertakan');
    }
    if (!stageName || !stageName.trim()) {
      return badRequest(res, 'Nama tahapan proses wajib diisi');
    }

    const applicant = await JobApplicant.findByPk(applicantId);
    if (!applicant) {
      return notFound(res, 'Pelamar tidak ditemukan');
    }

    const currentCount = await ApplicantProcess.count({ where: { applicantId } });

    const newProcess = await ApplicantProcess.create({
      applicantId: parseInt(applicantId, 10),
      jobVacancyId: jobVacancyId ? parseInt(jobVacancyId, 10) : applicant.jobVacancyId,
      stageName: stageName.trim(),
      stageOrder: stageOrder !== undefined ? parseInt(stageOrder, 10) : currentCount + 1,
      status,
      scheduledDate: scheduledDate || null,
      interviewerName: interviewerName ? interviewerName.trim() : null,
      result,
      overallScore: overallScore !== undefined && overallScore !== '' ? parseFloat(overallScore) : null,
      matrixTemplateId: matrixTemplateId ? parseInt(matrixTemplateId, 10) : null,
      evaluationMatrix: Array.isArray(evaluationMatrix) ? evaluationMatrix : [],
      comments: comments ? comments.trim() : '',
      documents: Array.isArray(documents) ? documents : []
    });

    return created(res, newProcess, 'Tahapan proses recruitment baru berhasil ditambahkan');
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const processItem = await ApplicantProcess.findByPk(id);
    if (!processItem) {
      return notFound(res, 'Proses recruitment tidak ditemukan');
    }

    const {
      stageName,
      stageOrder,
      status,
      scheduledDate,
      interviewerName,
      result,
      overallScore,
      matrixTemplateId,
      evaluationMatrix,
      comments,
      documents
    } = req.body;

    if (stageName !== undefined) processItem.stageName = stageName.trim();
    if (stageOrder !== undefined) processItem.stageOrder = parseInt(stageOrder, 10);
    if (status !== undefined) processItem.status = status;
    if (scheduledDate !== undefined) processItem.scheduledDate = scheduledDate || null;
    if (interviewerName !== undefined) processItem.interviewerName = interviewerName ? interviewerName.trim() : null;
    if (result !== undefined) processItem.result = result;
    if (overallScore !== undefined) processItem.overallScore = overallScore !== null && overallScore !== '' ? parseFloat(overallScore) : null;
    if (matrixTemplateId !== undefined) processItem.matrixTemplateId = matrixTemplateId ? parseInt(matrixTemplateId, 10) : null;
    if (evaluationMatrix !== undefined && Array.isArray(evaluationMatrix)) processItem.evaluationMatrix = evaluationMatrix;
    if (comments !== undefined) processItem.comments = comments ? comments.trim() : '';
    if (documents !== undefined && Array.isArray(documents)) processItem.documents = documents;

    await processItem.save();

    // If result was marked PASSED/FAILED or status changed, sync applicant status if needed
    if (status === 'Done' && result === 'PASSED') {
      const remainingPending = await ApplicantProcess.count({
        where: {
          applicantId: processItem.applicantId,
          status: { [Op.ne]: 'Done' }
        }
      });
      if (remainingPending === 0) {
        // all stages done and passed!
        await JobApplicant.update({ status: 'OFFERED' }, { where: { id: processItem.applicantId } });
      }
    } else if (result === 'FAILED') {
      await JobApplicant.update({ status: 'REJECTED' }, { where: { id: processItem.applicantId } });
    }

    return success(res, processItem, 'Proses recruitment berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const processItem = await ApplicantProcess.findByPk(id);
    if (!processItem) {
      return notFound(res, 'Proses recruitment tidak ditemukan');
    }

    await processItem.destroy();
    return success(res, null, 'Proses recruitment berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const processItem = await ApplicantProcess.findByPk(id);
    if (!processItem) {
      return notFound(res, 'Proses recruitment tidak ditemukan');
    }

    if (!req.file) {
      return badRequest(res, 'File wajib diunggah');
    }

    const { documentName = 'Dokumen Lampiran', notes = '' } = req.body;
    const relativeUrl = `/uploads/recruitment/${id}/${req.file.filename}`;

    const docObj = {
      id: Date.now().toString(),
      name: documentName || req.file.originalname,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: relativeUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      notes
    };

    const currentDocs = Array.isArray(processItem.documents) ? [...processItem.documents] : [];
    currentDocs.push(docObj);
    processItem.documents = currentDocs;
    await processItem.save();

    // Also persist in RecruitmentDocument table for audit
    await RecruitmentDocument.create({
      applicantProcessId: processItem.id,
      applicantId: processItem.applicantId,
      documentName: docObj.name,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: relativeUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      notes
    });

    return created(res, { document: docObj, process: processItem }, 'Dokumen proses recruitment berhasil diunggah');
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const processItem = await ApplicantProcess.findByPk(id);
    if (!processItem) {
      return notFound(res, 'Proses recruitment tidak ditemukan');
    }

    const currentDocs = Array.isArray(processItem.documents) ? [...processItem.documents] : [];
    const targetDoc = currentDocs.find((d) => String(d.id) === String(docId));
    if (!targetDoc) {
      return notFound(res, 'Dokumen lampiran tidak ditemukan');
    }

    // Try deleting file from disk
    if (targetDoc.filePath && fs.existsSync(targetDoc.filePath)) {
      try {
        fs.unlinkSync(targetDoc.filePath);
      } catch (e) {
        console.warn('Failed to delete file from disk:', e.message);
      }
    }

    processItem.documents = currentDocs.filter((d) => String(d.id) !== String(docId));
    await processItem.save();

    await RecruitmentDocument.destroy({
      where: {
        applicantProcessId: processItem.id,
        fileName: targetDoc.fileName
      }
    });

    return success(res, processItem, 'Dokumen lampiran berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
