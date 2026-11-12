const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);
router.route('/:id').get(protect, getBookingById).delete(protect, cancelBooking);

module.exports = router;
