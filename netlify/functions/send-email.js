import { Resend } from "resend";

function parseBody(event) {
  const ct = (event.headers?.["content-type"] || event.headers?.["Content-Type"] || "").toLowerCase();
  const raw = event.body || "";

  // Netlify Forms default: application/x-www-form-urlencoded
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    return {
      name: params.get("name") || "",
      email: params.get("email") || "",
      message: params.get("message") || "",
    };
  }

  // JSON (if you're using fetch)
  if (ct.includes("application/json")) {
    try {
      const obj = JSON.parse(raw);
      return {
        name: obj.name || "",
        email: obj.email || "",
        message: obj.message || "",
      };
    } catch {
      return { name: "", email: "", message: "" };
    }
  }

  // Fallback: try JSON, else empty
  try {
    const obj = JSON.parse(raw);
    return {
      name: obj.name || "",
      email: obj.email || "",
      message: obj.message || "",
    };
  } catch {
    return { name: "", email: "", message: "" };
  }
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL;

  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: "Missing RESEND_API_KEY env var" };
  }
  if (!TO_EMAIL) {
    return { statusCode: 500, body: "Missing TO_EMAIL env var" };
  }

  const { name, email, message } = parseBody(event);

  // Basic validation
  if (!name || !email || !message) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    // 1) Send to admin inbox
    const adminRes = await resend.emails.send({
      from: "P2A Journey <onboarding@resend.dev>",
      to: TO_EMAIL,
      subject: "New Inquiry Received - P2A Journey",
      html: `
        <h2>New Inquiry</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br/>${String(message).replace(/\n/g, "<br/>")}</p>
      `,
      replyTo: email,
    });

    console.log("Admin email response:", adminRes);

    // 2) Auto-reply to sender
    const autoRes = await resend.emails.send({
      from: "P2A Journey <onboarding@resend.dev>",
      to: email,
      subject: "Thank you for your inquiry - Panpacific University",
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for contacting the Internationalization (IZN) Office of Panpacific University.</p>
        <p>We have received your inquiry and will respond as soon as possible.</p>
        <p>Regards,<br/>Internationalization (IZN) Office<br/>Panpacific University</p>
      `,
    });

    console.log("Auto-reply response:", autoRes);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Resend error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: String(err?.message || err) }),
    };
  }
}
