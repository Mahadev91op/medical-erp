import nodemailer from "nodemailer";

/**
 * Utility to send verification OTP via email
 * @param {string} email - Destination email address
 * @param {string} emailOtp - 6-digit email OTP
 * @param {string} [phoneOtp] - Optional 6-digit phone OTP (for signup)
 * @param {string} [type] - "signup" or "profile"
 * @returns {Promise<{success: boolean, mock: boolean}>}
 */
export async function sendOtpEmail(email, emailOtp, phoneOtp = null, type = "signup") {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"PharmaERP" <noreply@pharmaerp.com>`;

  const isConfigured = host && user && pass;

  let subject = "PharmaERP - Email Verification OTP";
  let html = "";

  if (type === "signup") {
    subject = "PharmaERP - Account Verification OTPs";
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #10b981; text-align: center;">Welcome to PharmaERP!</h2>
        <p style="color: #475569; font-size: 14px;">Thank you for registering. To complete your signup, please use the following one-time password (OTP) codes to verify your email and phone number.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; uppercase; tracking-wider;">Email Verification Code</p>
          <p style="margin: 5px 0 0; font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px;">${emailOtp}</p>
        </div>

        ${phoneOtp ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; uppercase; tracking-wider;">Phone Verification Code (Free Simulation)</p>
          <p style="margin: 5px 0 0; font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px;">${phoneOtp}</p>
        </div>
        ` : ''}

        <p style="color: #64748b; font-size: 12px;">These OTPs are valid for 10 minutes. Please do not share them with anyone.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">This is an automated system email, please do not reply.</p>
      </div>
    `;
  } else {
    subject = "PharmaERP - Profile Change Authorization Code";
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #10b981; text-align: center;">Profile Authorization Request</h2>
        <p style="color: #475569; font-size: 14px;">A request has been made to update details on your PharmaERP profile. Please verify this action using the authorization OTP below.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b; uppercase; tracking-wider;">Profile Update OTP Code</p>
          <p style="margin: 5px 0 0; font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px;">${emailOtp}</p>
        </div>

        <p style="color: #64748b; font-size: 12px;">This OTP is valid for 10 minutes. If you did not request this update, please ignore this email or change your password.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 10px; text-align: center;">This is an automated system email, please do not reply.</p>
      </div>
    `;
  }

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });

      return { success: true, mock: false };
    } catch (error) {
      console.error("Mailer Error (Failed to send email):", error);
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to send verification email. Please try again or check server SMTP configurations.");
      }
      // Fall through to mock logic in development
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email sending service is not configured on this server. Please contact administrator.");
    }
  }

  // Developer mock mode: log the codes to the console (Only in Development)
  console.log("\n==================================================");
  console.log("             PHARMAERP OTP VERIFICATION (MOCK)    ");
  console.log(`Destination Email: ${email}`);
  console.log(`Email OTP:         ${emailOtp}`);
  if (phoneOtp) {
    console.log(`Phone OTP:         ${phoneOtp}`);
  }
  console.log(`Action Type:       ${type.toUpperCase()}`);
  console.log("==================================================\n");

  return { success: true, mock: true };
}
