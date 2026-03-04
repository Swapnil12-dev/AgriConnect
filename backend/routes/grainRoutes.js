const express = require('express');
const router = express.Router();
const { addGrain, getAllGrains } = require('../controllers/grainController');

router.post('/', addGrain);       // POST to /api/grains will trigger addGrain
router.get('/', getAllGrains);    // GET to /api/grains will trigger getAllGrains

module.exports = router;