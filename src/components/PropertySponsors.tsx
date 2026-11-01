"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const SponsorResponseSchema = z.object({
  sponsors: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().min(2),
      tier: z.enum(["gold", "silver", "bronze"]),
    }),
  ),
});

type Sponsor = z.infer<typeof SponsorResponseSchema>["sponsors"][number];

export default function PropertySponsors({
  propertyId,
  address,
}: {
  propertyId: string;
  address: string;
}) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/properties/${encodeURIComponent(propertyId)}/sponsors`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Sponsor request failed.");
        }

        const payload = SponsorResponseSchema.parse(await response.json());

        if (!controller.signal.aborted) {
          setSponsors(payload.sponsors);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Sponsor information is temporarily unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [propertyId]);

  return (
    <aside
      aria-label={`Sponsors for ${address}`}
      aria-busy={loading}
      className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-slate-950"
    >
      <h4 className="font-bold">Property sponsors</h4>

      {loading ? (
        <p role="status" className="mt-2 text-sm">
          Loading sponsors…
        </p>
      ) : error ? (
        <p role="alert" className="mt-2 text-sm">{error}</p>
      ) : sponsors.length === 0 ? (
        <p className="mt-2 text-sm">No active sponsors available.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              <p className="font-semibold">{sponsor.name}</p>
              <p className="text-sm">
                Sponsored ·{" "}
                <span className="capitalize">{sponsor.tier}</span> tier
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
