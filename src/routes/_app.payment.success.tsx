import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQueryClient } from "@tanstack/react-query";
import { paymentApi, type PaymentVerifyResponse } from "@/lib/api";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/payment/success")({
  head: () => ({ meta: [{ title: "Payment Processing — TechHub" }] }),
  component: PaymentSuccessPage,
});

type VerifyState =
  | { status: "loading" }
  | { status: "success"; data: PaymentVerifyResponse }
  | { status: "error"; message: string };

function PaymentSuccessPage() {
  const search = Route.useSearch() as { reference?: string; trxref?: string };
  const reference = search.reference || search.trxref;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState<VerifyState>({ status: "loading" });
  const [retrying, setRetrying] = useState(false);
  const hasVerified = useRef(false);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["spendingSummary"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] }),
    ]);
  }, [queryClient]);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setState({ status: "error", message: "No transaction reference found in the URL." });
      return;
    }

    setState({ status: "loading" });
    setRetrying(true);

    try {
      const result = await paymentApi.verify(reference);

      if (result.status === "success") {
        setState({ status: "success", data: result });
        await refreshAll();
      } else {
        setState({
          status: "error",
          message: result.message || "Payment could not be verified. Please try again.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setState({ status: "error", message });
    } finally {
      setRetrying(false);
    }
  }, [reference, refreshAll]);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    verifyPayment();
  }, [verifyPayment]);

  // Auto-redirect to dashboard 2 seconds after success
  useEffect(() => {
    if (state.status !== "success") return;
    const timer = setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.status, navigate]);

  return (
    <div>
      <PageHeader
        title="Payment processing"
        description="Verifying your transaction with Paystack."
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md"
      >
        <Card>
          <CardContent className="p-8 text-center">
            {/* Loading */}
            {state.status === "loading" && (
              <>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold">Verifying Payment</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we confirm your payment with Paystack...
                </p>
                {reference && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Reference: {reference}
                  </p>
                )}
              </>
            )}

            {/* Success */}
            {state.status === "success" && (
              <>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">Payment Successful</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your wallet has been credited with{" "}
                  <span className="font-semibold text-foreground">
                    {formatNaira(state.data.amount)}
                  </span>
                  .
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  New balance: {formatNaira(state.data.balance)}
                </p>
                {reference && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Reference: {reference}
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Redirecting to dashboard in a few seconds...
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Button asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/wallet">
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      View Wallet
                    </Link>
                  </Button>
                </div>
              </>
            )}

            {/* Error */}
            {state.status === "error" && (
              <>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold">Verification Failed</h2>
                <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
                {reference && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Reference: {reference}
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-3">
                  <Button onClick={verifyPayment} disabled={retrying}>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    {retrying ? "Verifying..." : "Retry Verification"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/fund-wallet">
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      Fund Wallet Again
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
