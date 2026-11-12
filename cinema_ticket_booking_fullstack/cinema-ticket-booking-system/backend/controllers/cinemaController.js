const Cinema = require('../models/Cinema');

exports.getCinemas = async (req, res, next) => {
  try {
    const cinemas = await Cinema.find().sort({ name: 1 });
    res.json({ success: true, cinemas });
  } catch (err) {
    next(err);
  }
};

exports.createCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.create(req.body);
    res.status(201).json({ success: true, cinema });
  } catch (err) {
    next(err);
  }
};

exports.updateCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cinema) {
      res.status(404);
      throw new Error('Cinema not found');
    }
    res.json({ success: true, cinema });
  } catch (err) {
    next(err);
  }
};

exports.deleteCinema = async (req, res, next) => {
  try {
    await Cinema.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Cinema deleted' });
  } catch (err) {
    next(err);
  }
};
