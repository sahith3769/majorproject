require('dotenv').config();
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const testMailerSend = async () => {
    console.log("=========================================");
    console.log("   MailerSend Diagnostic Tool            ");
    console.log("=========================================\n");

    const apiKey = process.env.MAILERSEND_API_KEY;
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL || "info@trial-2p0347z011plzdrn.mlsender.net";
    const adminEmail = process.env.ADMIN_EMAIL || "vinaykumarb874@gmail.com";

    console.log(`1. Environment Variables:`);
    console.log(`   MAILERSEND_API_KEY: ${apiKey ? "********" + apiKey.slice(-6) : "MISSING!"}`);
    console.log(`   MAILERSEND_FROM_EMAIL: ${fromEmail}`);
    console.log(`   TEST_RECIPIENT (ADMIN_EMAIL): ${adminEmail}\n`);

    if (!apiKey) {
        console.error("❌ CRITICAL ERROR: Missing MAILERSEND_API_KEY in .env");
        process.exit(1);
    }

    try {
        console.log("2. Configuring MailerSend...");
        const mailersend = new MailerSend({ apiKey });
        console.log("   SDK configured successfully.\n");

        console.log("3. Attempting to send a test email...");
        
        const sentFrom = new Sender(fromEmail, "Placement Portal Admin");
        const recipients = [new Recipient(adminEmail, "Admin")];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject("Diagnostic Test - MailerSend API")
            .setHtml("<strong>This is a test email to verify MailerSend configuration.</strong>")
            .setText("This is a test email to verify MailerSend configuration.");

        const response = await mailersend.email.send(emailParams);
        
        console.log(`   ✅ Test Email Sent Successfully!`);
        console.log(`   Response Status: ${response.statusCode || 'OK'}`);

    } catch (error) {
        console.error("\n❌ DIAGNOSTIC FAILED!");
        console.error("Error Message:", error.body ? JSON.stringify(error.body) : error.message);
        
        console.log("\n💡 DIAGNOSIS: The API key might be invalid, or the 'From' email is not authorized in your MailerSend dashboard.");
    }
};

testMailerSend();
