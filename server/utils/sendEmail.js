const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const logger = require("../config/logger");

const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sendEmail = async (email, otp) => {
  const subject = "OTP Verification - MRU CSE Placement Portal";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 100%; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1a202c; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MRU CSE Placement Portal</h1>
        </div>
        <div style="padding: 40px 30px; color: #334155; text-align: left;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Verify Your Account</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #475569;">
            Welcome to the Placement Portal! Please use the following One-Time Password (OTP) to complete your verification process. This code is valid for <strong>5 minutes</strong>.
          </p>
          
          <div style="background-color: #f8fafc; padding: 30px 20px; border-radius: 12px; text-align: center; margin: 35px 0; border: 1px solid #f1f5f9;">
            <span style="font-family: inherit; font-size: 42px; font-weight: 800; color: #3b82f6; letter-spacing: 12px; display: inline-block; padding-left: 12px;">${otp}</span>
          </div>

          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 0;">
            If you did not attempt to sign up or log in, please secure your account or ignore this email.
          </p>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 10px;">
            MRU CSE Placement Portal team will never ask for your password or codes via email.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} MRU CSE Placement Cell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await executeMailerSend(email, subject, html);
};

const sendStatusEmail = async (email, jobTitle, status, studentName) => {
  const subject = `Application Status Update: ${jobTitle}`;
  let message = "";

  if (status === "accepted") {
    message = `
      <h3>Congratulations, ${studentName}! 🎉</h3>
      <p>We are pleased to inform you that your application for <strong>${jobTitle}</strong> has been <strong>ACCEPTED</strong>.</p>
      <p>The company will reach out to you shortly for the next steps.</p>
    `;
  } else if (status === "rejected") {
    message = `
      <h3>Application Update</h3>
      <p>Dear ${studentName},</p>
      <p>Thank you for applying for <strong>${jobTitle}</strong>.</p>
      <p>After careful review, we regret to inform you that we will not be moving forward with your application at this time.</p>
      <p>We wish you the best in your future endeavors.</p>
    `;
  } else {
    message = `
      <h3>Application Update</h3>
      <p>The status for your application to <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>
    `;
  }

  await executeMailerSend(email, subject, message);
};

const sendAdminNotification = async (type, details) => {
  const adminEmail = process.env.ADMIN_EMAIL || "vinaykumarb874@gmail.com";
  let subject = "";
  let message = "";

  if (type === "new_company") {
    subject = "New Company Registration - Review Required";
    message = `
      <h3>New Company Registration</h3>
      <p>A new recruiter has registered on the portal:</p>
      <ul>
        <li><strong>Name:</strong> ${details.name}</li>
        <li><strong>Email:</strong> ${details.email}</li>
      </ul>
      <p>Please log in to the Admin Dashboard to review and approve their access.</p>
    `;
  } else if (type === "new_job") {
    subject = "New Job Posting - Approval Needed";
    message = `
      <h3>New Job Posting Awaiting Review</h3>
      <p>A company has posted a new job opportunity:</p>
      <ul>
        <li><strong>Company:</strong> ${details.companyName}</li>
        <li><strong>Job Title:</strong> ${details.title}</li>
      </ul>
      <p>Please review the listing in the Admin Dashboard.</p>
    `;
  }

  await executeMailerSend(adminEmail, subject, message);
};

const executeMailerSend = async (toEmail, subject, htmlContent) => {
  try {
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL || "info@trial-2p0347z011plzdrn.mlsender.net",
      "MRU CSE Placement Portal"
    );
    const recipients = [new Recipient(toEmail, toEmail)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(htmlContent.replace(/<[^>]+>/g, '')); // Basic fallback text

    const response = await mailersend.email.send(emailParams);
    console.log(`[SUCCESS] Email sent successfully to ${toEmail}`);
    logger.info(`Email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`[CRITICAL Email Send Error]:`, error.body || error.message);
    logger.error(`MailerSend Error for ${toEmail}: ${JSON.stringify(error.body || error.message)}`);
    throw new Error("Failed to send email. Please try again later.");
  }
};

module.exports = { sendEmail, sendStatusEmail, sendAdminNotification };
