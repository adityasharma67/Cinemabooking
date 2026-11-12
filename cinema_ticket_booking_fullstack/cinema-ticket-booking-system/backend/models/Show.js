const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    screen: { type: String, required: true },
    screenType: { type: String, default: 'IMAX Laser' },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // e.g., "19:30"
    ticketPrice: {
      regular: { type: Number, required: true, default: 220 },
      premium: { type: Number, required: true, default: 340 },
      vip: { type: Number, required: true, default: 520 },
    },
    totalSeats: { type: Number, default: 96 },
    availableSeats: { type: Number, default: 96 },
    bookedSeats: [{ type: String }],
    lockedSeats: [
      {
        seatId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        expiresAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Show', showSchema);
