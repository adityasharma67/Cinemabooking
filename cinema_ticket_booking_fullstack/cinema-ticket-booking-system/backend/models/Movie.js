const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Movie title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    poster: { type: String, required: [true, 'Poster URL is required'] },
    backdrop: { type: String, default: '' },
    trailerUrl: { type: String, required: [true, 'Trailer URL is required'] },
    genre: [{ type: String, required: true }],
    language: [{ type: String, required: true }],
    duration: { type: Number, required: [true, 'Duration in minutes is required'] },
    releaseDate: { type: Date, required: true },
    rating: { type: Number, default: 8.5, min: 0, max: 10 },
    certification: { type: String, enum: ['U', 'U/A', 'A', 'PG-13', 'R'], default: 'U/A' },
    director: { type: String, default: '' },
    cast: [
      {
        name: { type: String, required: true },
        role: { type: String, required: true },
      },
    ],
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
