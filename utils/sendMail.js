const nodemailer = require("nodemailer");

const sendMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your SMTP provider
    auth: {
      user: process.env.SMTP_USER,   // your email
      pass: process.env.SMTP_PASS // your email app password
    },
  });

  await transporter.sendMail({
    from: `"Nyrah Jewellry" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendMail;
