const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getAllBookings,
  getAllUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));
router.get('/analytics', getDashboardAnalytics);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);

module.exports = router;
