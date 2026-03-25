const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
    await resend.emails.send({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: htmlContent
    });
};

module.exports = sendEmail;