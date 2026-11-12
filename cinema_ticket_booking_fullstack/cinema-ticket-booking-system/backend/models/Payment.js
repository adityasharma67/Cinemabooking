const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true, unique: true },
    method: { type: String, enum: ['Card', 'UPI'], required: true },
    maskedIdentifier: { type: String, required: true }, // e.g. "**** 4242" or "user@okaxis"
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['success', 'failed', 'refunded'], default: 'success' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
