const nodemailer = require('nodemailer');

const getMailConfig = () => {
  const user = process.env.MAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.MAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 465),
    secure: String(process.env.MAIL_SECURE || 'true') !== 'false',
    auth: {
      user,
      pass
    },
    from: process.env.MAIL_FROM || `Hotelify <${user}>`
  };
};

const createTransporter = () => {
  const config = getMailConfig();

  if (!config) {
    const error = new Error('Email service is not configured');
    error.statusCode = 503;
    error.publicMessage = 'Email service is not configured. Please restart backend and check Gmail SMTP env.';
    throw error;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sendPasswordResetEmail = async ({ to, fullName, resetUrl, expiresInMinutes }) => {
  const config = getMailConfig();

  if (!config) {
    const error = new Error('Email service is not configured');
    error.statusCode = 503;
    error.publicMessage = 'Email service is not configured. Please restart backend and check Gmail SMTP env.';
    throw error;
  }

  const transporter = createTransporter();
  const displayName = fullName || 'Hotelify user';
  const safeDisplayName = escapeHtml(displayName);
  const safeResetUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Reset your Hotelify password',
    text: [
      `Hello ${displayName},`,
      '',
      'We received a request to reset the password for your Hotelify account.',
      `Open this link within ${expiresInMinutes} minutes to create a new password:`,
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#253044">
        <h2 style="margin:0 0 12px">Reset your Hotelify password</h2>
        <p>Hello ${safeDisplayName},</p>
        <p>We received a request to reset the password for your Hotelify account.</p>
        <p>
          <a href="${safeResetUrl}" style="display:inline-block;padding:12px 18px;border-radius:6px;background:#0b84b3;color:#ffffff;text-decoration:none;font-weight:700">
            Create a new password
          </a>
        </p>
        <p>This link expires in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};

const sendReservationCancellationEmail = async ({
  to,
  fullName,
  bookingCode,
  supportPhone,
  refundAmount = 0,
  kind = 'canceled'
}) => {
  if (!to) {
    return;
  }

  const config = getMailConfig();

  if (!config) {
    return;
  }

  const transporter = createTransporter();
  const displayName = fullName || 'Hotelify customer';
  const safeDisplayName = escapeHtml(displayName);
  const safeBookingCode = escapeHtml(bookingCode);
  const safeSupportPhone = escapeHtml(supportPhone);
  const amountText = new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(refundAmount || 0));

  const isSupportRequired = kind === 'support-required';
  const subject = isSupportRequired
    ? `Cancellation support required for booking ${bookingCode}`
    : `Booking ${bookingCode} cancellation update`;
  const plainLines = isSupportRequired
    ? [
        `Hello ${displayName},`,
        '',
        `Your booking ${bookingCode} is within 48 hours of check-in, so Hotelify cannot process automatic cancellation/refund online.`,
        `Please contact ${supportPhone} directly for support.`,
        'Please prepare your bank transfer information: account holder, bank name, account number, and booking code.',
        '',
        'Hotelify'
      ]
    : [
        `Hello ${displayName},`,
        '',
        `Your booking ${bookingCode} has been canceled.`,
        refundAmount > 0
          ? `Refund amount processed through VNPAY: ${amountText}.`
          : 'No payment refund is required for this booking.',
        `If you need support, please contact ${supportPhone}.`,
        '',
        'Hotelify'
      ];

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text: plainLines.join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#253044">
        <h2 style="margin:0 0 12px">${isSupportRequired ? 'Cancellation support required' : 'Booking cancellation update'}</h2>
        <p>Hello ${safeDisplayName},</p>
        <p>Booking code: <strong>${safeBookingCode}</strong></p>
        ${
          isSupportRequired
            ? `<p>Your booking is within 48 hours of check-in, so Hotelify cannot process automatic cancellation/refund online.</p>
               <p>Please contact <strong>${safeSupportPhone}</strong> directly for support.</p>
               <p>Please prepare your bank transfer information: account holder, bank name, account number, and booking code.</p>`
            : `<p>Your booking has been canceled.</p>
               <p>${refundAmount > 0 ? `Refund amount processed through VNPAY: <strong>${escapeHtml(amountText)}</strong>.` : 'No payment refund is required for this booking.'}</p>
               <p>If you need support, please contact <strong>${safeSupportPhone}</strong>.</p>`
        }
      </div>
    `
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendReservationCancellationEmail
};
