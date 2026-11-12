const QRCode = require('qrcode');

const generateTicketQR = async (payload) => {
  const jsonString = JSON.stringify(payload);
  return await QRCode.toDataURL(jsonString, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 260,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
};

module.exports = { generateTicketQR };
