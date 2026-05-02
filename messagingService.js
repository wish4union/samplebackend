// ─────────────────────────────────────────────────────────────────────────────
//  messagingService.js  –  Twilio WhatsApp + SendGrid email helpers
//
//  Both functions return a result object:
//    { success: true,  sid/messageId }   on success
//    { success: false, error: <string> } on failure
//
//  They NEVER throw – callers can safely use them without try/catch.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const twilio  = require("twilio");
const sgMail  = require("@sendgrid/mail");

// ── Twilio client (lazy initialise so missing env doesn't crash import) ──────
let twilioClient = null;
function getTwilioClient() {
  if (!twilioClient) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.startsWith("ACxxx")) {
      return null; // credentials not configured
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

// ── SendGrid setup ────────────────────────────────────────────────────────────
if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.startsWith("SG.xxx")) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Build message bodies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plain-text WhatsApp message body for a birthday wish.
 */
function buildWhatsAppMessage(name) {
  return (
    `🎂 Happy Birthday, ${name}! 🎉\n\n` +
    `Wishing you a wonderful day filled with joy, laughter, and all the things that make you smile. ` +
    `Your dedication and talent inspire the whole team.\n\n` +
    `Have a fantastic birthday! 🥳\n— The HR Team`
  );
}

/**
 * HTML email body for a birthday wish.
 */
function buildEmailHtml(name) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin:0; padding:0; }
    .container { max-width:580px; margin:40px auto; background:#fff; border-radius:12px;
                 overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.1); }
    .header { background: linear-gradient(135deg,#ff6b6b,#ffa07a); padding:40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:2rem; }
    .body { padding:32px 40px; color:#333; line-height:1.7; }
    .body h2 { color:#ff6b6b; }
    .footer { background:#f0f0f0; padding:20px 40px; font-size:.85rem; color:#888; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size:3rem">🎂</div>
      <h1>Happy Birthday!</h1>
    </div>
    <div class="body">
      <h2>Dear ${name},</h2>
      <p>
        On behalf of the entire team, we want to wish you a very <strong>Happy Birthday</strong>! 🎉
      </p>
      <p>
        Your hard work, creativity, and positive energy make this company a better place every single day.
        Today is YOUR day — we hope it's as wonderful as you are!
      </p>
      <p>Wishing you all the best, today and always. 🥳</p>
      <p>With warm regards,<br/><strong>The HR Team</strong></p>
    </div>
    <div class="footer">
      This message was sent automatically by the Birthday Wishes System.
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  WhatsApp sender
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a birthday WhatsApp message via Twilio.
 * @param {object} staffMember – must have .name and .phone
 */
async function sendWhatsApp(staffMember) {
  const client = getTwilioClient();

  // ── DEMO MODE: Twilio not configured ────────────────────────────────────────
  if (!client) {
    console.log(`[WhatsApp DEMO] Would send to ${staffMember.name} (${staffMember.phone})`);
    return { success: true, demo: true, sid: "DEMO_SID" };
  }

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
      to:   `whatsapp:${staffMember.phone}`,
      body: buildWhatsAppMessage(staffMember.name)
    });

    console.log(`[WhatsApp] Sent to ${staffMember.name} – SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`[WhatsApp ERROR] ${staffMember.name}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Email sender
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a birthday email via SendGrid.
 * @param {object} staffMember – must have .name and .email
 */
async function sendEmail(staffMember) {
  const apiKey = process.env.SENDGRID_API_KEY;

  // ── DEMO MODE: SendGrid not configured ──────────────────────────────────────
  if (!apiKey || apiKey.startsWith("SG.xxx")) {
    console.log(`[Email DEMO] Would send to ${staffMember.name} <${staffMember.email}>`);
    return { success: true, demo: true, messageId: "DEMO_MSG_ID" };
  }

  const msg = {
    to:      staffMember.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "hr@yourcompany.com",
      name:  process.env.SENDGRID_FROM_NAME  || "HR Team"
    },
    subject: `🎂 Happy Birthday, ${staffMember.name}!`,
    html:    buildEmailHtml(staffMember.name)
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[Email] Sent to ${staffMember.name} – Status: ${response.statusCode}`);
    return { success: true, statusCode: response.statusCode };
  } catch (err) {
    console.error(`[Email ERROR] ${staffMember.name}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Combined sender – calls both WhatsApp and Email in parallel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends birthday wishes to a staff member via both WhatsApp AND email.
 * Returns a combined result object.
 */
async function sendBirthdayWish(staffMember) {
  const [whatsappResult, emailResult] = await Promise.all([
    sendWhatsApp(staffMember),
    sendEmail(staffMember)
  ]);

  return {
    name:      staffMember.name,
    whatsapp:  whatsappResult,
    email:     emailResult,
    allSuccess: whatsappResult.success && emailResult.success,
    demo:       !!(whatsappResult.demo || emailResult.demo)
  };
}

module.exports = { sendBirthdayWish, sendWhatsApp, sendEmail };
