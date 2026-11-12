const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowSeats,
  lockSeats,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getShows).post(protect, authorize('admin'), createShow);
router.get('/:id/seats', getShowSeats);
router.post('/:id/lock', protect, lockSeats);
router
  .route('/:id')
  .put(protect, authorize('admin'), updateShow)
  .delete(protect, authorize('admin'), deleteShow);

module.exports = router;
