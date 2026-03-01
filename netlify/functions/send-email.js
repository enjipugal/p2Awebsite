import { Resend } from "resend";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "P2A Journey <onboarding@resend.dev>",
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: "New Inquiry Received",
      html: `
        <h2>New Inquiry</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    await resend.emails.send({
      from: "Panpacific University <onboarding@resend.dev>",
      to: email,
      subject: "Inquiry Received – Panpacific University",
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for contacting us. We have received your inquiry.</p>
        <p>Our team will respond within 1–2 business days.</p>
        <p>Best regards,<br>Internationalization Office<br>Panpacific University</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
