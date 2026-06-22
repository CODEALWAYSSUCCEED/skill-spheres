import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const TO_EMAIL = "317solutions.ai@gmail.com";
const FROM_EMAIL = "317 Solutions <onboarding@resend.dev>";

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  service_interest?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const data: ContactEmailRequest = await req.json();

    if (!data.name || !data.email || !data.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #0f2460; padding: 28px 32px; }
    .header h1 { color: #f59e0b; font-size: 20px; margin: 0 0 4px; }
    .header p { color: rgba(255,255,255,0.6); font-size: 13px; margin: 0; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 18px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 15px; color: #111827; }
    .message-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 4px; }
    .divider { height: 1px; background: #f3f4f6; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Inquiry</h1>
      <p>Submitted via 317 Solutions website</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${data.name}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${data.email}" style="color:#0f2460;">${data.email}</a></div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${data.phone}</div>
      </div>` : ''}
      ${data.service_interest ? `
      <div class="field">
        <div class="label">Service Interest</div>
        <div class="value"><span class="badge">${data.service_interest}</span></div>
      </div>` : ''}
      <div class="divider"></div>
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box">${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      </div>
    </div>
    <div class="footer">
      Sent from the 317 Solutions contact form &bull; ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
    </div>
  </div>
</body>
</html>`;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY secret not configured — email not sent.");
      return new Response(
        JSON.stringify({ success: true, warning: "Email service not configured." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: data.email,
        subject: `New Inquiry: ${data.service_interest || "General"} from ${data.name}`,
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend API error:", resendRes.status, errText);
      // Still return success to client — inquiry is saved in DB
      return new Response(
        JSON.stringify({ success: true, warning: "Email delivery issue, inquiry saved." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message sent. We will be in touch shortly." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
