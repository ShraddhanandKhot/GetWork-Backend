const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // 1. Log configuration (mask password)
    console.log("Configuring email transporter with user:", process.env.EMAIL_USER);

    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Define email options
    const mailOptions = {
        from: `GetWork Support <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // 2. Wrap sendMail in try/catch to log detailed error
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Nodemailer Error Details:", error);
        throw error; // Re-throw to be caught by the controller
    }
};

module.exports = sendEmail;
