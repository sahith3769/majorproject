const nodemailer = require("nodemailer");
const logger = require("../config/logger");

/* 
  Nodemailer Setup
  Using SMTP for flexibility on production platforms like Render.
*/
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (email, otp) => {
  const mailOptions = {
    from: `"MRU CSE Placement Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "OTP Verification - MRU CSE Placement Portal",
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] OTP email sent successfully to ${email}`);
    logger.info(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[CRITICAL Email Send Error]:`, error); // Force output to raw console
    logger.error(`Nodemailer OTP Error: ${error.message}`);
    throw new Error("Failed to send verification email. Please try again later.");
  }
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

  const mailOptions = {
    from: `"MRU CSE Placement Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    text: status === "accepted" ? 
      `Congratulations! Your application for ${jobTitle} has been accepted.` : 
      `Your application for ${jobTitle} has been updated to: ${status}`,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Status update email sent to ${email}`);
  } catch (error) {
    logger.error(`Nodemailer Status Email Error: ${error.message}`);
  }
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

  const mailOptions = {
    from: `"Placement Portal System" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: subject,
    text: `Update for Admin: ${subject}`,
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Admin notification (${type}) sent successfully`);
  } catch (error) {
    logger.error(`Admin Notification Error: ${error.message}`);
  }
};

module.exports = { sendEmail, sendStatusEmail, sendAdminNotification };
