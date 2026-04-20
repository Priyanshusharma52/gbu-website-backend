const nodemailer = require("nodemailer");
const env = require("../config/env");
const { logInfo, logError } = require("../config/logger");

let transporter;

const isMailConfigured = () => {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
};

const getTransporter = () => {
  if (!isMailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();

  if (!transport) {
    logInfo("SMTP not configured. Email was not sent.", { to, subject });
    return { queued: false };
  }

  try {
    const result = await transport.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html,
    });

    return { queued: true, messageId: result.messageId };
  } catch (error) {
    logError("Failed to send email", {
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  sendMail,
  isMailConfigured,
};
