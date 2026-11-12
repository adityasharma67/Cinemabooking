const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { uploadPoster } = require('../config/cloudinary');

exports.getMovies = async (req, res, next) => {
  try {
    const { search, genre, language } = req.query;
    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (genre && genre !== 'All') {
      filter.genre = genre;
    }
    if (language && language !== 'All') {
      filter.language = language;
    }
    const movies = await Movie.find(filter).sort({ releaseDate: -1 });
    res.json({ success: true, count: movies.length, movies });
  } catch (err) {
    next(err);
  }
};

exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    const shows = await Show.find({ movie: movie._id }).populate('cinema');
    res.json({ success: true, movie, shows });
  } catch (err) {
    next(err);
  }
};

exports.createMovie = async (req, res, next) => {
  try {
    let posterUrl = req.body.poster;
    if (posterUrl && posterUrl.startsWith('data:image')) {
      const uploaded = await uploadPoster(posterUrl);
      posterUrl = uploaded.secure_url;
    }
    const movie = await Movie.create({ ...req.body, poster: posterUrl });
    res.status(201).json({ success: true, movie });
  } catch (err) {
    next(err);
  }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    res.json({ success: true, movie });
  } catch (err) {
    next(err);
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      res.status(404);
      throw new Error('Movie not found');
    }
    await Show.deleteMany({ movie: movie._id });
    res.json({ success: true, message: 'Movie and associated shows deleted' });
  } catch (err) {
    next(err);
  }
};
