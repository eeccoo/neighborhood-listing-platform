"use client";

import { useEffect } from "react";

interface SponsorImpressionProps {
  sponsorId: string;
  placement: string;
  pageContext: string;
}

export default function SponsorImpression({
  sponsorId,
  placement,
  pageContext,
}: SponsorImpressionProps) {
  useEffect(() => {
    const body = JSON.stringify({
      sponsorId,
      placement,
      pageContext,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/sponsor-impressions",
        new Blob([body], {
          type: "application/json",
        }),
      );

      return;
    }

    void fetch("/api/sponsor-impressions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  }, [pageContext, placement, sponsorId]);

  return null;
}