const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = async (email, otp) => {
  const mailOptions = {
    from: `"Fran's Tailor" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your verification code is <b>${otp}</b>. It expires in 10 min.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
