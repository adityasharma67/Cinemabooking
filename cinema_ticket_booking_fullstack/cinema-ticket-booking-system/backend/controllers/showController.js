const Show = require('../models/Show');
const Seat = require('../models/Seat');

const initializeShowSeats = async (show) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = 12;
  const seatDocs = [];
  for (const r of rows) {
    const category = ['A', 'B', 'C'].includes(r)
      ? 'Regular'
      : ['D', 'E', 'F'].includes(r)
      ? 'Premium'
      : 'VIP';
    const price =
      category === 'Regular'
        ? show.ticketPrice.regular
        : category === 'Premium'
        ? show.ticketPrice.premium
        : show.ticketPrice.vip;
    for (let c = 1; c <= cols; c++) {
      seatDocs.push({
        show: show._id,
        seatNumber: `${r}${c}`,
        row: r,
        column: c,
        category,
        price,
        status: 'available',
      });
    }
  }
  await Seat.insertMany(seatDocs);
};

exports.getShows = async (req, res, next) => {
  try {
    const { movieId, cinemaId, date } = req.query;
    const filter = {};
    if (movieId) filter.movie = movieId;
    if (cinemaId) filter.cinema = cinemaId;
    if (date) filter.date = date;

    const shows = await Show.find(filter)
      .populate('movie', 'title poster duration certification genre language')
      .populate('cinema', 'name location city amenities')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, shows });
  } catch (err) {
    next(err);
  }
};

exports.getShowSeats = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id).populate('movie').populate('cinema');
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }
    // Release expired locks
    await Seat.updateMany(
      { show: show._id, status: 'locked', lockedUntil: { $lt: new Date() } },
      { $set: { status: 'available', lockedBy: null, lockedUntil: null } }
    );
    const seats = await Seat.find({ show: show._id }).sort({ row: 1, column: 1 });
    res.json({ success: true, show, seats });
  } catch (err) {
    next(err);
  }
};

exports.lockSeats = async (req, res, next) => {
  try {
    const { seatNumbers } = req.body;
    const showId = req.params.id;
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 min lock

    const seats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    const unavailable = seats.filter(
      (s) =>
        s.status === 'booked' ||
        (s.status === 'locked' &&
          s.lockedUntil > now &&
          String(s.lockedBy) !== String(req.user._id))
    );

    if (unavailable.length > 0) {
      res.status(409);
      throw new Error(
        `Seats ${unavailable.map((s) => s.seatNumber).join(', ')} are already taken or locked`
      );
    }

    await Seat.updateMany(
      { show: showId, seatNumber: { $in: seatNumbers } },
      { $set: { status: 'locked', lockedBy: req.user._id, lockedUntil: lockExpiry } }
    );

    res.json({
      success: true,
      message: 'Seats locked for 10 minutes',
      lockedUntil: lockExpiry,
    });
  } catch (err) {
    next(err);
  }
};

exports.createShow = async (req, res, next) => {
  try {
    const show = await Show.create(req.body);
    await initializeShowSeats(show);
    res.status(201).json({ success: true, show });
  } catch (err) {
    next(err);
  }
};

exports.updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }
    res.json({ success: true, show });
  } catch (err) {
    next(err);
  }
};

exports.deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }
    await Seat.deleteMany({ show: show._id });
    res.json({ success: true, message: 'Show and seat inventory deleted' });
  } catch (err) {
    next(err);
  }
};
