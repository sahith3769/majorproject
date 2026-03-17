require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function testEmailJS() {
  console.log("Testing EmailJS Integration...");
  const testEmail = "sathwikpamu@gmail.com"; // User's email from earlier
  const testOtp = "999999";

  try {
    await sendEmail(testEmail, testOtp);
    console.log("Test successful! EmailJS sent the OTP.");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testEmailJS();
