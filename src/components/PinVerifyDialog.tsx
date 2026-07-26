import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { pinApi } from "@/lib/api";

interface PinVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (pin: string) => void;
}

export function PinVerifyDialog({ open, onOpenChange, onVerified }: PinVerifyDialogProps) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await pinApi.verify(pin);
      toast.success("PIN verified successfully");
      const pinValue = pin;
      setPin("");
      onOpenChange(false);
      onVerified(pinValue);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid PIN";
      setError(message);
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Enter Transaction PIN</DialogTitle>
          <DialogDescription className="text-center">
            Enter your 4-digit transaction PIN to authorize this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setError(""); }}
            autoFocus
          />

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleVerify}
              disabled={isVerifying || pin.length !== 4}
            >
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
