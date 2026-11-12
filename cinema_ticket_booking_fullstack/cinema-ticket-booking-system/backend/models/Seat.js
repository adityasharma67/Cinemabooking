const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    seatNumber: { type: String, required: true }, // e.g., "A1", "E6", "H10"
    row: { type: String, required: true },
    column: { type: Number, required: true },
    category: { type: String, enum: ['Regular', 'Premium', 'VIP'], required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available' },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
