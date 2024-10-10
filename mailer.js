const nodemailer = require("nodemailer");

async function sendEmail(data) {
  console.log(
    process.env.SMTP_SERVICE,
    process.env.SMTP_PORT,
    process.env.SMTP_HOST,
    process.env.SMTP_EMAIL,
    process.env.SMTP_PASSWORD
  );
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      host: process.env.SMTP_HOST,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.verify();
    const res = await transporter.sendMail(data);
    return res;
  } catch (error) {
    console.error(error);
  }
}

module.exports = sendEmail;
