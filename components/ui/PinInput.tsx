"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function PinInput({ value, onChange, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, " ").split("").slice(0, 4);

  const updateDigit = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d === " " ? "" : d));
    const joined = next.join("").replace(/\s/g, "").slice(0, 4);
    onChange(joined);
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i] === " " ? "" : digits[i]}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            updateDigit(i, char);
            if (char && i < 3) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i]?.trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          className="h-12 w-11 rounded-lg border-2 border-slate-300 bg-white text-center text-xl font-semibold text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
