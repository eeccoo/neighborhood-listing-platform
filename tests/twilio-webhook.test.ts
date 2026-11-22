import assert from "node:assert/strict";
import test from "node:test";

import twilio from "twilio";

import {
  extractVapiTwiml,
  FALLBACK_TWIML,
  isValidCallSid,
  maskCallSid,
  maskPhoneNumber,
} from "../src/lib/twilio/webhook-security";

const authToken = "test-auth-token";

const webhookUrl =
  "https://example.com/api/webhooks/twilio/voice";

const parameters = {
  CallSid:
    "CA11111111111111111111111111111111",
  From: "+12135551234",
  To: "+12135559876",
};

test("validates a genuine HMAC-SHA1 Twilio signature", () => {
  const signature =
    twilio.getExpectedTwilioSignature(
      authToken,
      webhookUrl,
      parameters,
    );

  assert.equal(
    twilio.validateRequest(
      authToken,
      signature,
      webhookUrl,
      parameters,
    ),
    true,
  );
});

test("rejects a changed request using the same signature", () => {
  const signature =
    twilio.getExpectedTwilioSignature(
      authToken,
      webhookUrl,
      parameters,
    );

  assert.equal(
    twilio.validateRequest(
      authToken,
      signature,
      webhookUrl,
      {
        ...parameters,
        From: "+12135550000",
      },
    ),
    false,
  );
});

test("masks phone numbers and CallSid values", () => {
  assert.equal(
    maskPhoneNumber("+1 (213) 555-1234"),
    "***-***-1234",
  );

  assert.equal(
    maskCallSid(
      "CA11111111111111111111111111111111",
    ),
    "CA…111111",
  );
});

test("validates the Twilio CallSid format", () => {
  assert.equal(
    isValidCallSid(
      "CA11111111111111111111111111111111",
    ),
    true,
  );

  assert.equal(
    isValidCallSid("invalid-call-id"),
    false,
  );
});

test("extracts valid TwiML returned by Vapi", () => {
  const twiml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    "<Response><Connect/></Response>";

  assert.equal(
    extractVapiTwiml({
      phoneCallProviderDetails: {
        twiml,
      },
    }),
    twiml,
  );
});

test("rejects unsafe or malformed Vapi TwiML", () => {
  assert.equal(
    extractVapiTwiml({
      phoneCallProviderDetails: {
        twiml:
          "<!DOCTYPE test><Response></Response>",
      },
    }),
    null,
  );

  assert.equal(
    extractVapiTwiml({
      unexpected: "response",
    }),
    null,
  );
});

test("fallback TwiML gives the caller a safe message", () => {
  assert.equal(
    FALLBACK_TWIML,
    '<?xml version="1.0" encoding="UTF-8"?>' +
      "<Response>" +
      "<Say>We are temporarily unable to connect your call. " +
      "Please try again later.</Say>" +
      "<Hangup/>" +
      "</Response>",
  );
});