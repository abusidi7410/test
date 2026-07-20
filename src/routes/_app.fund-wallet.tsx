import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { fundWalletSchema, type FundWalletInput } from "@/lib/validations";
import { walletApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const methods = [
  { name: "Card", value: "card", color: "#111827" },
  { name: "Bank Transfer", value: "bank_transfer", color: "#D32F2F" },
  { name: "USSD", value: "ussd", color: "#0EA5E9" },
  { name: "Crypto", value: "crypto", color: "#F59E0B" },
];

export const Route = createFileRoute("/_app/fund-wallet")({
  head: () => ({ meta: [{ title: "Fund Wallet — TechHub" }] }),
  component: FundWalletPage,
});

function FundWalletPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FundWalletInput>({
    resolver: zodResolver(fundWalletSchema),
    defaultValues: { method: "", amount: undefined },
  });

  async function onSubmit(values: FundWalletInput) {
    setIsSubmitting(true);
    try {
      await walletApi.fund({ amount: values.amount, method: values.method });
      toast.success("Wallet funding initiated! You will be redirected to complete payment.");
      form.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fund your wallet"
        description="Top up your TechHub wallet with a card, bank transfer or USSD."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                      Select method
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {methods.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => form.setValue("method", m.value, { shouldValidate: true })}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-sm font-medium transition hover:shadow-sm",
                            form.watch("method") === m.value
                              ? "border-primary shadow-sm"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <span
                            className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white"
                            style={{ background: m.color }}
                          >
                            {m.name[0]}
                          </span>
                          {m.name}
                        </button>
                      ))}
                    </div>
                    {form.formState.errors.method && (
                      <p className="mt-1 text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.method.message}
                      </p>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="₦100 minimum"
                            type="number"
                            className="h-11"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : "")
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-11 w-full sm:w-auto sm:px-8"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Fund wallet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <PlusCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Fund Wallet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Top up your TechHub wallet with a card, bank transfer or USSD.
              </p>
              <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processing time</span>
                  <span className="font-medium">Instant</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="font-medium">₦0.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-medium text-[color:var(--success)]">24 / 7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
