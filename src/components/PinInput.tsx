"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PinInput({ value, onChange, disabled }: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, " ").split("").slice(0, 4);

  const updateDigit = (index: number, digit: string) => {
    const arr = value.padEnd(4, " ").split("").slice(0, 4);
    arr[index] = digit;
    const newValue = arr.join("").replace(/ /g, "").slice(0, 4);
    onChange(newValue);
  };

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    updateDigit(index, digit);
    if (index < 3) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index] && digits[index] !== " ") {
        updateDigit(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        updateDigit(index - 1, "");
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 3);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-3">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i] === " " ? "" : digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-14 rounded-2xl border-2 border-white/40 bg-white/80 text-center text-2xl font-bold text-gray-800 shadow-sm backdrop-blur-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
