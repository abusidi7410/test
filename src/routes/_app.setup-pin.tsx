import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { pinApi } from "@/lib/api";

export const Route = createFileRoute("/_app/setup-pin")({
  head: () => ({ meta: [{ title: "Set Transaction PIN — TechHub" }] }),
  component: SetupPinPage,
});

function SetupPinPage() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await pinApi.set({ pin, pin_confirmation: confirmPin });
      toast.success("Transaction PIN set successfully!");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set PIN";
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
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Set Transaction PIN</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a 4-digit PIN to secure your transactions. You'll need this PIN for every transfer, bill payment, and withdrawal.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-center text-sm font-medium">
                Enter PIN
              </label>
              <PinInput value={pin} onChange={setPin} autoFocus />
            </div>

            <div>
              <label className="mb-2 block text-center text-sm font-medium">
                Confirm PIN
              </label>
              <PinInput value={confirmPin} onChange={setConfirmPin} />
            </div>

            {pin && confirmPin && pin !== confirmPin && (
              <p className="text-center text-sm text-destructive">PINs do not match</p>
            )}

            <Button
              className="h-11 w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Set PIN
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="text-primary hover:underline"
              >
                Skip for now
              </button>{" "}
              — You'll be reminded before your next transaction.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
