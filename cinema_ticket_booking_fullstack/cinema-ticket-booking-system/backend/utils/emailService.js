const nodemailer = require('nodemailer');

const sendTicketConfirmationEmail = async ({ to, customerName, booking }) => {
  try {
    if (!process.env.SMTP_HOST) {
      console.log(`[Email Simulation] Sent ticket ${booking.bookingCode} to ${to}`);
      return true;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'tickets@cineverse.com',
      to,
      subject: `Booking Confirmed: ${booking.bookingCode} | CineVerse`,
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #f43f5e;">Your Cinema Ticket is Ready!</h2>
          <p>Hi ${customerName},</p>
          <p>Your booking <strong>${booking.bookingCode}</strong> is confirmed.</p>
          <ul>
            <li><strong>Show Date & Time:</strong> ${booking.showDate} at ${booking.showTime}</li>
            <li><strong>Screen:</strong> ${booking.screen}</li>
            <li><strong>Seats:</strong> ${booking.seats.map((s) => s.seatNumber).join(', ')}</li>
            <li><strong>Total Paid:</strong> INR ${booking.totalAmount}</li>
          </ul>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
};

module.exports = { sendTicketConfirmationEmail };
