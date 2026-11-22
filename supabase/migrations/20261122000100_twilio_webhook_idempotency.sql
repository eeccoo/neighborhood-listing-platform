-- Stores one deterministic response per Twilio CallSid.
-- Caller phone numbers and transcript content are intentionally excluded.

create table public.twilio_webhook_events (
  call_sid text primary key,
  event_type text not null,
  response_xml text not null,
  created_at timestamptz not null default now(),

  constraint twilio_call_sid_format
    check (call_sid ~ '^CA[a-fA-F0-9]{32}$'),

  constraint twilio_event_type_allowed
    check (event_type in ('voice-inbound'))
);

alter table public.twilio_webhook_events
  enable row level security;

alter table public.twilio_webhook_events
  force row level security;

revoke all
  on public.twilio_webhook_events
  from anon, authenticated;

create index twilio_webhook_events_created_at_idx
  on public.twilio_webhook_events (
    created_at desc
  );