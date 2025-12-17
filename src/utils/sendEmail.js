const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    console.log("Configuring email transporter with user:", process.env.EMAIL_USER);

    // Switch to Port 587 (STARTTLS)
    // Sometimes Port 465 is blocked by firewalls.
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Must be false for port 587
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
    });

    const mailOptions = {
        from: `GetWork Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Nodemailer Error Details:", error);
        throw error;
    }
};

module.exports = sendEmail;
