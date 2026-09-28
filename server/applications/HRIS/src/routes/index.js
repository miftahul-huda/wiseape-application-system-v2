const express = require('express');
const router = express.Router();

const employeeRoutes = require('./employeeRoutes');
const documentRoutes = require('./documentRoutes');
const workExperienceRoutes = require('./workExperienceRoutes');
const educationRoutes = require('./educationRoutes');
const careerHistoryRoutes = require('./careerHistoryRoutes');

// Service health check and meta
router.get('/', (req, res) => {
  res.json({
    service: 'Wiseape HRIS Microservice REST API',
    version: '1.0.0',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    endpoints: {
      employees: {
        list: 'GET /api/employees',
        statistics: 'GET /api/employees/statistics',
        get: 'GET /api/employees/:id (supports numeric ID or NIK)',
        create: 'POST /api/employees',
        update: 'PUT /api/employees/:id',
        deactivate: 'PATCH /api/employees/:id/deactivate',
        activate: 'PATCH /api/employees/:id/activate',
        delete: 'DELETE /api/employees/:id (?force=true for hard-delete)'
      },
      documents: {
        listByEmployee: 'GET /api/employees/:employeeId/documents',
        upload: 'POST /api/employees/:employeeId/documents (multipart/form-data)',
        get: 'GET /api/documents/:id',
        download: 'GET /api/documents/:id/download',
        update: 'PUT /api/documents/:id',
        delete: 'DELETE /api/documents/:id'
      },
      workExperiences: {
        listByEmployee: 'GET /api/employees/:employeeId/work-experiences',
        create: 'POST /api/employees/:employeeId/work-experiences',
        get: 'GET /api/work-experiences/:id',
        update: 'PUT /api/work-experiences/:id',
        delete: 'DELETE /api/work-experiences/:id'
      },
      education: {
        listByEmployee: 'GET /api/employees/:employeeId/education',
        create: 'POST /api/employees/:employeeId/education',
        get: 'GET /api/education/:id',
        update: 'PUT /api/education/:id',
        delete: 'DELETE /api/education/:id'
      },
      careerHistory: {
        listByEmployee: 'GET /api/employees/:employeeId/career-history',
        create: 'POST /api/employees/:employeeId/career-history',
        get: 'GET /api/career-history/:id',
        update: 'PUT /api/career-history/:id',
        delete: 'DELETE /api/career-history/:id'
      }
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Mount resource routes
router.use('/employees', employeeRoutes);
router.use('/documents', documentRoutes);
router.use('/work-experiences', workExperienceRoutes);
router.use('/education', educationRoutes);
router.use('/career-history', careerHistoryRoutes);

module.exports = router;
