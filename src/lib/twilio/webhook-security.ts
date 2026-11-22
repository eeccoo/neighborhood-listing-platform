export const FALLBACK_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  "<Response>" +
  "<Say>We are temporarily unable to connect your call. " +
  "Please try again later.</Say>" +
  "<Hangup/>" +
  "</Response>";

export function extractVapiTwiml(
  payload: unknown,
): string | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("phoneCallProviderDetails" in payload)
  ) {
    return null;
  }

  const details =
    payload.phoneCallProviderDetails;

  if (
    typeof details !== "object" ||
    details === null ||
    !("twiml" in details) ||
    typeof details.twiml !== "string"
  ) {
    return null;
  }

  const twiml = details.twiml.trim();

  const hasValidRoot =
    twiml.startsWith("<Response") ||
    twiml.startsWith("<?xml");

  if (
    !hasValidRoot ||
    !twiml.includes("<Response") ||
    !twiml.endsWith("</Response>") ||
    twiml.includes("<!DOCTYPE") ||
    twiml.length > 20_000
  ) {
    return null;
  }

  return twiml;
}

export function maskPhoneNumber(
  phoneNumber: string | undefined,
): string {
  if (!phoneNumber) {
    return "[redacted]";
  }

  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length < 4) {
    return "[redacted]";
  }

  return `***-***-${digits.slice(-4)}`;
}

export function maskCallSid(
  callSid: string,
): string {
  if (callSid.length < 8) {
    return "[redacted]";
  }

  return `CA…${callSid.slice(-6)}`;
}

export function isValidCallSid(
  value: string | undefined,
): value is string {
  return (
    typeof value === "string" &&
    /^CA[a-fA-F0-9]{32}$/.test(value)
  );
}