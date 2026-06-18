const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

// Create SMTP Transporter
if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
} else {
  // Local development / Mock transport using Ethereal email fallback
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'mabelle.macejkovic36@ethereal.email', // pre-configured dummy account
      pass: 'P36e1qF8H2Wp8NfKvw'
    }
  });
  logger.warn('SMTP settings not found. Fallback configured to Ethereal Email sandbox.');
}

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email HTML message body
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"shopEZ Support" <noreply@shopez.com>',
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};
