const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const sendEmail = async (email, otp) => {
  const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY,
  });

  const sentFrom = new Sender(
    process.env.MAILERSEND_FROM_EMAIL || "info@smartplacement.com", 
    "Smart Placement Portal"
  );
  
  const recipients = [
    new Recipient(email, "Student")
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject("Smart Placement Portal OTP Verification")
    .setHtml(`
      <h3>Your OTP is:</h3>
      <h2>${otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
    `);

  try {
    const response = await mailerSend.email.send(emailParams);
    console.log("MailerSend OTP sent successfully", response.statusCode);
  } catch (error) {
    console.error("MailerSend Error:", error?.body ? error.body : error);
    throw new Error("Failed to send email via MailerSend SDK");
  }
};

const sendStatusEmail = async (email, jobTitle, status, studentName) => {
  const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY,
  });

  const sentFrom = new Sender(
    process.env.MAILERSEND_FROM_EMAIL || "info@smartplacement.com", 
    "Smart Placement Portal"
  );

  const recipients = [
    new Recipient(email, studentName)
  ];

  const subject = `Application Status Update: ${jobTitle}`;
  let message = "";

  if (status === "accepted") {
    message = `
      <h3>Congratulations, ${studentName}! 🎉</h3>
      <p>We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> has been <strong>ACCEPTED</strong>.</p>
      <p>The company will contact you shortly with further details.</p>
    `;
  } else if (status === "rejected") {
    message = `
      <h3>Application Update</h3>
      <p>Dear ${studentName},</p>
      <p>Thank you for your interest in the position of <strong>${jobTitle}</strong>.</p>
      <p>After careful consideration, we regret to inform you that your application has not been selected for the next round.</p>
      <p>We wish you the best in your job search!</p>
    `;
  } else {
    message = `
      <h3>Application Update</h3>
      <p>Your application status for <strong>${jobTitle}</strong> has been updated to: <strong>${status}</strong>.</p>
    `;
  }

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(message);

  try {
    const response = await mailerSend.email.send(emailParams);
    console.log("MailerSend Status email sent successfully", response.statusCode);
  } catch (error) {
    console.error("MailerSend Error:", error?.body ? error.body : error);
    throw new Error("Failed to send email via MailerSend SDK");
  }
};

module.exports = { sendEmail, sendStatusEmail };
