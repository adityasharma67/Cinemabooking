const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(getMovies).post(protect, authorize('admin'), createMovie);
router
  .route('/:id')
  .get(getMovieById)
  .put(protect, authorize('admin'), updateMovie)
  .delete(protect, authorize('admin'), deleteMovie);

module.exports = router;
