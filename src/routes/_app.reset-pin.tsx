import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { pinApi } from "@/lib/api";

export const Route = createFileRoute("/_app/reset-pin")({
  head: () => ({ meta: [{ title: "Reset Transaction PIN — Techub" }] }),
  component: ResetPinPage,
});

type Step = "request" | "verify";

function ResetPinPage() {
  const [step, setStep] = useState<Step>("request");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async () => {
    setIsSubmitting(true);
    try {
      await pinApi.requestReset();
      toast.success("OTP sent to your email address");
      setStep("verify");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    if (newPin.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await pinApi.resetConfirm({ otp, pin: newPin, pin_confirmation: confirmPin });
      toast.success("Transaction PIN reset successfully!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset PIN";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {step === "request" ? (
                <Mail className="h-8 w-8 text-primary" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {step === "request" ? "Reset Transaction PIN" : "Set New PIN"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "request"
                ? "We'll send a verification code to your email address."
                : "Enter the OTP from your email and set a new 4-digit PIN."}
            </p>
          </div>

          {step === "request" ? (
            <div className="space-y-6">
              <Button
                className="h-11 w-full"
                onClick={handleRequestOtp}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send Verification Code
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-center text-sm font-medium">
                  Enter OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="h-11 w-full rounded-lg border border-input bg-background px-4 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 block text-center text-sm font-medium">
                  New PIN
                </label>
                <PinInput value={newPin} onChange={setNewPin} />
              </div>

              <div>
                <label className="mb-2 block text-center text-sm font-medium">
                  Confirm PIN
                </label>
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>

              {newPin && confirmPin && newPin !== confirmPin && (
                <p className="text-center text-sm text-destructive">PINs do not match</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("request")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmReset}
                  disabled={isSubmitting || otp.length !== 6 || newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Reset PIN
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
