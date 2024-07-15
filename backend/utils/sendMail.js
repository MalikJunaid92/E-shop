const nodemailer = require("nodemailer");
const ErrorHandler = require("./ErrorHandler");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.verify(); // Verify connection configuration

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.emailMessage,
    };

    const info = await transporter.sendMail(mailOptions); // Send mail

    console.log("Message sent: %s", info.messageId);

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new ErrorHandler(500, error.message);
  }
};

module.exports = sendEmail;
