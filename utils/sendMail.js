const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // ✅ FORCE IPv4

const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"MediQueue" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
    });
};

module.exports = sendEmail;