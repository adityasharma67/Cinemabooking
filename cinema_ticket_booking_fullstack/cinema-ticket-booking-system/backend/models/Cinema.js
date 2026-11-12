const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  screenType: { type: String, enum: ['IMAX Laser', 'Dolby Atmos', '4DX', 'Gold Class'], default: 'Dolby Atmos' },
  rows: { type: Number, default: 8 },
  cols: { type: Number, default: 12 },
  seatCapacity: { type: Number, required: true },
});

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Cinema name is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'] },
    city: { type: String, default: 'Mumbai' },
    amenities: [{ type: String }],
    screens: [screenSchema],
    seatCapacity: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cinema', cinemaSchema);
