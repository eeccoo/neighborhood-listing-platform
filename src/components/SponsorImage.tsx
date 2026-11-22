"use client";

import Image from "next/image";
import { useState } from "react";

interface SponsorImageProps {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export default function SponsorImage({
  src,
  width,
  height,
  alt,
}: SponsorImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex aspect-video w-full items-center justify-center bg-amber-100 p-6 text-center font-semibold text-amber-900"
      >
        Sponsor image unavailable
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-amber-100">
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-amber-100"
        />
      )}

      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes="(max-width: 768px) 100vw, 50vw"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}