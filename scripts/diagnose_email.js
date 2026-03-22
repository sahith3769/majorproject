require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('./config/logger');

const testNodemailer = async () => {
    console.log("=========================================");
    console.log("   Nodemailer Diagnostic Tool            ");
    console.log("=========================================\n");

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log(`1. Environment Variables:`);
    console.log(`   SMTP_HOST: ${host}`);
    console.log(`   SMTP_PORT: ${port}`);
    console.log(`   SMTP_USER: ${user}`);
    console.log(`   SMTP_PASS: ${pass ? "********" + pass.slice(-4) : "MISSING!"}\n`);

    if (!user || !pass) {
        console.error("❌ CRITICAL ERROR: Missing SMTP credentials in .env");
        process.exit(1);
    }

    try {
        console.log("2. Configuring Transporter...");
        const transporter = nodemailer.createTransport({
            host: host,
            port: port || 587,
            secure: port == 465, // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass,
            },
        });
        console.log("   Transporter configured successfully.\n");

        console.log("3. Verifying SMTP Connection...");
        await transporter.verify();
        console.log("   ✅ Connection Verified - Authentication Successful!\n");

        console.log("4. Attempting to send a test email...");
        
        // Let's test the EXACT format we use in production
        const otp = "123456";
        const email = user; // Send to self

        const mailOptions = {
            from: `"MRU CSE Placement Portal" <${user}>`,
            to: email, // Changed to test email
            subject: "Diagnostic Test - OTP Verification",
            text: `Welcome to MRU CSE Placement Portal. Your OTP is: ${otp}`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #1e293b; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">MRU CSE Placement Portal</h1>
                </div>
                <div style="padding: 40px; color: #334155;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Verify Your Account</h2>
                  <p style="font-size: 16px; line-height: 1.6;">Welcome to the Placement Portal! Please use the following One-Time Password (OTP) to complete your verification process. This code is valid for <strong>5 minutes</strong>.</p>
                  
                  <div style="background-color: #f1f5f9; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #2563eb;">${otp}</span>
                  </div>
        
                  <p style="font-size: 14px; color: #64748b; line-height: 1.5;">If you did not attempt to sign up or log in, please secure your account or ignore this email.</p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} MRU CSE Placement Cell. All rights reserved.</p>
                </div>
              </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`   ✅ Test Email Sent Successfully!`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Accepted by: ${info.accepted}`);
        console.log(`   Rejected by: ${info.rejected}`);

    } catch (error) {
        console.error("\n❌ DIAGNOSTIC FAILED!");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Response:", error.response);

        if (error.code === 'EAUTH') {
            console.log("\n💡 DIAGNOSIS: Authentication Failed.");
            console.log("If you are using Gmail, this usually means one of two things:");
            console.log("1. The 'App Password' is incorrect or has been revoked.");
            console.log("2. 2-Step Verification is not enabled on the Gmail account.");
        } else if (error.code === 'ESOCKET') {
             console.log("\n💡 DIAGNOSIS: Network/Firewall Issue.");
             console.log("The server could not connect to smtp.gmail.com on port 587.");
        } else if (error.message.includes('Envelope')) {
             console.log("\n💡 DIAGNOSIS: Invalid Sender/Recipient.");
             console.log("Make sure SMTP_USER is a valid, correctly formatted email address.");
        }
    }
};

testNodemailer();
