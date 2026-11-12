# CineVerse — Cinema Hall Ticket Booking System (Full-Stack MERN + TypeScript)

A modern, production-ready Full-Stack Cinema Hall Ticket Booking Platform inspired by BookMyShow & IMAX Digital Box Office. Customers can browse movies, watch trailers, filter by language/genre, inspect real-time interactive hall layouts (Regular, Premium, VIP tiers), lock seats during checkout, complete simulated Card/UPI payments, and download QR-verified digital PDF tickets. Administrators have a dedicated analytics & operations suite to manage movies, multiplexes, screens, showtimes, seat layouts, users, Bookings, and financial reports.

---

## Complete Folder Structure

```text
cinema-ticket-booking-system/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Cinema.js
│   │   ├── Show.js
│   │   ├── Seat.js
│   │   ├── Booking.js
│   │   └── Payment.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateMiddleware.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── movieController.js
│   │   ├── cinemaController.js
│   │   ├── showController.js
│   │   ├── bookingController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── cinemaRoutes.js
│   │   ├── showRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── qrGenerator.js
│   │   └── emailService.js
│   └── seed/
│       └── seedData.js
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types/
        │   └── index.ts
        ├── api/
        │   └── axiosClient.ts
        ├── context/
        │   ├── AuthContext.tsx
        │   └── BookingContext.tsx
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── MovieCard.tsx
        │   ├── SeatLayoutGrid.tsx
        │   └── DigitalTicketModal.tsx
        └── pages/
            ├── HomePage.tsx
            ├── MovieListingPage.tsx
            ├── MovieDetailsPage.tsx
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── SeatSelectionPage.tsx
            ├── CheckoutPage.tsx
            ├── PaymentPage.tsx
            ├── BookingConfirmationPage.tsx
            ├── MyTicketsPage.tsx
            ├── ProfilePage.tsx
            └── AdminDashboardPage.tsx
```

---

## Tech Stack

### Frontend
- **React 18 + Vite** with **TypeScript**
- **Tailwind CSS** (Dark Cinema aesthetic, glassmorphism, responsive layout)
- **React Router v6** (Protected Customer & Admin routes)
- **Axios** (Interceptors for automatic JWT attachment & unified error handling)
- **Lucide React** (Cinema & UI iconography)
- **Recharts** (Admin revenue, occupancy & genre analytics)

### Backend
- **Node.js & Express.js** (RESTful MVC architecture)
- **MongoDB & Mongoose** (7 normalized schemas with atomic seat-locking & transactions)
- **JWT + bcryptjs** (Stateless authentication & role-based access control)
- **QRCode & PDFKit / Nodemailer / Cloudinary** (Digital ticket generation, email dispatch & poster storage)

---

## REST API Reference

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new customer account |
| POST | `/api/auth/login` | Public | Authenticate user & return JWT token |
| GET | `/api/auth/me` | Protected | Get logged-in user profile |
| PUT | `/api/auth/profile` | Protected | Update profile name, phone, password |

### Movies
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/movies` | Public | List movies (supports `search`, `genre`, `language` query filters) |
| GET | `/api/movies/:id` | Public | Get full movie details, trailer, cast & upcoming shows |
| POST | `/api/movies` | Admin | Create a new movie with poster upload |
| PUT | `/api/movies/:id` | Admin | Update movie details or status |
| DELETE | `/api/movies/:id` | Admin | Delete movie and associated shows |

### Cinemas & Shows
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/cinemas` | Public | List all cinema halls & screens |
| POST | `/api/cinemas` | Admin | Add a new multiplex cinema |
| GET | `/api/shows` | Public | List shows filtered by `movieId`, `cinemaId`, `date` |
| GET | `/api/shows/:id/seats` | Public | Fetch real-time seat matrix for a show |
| POST | `/api/shows/:id/lock` | Protected | Temporarily lock selected seats for 10 minutes during checkout |
| POST | `/api/shows` | Admin | Schedule a new movie showtime |
| PUT | `/api/shows/:id` | Admin | Update showtime or pricing tiers |
| DELETE | `/api/shows/:id` | Admin | Cancel/delete a showtime |

### Bookings & Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings` | Protected | Process payment (Card/UPI), confirm seats & generate QR ticket |
| GET | `/api/bookings/user` | Protected | Get logged-in customer's booking history |
| GET | `/api/bookings/:id` | Protected | Get single booking with QR code & payment receipt |
| DELETE | `/api/bookings/:id` | Protected | Cancel booking (validates show cutoff rules & releases seats) |

### Admin Analytics
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/analytics` | Admin | Total users, bookings, revenue, occupancy & popular movies |
| GET | `/api/admin/users` | Admin | View and manage registered users |
| GET | `/api/admin/bookings` | Admin | View all bookings across all cinemas |

---

## Local Setup Instructions

### 1. Prerequisites
- **Node.js** >= 18.x
- **MongoDB** (Local instance `mongodb://127.0.0.1:27017/cineverse` or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
# Seed initial movies, cinemas, shows, seats, and demo accounts:
npm run seed
# Start development server on port 5000:
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Demo Credentials (Seeded)
- **Customer Account**: `arjun.mehta@example.com` / `Password@123`
- **Admin Account**: `admin@cineverse.com` / `Admin@123`

---

## Deployment Instructions

### Option A: Docker Compose (Recommended for One-Command Deployment)
```bash
docker-compose up --build -d
```
This spins up MongoDB (`27017`), the Express API (`5000`), and the Nginx-served React production bundle (`80`).

### Option B: Cloud Deployment (MongoDB Atlas + Render + Vercel)
1. **Database (MongoDB Atlas)**:
   - Create a cluster on MongoDB Atlas, whitelist `0.0.0.0/0`, and copy the connection string into `MONGO_URI`.
2. **Backend (Render / Railway)**:
   - Connect your GitHub repository, set root directory to `backend`, build command to `npm install`, and start command to `node server.js`.
   - Configure environment variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).
3. **Frontend (Vercel / Netlify)**:
   - Set root directory to `frontend`, framework preset to `Vite`, build command to `npm run build`, output directory to `dist`, and environment variable `VITE_API_URL=https://your-backend.onrender.com/api`.
