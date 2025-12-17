const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    console.log("Configuring email transporter with user:", process.env.EMAIL_USER);

    // Explicit Gmail Configuration
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000, // 10 seconds
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
