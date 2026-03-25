const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
    const response = await resend.emails.send({
        from: "onboarding@resend.dev", // ✅ MUST USE THIS
        to: to,
        subject: subject,
        html: htmlContent
    });

    console.log("Email response:", response); // 👈 add this for debug
};

module.exports = sendEmail;