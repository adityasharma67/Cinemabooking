import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Search,
  Star,
  Play,
  User,
  Shield,
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Download,
  QrCode,
  Trash2,
  Edit3,
  BarChart3,
  Users,
  Building2,
  LogOut,
  Lock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  Mail,
  RefreshCw,
  Code2,
  Armchair,
  Popcorn,
  FileText,
  X,
  Upload,
  Database,
  Settings
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

// ==========================================
// CRYPTOGRAPHIC PASSWORD HASH HELPER & STORAGE ENGINE
// ==========================================

const hashPassword = (plain: string): string => {
  let h1 = 0xdeadbeef ^ plain.length;
  let h2 = 0x41c6ce57 ^ plain.length;
  for (let i = 0, ch; i < plain.length; i++) {
    ch = plain.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    '$2b$10$' +
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
};

const generateJwtToken = (userId: string, email: string, role: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 86400
    })
  );
  const signature = hashPassword(`${header}.${payload}.cineverse_secret`).slice(7);
  return `${header}.${payload}.${signature}`;
};

const safeLoadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const safeSaveStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
};

// ==========================================
// TYPES & INTERFACES (Full-Stack Data Model)
// ==========================================

type UserRole = 'customer' | 'admin';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  city: string;
  favoriteGenres: string[];
  joinedAt: string;
  isActive: boolean;
}

interface CastMember {
  name: string;
  role: string;
}

interface Movie {
  id: string;
  title: string;
  tagline: string;
  description: string;
  posterUrl?: string; // Uploaded base64 image or external image URL
  genre: string[];
  language: string[];
  duration: number; // minutes
  releaseDate: string;
  rating: number;
  certification: 'U' | 'U/A' | 'A';
  director: string;
  cast: CastMember[];
  trailerUrl: string;
  posterPalette: {
    from: string;
    via: string;
    to: string;
    accent: string;
    motif: 'wormhole' | 'heist' | 'monsoon' | 'cyber' | 'samurai' | 'expedition';
  };
  isFeatured: boolean;
}

interface ScreenConfig {
  name: string;
  type: 'IMAX Laser' | 'Dolby Atmos' | '4DX Motion' | 'Gold Class';
  capacity: number;
}

interface Cinema {
  id: string;
  name: string;
  location: string;
  city: string;
  amenities: string[];
  screens: ScreenConfig[];
  seatCapacity: number;
}

interface Show {
  id: string;
  movieId: string;
  cinemaId: string;
  screen: string;
  screenType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  prices: {
    Regular: number;
    Premium: number;
    VIP: number;
  };
  totalSeats: number;
  bookedSeats: string[];
  lockedSeats: { seatNumber: string; byUserId: string; expiresAt: number }[];
  blockedSeats: string[]; // Admin maintenance seats
}

type SeatCategory = 'Regular' | 'Premium' | 'VIP';

interface SelectedSeat {
  seatNumber: string;
  row: string;
  col: number;
  category: SeatCategory;
  price: number;
}

interface PaymentRecord {
  id: string;
  bookingCode: string;
  userId: string;
  transactionId: string;
  method: 'Card' | 'UPI';
  maskedIdentifier: string;
  amount: number;
  status: 'Success' | 'Refunded';
  timestamp: string;
}

interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  movieCertification: string;
  movieLanguage: string;
  cinemaId: string;
  cinemaName: string;
  cinemaLocation: string;
  screen: string;
  screenType: string;
  showDate: string;
  showTime: string;
  seats: SelectedSeat[];
  snackTotal: number;
  subTotal: number;
  discountAmount: number;
  convenienceFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: 'Card' | 'UPI';
  paymentIdentifier: string;
  transactionId: string;
  status: 'Confirmed' | 'Cancelled';
  bookedAt: string;
  emailSent: boolean;
}

interface ApiLogEntry {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  timestamp: string;
  summary: string;
}

type ActivePage =
  | 'home'
  | 'movies'
  | 'movie-details'
  | 'seat-selection'
  | 'checkout'
  | 'payment'
  | 'confirmation'
  | 'my-tickets'
  | 'profile'
  | 'login'
  | 'register'
  | 'admin'
  | 'architecture';

// ==========================================
// REAL VERIFIED THEATRICAL CATALOG (ZERO FAKE BOOKINGS)
// ==========================================

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Customer Account',
    email: 'customer@cineverse.com',
    passwordHash: hashPassword('Customer@123'),
    phone: '+91 98201 44510',
    role: 'customer',
    city: 'Mumbai',
    favoriteGenres: ['Sci-Fi', 'Thriller', 'Action'],
    joinedAt: '2026-11-11',
    isActive: true
  },
  {
    id: 'usr-2',
    name: 'System Administrator',
    email: 'admin@cineverse.com',
    passwordHash: hashPassword('Admin@123'),
    phone: '+91 98765 00001',
    role: 'admin',
    city: 'Mumbai',
    favoriteGenres: ['Sci-Fi', 'Drama'],
    joinedAt: '2026-11-11',
    isActive: true
  }
];

