export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  joinedAt: string;
}

export interface CastMember {
  name: string;
  role: string;
}

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre: string[];
  language: string[];
  duration: number;
  releaseDate: string;
  rating: number;
  certification: string;
  director: string;
  cast: CastMember[];
  trailerUrl: string;
  posterTheme: string;
  isFeatured?: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  location: string;
  city: string;
  amenities: string[];
  screens: { name: string; type: string; capacity: number }[];
  seatCapacity: number;
}

export interface Show {
  id: string;
  movieId: string;
  cinemaId: string;
  screen: string;
  screenType: string;
  date: string;
  time: string;
  prices: {
    Regular: number;
    Premium: number;
    VIP: number;
  };
  totalSeats: number;
  bookedSeats: string[];
  lockedSeats: string[];
}

export type SeatCategory = 'Regular' | 'Premium' | 'VIP';

export interface SelectedSeat {
  seatNumber: string;
  row: string;
  col: number;
  category: SeatCategory;
  price: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  cinemaName: string;
  cinemaLocation: string;
  screen: string;
  showDate: string;
  showTime: string;
  seats: SelectedSeat[];
  subTotal: number;
  convenienceFee: number;
  gst: number;
  totalAmount: number;
  paymentMethod: 'Card' | 'UPI';
  paymentIdentifier: string;
  transactionId: string;
  status: 'Confirmed' | 'Cancelled';
  bookedAt: string;
}
