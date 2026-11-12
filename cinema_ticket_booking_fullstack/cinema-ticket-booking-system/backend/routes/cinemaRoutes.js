const express = require('express');
const router = express.Router();
const {
  getCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
} = require('../controllers/cinemaController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getCinemas).post(protect, authorize('admin'), createCinema);
router
  .route('/:id')
  .put(protect, authorize('admin'), updateCinema)
  .delete(protect, authorize('admin'), deleteCinema);

module.exports = router;
