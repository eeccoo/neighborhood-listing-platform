"use client";

import { useState, type FormEvent } from "react";

export default function InquiryForm({
  propertyId,
  address,
}: {
  propertyId: string;
  address: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailId = `inquiry-email-${propertyId}`;
  const messageId = `inquiry-message-${propertyId}`;
  const helpId = `inquiry-help-${propertyId}`;
  const headingId = `inquiry-heading-${propertyId}`;
  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          inquirer_email: String(values.get("email") ?? ""),
          message: String(values.get("message") ?? ""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const issue = result.issues?.[0]?.message;
        setError(issue ?? result.error ?? "Unable to send inquiry.");
        return;
      }

      form.reset();
      setSuccess("Your inquiry has been sent.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={headingId} className="mt-5 border-t border-slate-200 pt-5">
      <h4 id={headingId} className="font-bold">Ask about this property</h4>
      <p className="mt-2 text-sm text-slate-700">{address}</p>

      <form onSubmit={submitInquiry} className="mt-4 space-y-4">
        <div>
          <label htmlFor={emailId} className="block font-semibold">
            Your email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            className={`mt-2 w-full rounded border border-slate-500 bg-white p-3 ${focus}`}
          />
        </div>

        <div>
          <label htmlFor={messageId} className="block font-semibold">
            Message
          </label>
          <p id={helpId} className="mt-1 text-sm text-slate-600">
            Use 10 to 2,000 characters.
          </p>
          <textarea
            id={messageId}
            name="message"
            rows={4}
            minLength={10}
            maxLength={2000}
            aria-describedby={helpId}
            required
            className={`mt-2 w-full rounded border border-slate-500 bg-white p-3 ${focus}`}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className={`rounded bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60 ${focus}`}
        >
          {busy ? "Sending…" : "Send inquiry"}
        </button>

        {error && <p role="alert" className="text-red-800">{error}</p>}
        <p role="status" className="text-slate-700">{success}</p>
      </form>
    </section>
  );
}
