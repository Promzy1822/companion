import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP    = "Companion";

export async function sendVerificationEmail(
  to: string, name: string, otp: string
): Promise<boolean> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `${otp} is your Companion verification code`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#1877F2;padding:32px 24px;text-align:center">
          <div style="width:56px;height:56px;border-radius:16px;background:#EA580C;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
            <span style="font-size:28px">🎓</span>
          </div>
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">${APP}</h1>
          <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">AI JAMB Study Assistant</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 24px">
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#050505">Verify your email</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#65676B;line-height:1.6">
            Hi ${name}, use the code below to verify your Companion account. It expires in <strong>10 minutes</strong>.
          </p>
          <!-- OTP Box -->
          <div style="background:#F0F7FF;border:2px solid #1877F233;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#1877F2;font-family:monospace">${otp}</div>
            <p style="margin:8px 0 0;font-size:12px;color:#65676B">Enter this code in the Companion app</p>
          </div>
          <p style="margin:0;font-size:12px;color:#8A8D91;line-height:1.6">
            If you didn't create a Companion account, you can safely ignore this email.
            <br>This code expires in 10 minutes and can only be used once.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #E4E6EB;text-align:center">
          <p style="margin:0;font-size:11px;color:#8A8D91">© ${new Date().getFullYear()} Companion · AI JAMB Study Assistant</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    return true;
  } catch (err) {
    console.error("[email] sendVerificationEmail failed:", err);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string, name: string, resetUrl: string
): Promise<boolean> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `Reset your Companion password`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="background:#1877F2;padding:32px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">${APP}</h1>
          <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">AI JAMB Study Assistant</p>
        </td></tr>
        <tr><td style="padding:32px 24px">
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#050505">Reset your password</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#65676B;line-height:1.6">
            Hi ${name}, tap the button below to reset your password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#1877F2;color:#fff;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 4px 14px rgba(24,119,242,0.35)">
              Reset Password →
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:12px;color:#8A8D91">Or copy this link:</p>
          <p style="margin:0;font-size:11px;color:#1877F2;word-break:break-all">${resetUrl}</p>
          <p style="margin:16px 0 0;font-size:12px;color:#8A8D91;line-height:1.6">
            If you didn't request a password reset, ignore this email. Your password won't change.
            <br>This link expires in 1 hour and can only be used once.
          </p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #E4E6EB;text-align:center">
          <p style="margin:0;font-size:11px;color:#8A8D91">© ${new Date().getFullYear()} Companion · AI JAMB Study Assistant</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    return true;
  } catch (err) {
    console.error("[email] sendPasswordResetEmail failed:", err);
    return false;
  }
}
