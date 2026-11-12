const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cineverse');
    await Promise.all([
      User.deleteMany(),
      Movie.deleteMany(),
      Cinema.deleteMany(),
      Show.deleteMany(),
      Seat.deleteMany(),
      Booking.deleteMany(),
      Payment.deleteMany(),
    ]);

    await User.create([
      {
        name: 'System Administrator',
        email: 'admin@cineverse.com',
        password: 'Admin@123',
        phone: '+91 98765 00001',
        role: 'admin',
      },
      {
        name: 'Customer Account',
        email: 'customer@cineverse.com',
        password: 'Customer@123',
        phone: '+91 98201 44510',
        role: 'customer',
      },
    ]);

    const movies = await Movie.create([
      {
        title: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
        poster: 'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        language: ['English', 'Hindi', 'Tamil'],
        duration: 166,
        releaseDate: new Date('2024-03-01'),
        rating: 8.4,
        certification: 'U/A',
        director: 'Denis Villeneuve',
        cast: [
          { name: 'Timothée Chalamet', role: 'Paul Atreides' },
          { name: 'Zendaya', role: 'Chani' },
          { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
          { name: 'Javier Bardem', role: 'Stilgar' },
        ],
        isFeatured: true,
      },
      {
        title: 'Kalki 2898 AD',
        description:
          'Set in a post-apocalyptic world in the year 2898 AD, a modern-day avatar of Vishnu descends to Earth to protect the world from dark forces.',
        poster: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
        genre: ['Sci-Fi', 'Action', 'Adventure'],
        language: ['Telugu', 'Hindi', 'Tamil', 'English'],
        duration: 181,
        releaseDate: new Date('2024-06-27'),
        rating: 8.2,
        certification: 'U/A',
        director: 'Nag Ashwin',
        cast: [
          { name: 'Prabhas', role: 'Bhairava' },
          { name: 'Amitabh Bachchan', role: 'Ashwatthama' },
          { name: 'Deepika Padukone', role: 'SUM-80' },
          { name: 'Kamal Haasan', role: 'Supreme Yaskin' },
        ],
        isFeatured: true,
      },
      {
        title: 'Stree 2: Sarkate Ka Aatank',
        description:
          'After the events of Stree, the town of Chanderi is haunted again by a headless entity known as Sarkata, and Vicky and his friends must save their town.',
        poster: 'https://upload.wikimedia.org/wikipedia/en/a/a1/Stree_2.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=KVnheXywIbY',
        genre: ['Drama', 'Thriller', 'Adventure'],
        language: ['Hindi'],
        duration: 149,
        releaseDate: new Date('2024-08-15'),
        rating: 8.0,
        certification: 'U/A',
        director: 'Amar Kaushik',
        cast: [
          { name: 'Shraddha Kapoor', role: 'Mystery Woman' },
          { name: 'Rajkummar Rao', role: 'Vicky' },
          { name: 'Pankaj Tripathi', role: 'Rudra' },
          { name: 'Abhishek Banerjee', role: 'Jana' },
        ],
        isFeatured: true,
      },
      {
        title: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        poster: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        genre: ['Drama', 'Thriller'],
        language: ['English', 'Hindi'],
        duration: 180,
        releaseDate: new Date('2023-07-21'),
        rating: 8.9,
        certification: 'U/A',
        director: 'Christopher Nolan',
        cast: [
          { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
          { name: 'Emily Blunt', role: 'Kitty Oppenheimer' },
          { name: 'Matt Damon', role: 'Gen. Leslie Groves' },
          { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
        ],
        isFeatured: false,
      },
    ]);

    const cinemas = await Cinema.create([
      {
        name: 'PVR IMAX Palladium',
        location: 'Lower Parel, Phoenix Palladium Mall',
        city: 'Mumbai',
        amenities: ['IMAX with Laser', 'Dolby Atmos', 'VIP Recliner Lounge', 'Valet Parking'],
        screens: [
          { name: 'Audi 1 - IMAX Laser', screenType: 'IMAX Laser', seatCapacity: 96 },
          { name: 'Audi 2 - Gold Class', screenType: 'Gold Class', seatCapacity: 96 },
        ],
        seatCapacity: 192,
      },
      {
        name: 'INOX Megaplex Inorbit',
        location: 'Link Road, Malad West',
        city: 'Mumbai',
        amenities: ['4DX Motion Seats', 'Dolby Atmos 7.1', 'Valet Parking'],
        screens: [
          { name: 'Screen 1 - Dolby Atmos', screenType: 'Dolby Atmos', seatCapacity: 96 },
        ],
        seatCapacity: 96,
      },
    ]);

    const show = await Show.create({
      movie: movies[0]._id,
      cinema: cinemas[0]._id,
      screen: 'Audi 1 - IMAX Laser',
      screenType: 'IMAX Laser',
      date: '2026-11-12',
      time: '19:30',
      ticketPrice: { regular: 260, premium: 390, vip: 580 },
      totalSeats: 96,
      availableSeats: 96,
      bookedSeats: [],
    });

    // Populate clean 96-seat inventory with 0 fake booked seats
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
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
      for (let c = 1; c <= 12; c++) {
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

    console.log('Clean database seeded successfully (0 pre-booked seats, 0 fake bookings)!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
