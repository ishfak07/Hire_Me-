const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables."
    );
  }

  return nodemailer.createTransport({
    service: "gmail", // Use service instead of manual host/port configuration
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();

    // Verify SMTP connection configuration
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const mailOptions = {
      from: `"HireMe Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - HireMe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Password Reset Request</h1>
          <p>Your OTP for password reset is: <strong style="font-size: 24px; color: #3498db;">${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color: #7f8c8d;">If you didn't request this password reset, please ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #95a5a6;">This is an automated email, please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      recipient: email,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", {
      error: error.message,
      code: error.code,
      command: error.command,
    });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

module.exports = { sendOTP };
