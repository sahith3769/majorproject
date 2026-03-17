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
      <h3>Welcome to MRU CSE Placement Portal</h3>
      <p>Your OTP for account verification is:</p>
      <h2 style="color: #2563eb; font-size: 2rem; letter-spacing: 5px;">${otp}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to ${email}`);
  } catch (error) {
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
