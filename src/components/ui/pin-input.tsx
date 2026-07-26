import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function PinInput({ length = 4, value, onChange, disabled = false, autoFocus = true, className }: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d*$/.test(digit)) return;

      const newValue = value.split("");
      newValue[index] = digit;
      const result = newValue.join("").slice(0, length);
      onChange(result);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (!value[index] && index > 0) {
          const newValue = value.split("");
          newValue[index - 1] = "";
          onChange(newValue.join(""));
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [length, onChange]
  );

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(i)}
          className={cn(
            "h-14 w-14 text-center text-xl font-semibold rounded-lg border bg-background text-foreground transition-all",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value[i] ? "border-primary" : "border-input",
            focusedIndex === i && "border-primary ring-2 ring-primary/20"
          )}
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </div>
  );
}
