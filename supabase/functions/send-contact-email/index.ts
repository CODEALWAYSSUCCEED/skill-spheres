import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const contactData: ContactEmailRequest = await req.json();

    // Validate required fields
    if (!contactData.name || !contactData.email || !contactData.message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format the email body
    const emailBody = `
New Contact Inquiry from 317 Solutions Website

Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone || "Not provided"}
Service Interest: ${contactData.service_interest || "Not specified"}

Subject: ${contactData.subject}

Message:
${contactData.message}

---
This inquiry was submitted through the 317 Solutions contact form.
    `.trim();

    // Log the contact inquiry (since we don't have a real email service configured)
    console.log("Contact Inquiry Received:", {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      service_interest: contactData.service_interest,
      subject: contactData.subject,
      timestamp: new Date().toISOString(),
    });

    // In a production environment, you would integrate with an email service here
    // Examples: SendGrid, Resend, AWS SES, etc.
    // For now, we just log it and return success

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact inquiry received. We will respond shortly.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing contact email:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
