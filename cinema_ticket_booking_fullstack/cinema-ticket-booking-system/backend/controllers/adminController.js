const User = require('../models/User');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalMovies, totalCinemas, bookings] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Cinema.countDocuments(),
      Booking.find().populate('movie', 'title genre'),
    ]);

    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const movieStatsMap = {};
    for (const b of confirmedBookings) {
      const title = b.movie?.title || 'Unknown';
      if (!movieStatsMap[title]) {
        movieStatsMap[title] = { title, bookings: 0, tickets: 0, revenue: 0 };
      }
      movieStatsMap[title].bookings += 1;
      movieStatsMap[title].tickets += b.seats.length;
      movieStatsMap[title].revenue += b.totalAmount;
    }

    const popularMovies = Object.values(movieStatsMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalMovies,
        totalCinemas,
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        totalRevenue,
        popularMovies,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('movie', 'title')
      .populate('cinema', 'name location')
      .populate('payment')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};
