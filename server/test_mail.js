const axios = require('axios');
require('dotenv').config();

const testMailerSend = async () => {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || "MS_Yhzala@test-2p0347z011plzdrn.mlsender.net";
  
  console.log(`Testing MailerSend with:`);
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`From Email: ${fromEmail}`);

  const client = axios.create({
    baseURL: "https://api.mailersend.com/v1",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
  });

  const data = {
    from: { email: fromEmail, name: "Test Builder" },
    to: [{ email: "vinaykumarb874@gmail.com", name: "Recipient" }],
    subject: "Test Email",
    text: "This is a test email to verify credentials.",
    html: "<b>This is a test email to verify credentials.</b>"
  };

  try {
    const response = await client.post('/email', data);
    console.log("SUCCESS!");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
  } catch (error) {
    console.log("FAILED!");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Details:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error:", error.message);
    }
  }
};

testMailerSend();
