const axios = require("axios");
const logger = require("../config/logger");

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/* 
  EmailJS REST API Setup
  Uses standard HTTP port 443 which solves the Render SMTP firewall block.
*/
const sendEmailJS = async (to_email, subject, html_content, templateIdOverride = null, otp = "") => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = templateIdOverride || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    logger.error("Missing EmailJS credentials or Template ID in .env");
    return;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: to_email,
      subject: subject,
      message_html: html_content,
      otp: otp // Added so the template {{otp}} tag works if used
    }
  };

  try {
    const response = await axios.post(EMAILJS_URL, payload);
    console.log(`[SUCCESS] Email sent successfully to ${to_email}`);
    logger.info(`Email sent successfully to ${to_email}`);
  } catch (error) {
    const errData = error.response ? error.response.data : error.message;
    console.error(`[CRITICAL Email Send Error]:`, errData); 
    logger.error(`EmailJS Error: ${JSON.stringify(errData)}`);
    throw new Error("Failed to send email. Please try again later.");
  }
};

const wrapEmailTemplate = (content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 100%; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #1a202c; padding: 25px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">MRU CSE Placement Portal</h1>
      </div>
      <div style="padding: 35px 30px; color: #334155; text-align: left;">
        ${content}
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} MRU CSE Placement Cell. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

const sendEmail = async (email, otp) => {
  const subject = "OTP Verification - MRU CSE Placement Portal";
  const innerContent = `
    <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Verify Your Account</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #475569;">
      Welcome to the Placement Portal! Please use the following One-Time Password (OTP) to complete your verification process. This code is valid for <strong>10 minutes</strong>.
    </p>
    
    <div style="background-color: #f8fafc; padding: 30px 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #e2e8f0;">
      <span style="font-family: inherit; font-size: 38px; font-weight: 800; color: #3b82f6; letter-spacing: 12px; display: inline-block; padding-left: 12px;">${otp}</span>
    </div>

    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 0;">
      If you did not attempt to sign up or log in, please secure your account or ignore this email.
    </p>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 10px;">
      MRU CSE Placement Portal team will never ask for your password or codes via email.
    </p>
  `;
  const html = wrapEmailTemplate(innerContent);
  await sendEmailJS(email, subject, html, null, otp);
};

const sendStatusEmail = async (email, jobTitle, status, studentName) => {
  const subject = `Application Status Update: ${jobTitle}`;
  let innerContent = "";

  if (status === "accepted") {
    innerContent = `
      <h2 style="color: #2e7d32; margin-top: 0; font-size: 22px; font-weight: 700;">Congratulations, ${studentName}! 🎉</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">We are incredibly pleased to inform you that your application for the <strong>${jobTitle}</strong> position has been fiercely reviewed and <strong>ACCEPTED</strong>.</p>
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
        <p style="margin: 0; color: #1b5e20; font-weight: 500;">Next Steps: The hiring team will be reaching out to you shortly directly via email.</p>
      </div>
    `;
  } else if (status === "rejected") {
    innerContent = `
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Application Update</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Dear ${studentName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Thank you for taking the time to apply for the <strong>${jobTitle}</strong> opportunity.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">After careful consideration of your profile, we regret to inform you that the company will not be moving forward with your application at this time.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 20px;">We encourage you to keep applying through the portal! We wish you the absolute best in your placement journey.</p>
    `;
  } else {
    innerContent = `
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Application Status Changed</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">Dear ${studentName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">The status for your application to <strong>${jobTitle}</strong> has been updated.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 0; font-weight: 600; color: #3b82f6;">New Status: <span style="text-transform: uppercase;">${status}</span></p>
      </div>
    `;
  }

  const html = wrapEmailTemplate(innerContent);
  // Uses a dedicated Status Template ID if provided, otherwise falls back to the default
  const statusTemplateId = process.env.EMAILJS_STATUS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  await sendEmailJS(email, subject, html, statusTemplateId);
};

const sendAdminNotification = async (type, details) => {
  const adminEmail = process.env.ADMIN_EMAIL || "vinaykumarb874@gmail.com";
  let subject = "";
  let innerContent = "";

  if (type === "new_company") {
    subject = "Action Required: New Company Registration";
    innerContent = `
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">New Company Registration</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">A new recruiter has registered on the placement portal and is awaiting your approval to post jobs.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <ul style="margin: 0; padding-left: 20px; color: #334155;">
          <li style="margin-bottom: 8px;"><strong>Company Name:</strong> ${details.name}</li>
          <li><strong>Contact Email:</strong> ${details.email}</li>
        </ul>
      </div>
      <p style="font-size: 15px; color: #dc2626; font-weight: 600;">Please log in to the Admin Dashboard to review and approve their access immediately.</p>
    `;
  } else if (type === "new_job") {
    subject = "Action Required: New Job Posting";
    innerContent = `
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">New Job Posting Awaiting Review</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">An approved company has submitted a new job opportunity that requires publishing approval.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <ul style="margin: 0; padding-left: 20px; color: #334155;">
          <li style="margin-bottom: 8px;"><strong>Hiring Company:</strong> ${details.companyName}</li>
          <li><strong>Job Position:</strong> ${details.title}</li>
        </ul>
      </div>
      <p style="font-size: 15px; color: #dc2626; font-weight: 600;">Please log in to the Admin Dashboard to review the listing visually before publishing it to students.</p>
    `;
  }

  const html = wrapEmailTemplate(innerContent);
  const statusTemplateId = process.env.EMAILJS_STATUS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  await sendEmailJS(adminEmail, subject, html, statusTemplateId);
};

module.exports = { sendEmail, sendStatusEmail, sendAdminNotification };
