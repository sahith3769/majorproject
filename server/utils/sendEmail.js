const axios = require("axios");
const logger = require("../config/logger");

/* 
  Direct HTTP API helper for MailerSend
  This avoids SDK dependency issues on production platforms like Render.
*/
const mailerSendApi = axios.create({
  baseURL: "https://api.mailersend.com/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

/* Helper to get authorization header */
const getAuthHeaders = () => ({
  Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
});

const sendEmail = async (email, otp) => {
  const emailParams = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL || "MS_Yhzala@test-2p0347z011plzdrn.mlsender.net",
      name: "MRU CSE Placement Portal",
    },
    to: [
      {
        email: email,
        name: "Student",
      },
    ],
    subject: "OTP Verification - MRU CSE Placement Portal",
    html: `
      <h3>Welcome to MRU CSE Placement Portal</h3>
      <p>Your OTP for account verification is:</p>
      <h2 style="color: #2563eb; font-size: 2rem; letter-spacing: 5px;">${otp}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await mailerSendApi.post("/email", {
      ...emailParams,
      text: `Welcome to MRU CSE Placement Portal. Your OTP is: ${otp}`,
    }, { headers: getAuthHeaders() });
    logger.info(`OTP email sent successfully to ${email}`);
  } catch (error) {
    if (error.response) {
      logger.error(`MailerSend OTP Error Details: ${JSON.stringify(error.response.data)}`);
      logger.error(`MailerSend OTP Status: ${error.response.status}`);
    } else {
      logger.error(`MailerSend OTP Error: ${error.message}`);
    }
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

  const emailParams = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL || "MS_Yhzala@test-2p0347z011plzdrn.mlsender.net",
      name: "MRU CSE Placement Portal",
    },
    to: [
      {
        email: email,
        name: studentName,
      },
    ],
    subject: subject,
    html: message,
  };

  try {
    const textMessage = status === "accepted" ? 
      `Congratulations! Your application for ${jobTitle} has been accepted.` : 
      `Your application for ${jobTitle} has been updated to: ${status}`;

    await mailerSendApi.post("/email", {
      ...emailParams,
      text: textMessage,
    }, { headers: getAuthHeaders() });
    logger.info(`Status update email sent to ${email}`);
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`MailerSend Status Email Error: ${errorMsg}`);
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

  const emailParams = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL || "MS_Yhzala@test-2p0347z011plzdrn.mlsender.net",
      name: "Placement Portal System",
    },
    to: [
      {
        email: adminEmail,
        name: "Admin",
      },
    ],
    subject: subject,
    html: message,
  };

  try {
    await mailerSendApi.post("/email", {
      ...emailParams,
      text: `Update for Admin: ${subject}`,
    }, { headers: getAuthHeaders() });
    logger.info(`Admin notification (${type}) sent successfully`);
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    logger.error(`Admin Notification Error: ${errorMsg}`);
  }
};

module.exports = { sendEmail, sendStatusEmail, sendAdminNotification };
