const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const { generateTicketQR } = require('../utils/qrGenerator');
const { sendTicketConfirmationEmail } = require('../utils/emailService');

exports.createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers, paymentMethod, maskedIdentifier } = req.body;
    if (!showId || !seatNumbers || seatNumbers.length === 0) {
      res.status(400);
      throw new Error('Show and seats are required');
    }

    const show = await Show.findById(showId).populate('movie').populate('cinema');
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }

    const seats = await Seat.find({ show: showId, seatNumber: { $in: seatNumbers } });
    const alreadyBooked = seats.filter((s) => s.status === 'booked');
    if (alreadyBooked.length > 0 || show.bookedSeats.some((b) => seatNumbers.includes(b))) {
      res.status(409);
      throw new Error(
        `Double-booking prevented: Seats ${alreadyBooked.map((s) => s.seatNumber).join(', ')} are already booked.`
      );
    }

    const seatItems = seatNumbers.map((sn) => {
      const row = sn.charAt(0);
      const category = ['A', 'B', 'C'].includes(row)
        ? 'Regular'
        : ['D', 'E', 'F'].includes(row)
        ? 'Premium'
        : 'VIP';
      const price =
        category === 'Regular'
          ? show.ticketPrice.regular
          : category === 'Premium'
          ? show.ticketPrice.premium
          : show.ticketPrice.vip;
      return { seatNumber: sn, category, price };
    });

    const subTotal = seatItems.reduce((sum, item) => sum + item.price, 0);
    const convenienceFee = Math.round(seatItems.length * 35);
    const taxAmount = Math.round((subTotal + convenienceFee) * 0.18);
    const totalAmount = subTotal + convenienceFee + taxAmount;

    const bookingCode = `CV-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const qrCodeDataUrl = await generateTicketQR({
      bookingCode,
      movie: show.movie.title,
      cinema: show.cinema.name,
      screen: show.screen,
      date: show.date,
      time: show.time,
      seats: seatNumbers,
    });

    const booking = await Booking.create({
      bookingCode,
      user: req.user._id,
      show: show._id,
      movie: show.movie._id,
      cinema: show.cinema._id,
      screen: show.screen,
      showDate: show.date,
      showTime: show.time,
      seats: seatItems,
      subTotal,
      convenienceFee,
      taxAmount,
      totalAmount,
      qrCodeDataUrl,
      status: 'confirmed',
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      transactionId: `TXN-${Date.now()}`,
      method: paymentMethod || 'Card',
      maskedIdentifier: maskedIdentifier || '**** 4242',
      amount: totalAmount,
      status: 'success',
    });

    booking.payment = payment._id;
    await booking.save();

    await Seat.updateMany(
      { show: show._id, seatNumber: { $in: seatNumbers } },
      { $set: { status: 'booked', lockedBy: null, lockedUntil: null } }
    );

    show.bookedSeats.push(...seatNumbers);
    show.availableSeats = Math.max(0, show.totalSeats - show.bookedSeats.length);
    await show.save();

    await sendTicketConfirmationEmail({
      to: req.user.email,
      customerName: req.user.name,
      booking,
    });

    const populated = await Booking.findById(booking._id)
      .populate('movie')
      .populate('cinema')
      .populate('payment');

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    next(err);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('movie', 'title poster duration certification language genre')
      .populate('cinema', 'name location city')
      .populate('payment')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie')
      .populate('cinema')
      .populate('payment')
      .populate('user', 'name email phone');
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }
    if (
      String(booking.user._id) !== String(req.user._id) &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      throw new Error('Not authorized to view this booking');
    }
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }
    if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
    }
    if (booking.status === 'cancelled') {
      res.status(400);
      throw new Error('Booking is already cancelled');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    await Seat.updateMany(
      { show: booking.show, seatNumber: { $in: seatNumbers } },
      { $set: { status: 'available', lockedBy: null, lockedUntil: null } }
    );

    const show = await Show.findById(booking.show);
    if (show) {
      show.bookedSeats = show.bookedSeats.filter((sn) => !seatNumbers.includes(sn));
      show.availableSeats = Math.min(show.totalSeats, show.totalSeats - show.bookedSeats.length);
      await show.save();
    }

    if (booking.payment) {
      await Payment.findByIdAndUpdate(booking.payment, { status: 'refunded' });
    }

    res.json({ success: true, message: 'Booking cancelled and seats released', booking });
  } catch (err) {
    next(err);
  }
};
