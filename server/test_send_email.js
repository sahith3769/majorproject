require('dotenv').config();
const { sendEmail } = require("./utils/sendEmail");

const testLiveEmail = async () => {
    const recipient = "sathwikpamu@gmail.com";
    const sampleOtp = "842961";

    console.log(`🚀 Dispatching sample premium OTP mail to: ${recipient}`);

    try {
        await sendEmail(recipient, sampleOtp);
        console.log("✅ SUCCESS! Check your inbox.");
    } catch (error) {
        console.error("❌ FAILED:", error.message);
    }
};

testLiveEmail();