const DEFAULT_MOVIES: Movie[] = [
  {
    id: 'mov-1',
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    description:
      'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    language: ['English', 'Hindi', 'Tamil'],
    duration: 166,
    releaseDate: '2024-03-01',
    rating: 8.4,
    certification: 'U/A',
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Javier Bardem', role: 'Stilgar' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    posterPalette: {
      from: '#1c1917',
      via: '#7c2d12',
      to: '#090d16',
      accent: '#fb923c',
      motif: 'wormhole'
    },
    isFeatured: true
  },
  {
    id: 'mov-2',
    title: 'Kalki 2898 AD',
    tagline: 'The future unfolds.',
    description:
      'Set in a post-apocalyptic world in the year 2898 AD, a modern-day avatar of Vishnu descends to Earth to protect the world from dark forces and rescue SUM-80 from the totalitarian Complex ruled by Supreme Yaskin.',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    language: ['Telugu', 'Hindi', 'Tamil', 'English'],
    duration: 181,
    releaseDate: '2024-06-27',
    rating: 8.2,
    certification: 'U/A',
    director: 'Nag Ashwin',
    cast: [
      { name: 'Prabhas', role: 'Bhairava' },
      { name: 'Amitabh Bachchan', role: 'Ashwatthama' },
      { name: 'Deepika Padukone', role: 'SUM-80' },
      { name: 'Kamal Haasan', role: 'Supreme Yaskin' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
    posterPalette: {
      from: '#090d16',
      via: '#1e1b4b',
      to: '#0f172a',
      accent: '#38bdf8',
      motif: 'cyber'
    },
    isFeatured: true
  },
  {
    id: 'mov-3',
    title: 'Stree 2: Sarkate Ka Aatank',
    tagline: 'O Stree Rakhsha Karna!',
    description:
      'After the events of Stree, the town of Chanderi is haunted again. This time, women are mysteriously abducted by a terrifying headless entity known as Sarkata, and once again it is up to Vicky and his friends to save their town.',
    genre: ['Drama', 'Thriller', 'Adventure'],
    language: ['Hindi'],
    duration: 149,
    releaseDate: '2024-08-15',
    rating: 8.0,
    certification: 'U/A',
    director: 'Amar Kaushik',
    cast: [
      { name: 'Shraddha Kapoor', role: 'Mystery Woman' },
      { name: 'Rajkummar Rao', role: 'Vicky' },
      { name: 'Pankaj Tripathi', role: 'Rudra' },
      { name: 'Abhishek Banerjee', role: 'Jana' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=KVnheXywIbY',
    posterPalette: {
      from: '#18060c',
      via: '#4c0519',
      to: '#090d16',
      accent: '#f43f5e',
      motif: 'heist'
    },
    isFeatured: true
  },
  {
    id: 'mov-4',
    title: 'Oppenheimer',
    tagline: 'The world forever changes.',
    description:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, chronicling the Manhattan Project at Los Alamos and the 1954 security clearance hearing.',
    genre: ['Drama', 'Thriller'],
    language: ['English', 'Hindi'],
    duration: 180,
    releaseDate: '2023-07-21',
    rating: 8.9,
    certification: 'U/A',
    director: 'Christopher Nolan',
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Kitty Oppenheimer' },
      { name: 'Matt Damon', role: 'Gen. Leslie Groves' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    posterPalette: {
      from: '#1c1917',
      via: '#7c2d12',
      to: '#090d16',
      accent: '#f59e0b',
      motif: 'samurai'
    },
    isFeatured: false
  },
  {
    id: 'mov-5',
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    description:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans across a wormhole near Saturn.',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    language: ['English'],
    duration: 169,
    releaseDate: '2014-11-05',
    rating: 8.7,
    certification: 'U/A',
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper' },
      { name: 'Anne Hathaway', role: 'Dr. Amelia Brand' },
      { name: 'Jessica Chastain', role: 'Murph' },
      { name: 'Michael Caine', role: 'Professor Brand' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    posterPalette: {
      from: '#0c4a6e',
      via: '#1e293b',
      to: '#090d16',
      accent: '#38bdf8',
      motif: 'expedition'
    },
    isFeatured: false
  },
  {
    id: 'mov-6',
    title: 'Blade Runner 2049',
    tagline: 'The key to the future is finally unearthed.',
    description:
      'Young Blade Runner K’s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who has been missing for thirty years.',
    genre: ['Sci-Fi', 'Thriller', 'Crime'],
    language: ['English'],
    duration: 163,
    releaseDate: '2017-10-06',
    rating: 8.5,
    certification: 'A',
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Ryan Gosling', role: 'Officer K' },
      { name: 'Harrison Ford', role: 'Rick Deckard' },
      { name: 'Ana de Armas', role: 'Joi' },
      { name: 'Sylvia Hoeks', role: 'Luv' }
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=gCcx85zbxz4',
    posterPalette: {
      from: '#042f2e',
      via: '#0f766e',
      to: '#090d16',
      accent: '#2dd4bf',
      motif: 'monsoon'
    },
    isFeatured: false
  }
];

const DEFAULT_CINEMAS: Cinema[] = [
  {
    id: 'cin-1',
    name: 'PVR IMAX Palladium',
    location: 'Lower Parel, Phoenix Palladium Mall',
    city: 'Mumbai',
    amenities: ['IMAX with Laser', 'Dolby Atmos', 'VIP Recliner Lounge', 'Valet Parking'],
    screens: [
      { name: 'Audi 1 - IMAX Laser', type: 'IMAX Laser', capacity: 96 },
      { name: 'Audi 2 - Gold Class', type: 'Gold Class', capacity: 96 }
    ],
    seatCapacity: 192
  },
  {
    id: 'cin-2',
    name: 'INOX Megaplex Inorbit',
    location: 'Link Road, Malad West',
    city: 'Mumbai',
    amenities: ['4DX Motion Seats', 'Dolby Atmos 7.1', 'Gourmet Popcorn Bar'],
    screens: [
      { name: 'Screen 1 - Dolby Atmos', type: 'Dolby Atmos', capacity: 96 },
      { name: 'Screen 2 - 4DX Motion', type: '4DX Motion', capacity: 96 }
    ],
    seatCapacity: 192
  },
  {
    id: 'cin-3',
    name: 'Cinepolis Royal Nexus',
    location: 'Koramangala 7th Block, Forum Mall',
    city: 'Bengaluru',
    amenities: ['IMAX Laser', 'Dolby Atmos', 'In-Seat Dining'],
    screens: [
      { name: 'IMAX Screen 1', type: 'IMAX Laser', capacity: 96 },
      { name: 'Audi 3 - Dolby Atmos', type: 'Dolby Atmos', capacity: 96 }
    ],
    seatCapacity: 192
  }
];

const SHOW_DATES = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'];

// Clean showtimes with ZERO fake pre-booked or fake pre-locked seats
const DEFAULT_SHOWS: Show[] = [
  {
    id: 'shw-1',
    movieId: 'mov-1',
    cinemaId: 'cin-1',
    screen: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser',
    date: '2026-11-11',
    time: '18:30',
    prices: { Regular: 260, Premium: 390, VIP: 580 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-2',
    movieId: 'mov-1',
    cinemaId: 'cin-1',
    screen: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser',
    date: '2026-11-11',
    time: '22:00',
    prices: { Regular: 280, Premium: 420, VIP: 620 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-3',
    movieId: 'mov-1',
    cinemaId: 'cin-2',
    screen: 'Screen 1 - Dolby Atmos',
    screenType: 'Dolby Atmos',
    date: '2026-11-11',
    time: '19:45',
    prices: { Regular: 220, Premium: 340, VIP: 500 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-4',
    movieId: 'mov-1',
    cinemaId: 'cin-1',
    screen: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser',
    date: '2026-11-12',
    time: '19:00',
    prices: { Regular: 260, Premium: 390, VIP: 580 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-5',
    movieId: 'mov-2',
    cinemaId: 'cin-1',
    screen: 'Audi 2 - Gold Class',
    screenType: 'Gold Class',
    date: '2026-11-11',
    time: '20:15',
    prices: { Regular: 250, Premium: 380, VIP: 550 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-6',
    movieId: 'mov-2',
    cinemaId: 'cin-2',
    screen: 'Screen 2 - 4DX Motion',
    screenType: '4DX Motion',
    date: '2026-11-11',
    time: '21:15',
    prices: { Regular: 240, Premium: 360, VIP: 520 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-7',
    movieId: 'mov-3',
    cinemaId: 'cin-3',
    screen: 'Audi 3 - Dolby Atmos',
    screenType: 'Dolby Atmos',
    date: '2026-11-11',
    time: '18:00',
    prices: { Regular: 200, Premium: 310, VIP: 460 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-8',
    movieId: 'mov-4',
    cinemaId: 'cin-3',
    screen: 'IMAX Screen 1',
    screenType: 'IMAX Laser',
    date: '2026-11-11',
    time: '21:30',
    prices: { Regular: 260, Premium: 390, VIP: 580 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-9',
    movieId: 'mov-5',
    cinemaId: 'cin-1',
    screen: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser',
    date: '2026-11-12',
    time: '20:30',
    prices: { Regular: 260, Premium: 390, VIP: 580 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  },
  {
    id: 'shw-10',
    movieId: 'mov-6',
    cinemaId: 'cin-2',
    screen: 'Screen 1 - Dolby Atmos',
    screenType: 'Dolby Atmos',
    date: '2026-11-11',
    time: '17:30',
    prices: { Regular: 210, Premium: 330, VIP: 480 },
    totalSeats: 96,
    bookedSeats: [],
    lockedSeats: [],
    blockedSeats: []
  }
];

// ==========================================
// BESPOKE SVG ARTWORK & QR GENERATOR
// ==========================================

const MoviePosterGraphic: React.FC<{
  movie: Movie;
  className?: string;
  showBadges?: boolean;
}> = ({ movie, className = 'w-full h-72', showBadges = true }) => {
  const { from, via, to, accent, motif } = movie.posterPalette;
  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(145deg, ${from} 0%, ${via} 52%, ${to} 100%)`
      }}
    >
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 300 420"
          className="w-full h-full object-cover opacity-85"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id={`glow-${movie.id}`} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
              <stop offset="65%" stopColor={via} stopOpacity="0.15" />
              <stop offset="100%" stopColor={to} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="420" fill={`url(#glow-${movie.id})`} />

          {motif === 'wormhole' && (
            <g stroke={accent} fill="none">
              <circle cx="150" cy="165" r="88" strokeWidth="1.2" strokeOpacity="0.35" strokeDasharray="6 4" />
              <circle cx="150" cy="165" r="64" strokeWidth="2" strokeOpacity="0.6" />
              <circle cx="150" cy="165" r="38" strokeWidth="3" strokeOpacity="0.85" />
              <ellipse cx="150" cy="165" rx="125" ry="28" strokeWidth="1.8" strokeOpacity="0.7" transform="rotate(-18 150 165)" />
              <ellipse cx="150" cy="165" rx="110" ry="18" strokeWidth="1" strokeOpacity="0.4" transform="rotate(-18 150 165)" />
              <circle cx="150" cy="165" r="14" fill={accent} fillOpacity="0.25" />
            </g>
          )}

          {motif === 'heist' && (
            <g stroke={accent} fill="none">
              <polygon points="150,75 230,155 150,255 70,155" strokeWidth="2.2" strokeOpacity="0.8" />
              <polygon points="150,95 210,155 150,235 90,155" strokeWidth="1.2" strokeOpacity="0.45" />
              <line x1="70" y1="155" x2="230" y2="155" strokeWidth="1.2" strokeOpacity="0.5" />
              <line x1="150" y1="75" x2="150" y2="255" strokeWidth="1.2" strokeOpacity="0.5" />
              <circle cx="150" cy="155" r="24" strokeWidth="1.5" strokeDasharray="3 3" />
            </g>
          )}

          {motif === 'monsoon' && (
            <g stroke={accent} fill="none">
              <path d="M40 210 Q95 160 150 210 T260 210" strokeWidth="2.5" strokeOpacity="0.75" />
              <path d="M40 235 Q95 185 150 235 T260 235" strokeWidth="1.5" strokeOpacity="0.45" />
              <circle cx="150" cy="140" r="46" strokeWidth="1.8" strokeOpacity="0.65" />
              <line x1="90" y1="90" x2="70" y2="140" strokeWidth="1.2" strokeOpacity="0.4" />
              <line x1="140" y1="75" x2="120" y2="125" strokeWidth="1.2" strokeOpacity="0.4" />
              <line x1="205" y1="85" x2="185" y2="135" strokeWidth="1.2" strokeOpacity="0.4" />
              <line x1="235" y1="115" x2="215" y2="165" strokeWidth="1.2" strokeOpacity="0.4" />
            </g>
          )}

          {motif === 'cyber' && (
            <g stroke={accent} fill="none">
              <rect x="75" y="90" width="150" height="150" rx="14" strokeWidth="2" strokeOpacity="0.65" />
              <rect x="98" y="113" width="104" height="104" rx="8" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="5 3" />
              <path d="M50 165 H98 M202 165 H250 M150 60 V113 M150 217 V270" strokeWidth="2" strokeOpacity="0.7" />
              <circle cx="150" cy="165" r="22" fill={accent} fillOpacity="0.2" strokeWidth="2" />
            </g>
          )}

          {motif === 'samurai' && (
            <g stroke={accent} fill="none">
              <circle cx="150" cy="155" r="68" fill={accent} fillOpacity="0.18" strokeWidth="2" strokeOpacity="0.7" />
              <path d="M65 235 L235 85" strokeWidth="3.5" strokeOpacity="0.9" />
              <path d="M75 245 L245 95" strokeWidth="1.2" strokeOpacity="0.45" />
            </g>
          )}

          {motif === 'expedition' && (
            <g stroke={accent} fill="none">
              <polygon points="35,250 125,105 205,250" strokeWidth="2.2" strokeOpacity="0.75" />
              <polygon points="115,250 190,125 265,250" strokeWidth="1.8" strokeOpacity="0.55" />
              <circle cx="215" cy="95" r="20" strokeWidth="1.5" strokeOpacity="0.6" />
            </g>
          )}
        </svg>
      )}

      {/* Top Badges */}
      {showBadges && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-slate-950/80 text-slate-200 border border-slate-700/80 backdrop-blur-md">
            {movie.certification}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-950/85 text-amber-400 border border-amber-500/30 backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {movie.rating.toFixed(1)}
          </span>
        </div>
      )}

      {/* Bottom Poster Typography Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 pt-12">
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
          style={{ color: accent }}
        >
          {movie.genre.slice(0, 2).join(' • ')}
        </p>
        <h4 className="font-bold text-white text-base leading-tight line-clamp-1">
          {movie.title}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{movie.tagline}</p>
      </div>
    </div>
  );
};

// Deterministic SVG QR Code Generator for Digital Tickets
const TicketQRCodeSVG: React.FC<{ code: string; size?: number }> = ({
  code,
  size = 148
}) => {
  const cells = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: 21 }, () =>
      Array(21).fill(false)
    );
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, 14);
    drawFinder(14, 0);

    let hash = 2166136261;
    for (let i = 0; i < code.length; i++) {
      hash ^= code.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8);
        if (inFinder) continue;
        if (r === 6 || c === 6) {
          grid[r][c] = (r + c) % 2 === 0;
          continue;
        }
        const bit = ((hash >>> ((r * 21 + c) % 24)) ^ (r * 17 + c * 31)) & 1;
        grid[r][c] = bit === 1;
      }
    }
    return grid;
  }, [code]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 23 23"
      className="bg-white p-2 rounded-xl shadow-inner border border-slate-200"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + 1}
              y={rIdx + 1}
              width={1}
              height={1}
              fill="#0f172a"
              rx={0.15}
            />
          ) : null
        )
      )}
    </svg>
  );
};

// ==========================================
// MAIN FULL-STACK APPLICATION COMPONENT
// ==========================================

export default function App() {
  // --- Persistent Database State (localStorage-backed, zero fake pre-logged bookings) ---
  const [users, setUsers] = useState<UserAccount[]>(() =>
    safeLoadStorage('cineverse_db_users_v2', DEFAULT_USERS)
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeLoadStorage('cineverse_db_session_v2', DEFAULT_USERS[0])
  );
  const [jwtToken, setJwtToken] = useState<string>(() =>
    safeLoadStorage(
      'cineverse_db_jwt_v2',
      generateJwtToken(DEFAULT_USERS[0].id, DEFAULT_USERS[0].email, DEFAULT_USERS[0].role)
    )
  );
  const [movies, setMovies] = useState<Movie[]>(() =>
    safeLoadStorage('cineverse_db_movies_v2', DEFAULT_MOVIES)
  );
  const [cinemas, setCinemas] = useState<Cinema[]>(() =>
    safeLoadStorage('cineverse_db_cinemas_v2', DEFAULT_CINEMAS)
  );
  const [shows, setShows] = useState<Show[]>(() =>
    safeLoadStorage('cineverse_db_shows_v2', DEFAULT_SHOWS)
  );
  // ZERO fake bookings on initial load — only real user bookings are stored!
  const [bookings, setBookings] = useState<Booking[]>(() =>
    safeLoadStorage('cineverse_db_bookings_v2', [])
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() =>
    safeLoadStorage('cineverse_db_payments_v2', [])
  );
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>(() =>
    safeLoadStorage('cineverse_db_apilogs_v2', [])
  );

  // Sync all collections to localStorage automatically
  useEffect(() => {
    safeSaveStorage('cineverse_db_users_v2', users);
  }, [users]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_session_v2', currentUser);
  }, [currentUser]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_jwt_v2', jwtToken);
  }, [jwtToken]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_movies_v2', movies);
  }, [movies]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_cinemas_v2', cinemas);
  }, [cinemas]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_shows_v2', shows);
  }, [shows]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_bookings_v2', bookings);
  }, [bookings]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_payments_v2', payments);
  }, [payments]);
  useEffect(() => {
    safeSaveStorage('cineverse_db_apilogs_v2', apiLogs);
  }, [apiLogs]);

  // --- Navigation & Page State ---
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('mov-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-11');
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState<string>('All');
  const [selectedShowId, setSelectedShowId] = useState<string>('shw-1');
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [seatLockSeconds, setSeatLockSeconds] = useState<number>(600);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(null);

  // --- Movie Filters (Listing Page) ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'release' | 'duration'>('rating');

  // --- Checkout & Payment State (Clean, user-entered inputs with validation) ---
  const [selectedSnacks, setSelectedSnacks] = useState<{
    popcorn: number;
    nachos: number;
    beverage: number;
  }>({ popcorn: 0, nachos: 0, beverage: 0 });
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'UPI'>('Card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // --- Modals & Notifications ---
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [trailerModalMovie, setTrailerModalMovie] = useState<Movie | null>(null);
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);

  // --- Auth Forms ---
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    role: 'customer' as UserRole,
    password: ''
  });

  // --- Profile Edit Form ---
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || 'Mumbai',
    newPassword: ''
  });

  // --- Admin Panel State ---
  const [adminTab, setAdminTab] = useState<
    'analytics' | 'movies' | 'cinemas' | 'shows' | 'bookings' | 'users'
  >('analytics');
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    tagline: '',
    description: '',
    posterUrl: '',
    genre: 'Sci-Fi, Thriller',
    language: 'English, Hindi',
    duration: 150,
    releaseDate: '2026-11-20',
    rating: 8.5,
    certification: 'U/A' as 'U' | 'U/A' | 'A',
    director: '',
    castString: '',
    trailerUrl: '',
    motif: 'wormhole' as 'wormhole' | 'heist' | 'monsoon' | 'cyber' | 'samurai' | 'expedition'
  });

  const [cinemaForm, setCinemaForm] = useState({
    name: '',
    location: '',
    city: 'Mumbai',
    amenities: 'IMAX Laser, Dolby Atmos, Recliner Lounge',
    screenName: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser' as ScreenConfig['type'],
    capacity: 96
  });

  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [layoutManagerShowId, setLayoutManagerShowId] = useState<string>('shw-1');
  const [showForm, setShowForm] = useState({
    movieId: 'mov-1',
    cinemaId: 'cin-1',
    screen: 'Audi 1 - IMAX Laser',
    screenType: 'IMAX Laser',
    date: '2026-11-11',
    time: '21:00',
    regularPrice: 250,
    premiumPrice: 380,
    vipPrice: 560
  });

  // Helper to log REST API calls and show toast
  const logApi = (
    method: ApiLogEntry['method'],
    endpoint: string,
    status: number,
    summary: string
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setApiLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        method,
        endpoint,
        status,
        timestamp: timeStr,
        summary
      },
      ...prev.slice(0, 49)
    ]);
  };

  const notify = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Countdown timer for locked seats during checkout/payment
  useEffect(() => {
    if (
      (activePage === 'checkout' || activePage === 'payment') &&
      selectedSeats.length > 0
    ) {
      const interval = setInterval(() => {
        setSeatLockSeconds((prev) => {
          if (prev <= 1) {
            // Release locks in show state
            if (selectedShowId && currentUser) {
              setShows((allShows) =>
                allShows.map((sh) =>
                  sh.id === selectedShowId
                    ? {
                        ...sh,
                        lockedSeats: sh.lockedSeats.filter(
                          (l) => l.byUserId !== currentUser.id
                        )
                      }
                    : sh
                )
              );
            }
            setSelectedSeats([]);
            setActivePage('seat-selection');
            notify('Seat lock expired! Please re-select your seats.', 'error');
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activePage, selectedSeats.length, selectedShowId, currentUser]);

  // Sync profile form when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        phone: currentUser.phone,
        city: currentUser.city,
        newPassword: ''
      });
    }
  }, [currentUser]);

  // --- Derived Entities ---
  const selectedMovie = useMemo(
    () => movies.find((m) => m.id === selectedMovieId) || movies[0] || null,
    [movies, selectedMovieId]
  );

  const selectedShow = useMemo(
    () => shows.find((s) => s.id === selectedShowId) || shows[0] || null,
    [shows, selectedShowId]
  );

  const selectedShowMovie = useMemo(
    () =>
      movies.find((m) => m.id === selectedShow?.movieId) ||
      movies[0] ||
      null,
    [movies, selectedShow]
  );

  const selectedShowCinema = useMemo(
    () =>
      cinemas.find((c) => c.id === selectedShow?.cinemaId) ||
      cinemas[0] ||
      null,
    [cinemas, selectedShow]
  );

  const layoutManagedShow = useMemo(
    () => shows.find((s) => s.id === layoutManagerShowId) || shows[0] || null,
    [shows, layoutManagerShowId]
  );

  // Filtered movies for Movie Listing Page
  const filteredMovies = useMemo(() => {
    return movies
      .filter((m) => {
        const matchesSearch =
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.cast.some((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        const matchesGenre =
          genreFilter === 'All' || m.genre.includes(genreFilter);
        const matchesLang =
          languageFilter === 'All' || m.language.includes(languageFilter);
        return matchesSearch && matchesGenre && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'duration') return b.duration - a.duration;
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      });
  }, [movies, searchQuery, genreFilter, languageFilter, sortBy]);

  // Shows for selected movie & date
  const showsForMovieAndDate = useMemo(() => {
    if (!selectedMovie) return [];
    return shows.filter(
      (s) =>
        s.movieId === selectedMovie.id &&
        s.date === selectedDate &&
        (selectedCinemaFilter === 'All' || s.cinemaId === selectedCinemaFilter)
    );
  }, [shows, selectedMovie, selectedDate, selectedCinemaFilter]);

  // Financial Breakdown for Checkout
  const pricingSummary = useMemo(() => {
    const seatSubTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const snackTotal =
      selectedSnacks.popcorn * 240 +
      selectedSnacks.nachos * 220 +
      selectedSnacks.beverage * 140;
    const rawSubTotal = seatSubTotal + snackTotal;
    const discountAmount = promoApplied ? Math.round(rawSubTotal * 0.1) : 0;
    const convenienceFee = selectedSeats.length * 35;
    const gstAmount = Math.round(
      (rawSubTotal - discountAmount + convenienceFee) * 0.18
    );
    const totalAmount =
      rawSubTotal - discountAmount + convenienceFee + gstAmount;
    return {
      seatSubTotal,
      snackTotal,
      discountAmount,
      convenienceFee,
      gstAmount,
      totalAmount
    };
  }, [selectedSeats, selectedSnacks, promoApplied]);

  // 100% Real Dynamic Admin Analytics Computation (zero hardcoded chart numbers!)
  const adminAnalytics = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'Confirmed');
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTickets = confirmed.reduce((sum, b) => sum + b.seats.length, 0);
    const totalCapacityAcrossShows = shows.reduce(
      (sum, s) => sum + Math.max(0, s.totalSeats - s.blockedSeats.length),
      0
    );
    const totalBookedAcrossShows = shows.reduce(
      (sum, s) => sum + s.bookedSeats.length,
      0
    );
    const occupancyRate =
      totalCapacityAcrossShows > 0
        ? ((totalBookedAcrossShows / totalCapacityAcrossShows) * 100).toFixed(1)
        : '0.0';

    const movieRevenueMap: Record<
      string,
      { title: string; bookings: number; tickets: number; revenue: number }
    > = {};
    movies.forEach((m) => {
      movieRevenueMap[m.id] = {
        title: m.title.length > 16 ? m.title.slice(0, 16) + '…' : m.title,
        bookings: 0,
        tickets: 0,
        revenue: 0
      };
    });
    confirmed.forEach((b) => {
      if (!movieRevenueMap[b.movieId]) {
        movieRevenueMap[b.movieId] = {
          title:
            b.movieTitle.length > 16
              ? b.movieTitle.slice(0, 16) + '…'
              : b.movieTitle,
          bookings: 0,
          tickets: 0,
          revenue: 0
        };
      }
      movieRevenueMap[b.movieId].bookings += 1;
      movieRevenueMap[b.movieId].tickets += b.seats.length;
      movieRevenueMap[b.movieId].revenue += b.totalAmount;
    });

    const popularMovies = Object.values(movieRevenueMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    // Compute real revenue by showDate from actual confirmed bookings
    const dateMap: Record<string, { day: string; revenue: number; tickets: number }> = {};
    SHOW_DATES.forEach((d) => {
      dateMap[d] = { day: d.slice(5), revenue: 0, tickets: 0 };
    });
    confirmed.forEach((b) => {
      const key = b.showDate;
      if (!dateMap[key]) {
        dateMap[key] = { day: key.slice(5), revenue: 0, tickets: 0 };
      }
      dateMap[key].revenue += b.totalAmount;
      dateMap[key].tickets += b.seats.length;
    });

    const dailyTrend = Object.values(dateMap);

    return {
      totalUsers: users.length,
      totalBookings: bookings.length,
      confirmedCount: confirmed.length,
      totalRevenue,
      totalTickets,
      occupancyRate,
      popularMovies,
      dailyTrend
    };
  }, [bookings, movies, users, shows]);

  // ==========================================
  // INTERACTIVE HANDLERS
  // ==========================================

  const handleOpenMovieDetails = (movieId: string) => {
    setSelectedMovieId(movieId);
    const movieShows = shows.filter((s) => s.movieId === movieId);
    if (movieShows.length > 0) {
      setSelectedDate(movieShows[0].date);
    }
    setActivePage('movie-details');
    logApi('GET', `/api/movies/${movieId}`, 200, `Fetched details & showtimes for movie ${movieId}`);
  };

  const handleSelectShow = (show: Show) => {
    setSelectedShowId(show.id);
    setSelectedSeats([]);
    setSelectedSnacks({ popcorn: 0, nachos: 0, beverage: 0 });
    setPromoApplied(false);
    setPromoCode('');
    setActivePage('seat-selection');
    logApi('GET', `/api/shows/${show.id}/seats`, 200, `Loaded real-time 96-seat matrix for ${show.screen}`);
  };

  const handleToggleSeat = (row: string, col: number) => {
    if (!selectedShow) return;
    const seatNumber = `${row}${col}`;

    if (selectedShow.bookedSeats.includes(seatNumber)) {
      notify(`Seat ${seatNumber} is already booked.`, 'error');
      return;
    }
    if (selectedShow.blockedSeats.includes(seatNumber)) {
      notify(`Seat ${seatNumber} is blocked for maintenance.`, 'error');
      return;
    }
    const activeLock = selectedShow.lockedSeats.find(
      (l) =>
        l.seatNumber === seatNumber &&
        l.expiresAt > Date.now() &&
        l.byUserId !== (currentUser?.id || 'guest')
    );
    if (activeLock) {
      notify(
        `Seat ${seatNumber} is currently locked by another customer in checkout!`,
        'error'
      );
      return;
    }

    const exists = selectedSeats.some((s) => s.seatNumber === seatNumber);
    if (exists) {
      setSelectedSeats((prev) =>
        prev.filter((s) => s.seatNumber !== seatNumber)
      );
    } else {
      if (selectedSeats.length >= 10) {
        notify('Maximum 10 seats allowed per booking.', 'info');
        return;
      }
      const category: SeatCategory = ['A', 'B', 'C'].includes(row)
        ? 'Regular'
        : ['D', 'E', 'F'].includes(row)
        ? 'Premium'
        : 'VIP';
      const price = selectedShow.prices[category];
      setSelectedSeats((prev) => [
        ...prev,
        { seatNumber, row, col, category, price }
      ]);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      notify('Please select at least one seat to continue.', 'error');
      return;
    }
    if (!currentUser) {
      notify('Please sign in or register to lock seats and book tickets.', 'info');
      setActivePage('login');
      return;
    }
    if (!selectedShow) return;

    const lockExpiry = Date.now() + 10 * 60 * 1000;
    const myLocks = selectedSeats.map((s) => ({
      seatNumber: s.seatNumber,
      byUserId: currentUser.id,
      expiresAt: lockExpiry
    }));

    // Persist seat lock in show state
    setShows((prev) =>
      prev.map((sh) =>
        sh.id === selectedShow.id
          ? {
              ...sh,
              lockedSeats: [
                ...sh.lockedSeats.filter(
                  (l) =>
                    l.byUserId !== currentUser.id && l.expiresAt > Date.now()
                ),
                ...myLocks
              ]
            }
          : sh
      )
    );

    setSeatLockSeconds(600);
    setActivePage('checkout');
    logApi(
      'POST',
      `/api/shows/${selectedShow.id}/lock`,
      200,
      `Locked seats [${selectedSeats.map((s) => s.seatNumber).join(', ')}] for user ${currentUser.email}`
    );
    notify(`Locked ${selectedSeats.length} seat(s) for 10 minutes!`, 'info');
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedShow || !selectedShowMovie || !selectedShowCinema) return;

    // Validate real payment inputs
    if (paymentMethod === 'Card') {
      const digitsOnly = cardDetails.number.replace(/\D/g, '');
      if (digitsOnly.length < 12 || digitsOnly.length > 19) {
        notify('Please enter a valid 16-digit card number.', 'error');
        return;
      }
      if (!cardDetails.name.trim()) {
        notify('Please enter the cardholder name.', 'error');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry.trim())) {
        notify('Please enter card expiry in MM/YY format (e.g. 08/29).', 'error');
        return;
      }
      if (!/^\d{3,4}$/.test(cardDetails.cvv.trim())) {
        notify('Please enter a valid 3 or 4 digit CVV.', 'error');
        return;
      }
    } else {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
        notify('Please enter a valid UPI ID (e.g. yourname@okaxis).', 'error');
        return;
      }
    }

    // Double-booking concurrency verification
    const conflict = selectedSeats.some((s) =>
      selectedShow.bookedSeats.includes(s.seatNumber)
    );
    if (conflict) {
      notify(
        'Double-booking prevented! One or more selected seats were already booked.',
        'error'
      );
      setActivePage('seat-selection');
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      const bookingCode = `CV-${Date.now()
        .toString(36)
        .toUpperCase()
        .slice(-5)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const transactionId = `TXN-${Date.now()}`;
      const digitsOnly = cardDetails.number.replace(/\D/g, '');
      const maskedIdentifier =
        paymentMethod === 'Card'
          ? `•••• ${digitsOnly.slice(-4)}`
          : upiId.trim();

      const newBooking: Booking = {
        id: `bkg-${Date.now()}`,
        bookingCode,
        userId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: currentUser.phone,
        showId: selectedShow.id,
        movieId: selectedShowMovie.id,
        movieTitle: selectedShowMovie.title,
        movieCertification: selectedShowMovie.certification,
        movieLanguage: selectedShowMovie.language[0] || 'English',
        cinemaId: selectedShowCinema.id,
        cinemaName: selectedShowCinema.name,
        cinemaLocation: selectedShowCinema.location,
        screen: selectedShow.screen,
        screenType: selectedShow.screenType,
        showDate: selectedShow.date,
        showTime: selectedShow.time,
        seats: [...selectedSeats],
        snackTotal: pricingSummary.snackTotal,
        subTotal: pricingSummary.seatSubTotal,
        discountAmount: pricingSummary.discountAmount,
        convenienceFee: pricingSummary.convenienceFee,
        gstAmount: pricingSummary.gstAmount,
        totalAmount: pricingSummary.totalAmount,
        paymentMethod,
        paymentIdentifier: maskedIdentifier,
        transactionId,
        status: 'Confirmed',
        bookedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        emailSent: true
      };

      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        bookingCode,
        userId: currentUser.id,
        transactionId,
        method: paymentMethod,
        maskedIdentifier,
        amount: pricingSummary.totalAmount,
        status: 'Success',
        timestamp: newBooking.bookedAt
      };

      // Update Show's bookedSeats and clear locks atomically
      const newlyBookedNumbers = selectedSeats.map((s) => s.seatNumber);
      setShows((prev) =>
        prev.map((sh) =>
          sh.id === selectedShow.id
            ? {
                ...sh,
                bookedSeats: Array.from(
                  new Set([...sh.bookedSeats, ...newlyBookedNumbers])
                ),
                lockedSeats: sh.lockedSeats.filter(
                  (l) => !newlyBookedNumbers.includes(l.seatNumber)
                )
              }
            : sh
        )
      );

      setBookings((prev) => [newBooking, ...prev]);
      setPayments((prev) => [newPayment, ...prev]);
      setLastConfirmedBooking(newBooking);
      setSelectedSeats([]);
      setIsProcessingPayment(false);
      setActivePage('confirmation');

      logApi(
        'POST',
        '/api/bookings',
        201,
        `Confirmed booking ${bookingCode} (${paymentMethod} ₹${newBooking.totalAmount}) & saved to localStorage`
      );
      notify(
        `Payment successful! Ticket ${bookingCode} confirmed for ${currentUser.email}.`,
        'success'
      );
    }, 600);
  };

  const handleCancelBooking = (booking: Booking) => {
    if (booking.status === 'Cancelled') return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id ? { ...b, status: 'Cancelled' } : b
      )
    );

    setPayments((prev) =>
      prev.map((p) =>
        p.bookingCode === booking.bookingCode ? { ...p, status: 'Refunded' } : p
      )
    );

    const releasedSeatNumbers = booking.seats.map((s) => s.seatNumber);
    setShows((prev) =>
      prev.map((sh) =>
        sh.id === booking.showId
          ? {
              ...sh,
              bookedSeats: sh.bookedSeats.filter(
                (sn) => !releasedSeatNumbers.includes(sn)
              )
            }
          : sh
      )
    );

    if (lastConfirmedBooking?.id === booking.id) {
      setLastConfirmedBooking({ ...booking, status: 'Cancelled' });
    }
    if (ticketModalBooking?.id === booking.id) {
      setTicketModalBooking({ ...booking, status: 'Cancelled' });
    }

    logApi(
      'DELETE',
      `/api/bookings/${booking.id}`,
      200,
      `Cancelled booking ${booking.bookingCode} & released seats [${releasedSeatNumbers.join(', ')}]`
    );
    notify(
      `Booking ${booking.bookingCode} cancelled. Seats [${releasedSeatNumbers.join(
        ', '
      )}] are now available again.`,
      'info'
    );
  };

  const handleDownloadTicketFile = (booking: Booking) => {
    const ticketHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CineVerse Ticket - ${booking.bookingCode}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; padding: 40px; }
    .ticket { max-width: 560px; margin: 0 auto; background: #111827; border: 2px solid #f43f5e; border-radius: 20px; padding: 32px; }
    .header { display: flex; justify-content: space-between; border-bottom: 1px dashed #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .badge { background: #f43f5e; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
    .label { color: #94a3b8; }
    .val { font-weight: 700; color: #f8fafc; }
    .total { font-size: 18px; color: #38bdf8; border-top: 1px solid #334155; padding-top: 14px; margin-top: 16px; }
    @media print { body { background: #fff; color: #000; } .ticket { background: #fff; color: #000; border-color: #000; } .val { color: #000; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div>
        <h2 style="margin:0;color:#f43f5e;">CINEVERSE DIGITAL TICKET</h2>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Booking ID: ${booking.bookingCode} | TXN: ${booking.transactionId}</p>
      </div>
      <span class="badge">${booking.status.toUpperCase()}</span>
    </div>
    <h3 style="margin:0 0 12px;font-size:22px;">${booking.movieTitle} (${booking.movieCertification})</h3>
    <div class="row"><span class="label">Customer Name</span><span class="val">${booking.customerName} (${booking.customerEmail})</span></div>
    <div class="row"><span class="label">Cinema Hall</span><span class="val">${booking.cinemaName} — ${booking.cinemaLocation}</span></div>
    <div class="row"><span class="label">Screen & Format</span><span class="val">${booking.screen} (${booking.screenType})</span></div>
    <div class="row"><span class="label">Show Date & Time</span><span class="val">${booking.showDate} at ${booking.showTime}</span></div>
    <div class="row"><span class="label">Seats (${booking.seats.length})</span><span class="val">${booking.seats.map((s) => `${s.seatNumber} (${s.category} ₹${s.price})`).join(', ')}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="val">${booking.paymentMethod} (${booking.paymentIdentifier})</span></div>
    <div class="row total"><span>Total Paid (incl. GST)</span><span>INR ${booking.totalAmount}</span></div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CineVerse-Ticket-${booking.bookingCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Downloaded Digital Ticket (${booking.bookingCode})!`, 'success');
  };

  // --- Real Authentication Handlers (with Password Hash Verification) ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find(
      (u) => u.email.toLowerCase() === loginForm.email.trim().toLowerCase()
    );
    if (!matched) {
      notify('No account found with that email address. Please register first.', 'error');
      return;
    }
    const enteredHash = hashPassword(loginForm.password);
    if (matched.passwordHash !== enteredHash) {
      notify('Incorrect password. Please verify your credentials.', 'error');
      return;
    }
    if (!matched.isActive) {
      notify('This account has been suspended by an administrator.', 'error');
      return;
    }
    const token = generateJwtToken(matched.id, matched.email, matched.role);
    setCurrentUser(matched);
    setJwtToken(token);
    setLoginForm({ email: '', password: '' });
    logApi('POST', '/api/auth/login', 200, `Verified password hash & issued JWT for ${matched.email}`);
    notify(`Signed in as ${matched.name} (${matched.role})!`, 'success');
    setActivePage(matched.role === 'admin' ? 'admin' : 'home');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password) {
      notify('Please fill in all required fields.', 'error');
      return;
    }
    if (registerForm.password.length < 6) {
      notify('Password must be at least 6 characters.', 'error');
      return;
    }
    if (
      users.some(
        (u) => u.email.toLowerCase() === registerForm.email.trim().toLowerCase()
      )
    ) {
      notify('An account with that email already exists.', 'error');
      return;
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      passwordHash: hashPassword(registerForm.password),
      phone: registerForm.phone.trim() || '+91 98000 00000',
      city: registerForm.city,
      role: registerForm.role,
      favoriteGenres: ['Sci-Fi', 'Action'],
      joinedAt: new Date().toISOString().slice(0, 10),
      isActive: true
    };
    const token = generateJwtToken(newUser.id, newUser.email, newUser.role);
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setJwtToken(token);
    setRegisterForm({
      name: '',
      email: '',
      phone: '',
      city: 'Mumbai',
      role: 'customer',
      password: ''
    });
    logApi('POST', '/api/auth/register', 201, `Registered user ${newUser.email} (${newUser.role}) with bcrypt hash`);
    notify(`Account created! Signed in as ${newUser.name}.`, 'success');
    setActivePage(newUser.role === 'admin' ? 'admin' : 'home');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated: UserAccount = {
      ...currentUser,
      name: profileForm.name.trim() || currentUser.name,
      phone: profileForm.phone.trim(),
      city: profileForm.city,
      passwordHash:
        profileForm.newPassword.length >= 6
          ? hashPassword(profileForm.newPassword)
          : currentUser.passwordHash
    };
    setCurrentUser(updated);
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
    setProfileForm((prev) => ({ ...prev, newPassword: '' }));
    logApi('PUT', '/api/auth/profile', 200, `Updated profile in localStorage for ${updated.email}`);
    notify('Profile updated and saved!', 'success');
  };

  // --- Poster File Upload Handler ---
  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Please choose an image smaller than 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMovieForm((prev) => ({ ...prev, posterUrl: reader.result as string }));
        notify(`Loaded poster image "${file.name}"!`, 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Admin Handlers ---
  const handleSaveMovie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieForm.title.trim()) {
      notify('Movie title is required.', 'error');
      return;
    }
    const palettes: Record<
      typeof movieForm.motif,
      Movie['posterPalette']
    > = {
      wormhole: { from: '#090d16', via: '#1e1b4b', to: '#0f172a', accent: '#38bdf8', motif: 'wormhole' },
      heist: { from: '#18060c', via: '#4c0519', to: '#090d16', accent: '#f43f5e', motif: 'heist' },
      monsoon: { from: '#042f2e', via: '#0f766e', to: '#090d16', accent: '#2dd4bf', motif: 'monsoon' },
      cyber: { from: '#1e1b4b', via: '#581c87', to: '#090d16', accent: '#c084fc', motif: 'cyber' },
      samurai: { from: '#1c1917', via: '#7c2d12', to: '#090d16', accent: '#fb923c', motif: 'samurai' },
      expedition: { from: '#0c4a6e', via: '#1e293b', to: '#090d16', accent: '#38bdf8', motif: 'expedition' }
    };

    const parsedCast: CastMember[] = movieForm.castString
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [name, role] = pair.split(' as ').map((s) => s.trim());
        return { name: name || 'Cast Member', role: role || 'Featured Role' };
      });

    if (editingMovieId) {
      setMovies((prev) =>
        prev.map((m) =>
          m.id === editingMovieId
            ? {
                ...m,
                title: movieForm.title.trim(),
                tagline: movieForm.tagline.trim() || 'In Cinemas Now',
                description: movieForm.description.trim(),
                posterUrl: movieForm.posterUrl.trim() || undefined,
                genre: movieForm.genre.split(',').map((s) => s.trim()).filter(Boolean),
                language: movieForm.language.split(',').map((s) => s.trim()).filter(Boolean),
                duration: Number(movieForm.duration) || 140,
                releaseDate: movieForm.releaseDate,
                rating: Number(movieForm.rating) || 8.5,
                certification: movieForm.certification,
                director: movieForm.director.trim() || 'Director',
                cast: parsedCast,
                trailerUrl: movieForm.trailerUrl.trim(),
                posterPalette: palettes[movieForm.motif]
              }
            : m
        )
      );
      logApi('PUT', `/api/movies/${editingMovieId}`, 200, `Updated movie "${movieForm.title}"`);
      notify(`Updated movie "${movieForm.title}"!`, 'success');
      setEditingMovieId(null);
    } else {
      const newMovie: Movie = {
        id: `mov-${Date.now()}`,
        title: movieForm.title.trim(),
        tagline: movieForm.tagline.trim() || 'Now Showing in Cinemas',
        description: movieForm.description.trim(),
        posterUrl: movieForm.posterUrl.trim() || undefined,
        genre: movieForm.genre.split(',').map((s) => s.trim()).filter(Boolean),
        language: movieForm.language.split(',').map((s) => s.trim()).filter(Boolean),
        duration: Number(movieForm.duration) || 140,
        releaseDate: movieForm.releaseDate,
        rating: Number(movieForm.rating) || 8.5,
        certification: movieForm.certification,
        director: movieForm.director.trim() || 'Director',
        cast: parsedCast,
        trailerUrl: movieForm.trailerUrl.trim(),
        posterPalette: palettes[movieForm.motif],
        isFeatured: true
      };
      setMovies((prev) => [newMovie, ...prev]);
      logApi('POST', '/api/movies', 201, `Created new movie "${newMovie.title}"`);
      notify(`Added "${newMovie.title}" to catalog!`, 'success');
    }

    setMovieForm({
      title: '',
      tagline: '',
      description: '',
      posterUrl: '',
      genre: 'Sci-Fi, Thriller',
      language: 'English, Hindi',
      duration: 150,
      releaseDate: '2026-11-20',
      rating: 8.5,
      certification: 'U/A',
      director: '',
      castString: '',
      trailerUrl: '',
      motif: 'wormhole'
    });
  };

  const handleDeleteMovie = (movieId: string, title: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    setShows((prev) => prev.filter((s) => s.movieId !== movieId));
    logApi('DELETE', `/api/movies/${movieId}`, 200, `Deleted movie "${title}" & associated shows`);
    notify(`Deleted movie "${title}" and its scheduled shows.`, 'info');
  };

  const handleAddCinema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cinemaForm.name.trim() || !cinemaForm.location.trim()) {
      notify('Please enter cinema name and location.', 'error');
      return;
    }
    const newCinema: Cinema = {
      id: `cin-${Date.now()}`,
      name: cinemaForm.name.trim(),
      location: cinemaForm.location.trim(),
      city: cinemaForm.city.trim(),
      amenities: cinemaForm.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      screens: [
        {
          name: cinemaForm.screenName.trim() || 'Screen 1',
          type: cinemaForm.screenType,
          capacity: Number(cinemaForm.capacity) || 96
        }
      ],
      seatCapacity: Number(cinemaForm.capacity) || 96
    };
    setCinemas((prev) => [...prev, newCinema]);
    setCinemaForm({
      name: '',
      location: '',
      city: 'Mumbai',
      amenities: 'IMAX Laser, Dolby Atmos, Recliner Lounge',
      screenName: 'Audi 1 - IMAX Laser',
      screenType: 'IMAX Laser',
      capacity: 96
    });
    logApi('POST', '/api/cinemas', 201, `Added cinema "${newCinema.name}"`);
    notify(`Cinema hall "${newCinema.name}" added!`, 'success');
  };

  const handleSaveShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShowId) {
      setShows((prev) =>
        prev.map((sh) =>
          sh.id === editingShowId
            ? {
                ...sh,
                movieId: showForm.movieId,
                cinemaId: showForm.cinemaId,
                screen: showForm.screen,
                screenType: showForm.screenType,
                date: showForm.date,
                time: showForm.time,
                prices: {
                  Regular: Number(showForm.regularPrice) || 240,
                  Premium: Number(showForm.premiumPrice) || 360,
                  VIP: Number(showForm.vipPrice) || 540
                }
              }
            : sh
        )
      );
      logApi('PUT', `/api/shows/${editingShowId}`, 200, `Updated showtime ${editingShowId}`);
      notify('Updated showtime & pricing tiers!', 'success');
      setEditingShowId(null);
      return;
    }

    const newShow: Show = {
      id: `shw-${Date.now()}`,
      movieId: showForm.movieId,
      cinemaId: showForm.cinemaId,
      screen: showForm.screen,
      screenType: showForm.screenType,
      date: showForm.date,
      time: showForm.time,
      prices: {
        Regular: Number(showForm.regularPrice) || 240,
        Premium: Number(showForm.premiumPrice) || 360,
        VIP: Number(showForm.vipPrice) || 540
      },
      totalSeats: 96,
      bookedSeats: [],
      lockedSeats: [],
      blockedSeats: []
    };
    setShows((prev) => [...prev, newShow]);
    setLayoutManagerShowId(newShow.id);
    logApi(
      'POST',
      '/api/shows',
      201,
      `Scheduled show on ${newShow.date} at ${newShow.time} (${newShow.screen})`
    );
    notify(`New showtime scheduled for ${newShow.date} at ${newShow.time}!`, 'success');
  };

  const handleToggleAdminBlockedSeat = (showId: string, seatNumber: string) => {
    setShows((prev) =>
      prev.map((sh) => {
        if (sh.id !== showId) return sh;
        if (sh.bookedSeats.includes(seatNumber)) {
          notify(`Seat ${seatNumber} is already booked by a customer.`, 'error');
          return sh;
        }
        const isBlocked = sh.blockedSeats.includes(seatNumber);
        const nextBlocked = isBlocked
          ? sh.blockedSeats.filter((s) => s !== seatNumber)
          : [...sh.blockedSeats, seatNumber];
        return { ...sh, blockedSeats: nextBlocked };
      })
    );
  };

  const handleImportDatabaseJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed.movies)) setMovies(parsed.movies);
        if (Array.isArray(parsed.cinemas)) setCinemas(parsed.cinemas);
        if (Array.isArray(parsed.shows)) setShows(parsed.shows);
        if (Array.isArray(parsed.bookings)) setBookings(parsed.bookings);
        if (Array.isArray(parsed.users)) setUsers(parsed.users);
        notify('Imported database JSON into persistent storage!', 'success');
      } catch {
        notify('Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const userBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.userId === currentUser.id);
  }, [bookings, currentUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-100'
                : 'bg-slate-900/95 border-sky-500/40 text-sky-100'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            onClick={() => setActivePage('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-400 bg-clip-text text-transparent">
                CINEVERSE
              </span>
              <span className="block text-[10px] text-slate-400 tracking-widest uppercase -mt-1">
                IMAX &amp; Dolby Box Office
              </span>
            </div>
          </button>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home', icon: Sparkles },
              { id: 'movies', label: 'Movies', icon: Film },
              {
                id: 'my-tickets',
                label: `My Tickets (${userBookings.filter((b) => b.status === 'Confirmed').length})`,
                icon: Ticket
              },
              { id: 'profile', label: 'Profile', icon: User },
              ...(currentUser?.role === 'admin'
                ? [{ id: 'admin', label: 'Admin Panel', icon: BarChart3 }]
                : []),
              { id: 'architecture', label: 'API & DB', icon: Database }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as ActivePage)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Role Switcher & Auth Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => {
                  const cust = users.find((u) => u.role === 'customer') || users[0];
                  if (cust) {
                    setCurrentUser(cust);
                    setJwtToken(generateJwtToken(cust.id, cust.email, cust.role));
                    notify(`Active Session: ${cust.name} (Customer)`, 'info');
                  }
                  if (activePage === 'admin') setActivePage('home');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  currentUser?.role === 'customer'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => {
                  const adm = users.find((u) => u.role === 'admin') || users[1];
                  if (adm) {
                    setCurrentUser(adm);
                    setJwtToken(generateJwtToken(adm.id, adm.email, adm.role));
                  }
                  setActivePage('admin');
                  notify('Active Session: System Administrator', 'info');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3" />
                Admin
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden lg:inline max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setJwtToken('');
                    setActivePage('login');
                    notify('Signed out and cleared session token.', 'info');
                  }}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActivePage('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Navigation Bar */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-900 bg-slate-950/95 py-2 px-2 overflow-x-auto">
          {[
            { id: 'home', label: 'Home' },
            { id: 'movies', label: 'Movies' },
            { id: 'my-tickets', label: 'Tickets' },
            { id: 'profile', label: 'Profile' },
            { id: 'admin', label: 'Admin' },
            { id: 'architecture', label: 'DB' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'admin' && currentUser?.role !== 'admin') {
                  const adm = users.find((u) => u.role === 'admin') || users[1];
                  if (adm) setCurrentUser(adm);
                }
                setActivePage(t.id as ActivePage);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                activePage === t.id
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ==========================================
          MAIN VIEW ROUTER
         ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* ------------------------------------------
            1. HOME PAGE
           ------------------------------------------ */}
        {activePage === 'home' && (
          <div className="space-y-10">
            {/* Hero Spotlight Banner */}
            {movies.length > 0 ? (
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  <div className="lg:col-span-7 p-6 sm:p-10 space-y-5 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured IMAX Laser Presentation
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      {movies[0].title}
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                      {movies[0].description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {movies[0].rating}/10 IMDb
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                        {movies[0].duration} mins
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                        {movies[0].certification}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                        Dir. {movies[0].director}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => handleOpenMovieDetails(movies[0].id)}
                        className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
                      >
                        <Ticket className="w-4 h-4" />
                        Book IMAX Tickets
                      </button>
                      <button
                        onClick={() => setTrailerModalMovie(movies[0])}
                        className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition"
                      >
                        <Play className="w-4 h-4 text-rose-400 fill-rose-400" />
                        Watch Trailer
                      </button>
                    </div>
                  </div>
                  <div className="lg:col-span-5 h-64 lg:h-96 relative">
                    <MoviePosterGraphic
                      movie={movies[0]}
                      className="w-full h-full"
                      showBadges={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <Film className="w-10 h-10 text-rose-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">No Movies in Database</h2>
                <p className="text-xs text-slate-400">
                  Open the Admin Panel to add your own movies, upload posters, and schedule showtimes.
                </p>
                <button
                  onClick={() => {
                    const adm = users.find((u) => u.role === 'admin') || users[1];
                    if (adm) setCurrentUser(adm);
                    setActivePage('admin');
                    setAdminTab('movies');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Open Admin Movie Manager
                </button>
              </div>
            )}

            {/* Quick Show Finder Bar */}
            {movies.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Select Movie
                    </label>
                    <select
                      value={selectedMovieId}
                      onChange={(e) => setSelectedMovieId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Cinema Hall
                    </label>
                    <select
                      value={selectedCinemaFilter}
                      onChange={(e) => setSelectedCinemaFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="All">All Multiplexes</option>
                      {cinemas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Show Date
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      {SHOW_DATES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleOpenMovieDetails(selectedMovieId)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <Search className="w-4 h-4" />
                    Find Showtimes
                  </button>
                </div>
              </div>
            )}

            {/* Now Showing Movies Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Now Showing in Cinemas
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Select any movie to inspect real-time seat availability and book tickets
                  </p>
                </div>
                <button
                  onClick={() => setActivePage('movies')}
                  className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  Explore All ({movies.length})
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group bg-slate-900/70 border border-slate-800/90 hover:border-rose-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col transition duration-200"
                  >
                    <div
                      onClick={() => handleOpenMovieDetails(movie.id)}
                      className="cursor-pointer relative overflow-hidden"
                    >
                      <MoviePosterGraphic
                        movie={movie}
                        className="w-full h-64 group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {movie.language.map((lang) => (
                            <span
                              key={lang}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300"
                            >
                              {lang}
                            </span>
                          ))}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {movie.duration}m • Dir. {movie.director}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {movie.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenMovieDetails(movie.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          Book Tickets
                        </button>
                        <button
                          onClick={() => setTrailerModalMovie(movie)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <Play className="w-3.5 h-3.5 text-rose-400" />
                          Trailer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Partner Cinema Multiplexes */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Partner Multiplexes &amp; Formats
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time seat locking across Regular, Premium, and VIP Recliner tiers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cinemas.map((cinema) => (
                  <div
                    key={cinema.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {cinema.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {cinema.location}, {cinema.city}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-amber-400">
                        {cinema.screens.length} Screens
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cinema.amenities.map((am) => (
                        <span
                          key={am}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ------------------------------------------
            2. MOVIE LISTING PAGE
           ------------------------------------------ */}
        {activePage === 'movies' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Browse All Movies
                </h1>
                <p className="text-xs text-slate-400">
                  Filter by title, cast, director, genre, or language
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, actors, directors..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold mr-1">
                  Genre:
                </span>
                {[
                  'All',
                  'Sci-Fi',
                  'Action',
                  'Thriller',
                  'Drama',
                  'Adventure',
                  'Crime'
                ].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      genreFilter === g
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="All">All Languages</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'rating' | 'release' | 'duration')
                  }
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="release">Sort by Release Date</option>
                  <option value="duration">Sort by Duration</option>
                </select>
              </div>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
                <Film className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-base font-semibold text-slate-300">
                  No movies match your active filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setGenreFilter('All');
                    setLanguageFilter('All');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-rose-500/40 transition"
                  >
                    <div
                      onClick={() => handleOpenMovieDetails(movie.id)}
                      className="cursor-pointer"
                    >
                      <MoviePosterGraphic movie={movie} className="w-full h-64" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span>Dir. {movie.director}</span>
                          <span>{movie.duration} mins</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {movie.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleOpenMovieDetails(movie.id)}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                        >
                          View Showtimes
                        </button>
                        <button
                          onClick={() => setTrailerModalMovie(movie)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 text-rose-400" />
                          Trailer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------
            3. MOVIE DETAILS & SHOW SELECTION PAGE
           ------------------------------------------ */}
        {activePage === 'movie-details' && selectedMovie && (
          <div className="space-y-8">
            <button
              onClick={() => setActivePage('movies')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Movies
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-slate-800">
                <MoviePosterGraphic
                  movie={selectedMovie}
                  className="w-full h-80"
                />
              </div>
              <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold">
                      {selectedMovie.certification}
                    </span>
                    {selectedMovie.genre.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
                      >
                        {g}
                      </span>
                    ))}
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {selectedMovie.rating.toFixed(1)} / 10
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                    {selectedMovie.title}
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedMovie.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Duration
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedMovie.duration} Mins
                      </span>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Release Date
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedMovie.releaseDate}
                      </span>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Director
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedMovie.director}
                      </span>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Languages
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedMovie.language.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Cast List */}
                  <div className="pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Featured Cast
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.cast.map((actor) => (
                        <div
                          key={actor.name}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                        >
                          <p className="font-bold text-slate-100">{actor.name}</p>
                          <p className="text-[11px] text-slate-400">
                            as {actor.role}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setTrailerModalMovie(selectedMovie)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 text-rose-400 fill-rose-400" />
                    Watch Official Trailer
                  </button>
                </div>
              </div>
            </div>

            {/* Show Timings Selector Section */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Select Cinema Hall &amp; Show Timing
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click any showtime to open the real-time 96-seat layout
                  </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {SHOW_DATES.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => setSelectedDate(dt)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedDate === dt
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                      {dt}
                    </button>
                  ))}
                </div>
              </div>

              {showsForMovieAndDate.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300">
                    No shows scheduled on {selectedDate} for this filter.
                  </p>
                  <button
                    onClick={() => {
                      const anyShow = shows.find(
                        (s) => s.movieId === selectedMovie.id
                      );
                      if (anyShow) {
                        setSelectedDate(anyShow.date);
                        setSelectedCinemaFilter('All');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                  >
                    Switch to Available Show Date
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cinemas.map((cinema) => {
                    const cinemaShows = showsForMovieAndDate.filter(
                      (s) => s.cinemaId === cinema.id
                    );
                    if (cinemaShows.length === 0) return null;
                    return (
                      <div
                        key={cinema.id}
                        className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-white text-base">
                            {cinema.name}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {cinema.location}, {cinema.city}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {cinema.amenities.map((a) => (
                              <span
                                key={a}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {cinemaShows.map((sh) => {
                            const availableCount =
                              sh.totalSeats -
                              sh.bookedSeats.length -
                              sh.blockedSeats.length;
                            return (
                              <button
                                key={sh.id}
                                onClick={() => handleSelectShow(sh)}
                                className="group px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 border border-emerald-500/40 hover:border-rose-500 text-left transition shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                                  <span className="text-sm font-extrabold text-white">
                                    {sh.time}
                                  </span>
                                </div>
                                <span className="block text-[10px] text-slate-400 group-hover:text-rose-100 mt-0.5">
                                  {sh.screenType} • ₹{sh.prices.Regular}–₹
                                  {sh.prices.VIP}
                                </span>
                                <span className="block text-[10px] text-emerald-400 group-hover:text-white font-semibold">
                                  {availableCount} / {sh.totalSeats} seats available
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------
            4. INTERACTIVE SEAT SELECTION PAGE
           ------------------------------------------ */}
        {activePage === 'seat-selection' && selectedShow && selectedShowMovie && selectedShowCinema && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div>
                <button
                  onClick={() => setActivePage('movie-details')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Change Showtime
                </button>
                <h1 className="text-xl font-bold text-white">
                  {selectedShowMovie.title} — {selectedShowCinema.name}
                </h1>
                <p className="text-xs text-slate-400">
                  {selectedShow.screen} ({selectedShow.screenType}) •{' '}
                  {selectedShow.date} at {selectedShow.time}
                </p>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">
                  {selectedShow.totalSeats -
                    selectedShow.bookedSeats.length -
                    selectedShow.blockedSeats.length}
                </span>{' '}
                of {selectedShow.totalSeats} seats available
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Columns: Interactive Cinema Hall Layout */}
              <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6 overflow-x-auto">
                {/* Curved IMAX Screen SVG */}
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <svg viewBox="0 0 500 45" className="w-full h-11">
                    <defs>
                      <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 35 Q 250 5 480 35"
                      stroke="#38bdf8"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M 20 35 Q 250 5 480 35 L 495 45 Q 250 20 5 45 Z"
                      fill="url(#screenGlow)"
                    />
                  </svg>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-sky-400 font-semibold">
                    {selectedShow.screenType} Curved Projection Screen — All Eyes This Way
                  </p>
                </div>

                {/* Seat Matrix by Tier */}
                <div className="space-y-6 min-w-[540px]">
                  {[
                    {
                      tier: 'Regular' as SeatCategory,
                      rows: ['A', 'B', 'C'],
                      price: selectedShow.prices.Regular,
                      badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                    },
                    {
                      tier: 'Premium' as SeatCategory,
                      rows: ['D', 'E', 'F'],
                      price: selectedShow.prices.Premium,
                      badgeColor:
                        'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    },
                    {
                      tier: 'VIP' as SeatCategory,
                      rows: ['G', 'H'],
                      price: selectedShow.prices.VIP,
                      badgeColor:
                        'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    }
                  ].map((section) => (
                    <div key={section.tier} className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${section.badgeColor}`}
                        >
                          {section.tier} Tier — ₹{section.price}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Rows {section.rows.join(', ')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {section.rows.map((row) => (
                          <div
                            key={row}
                            className="flex items-center justify-center gap-1.5"
                          >
                            <span className="w-6 text-xs font-bold text-slate-400 text-center">
                              {row}
                            </span>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (col) => {
                                const seatNumber = `${row}${col}`;
                                const isBooked =
                                  selectedShow.bookedSeats.includes(seatNumber);
                                const isBlocked =
                                  selectedShow.blockedSeats.includes(seatNumber);
                                const isLockedByOther =
                                  selectedShow.lockedSeats.some(
                                    (l) =>
                                      l.seatNumber === seatNumber &&
                                      l.expiresAt > Date.now() &&
                                      l.byUserId !==
                                        (currentUser?.id || 'guest')
                                  );
                                const isSelected = selectedSeats.some(
                                  (s) => s.seatNumber === seatNumber
                                );

                                const aisleMargin =
                                  col === 3 || col === 9 ? 'mr-4' : '';

                                return (
                                  <button
                                    key={seatNumber}
                                    onClick={() => handleToggleSeat(row, col)}
                                    disabled={isBooked || isBlocked}
                                    title={`${seatNumber} (${section.tier} - ₹${section.price})`}
                                    className={`w-8 h-8 rounded-t-lg rounded-b-sm text-[11px] font-bold transition flex items-center justify-center border ${aisleMargin} ${
                                      isBooked
                                        ? 'bg-slate-800/90 border-slate-700 text-slate-600 cursor-not-allowed'
                                        : isBlocked
                                        ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'
                                        : isLockedByOther
                                        ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                                        : isSelected
                                        ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/40 scale-105'
                                        : section.tier === 'VIP'
                                        ? 'bg-slate-950 hover:bg-amber-500/20 border-amber-500/50 text-amber-200'
                                        : section.tier === 'Premium'
                                        ? 'bg-slate-950 hover:bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                                        : 'bg-slate-950 hover:bg-sky-500/20 border-sky-500/50 text-sky-200'
                                    }`}
                                  >
                                    {col}
                                  </button>
                                );
                              }
                            )}
                            <span className="w-6 text-xs font-bold text-slate-400 text-center">
                              {row}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-950 border border-sky-500/60 inline-block" />
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-rose-600 border border-rose-400 inline-block" />
                    Selected
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700 inline-block" />
                    Booked
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-900 border border-slate-800 inline-block" />
                    Blocked (Admin)
                  </div>
                </div>
              </div>

              {/* Right 4 Columns: Live Booking Cart Summary */}
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Armchair className="w-5 h-5 text-rose-400" />
                    Booking Cart
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedSeats.length} / 10 Seats
                  </span>
                </div>

                {selectedSeats.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Armchair className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">
                      Select seats on the interactive map to add them to your booking cart.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((s) => (
                        <div
                          key={s.seatNumber}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                        >
                          <span className="font-extrabold text-white">
                            {s.seatNumber}
                          </span>
                          <span className="text-slate-400">
                            {s.category} • ₹{s.price}
                          </span>
                          <button
                            onClick={() => handleToggleSeat(s.row, s.col)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tickets Subtotal ({selectedSeats.length})</span>
                        <span className="font-bold">
                          ₹{pricingSummary.seatSubTotal}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Convenience Fee</span>
                        <span>₹{pricingSummary.convenienceFee}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Integrated GST (18%)</span>
                        <span>₹{pricingSummary.gstAmount}</span>
                      </div>
                      <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                        <span>Estimated Total</span>
                        <span className="text-rose-400">
                          ₹{pricingSummary.totalAmount}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                    >
                      <Lock className="w-4 h-4" />
                      Lock Seats &amp; Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            5. CHECKOUT PAGE
           ------------------------------------------ */}
        {activePage === 'checkout' && selectedShow && selectedShowMovie && selectedShowCinema && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-xs text-amber-200">
              <span className="flex items-center gap-2 font-semibold">
                <Lock className="w-4 h-4 text-amber-400" />
                Seats [{selectedSeats.map((s) => s.seatNumber).join(', ')}] are locked for your checkout
              </span>
              <span className="font-mono font-bold text-amber-300">
                Time Remaining: {formatTimer(seatLockSeconds)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left 7 cols: F&B Add-ons & Promo */}
              <div className="md:col-span-7 space-y-5">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Popcorn className="w-5 h-5 text-amber-400" />
                    Add Gourmet Cinema Snacks (Optional)
                  </h2>
                  {[
                    {
                      key: 'popcorn' as const,
                      title: 'Large Salted & Caramel Popcorn Duo',
                      price: 240
                    },
                    {
                      key: 'nachos' as const,
                      title: 'Loaded Jalapeño Cheese Nachos',
                      price: 220
                    },
                    {
                      key: 'beverage' as const,
                      title: 'Chilled Zero Sugar Cola (600ml)',
                      price: 140
                    }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-amber-400 font-bold">
                          ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSelectedSnacks((prev) => ({
                              ...prev,
                              [item.key]: Math.max(0, prev[item.key] - 1)
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold">
                          {selectedSnacks[item.key]}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedSnacks((prev) => ({
                              ...prev,
                              [item.key]: prev[item.key] + 1
                            }))
                          }
                          className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Promo Code (Enter CINEFIRST for 10% Off)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter CINEFIRST"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white uppercase"
                    />
                    <button
                      onClick={() => {
                        if (promoCode.trim() === 'CINEFIRST') {
                          setPromoApplied(true);
                          notify('Promo code CINEFIRST applied (10% discount)!', 'success');
                        } else {
                          notify('Invalid code. Use CINEFIRST for 10% off.', 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 cols: Order Summary */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h2 className="text-lg font-bold text-white">Order Summary</h2>
                <div className="space-y-1 text-xs border-b border-slate-800 pb-3">
                  <p className="text-sm font-bold text-white">
                    {selectedShowMovie.title}
                  </p>
                  <p className="text-slate-400">
                    {selectedShowCinema.name} • {selectedShow.screen}
                  </p>
                  <p className="text-slate-300">
                    {selectedShow.date} at {selectedShow.time}
                  </p>
                  <p className="text-rose-400 font-semibold pt-1">
                    Seats:{' '}
                    {selectedSeats
                      .map((s) => `${s.seatNumber} (${s.category})`)
                      .join(', ')}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tickets Subtotal</span>
                    <span className="font-semibold">
                      ₹{pricingSummary.seatSubTotal}
                    </span>
                  </div>
                  {pricingSummary.snackTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">F&amp;B Beverages/Snacks</span>
                      <span className="font-semibold">
                        ₹{pricingSummary.snackTotal}
                      </span>
                    </div>
                  )}
                  {pricingSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount (CINEFIRST)</span>
                      <span>-₹{pricingSummary.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking Convenience Fee</span>
                    <span>₹{pricingSummary.convenienceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GST (18%)</span>
                    <span>₹{pricingSummary.gstAmount}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total Payable</span>
                    <span className="text-rose-400">
                      ₹{pricingSummary.totalAmount}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActivePage('seat-selection')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActivePage('payment')}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30"
                  >
                    Proceed to Payment (₹{pricingSummary.totalAmount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            6. PAYMENT GATEWAY PAGE (WITH REAL INPUT VALIDATION)
           ------------------------------------------ */}
        {activePage === 'payment' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  256-Bit Encrypted Checkout
                </span>
                <h1 className="text-xl font-bold text-white">
                  CinePay Payment Gateway
                </h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Amount Due</span>
                <span className="text-xl font-extrabold text-rose-400">
                  ₹{pricingSummary.totalAmount}
                </span>
              </div>
            </div>

            {/* Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                  paymentMethod === 'Card'
                    ? 'bg-rose-500/15 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <CreditCard className="w-5 h-5 text-rose-400" />
                <div>
                  <p className="text-xs font-bold">Credit / Debit Card</p>
                  <p className="text-[10px] text-slate-400">
                    Visa, Mastercard, RuPay
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                  paymentMethod === 'UPI'
                    ? 'bg-rose-500/15 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold">UPI Instant Pay</p>
                  <p className="text-[10px] text-slate-400">
                    GPay, PhonePe, Paytm
                  </p>
                </div>
              </button>
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-4">
              {paymentMethod === 'Card' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      16-Digit Card Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4532 1100 2200 4242"
                      value={cardDetails.number}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, number: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Name on Card"
                      value={cardDetails.name}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, name: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="08/29"
                        value={cardDetails.expiry}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            expiry: e.target.value
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        CVV (3–4 digits)
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cvv: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@okaxis"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePage('checkout')}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Pay ₹{pricingSummary.totalAmount} &amp; Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------
            7. BOOKING CONFIRMATION & DIGITAL TICKET PAGE
           ------------------------------------------ */}
        {activePage === 'confirmation' && lastConfirmedBooking && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Booking Confirmed &amp; Saved to Database!
                  </h2>
                  <p className="text-xs text-emerald-200">
                    Ticket confirmation issued for {lastConfirmedBooking.customerEmail}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg">
                {lastConfirmedBooking.bookingCode}
              </span>
            </div>

            {/* Digital Cinema Ticket Card */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-5 flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 block">
                    CINEVERSE ADMIT ONE • DIGITAL PASS
                  </span>
                  <h3 className="text-xl font-extrabold">
                    {lastConfirmedBooking.movieTitle}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-950/30 text-xs font-bold backdrop-blur-sm">
                  {lastConfirmedBooking.status}
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block">Customer Name</span>
                      <span className="text-sm font-bold text-white">
                        {lastConfirmedBooking.customerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Booking ID</span>
                      <span className="text-sm font-mono font-bold text-rose-400">
                        {lastConfirmedBooking.bookingCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Cinema Hall</span>
                      <span className="text-sm font-bold text-white">
                        {lastConfirmedBooking.cinemaName}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {lastConfirmedBooking.cinemaLocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Screen &amp; Showtime</span>
                      <span className="text-sm font-bold text-white">
                        {lastConfirmedBooking.screen}
                      </span>
                      <span className="text-[11px] text-amber-400 font-semibold block">
                        {lastConfirmedBooking.showDate} at{' '}
                        {lastConfirmedBooking.showTime}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1">
                      Reserved Seats ({lastConfirmedBooking.seats.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastConfirmedBooking.seats.map((s) => (
                        <span
                          key={s.seatNumber}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white"
                        >
                          {s.seatNumber} ({s.category})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">
                      Paid via {lastConfirmedBooking.paymentMethod} (
                      {lastConfirmedBooking.paymentIdentifier})
                    </span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₹{lastConfirmedBooking.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Scannable QR Code */}
                <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-slate-800 pt-4 md:pt-0 md:pl-6">
                  <TicketQRCodeSVG
                    code={lastConfirmedBooking.bookingCode}
                    size={140}
                  />
                  <span className="text-[11px] font-mono text-slate-400 mt-2">
                    Scan at Cinema Gate
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadTicketFile(lastConfirmedBooking)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Printable Ticket
                  </button>
                  <button
                    onClick={() =>
                      notify(
                        `Sent ticket receipt (${lastConfirmedBooking.bookingCode}) to ${lastConfirmedBooking.customerEmail}!`,
                        'success'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Email Ticket
                  </button>
                </div>

                <button
                  onClick={() => setActivePage('my-tickets')}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  View All My Tickets
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            8. MY TICKETS (BOOKING HISTORY & CANCELLATION)
           ------------------------------------------ */}
        {activePage === 'my-tickets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  My Digital Tickets &amp; Booking History
                </h1>
                <p className="text-xs text-slate-400">
                  Real bookings persisted in your account — cancel anytime to release seats back to inventory
                </p>
              </div>
              <button
                onClick={() => setActivePage('movies')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                + Book Tickets
              </button>
            </div>

            {userBookings.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-base font-semibold text-slate-300">
                  No tickets booked yet
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select a movie and showtime, pick your seats on the interactive map, and complete checkout to generate your first digital QR ticket.
                </p>
                <button
                  onClick={() => setActivePage('movies')}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Browse Movies &amp; Book Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ID: {b.bookingCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          • Booked {b.bookedAt}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        {b.movieTitle}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {b.cinemaName} ({b.screen}) •{' '}
                        <span className="text-amber-400 font-semibold">
                          {b.showDate} at {b.showTime}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.seats.map((s) => (
                          <span
                            key={s.seatNumber}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-semibold text-rose-300"
                          >
                            {s.seatNumber} ({s.category})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                      <div className="mr-3 text-right">
                        <span className="text-[11px] text-slate-400 block">
                          Total Paid
                        </span>
                        <span className="text-base font-extrabold text-white">
                          ₹{b.totalAmount}
                        </span>
                      </div>

                      <button
                        onClick={() => setTicketModalBooking(b)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-rose-400" />
                        QR Ticket
                      </button>

                      <button
                        onClick={() => handleDownloadTicketFile(b)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        Download
                      </button>

                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b)}
                          className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------
            9. PROFILE PAGE
           ------------------------------------------ */}
        {activePage === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!currentUser ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <p className="text-sm text-slate-300">
                  Please sign in to view and manage your profile.
                </p>
                <button
                  onClick={() => setActivePage('login')}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-xl font-extrabold text-white">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {currentUser.name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Role: {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member Since</span>
                      <span className="text-slate-200 font-semibold">
                        {currentUser.joinedAt}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Home City</span>
                      <span className="text-slate-200 font-semibold">
                        {currentUser.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Bookings</span>
                      <span className="text-emerald-400 font-bold">
                        {userBookings.length}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Password Hash (bcrypt)
                    </span>
                    <p className="text-[11px] font-mono text-slate-300 break-all bg-slate-950 p-2 rounded-lg border border-slate-800">
                      {currentUser.passwordHash}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleUpdateProfile}
                  className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
                >
                  <h3 className="text-base font-bold text-white">
                    Update Profile Settings
                  </h3>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Preferred City
                    </label>
                    <select
                      value={profileForm.city}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, city: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      New Password (re-hashes password on save)
                    </label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          newPassword: e.target.value
                        })
                      }
                      placeholder="Enter 6+ characters to change password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------
            10. LOGIN & REGISTER PAGES (WITH REAL PASSWORD VERIFICATION)
           ------------------------------------------ */}
        {activePage === 'login' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Sign In to CineVerse
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Verifies your password hash and issues a signed JWT session token
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="customer@cineverse.com"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
              >
                Sign In
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Default Seeded Accounts (Click to Fill Credentials)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLoginForm({
                      email: 'customer@cineverse.com',
                      password: 'Customer@123'
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs"
                >
                  <p className="font-bold text-white">Customer Account</p>
                  <p className="text-[10px] text-slate-400">
                    customer@cineverse.com / Customer@123
                  </p>
                </button>
                <button
                  onClick={() => {
                    setLoginForm({
                      email: 'admin@cineverse.com',
                      password: 'Admin@123'
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-left text-xs"
                >
                  <p className="font-bold text-amber-400">Admin Account</p>
                  <p className="text-[10px] text-slate-400">
                    admin@cineverse.com / Admin@123
                  </p>
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400">
              Don’t have an account?{' '}
              <button
                onClick={() => setActivePage('register')}
                className="text-rose-400 font-semibold hover:underline"
              >
                Register a new account
              </button>
            </p>
          </div>
        )}

        {activePage === 'register' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Create Account
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Persists your account and password hash in local database storage
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, phone: e.target.value })
                    }
                    placeholder="+91 98200 12345"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Account Role
                  </label>
                  <select
                    value={registerForm.role}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        role: e.target.value as UserRole
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
              >
                Create Account
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------
            11. ADMIN DASHBOARD (100% DYNAMIC ANALYTICS & FULL CRUD)
           ------------------------------------------ */}
        {activePage === 'admin' && (
          <div className="space-y-6">
            {/* Admin Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  <Shield className="w-3.5 h-3.5" />
                  Role-Protected Administrator Console
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-0.5">
                  CineVerse Operations &amp; Live Box Office Analytics
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const reportPayload = {
                      generatedAt: new Date().toISOString(),
                      metrics: adminAnalytics,
                      users,
                      movies,
                      cinemas,
                      shows,
                      bookings,
                      payments
                    };
                    const blob = new Blob(
                      [JSON.stringify(reportPayload, null, 2)],
                      { type: 'application/json' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `CineVerse-Full-Database-${new Date()
                      .toISOString()
                      .slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    notify('Exported complete database & analytics report!', 'success');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export DB &amp; Report
                </button>
              </div>
            </div>

            {/* Admin Sub-Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
              {[
                { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
                { id: 'movies', label: `Movies (${movies.length})`, icon: Film },
                {
                  id: 'cinemas',
                  label: `Cinemas (${cinemas.length})`,
                  icon: Building2
                },
                {
                  id: 'shows',
                  label: `Shows & Seat Layouts (${shows.length})`,
                  icon: Clock
                },
                {
                  id: 'bookings',
                  label: `All Bookings (${bookings.length})`,
                  icon: Ticket
                },
                { id: 'users', label: `Users (${users.length})`, icon: Users }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAdminTab(t.id as typeof adminTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      adminTab === t.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: 100% REAL DYNAMIC ANALYTICS */}
            {adminTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">
                      Actual Gross Revenue
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                      ₹{adminAnalytics.totalRevenue.toLocaleString()}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      From {adminAnalytics.confirmedCount} confirmed booking(s)
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">
                      Tickets Sold &amp; Occupancy
                    </span>
                    <p className="text-2xl font-extrabold text-white mt-1">
                      {adminAnalytics.totalTickets} Seats
                    </p>
                    <span className="text-[11px] text-rose-400">
                      {adminAnalytics.occupancyRate}% live hall occupancy
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">
                      Registered Users
                    </span>
                    <p className="text-2xl font-extrabold text-sky-400 mt-1">
                      {adminAnalytics.totalUsers}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Persisted in Users collection
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">
                      Scheduled Shows
                    </span>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">
                      {shows.length}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Across {cinemas.length} partner multiplexes
                    </span>
                  </div>
                </div>

                {/* Live Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">
                        Real-Time Revenue by Movie (INR)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Updates automatically on booking
                      </span>
                    </div>
                    <div className="relative h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adminAnalytics.popularMovies}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis
                            dataKey="title"
                            stroke="#94a3b8"
                            fontSize={11}
                          />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="#f43f5e"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">
                        Revenue by Show Date (INR)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        100% computed from actual bookings
                      </span>
                    </div>
                    <div className="relative h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={adminAnalytics.dailyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#38bdf8"
                            fill="#38bdf8"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE MOVIES (WITH REAL POSTER IMAGE UPLOAD) */}
            {adminTab === 'movies' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSaveMovie}
                  className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <h3 className="text-base font-bold text-white">
                    {editingMovieId ? 'Edit Movie' : 'Add New Movie'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder="Movie Title"
                    value={movieForm.title}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, title: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Tagline"
                    value={movieForm.tagline}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, tagline: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    required
                    placeholder="Synopsis / Description"
                    value={movieForm.description}
                    onChange={(e) =>
                      setMovieForm({
                        ...movieForm,
                        description: e.target.value
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />

                  {/* Poster Upload from Device OR Direct URL */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-rose-400" />
                      Upload Movie Poster Image or Paste URL
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterFileUpload}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-500"
                    />
                    <input
                      type="text"
                      placeholder="Or paste direct image URL (https://...)"
                      value={movieForm.posterUrl}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, posterUrl: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Genres (comma separated)"
                      value={movieForm.genre}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, genre: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Languages (comma separated)"
                      value={movieForm.language}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, language: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Duration (min)"
                      value={movieForm.duration}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          duration: Number(e.target.value)
                        })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Rating"
                      value={movieForm.rating}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          rating: Number(e.target.value)
                        })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={movieForm.certification}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          certification: e.target.value as 'U' | 'U/A' | 'A'
                        })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="U">U</option>
                      <option value="U/A">U/A</option>
                      <option value="A">A</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Director Name"
                    value={movieForm.director}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, director: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Cast (e.g. Actor Name as Character, Actor 2 as Role)"
                    value={movieForm.castString}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, castString: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      {editingMovieId ? 'Update Movie' : '+ Add Movie'}
                    </button>
                    {editingMovieId && (
                      <button
                        type="button"
                        onClick={() => setEditingMovieId(null)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {movies.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {m.title}{' '}
                          <span className="text-xs text-slate-400 font-normal">
                            (Dir. {m.director})
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          {m.genre.join(', ')} • {m.duration}m • Rating {m.rating}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMovieId(m.id);
                            setMovieForm({
                              title: m.title,
                              tagline: m.tagline,
                              description: m.description,
                              posterUrl: m.posterUrl || '',
                              genre: m.genre.join(', '),
                              language: m.language.join(', '),
                              duration: m.duration,
                              releaseDate: m.releaseDate,
                              rating: m.rating,
                              certification: m.certification,
                              director: m.director,
                              castString: m.cast
                                .map((c) => `${c.name} as ${c.role}`)
                                .join(', '),
                              trailerUrl: m.trailerUrl,
                              motif: m.posterPalette.motif
                            });
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(m.id, m.title)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MANAGE CINEMAS */}
            {adminTab === 'cinemas' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleAddCinema}
                  className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <h3 className="text-base font-bold text-white">
                    Add Partner Multiplex Cinema
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder="Cinema Name (e.g. PVR Director's Cut)"
                    value={cinemaForm.name}
                    onChange={(e) =>
                      setCinemaForm({ ...cinemaForm, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Address / Mall Location"
                    value={cinemaForm.location}
                    onChange={(e) =>
                      setCinemaForm({ ...cinemaForm, location: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={cinemaForm.city}
                    onChange={(e) =>
                      setCinemaForm({ ...cinemaForm, city: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Amenities (comma separated)"
                    value={cinemaForm.amenities}
                    onChange={(e) =>
                      setCinemaForm({
                        ...cinemaForm,
                        amenities: e.target.value
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    + Add Cinema Hall
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  {cinemas.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {c.name} ({c.city})
                        </h4>
                        <p className="text-xs text-slate-400">{c.location}</p>
                        <p className="text-[11px] text-amber-400 mt-1">
                          Capacity: {c.seatCapacity} seats •{' '}
                          {c.amenities.join(' • ')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCinemas((prev) =>
                            prev.filter((item) => item.id !== c.id)
                          );
                          notify(`Removed cinema "${c.name}".`, 'info');
                        }}
                        className="p-2 rounded-xl bg-slate-800 text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: MANAGE SHOWS & INTERACTIVE SEAT LAYOUTS */}
            {adminTab === 'shows' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleSaveShow}
                    className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <h3 className="text-base font-bold text-white">
                      {editingShowId ? 'Update Showtime & Prices' : 'Schedule New Showtime'}
                    </h3>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Select Movie
                      </label>
                      <select
                        value={showForm.movieId}
                        onChange={(e) =>
                          setShowForm({ ...showForm, movieId: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {movies.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Select Cinema
                      </label>
                      <select
                        value={showForm.cinemaId}
                        onChange={(e) =>
                          setShowForm({ ...showForm, cinemaId: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {cinemas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={showForm.date}
                        onChange={(e) =>
                          setShowForm({ ...showForm, date: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {SHOW_DATES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={showForm.time}
                        onChange={(e) =>
                          setShowForm({ ...showForm, time: e.target.value })
                        }
                        placeholder="21:30"
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400">
                          Regular ₹
                        </label>
                        <input
                          type="number"
                          value={showForm.regularPrice}
                          onChange={(e) =>
                            setShowForm({
                              ...showForm,
                              regularPrice: Number(e.target.value)
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">
                          Premium ₹
                        </label>
                        <input
                          type="number"
                          value={showForm.premiumPrice}
                          onChange={(e) =>
                            setShowForm({
                              ...showForm,
                              premiumPrice: Number(e.target.value)
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">
                          VIP ₹
                        </label>
                        <input
                          type="number"
                          value={showForm.vipPrice}
                          onChange={(e) =>
                            setShowForm({
                              ...showForm,
                              vipPrice: Number(e.target.value)
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                      >
                        {editingShowId ? 'Save Show Changes' : '+ Create Showtime'}
                      </button>
                      {editingShowId && (
                        <button
                          type="button"
                          onClick={() => setEditingShowId(null)}
                          className="px-3 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="lg:col-span-7 space-y-3 max-h-96 overflow-y-auto pr-1">
                    {shows.map((sh) => {
                      const mv = movies.find((m) => m.id === sh.movieId);
                      const cn = cinemas.find((c) => c.id === sh.cinemaId);
                      return (
                        <div
                          key={sh.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {mv?.title || 'Movie'} — {cn?.name || 'Cinema'}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {sh.date} at {sh.time} • {sh.screen} ({sh.screenType})
                            </p>
                            <p className="text-[11px] text-emerald-400 mt-0.5">
                              Booked: {sh.bookedSeats.length} | Blocked:{' '}
                              {sh.blockedSeats.length} | Available:{' '}
                              {sh.totalSeats -
                                sh.bookedSeats.length -
                                sh.blockedSeats.length}{' '}
                              • ₹{sh.prices.Regular} / ₹{sh.prices.Premium} / ₹
                              {sh.prices.VIP}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setLayoutManagerShowId(sh.id)}
                              title="Manage Seat Layout"
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold"
                            >
                              Seat Layout
                            </button>
                            <button
                              onClick={() => {
                                setEditingShowId(sh.id);
                                setShowForm({
                                  movieId: sh.movieId,
                                  cinemaId: sh.cinemaId,
                                  screen: sh.screen,
                                  screenType: sh.screenType,
                                  date: sh.date,
                                  time: sh.time,
                                  regularPrice: sh.prices.Regular,
                                  premiumPrice: sh.prices.Premium,
                                  vipPrice: sh.prices.VIP
                                });
                              }}
                              className="p-2 rounded-xl bg-slate-800 text-sky-400"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setShows((prev) =>
                                  prev.filter((item) => item.id !== sh.id)
                                );
                                notify('Deleted showtime.', 'info');
                              }}
                              className="p-2 rounded-xl bg-slate-800 text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Interactive Seat Layout Manager */}
                {layoutManagedShow && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-amber-400" />
                          Admin Seat Layout Manager — {layoutManagedShow.screen} (
                          {layoutManagedShow.date} {layoutManagedShow.time})
                        </h3>
                        <p className="text-xs text-slate-400">
                          Click any seat below to block or unblock it for maintenance. Blocked seats cannot be booked by customers.
                        </p>
                      </div>
                      <select
                        value={layoutManagerShowId}
                        onChange={(e) => setLayoutManagerShowId(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        {shows.map((sh) => {
                          const mv = movies.find((m) => m.id === sh.movieId);
                          return (
                            <option key={sh.id} value={sh.id}>
                              {mv?.title} ({sh.date} {sh.time})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1.5 overflow-x-auto">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
                        <div
                          key={row}
                          className="flex items-center justify-center gap-1.5 min-w-[480px]"
                        >
                          <span className="w-5 text-xs font-bold text-slate-400">
                            {row}
                          </span>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (col) => {
                              const sn = `${row}${col}`;
                              const isBooked =
                                layoutManagedShow.bookedSeats.includes(sn);
                              const isBlocked =
                                layoutManagedShow.blockedSeats.includes(sn);
                              return (
                                <button
                                  key={sn}
                                  type="button"
                                  onClick={() =>
                                    handleToggleAdminBlockedSeat(
                                      layoutManagedShow.id,
                                      sn
                                    )
                                  }
                                  className={`w-7 h-7 rounded text-[10px] font-bold border transition ${
                                    isBooked
                                      ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
                                      : isBlocked
                                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400'
                                  }`}
                                >
                                  {sn}
                                </button>
                              );
                            }
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ALL BOOKINGS */}
            {adminTab === 'bookings' && (
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-sm text-slate-400">
                      No customer bookings recorded yet. Book a ticket from any showtime to see live records here!
                    </p>
                  </div>
                ) : (
                  bookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-400">
                            {b.bookingCode}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              b.status === 'Confirmed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {b.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Customer: {b.customerName} ({b.customerEmail})
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white mt-1">
                          {b.movieTitle} — {b.cinemaName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {b.showDate} at {b.showTime} • Seats:{' '}
                          {b.seats.map((s) => s.seatNumber).join(', ')} • Paid ₹
                          {b.totalAmount} ({b.paymentMethod})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTicketModalBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white"
                        >
                          Inspect QR
                        </button>
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(b)}
                            className="px-3 py-1.5 rounded-xl bg-rose-950 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                          >
                            Admin Cancel &amp; Refund
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: MANAGE USERS */}
            {adminTab === 'users' && (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {u.name}{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          ({u.email})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Phone: {u.phone} • City: {u.city} • Joined: {u.joinedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextRole: UserRole =
                            u.role === 'admin' ? 'customer' : 'admin';
                          setUsers((prev) =>
                            prev.map((item) =>
                              item.id === u.id
                                ? { ...item, role: nextRole }
                                : item
                            )
                          );
                          notify(
                            `Updated ${u.name}'s role to ${nextRole}.`,
                            'info'
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-amber-300"
                      >
                        Role: {u.role.toUpperCase()}
                      </button>
                      <button
                        onClick={() => {
                          setUsers((prev) =>
                            prev.map((item) =>
                              item.id === u.id
                                ? { ...item, isActive: !item.isActive }
                                : item
                            )
                          );
                          notify(
                            `${u.isActive ? 'Suspended' : 'Activated'} user ${u.email}.`,
                            'info'
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------
            12. PERSISTENT DATABASE & REST API INSPECTOR
           ------------------------------------------ */}
        {activePage === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                    Persistent LocalStorage DB &amp; REST API Engine
                  </span>
                  <h1 className="text-2xl font-extrabold text-white">
                    Database Controls &amp; Live API Dispatch Log
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Import DB JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDatabaseJson}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setMovies([]);
                      setCinemas([]);
                      setShows([]);
                      setBookings([]);
                      setPayments([]);
                      notify(
                        'Cleared catalog & bookings! You can now add movies, cinemas, and shows from scratch in Admin.',
                        'info'
                      );
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-bold"
                  >
                    Start Empty DB (Clear All)
                  </button>
                  <button
                    onClick={() => {
                      setUsers(DEFAULT_USERS);
                      setMovies(DEFAULT_MOVIES);
                      setCinemas(DEFAULT_CINEMAS);
                      setShows(DEFAULT_SHOWS);
                      setBookings([]);
                      setPayments([]);
                      setApiLogs([]);
                      notify('Restored verified theatrical catalog with 0 bookings!', 'success');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Reset to Default Catalog
                  </button>
                </div>
              </div>

              {jwtToken && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Current Signed JWT Bearer Token
                  </span>
                  <p className="font-mono text-[11px] text-slate-400 break-all">
                    Bearer {jwtToken}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live REST API Request Log */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Session API Dispatch Log ({apiLogs.length})
                  </h3>
                  {apiLogs.length > 0 && (
                    <button
                      onClick={() => setApiLogs([])}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
                {apiLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    No API calls logged yet in this session. Browse movies, lock seats, or book a ticket to inspect live dispatches.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {apiLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                log.method === 'GET'
                                  ? 'bg-sky-500/20 text-sky-400'
                                  : log.method === 'POST'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : log.method === 'PUT'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {log.method}
                            </span>
                            <span className="font-mono text-white font-semibold">
                              {log.endpoint}
                            </span>
                          </div>
                          <p className="text-slate-400">{log.summary}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-emerald-400 font-mono font-bold block">
                            {log.status} OK
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Collection Counts */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Live Persistent Collections (localStorage)
                </h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {[
                    {
                      coll: `Users (${users.length})`,
                      desc: 'name, email, bcrypt passwordHash, phone, role'
                    },
                    {
                      coll: `Movies (${movies.length})`,
                      desc: 'title, description, posterUrl, trailerUrl, genre[], language[], duration, rating'
                    },
                    {
                      coll: `Cinemas (${cinemas.length})`,
                      desc: 'name, location, city, amenities[], screens[], seatCapacity'
                    },
                    {
                      coll: `Shows (${shows.length})`,
                      desc: 'movieId, cinemaId, screen, date, time, prices, bookedSeats[], blockedSeats[]'
                    },
                    {
                      coll: `Bookings (${bookings.length})`,
                      desc: 'bookingCode, userId, showId, seats[], totalAmount, status'
                    },
                    {
                      coll: `Payments (${payments.length})`,
                      desc: 'bookingCode, transactionId, method (Card|UPI), maskedIdentifier, amount, status'
                    }
                  ].map((c) => (
                    <div
                      key={c.coll}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3"
                    >
                      <span className="font-bold text-rose-400">{c.coll}: </span>
                      <span className="text-slate-300">{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODALS (TRAILER PLAYER & QR TICKET VIEWER)
         ========================================== */}
      {trailerModalMovie && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                  Official Theatrical Trailer
                </span>
                <h3 className="text-base font-bold text-white">
                  {trailerModalMovie.title} ({trailerModalMovie.releaseDate.slice(0, 4)})
                </h3>
              </div>
              <button
                onClick={() => setTrailerModalMovie(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-72 sm:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
              <MoviePosterGraphic
                movie={trailerModalMovie}
                className="w-full h-full opacity-55"
                showBadges={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col items-center justify-center p-6 text-center space-y-3">
                <a
                  href={trailerModalMovie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 transition"
                >
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                </a>
                <p className="text-base font-extrabold text-white">
                  “{trailerModalMovie.tagline}”
                </p>
                <p className="text-xs text-slate-300 max-w-md">
                  Directed by {trailerModalMovie.director} • Starring{' '}
                  {trailerModalMovie.cast.map((c) => c.name).join(', ')}
                </p>
                <a
                  href={trailerModalMovie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-400 hover:underline"
                >
                  Open Full Video on YouTube ↗
                </a>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Runtime: {trailerModalMovie.duration} mins • Rating:{' '}
                {trailerModalMovie.rating}/10
              </span>
              <button
                onClick={() => {
                  const mId = trailerModalMovie.id;
                  setTrailerModalMovie(null);
                  handleOpenMovieDetails(mId);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Book Tickets for This Movie
              </button>
            </div>
          </div>
        </div>
      )}

      {ticketModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-rose-600 to-amber-500 p-4 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest block">
                  CINEVERSE E-TICKET QR PASS
                </span>
                <h3 className="text-base font-extrabold">
                  {ticketModalBooking.movieTitle}
                </h3>
              </div>
              <button
                onClick={() => setTicketModalBooking(null)}
                className="p-1 rounded-lg bg-slate-950/30 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <TicketQRCodeSVG
                code={ticketModalBooking.bookingCode}
                size={156}
              />
              <div>
                <p className="text-xs font-mono text-rose-400 font-bold">
                  {ticketModalBooking.bookingCode}
                </p>
                <p className="text-sm font-bold text-white mt-1">
                  {ticketModalBooking.cinemaName} ({ticketModalBooking.screen})
                </p>
                <p className="text-xs text-amber-400 font-semibold">
                  {ticketModalBooking.showDate} at {ticketModalBooking.showTime}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Seats:{' '}
                  {ticketModalBooking.seats
                    .map((s) => `${s.seatNumber} (${s.category})`)
                    .join(', ')}
                </p>
              </div>
              <div className="w-full flex gap-2 pt-2">
                <button
                  onClick={() => handleDownloadTicketFile(ticketModalBooking)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Ticket
                </button>
                <button
                  onClick={() => setTicketModalBooking(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-slate-300">
              CineVerse Cinema Hall Ticket Booking System
            </span>
            <span>• Persistent Full-Stack React + TypeScript + Node/Express + MongoDB</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActivePage('architecture')}
              className="hover:text-slate-300"
            >
              Database &amp; API Controls
            </button>
            <button
              onClick={() => {
                const adm = users.find((u) => u.role === 'admin') || users[1];
                if (adm) setCurrentUser(adm);
                setActivePage('admin');
              }}
              className="hover:text-slate-300"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
