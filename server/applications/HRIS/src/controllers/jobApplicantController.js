const { Op } = require('sequelize');
const { JobApplicant, JobVacancy, ApplicantProcess, sequelize } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/responseHelper');

exports.findAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      jobVacancyId,
      status,
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { applicantNumber: { [Op.iLike]: `%${search}%` } },
        { currentPosition: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (jobVacancyId && jobVacancyId !== 'ALL') {
      where.jobVacancyId = parseInt(jobVacancyId, 10);
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const { count, rows } = await JobApplicant.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [[sortBy, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']],
      include: [
        {
          model: JobVacancy,
          as: 'vacancy',
          attributes: ['id', 'title', 'code', 'department', 'position']
        },
        {
          model: ApplicantProcess,
          as: 'processes',
          attributes: ['id', 'stageName', 'stageOrder', 'status', 'result', 'overallScore']
        }
      ]
    });

    return success(res, rows, 'Daftar pelamar berhasil dimuat', 200, {
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
    const applicant = await JobApplicant.findByPk(id, {
      include: [
        {
          model: JobVacancy,
          as: 'vacancy'
        },
        {
          model: ApplicantProcess,
          as: 'processes'
        }
      ],
      order: [
        [{ model: ApplicantProcess, as: 'processes' }, 'stageOrder', 'ASC']
      ]
    });

    if (!applicant) {
      return notFound(res, 'Data pelamar tidak ditemukan');
    }

    return success(res, applicant, 'Detail pelamar berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      jobVacancyId,
      fullName,
      email,
      phone,
      gender,
      birthDate,
      lastEducation,
      major,
      currentCompany,
      currentPosition,
      expectedSalary,
      resumeUrl,
      status = 'APPLIED',
      appliedDate,
      notes
    } = req.body;

    if (!fullName || !fullName.trim()) {
      await transaction.rollback();
      return badRequest(res, 'Nama lengkap pelamar wajib diisi');
    }
    if (!email || !email.trim()) {
      await transaction.rollback();
      return badRequest(res, 'Email pelamar wajib diisi');
    }
    if (!jobVacancyId) {
      await transaction.rollback();
      return badRequest(res, 'Pilihan lowongan pekerjaan wajib dipilih');
    }

    const vacancy = await JobVacancy.findByPk(jobVacancyId, { transaction });
    if (!vacancy) {
      await transaction.rollback();
      return notFound(res, 'Lowongan pekerjaan yang dipilih tidak ditemukan');
    }

    const countTotal = await JobApplicant.count({ transaction });
    const year = new Date().getFullYear();
    const applicantNumber = `APP-${year}-${String(countTotal + 1).padStart(4, '0')}`;

    const applicant = await JobApplicant.create(
      {
        jobVacancyId: parseInt(jobVacancyId, 10),
        applicantNumber,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        gender: gender || 'Laki-laki',
        birthDate: birthDate || null,
        lastEducation: lastEducation || 'S1',
        major: major ? major.trim() : '',
        currentCompany: currentCompany ? currentCompany.trim() : '',
        currentPosition: currentPosition ? currentPosition.trim() : '',
        expectedSalary: expectedSalary ? parseFloat(expectedSalary) : null,
        resumeUrl: resumeUrl || null,
        status,
        appliedDate: appliedDate || new Date().toISOString().slice(0, 10),
        notes: notes ? notes.trim() : ''
      },
      { transaction }
    );

    // Auto-create processes from vacancy.stages
    const stages = Array.isArray(vacancy.stages) ? vacancy.stages : [];
    if (stages.length > 0) {
      for (let i = 0; i < stages.length; i++) {
        const st = stages[i];
        await ApplicantProcess.create(
          {
            applicantId: applicant.id,
            jobVacancyId: vacancy.id,
            stageName: st.name || `Tahapan ${i + 1}`,
            stageOrder: st.order || (i + 1),
            status: i === 0 ? 'Ongoing' : 'Not Starting',
            scheduledDate: null,
            interviewerName: null,
            result: 'PENDING',
            overallScore: null,
            matrixTemplateId: st.matrixTemplateId || null,
            evaluationMatrix: [],
            comments: '',
            documents: []
          },
          { transaction }
        );
      }
    } else {
      // Create a default CV screening process
      await ApplicantProcess.create(
        {
          applicantId: applicant.id,
          jobVacancyId: vacancy.id,
          stageName: 'Screening CV & Berkas',
          stageOrder: 1,
          status: 'Ongoing',
          result: 'PENDING',
          comments: 'Tahapan seleksi awal administrasi dan CV pelamar'
        },
        { transaction }
      );
    }

    await transaction.commit();

    const createdApplicant = await JobApplicant.findByPk(applicant.id, {
      include: [
        { model: JobVacancy, as: 'vacancy' },
        { model: ApplicantProcess, as: 'processes' }
      ]
    });

    return created(res, createdApplicant, 'Data pelamar dan tahapan proses seleksi berhasil dibuat');
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicant = await JobApplicant.findByPk(id);
    if (!applicant) {
      return notFound(res, 'Data pelamar tidak ditemukan');
    }

    const {
      jobVacancyId,
      fullName,
      email,
      phone,
      gender,
      birthDate,
      lastEducation,
      major,
      currentCompany,
      currentPosition,
      expectedSalary,
      resumeUrl,
      status,
      appliedDate,
      notes
    } = req.body;

    if (jobVacancyId !== undefined) applicant.jobVacancyId = parseInt(jobVacancyId, 10);
    if (fullName !== undefined) applicant.fullName = fullName.trim();
    if (email !== undefined) applicant.email = email.trim().toLowerCase();
    if (phone !== undefined) applicant.phone = phone ? phone.trim() : null;
    if (gender !== undefined) applicant.gender = gender;
    if (birthDate !== undefined) applicant.birthDate = birthDate || null;
    if (lastEducation !== undefined) applicant.lastEducation = lastEducation;
    if (major !== undefined) applicant.major = major ? major.trim() : '';
    if (currentCompany !== undefined) applicant.currentCompany = currentCompany ? currentCompany.trim() : '';
    if (currentPosition !== undefined) applicant.currentPosition = currentPosition ? currentPosition.trim() : '';
    if (expectedSalary !== undefined) applicant.expectedSalary = expectedSalary ? parseFloat(expectedSalary) : null;
    if (resumeUrl !== undefined) applicant.resumeUrl = resumeUrl;
    if (status !== undefined) applicant.status = status;
    if (appliedDate !== undefined) applicant.appliedDate = appliedDate;
    if (notes !== undefined) applicant.notes = notes ? notes.trim() : '';

    await applicant.save();

    const updated = await JobApplicant.findByPk(applicant.id, {
      include: [
        { model: JobVacancy, as: 'vacancy' },
        { model: ApplicantProcess, as: 'processes' }
      ]
    });

    return success(res, updated, 'Data pelamar berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const applicant = await JobApplicant.findByPk(id);
    if (!applicant) {
      return notFound(res, 'Data pelamar tidak ditemukan');
    }

    await applicant.destroy();
    return success(res, null, 'Data pelamar berhasil dihapus');
  } catch (err) {
    next(err);
  }
};
