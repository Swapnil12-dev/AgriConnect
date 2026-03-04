const express = require('express');
const router = express.Router();

// Make sure it is lowercase "d" here:
const { makePitch, getFarmerPitches, getBuyerPitches, updatePitchStatus, deletePitch } = require('../controllers/pitchController');

router.post('/', makePitch);
router.get('/farmer/:farmer_id', getFarmerPitches);
router.get('/buyer/:buyer_id', getBuyerPitches);
router.put('/:id/status', updatePitchStatus);

// Make sure it is lowercase "d" here too:
router.delete('/:id', deletePitch);

module.exports = router;