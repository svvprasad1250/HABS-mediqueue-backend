const SibApiV3Sdk = require("sib-api-v3-sdk");

const sendEmail = async (to, subject, htmlContent) => {
    const client = SibApiV3Sdk.ApiClient.instance;

    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
        email: "venkatprashu008@gmail.com", // 👈 YOU CAN USE YOUR GMAIL HERE
        name: "MediQueue"
    };

    const receivers = [
        {
            email: to
        }
    ];

    await tranEmailApi.sendTransacEmail({
        sender,
        to: receivers,
        subject: subject,
        htmlContent: htmlContent
    });

    console.log("✅ Email sent successfully");
};

module.exports = sendEmail;