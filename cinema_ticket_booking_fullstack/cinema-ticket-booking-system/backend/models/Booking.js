const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    screen: { type: String, required: true },
    showDate: { type: String, required: true },
    showTime: { type: String, required: true },
    seats: [
      {
        seatNumber: { type: String, required: true },
        category: { type: String, enum: ['Regular', 'Premium', 'VIP'], required: true },
        price: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    convenienceFee: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    qrCodeDataUrl: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
