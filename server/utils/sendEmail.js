const sendEmail = async (email, otp) => {
  const payload = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL || "info@smartplacement.com",
      name: "Smart Placement Portal"
    },
    to: [
      {
        email: email
      }
    ],
    subject: "Smart Placement Portal OTP Verification",
    html: `
      <h3>Your OTP is:</h3>
      <h2>${otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  };

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MAILERSEND_API_KEY}`,
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("MailerSend Error:", errorText);
    throw new Error("Failed to send email via MailerSend");
  }
};

const sendStatusEmail = async (email, jobTitle, status, studentName) => {
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

  const payload = {
    from: {
      email: process.env.MAILERSEND_FROM_EMAIL || "info@smartplacement.com",
      name: "Smart Placement Portal"
    },
    to: [
      {
        email: email
      }
    ],
    subject: subject,
    html: message,
  };

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MAILERSEND_API_KEY}`,
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("MailerSend Error:", errorText);
    throw new Error("Failed to send email via MailerSend");
  }
};

module.exports = { sendEmail, sendStatusEmail };
