const express = require('express');
const router = express.Router();

const employeeRoutes = require('./employeeRoutes');
const documentRoutes = require('./documentRoutes');
const workExperienceRoutes = require('./workExperienceRoutes');
const educationRoutes = require('./educationRoutes');
const careerHistoryRoutes = require('./careerHistoryRoutes');
const familyRoutes = require('./familyRoutes');
const masterDataRoutes = require('./masterDataRoutes');
const organizationRoutes = require('./organizationRoutes');
const jobLevelRoutes = require('./jobLevelRoutes');
const positionRoutes = require('./positionRoutes');
const recruitmentRoutes = require('./recruitmentRoutes');

// Service health check and meta
router.get('/', (req, res) => {
  res.json({
    service: 'Wiseape HRIS Microservice REST API',
    version: '1.0.0',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    endpoints: {
      masterData: '/api/master-data',
      organizations: '/api/organizations',
      jobLevels: '/api/job-levels',
      positions: '/api/positions',
      employees: '/api/employees',
      documents: '/api/documents',
      workExperiences: '/api/work-experiences',
      education: '/api/education',
      careerHistory: '/api/career-history',
      family: '/api/family',
      recruitment: '/api/recruitment'
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Mount resource routes
router.use('/master-data', masterDataRoutes);
router.use('/organizations', organizationRoutes);
router.use('/job-levels', jobLevelRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/documents', documentRoutes);
router.use('/work-experiences', workExperienceRoutes);
router.use('/education', educationRoutes);
router.use('/career-history', careerHistoryRoutes);
router.use('/family', familyRoutes);
router.use('/recruitment', recruitmentRoutes);

module.exports = router;
