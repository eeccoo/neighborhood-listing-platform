import {
  NextRequest,
  NextResponse,
} from "next/server";

import twilio from "twilio";

import { createSupabaseAdminClient } from
  "@/lib/supabase/admin";

import {
  extractVapiTwiml,
  FALLBACK_TWIML,
  isValidCallSid,
  maskCallSid,
  maskPhoneNumber,
} from "@/lib/twilio/webhook-security";

export const runtime = "nodejs";

function twimlResponse(
  xml: string,
  status = 200,
): NextResponse {
  return new NextResponse(xml, {
    status,
    headers: {
      "Content-Type":
        "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function formDataToParameters(
  formData: FormData,
): Record<string, string> {
  const parameters: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      parameters[key] = value;
    }
  }

  return parameters;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const authToken =
    process.env.TWILIO_AUTH_TOKEN;

  const webhookUrl =
    process.env.TWILIO_VOICE_WEBHOOK_URL;

  if (!authToken || !webhookUrl) {
    return new NextResponse(
      "Webhook configuration unavailable.",
      {
        status: 503,
        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let parameters: Record<string, string>;

  try {
    const formData = await request.formData();
    parameters = formDataToParameters(formData);
  } catch {
    return new NextResponse(
      "Webhook body must be form encoded.",
      { status: 400 },
    );
  }

  const signature = request.headers.get(
    "x-twilio-signature",
  );

  const signatureIsValid =
    signature !== null &&
    twilio.validateRequest(
      authToken,
      signature,
      webhookUrl,
      parameters,
    );

  if (!signatureIsValid) {
    return new NextResponse(
      "Invalid Twilio signature.",
      {
        status: 403,
        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const callSid = parameters.CallSid;
  const caller = parameters.From;

  if (!isValidCallSid(callSid)) {
    return new NextResponse(
      "Missing or invalid CallSid.",
      { status: 400 },
    );
  }

  try {
    const vapiKey =
      process.env.VAPI_PRIVATE_API_KEY;

    const vapiPhoneNumberId =
      process.env.VAPI_PHONE_NUMBER_ID;

    const vapiAssistantId =
      process.env.VAPI_ASSISTANT_ID;

    if (
      !vapiKey ||
      !vapiPhoneNumberId ||
      !vapiAssistantId
    ) {
      throw new Error(
        "Vapi configuration is unavailable.",
      );
    }

    if (
      !caller ||
      !/^\+[1-9]\d{7,14}$/.test(caller)
    ) {
      throw new Error(
        "Caller number is unavailable.",
      );
    }

    const supabase =
      createSupabaseAdminClient();

    // Reserve CallSid before contacting Vapi.
    // A retry receives the stored response instead
    // of creating a second Vapi call.
    const { error: insertError } = await supabase
      .from("twilio_webhook_events")
      .insert({
        call_sid: callSid,
        event_type: "voice-inbound",
        response_xml: FALLBACK_TWIML,
      });

    if (insertError?.code === "23505") {
      const {
        data: existingEvent,
        error: readError,
      } = await supabase
        .from("twilio_webhook_events")
        .select("response_xml")
        .eq("call_sid", callSid)
        .single();

      if (readError || !existingEvent) {
        throw new Error(
          "Duplicate response could not be read.",
        );
      }

      console.info("twilio_voice_webhook", {
        callSid: maskCallSid(callSid),
        from: maskPhoneNumber(caller),
        outcome: "duplicate-replayed",
      });

      return twimlResponse(
        existingEvent.response_xml,
      );
    }

    if (insertError) {
      throw new Error(
        "Webhook event could not be stored.",
      );
    }

    const vapiResponse = await fetch(
      "https://api.vapi.ai/call",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumberId: vapiPhoneNumberId,
          phoneCallProviderBypassEnabled: true,
          customer: {
            number: caller,
          },
          assistantId: vapiAssistantId,
        }),
      },
    );

    if (!vapiResponse.ok) {
      throw new Error(
        "Vapi service rejected the call.",
      );
    }

    const vapiPayload: unknown =
      await vapiResponse.json();

    const responseXml =
      extractVapiTwiml(vapiPayload);

    if (!responseXml) {
      throw new Error(
        "Vapi returned invalid TwiML.",
      );
    }

    const { error: updateError } =
      await supabase
        .from("twilio_webhook_events")
        .update({
          response_xml: responseXml,
        })
        .eq("call_sid", callSid);

    if (updateError) {
      throw new Error(
        "Vapi response could not be stored.",
      );
    }

    console.info("twilio_voice_webhook", {
      callSid: maskCallSid(callSid),
      from: maskPhoneNumber(caller),
      outcome: "accepted",
    });

    return twimlResponse(responseXml);
  } catch {
    console.error(
      "twilio_voice_webhook_error",
      {
        callSid: maskCallSid(callSid),
        from: maskPhoneNumber(caller),
        outcome: "fallback-returned",
      },
    );

    return twimlResponse(FALLBACK_TWIML);
  }
}