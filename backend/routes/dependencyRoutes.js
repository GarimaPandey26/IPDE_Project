const express = require('express');
const router = express.Router();
const dependencyController = require('../controllers/dependencyController');
const auth = require('../middleware/auth');

// All endpoints require a logged-in user session
router.get('/', auth, dependencyController.getDependencies);
router.post('/', auth, dependencyController.createDependency);
router.delete('/:id', auth, dependencyController.deleteDependency);
router.get('/impact/:componentId', auth, dependencyController.getImpactAnalysis);

module.exports = router;
