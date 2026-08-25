"use client";

import { letterPhotoTiltDeg, publicBottleImageUrl } from "@/lib/bottleImage";

type Props = {
  imagePath: string;
  tiltId: string;
  className?: string;
};

export default function LetterPhoto({ imagePath, tiltId, className = "" }: Props) {
  const tilt = letterPhotoTiltDeg(tiltId);
  const src = publicBottleImageUrl(imagePath);

  return (
    <div className={`mt-3 flex justify-center ${className}`}>
      <div
        className="bg-white p-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.18),0_2px_6px_rgba(15,23,42,0.08)] max-w-[85%]"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="block max-h-64 w-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
