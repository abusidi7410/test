import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";
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
import { airtimeToCashSchema, type AirtimeToCashInput } from "@/lib/validations";
import { billsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const providers = [
  { name: "MTN", value: "mtn", color: "#FFCC00" },
  { name: "Airtel", value: "airtel", color: "#E4002B" },
  { name: "Glo", value: "glo", color: "#00A651" },
  { name: "9mobile", value: "9mobile", color: "#00B04F" },
];

export const Route = createFileRoute("/_app/airtime-to-cash")({
  head: () => ({ meta: [{ title: "Airtime to Cash — TechHub" }] }),
  component: AirtimeToCashPage,
});

function AirtimeToCashPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AirtimeToCashInput>({
    resolver: zodResolver(airtimeToCashSchema),
    defaultValues: { provider: "", phone: "", amount: undefined },
  });

  async function onSubmit(values: AirtimeToCashInput) {
    setIsSubmitting(true);
    try {
      await billsApi.convertAirtime({
        phone: values.phone,
        amount: values.amount,
        provider: values.provider,
      });
      toast.success("Airtime converted to cash successfully!");
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
        title="Airtime to cash"
        description="Instantly convert unused airtime to cash in your wallet."
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
                      Select provider
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {providers.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            form.setValue("provider", p.value, { shouldValidate: true })
                          }
                          className={cn(
                            "flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-sm font-medium transition hover:shadow-sm",
                            form.watch("provider") === p.value
                              ? "border-primary shadow-sm"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <span
                            className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white"
                            style={{ background: p.color }}
                          >
                            {p.name[0]}
                          </span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                    {form.formState.errors.provider && (
                      <p className="mt-1 text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.provider.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0803 000 0000"
                              type="tel"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Airtime amount</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="₦500 minimum"
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
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full sm:w-auto sm:px-8"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Convert to cash
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
                <Coins className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Airtime to Cash</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Instantly convert unused airtime to cash in your wallet.
              </p>
              <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processing time</span>
                  <span className="font-medium">Instant</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="font-medium">5%</span>
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
