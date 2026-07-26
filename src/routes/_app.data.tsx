import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wifi, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataSchema, type DataInput } from "@/lib/validations";
import { billsApi, variationsApi, type Variation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PinVerifyDialog } from "@/components/PinVerifyDialog";
import { updateWalletBalance } from "@/lib/queries";

const providers = [
  { name: "MTN", value: "mtn", vtpassServiceId: "mtn-data", color: "#FFCC00" },
  { name: "Airtel", value: "airtel", vtpassServiceId: "airtel-data", color: "#E4002B" },
  { name: "Glo", value: "glo", vtpassServiceId: "glo-data", color: "#00A651" },
  { name: "9mobile", value: "9mobile", vtpassServiceId: "9mobile-data", color: "#00B04F" },
];

export const Route = createFileRoute("/_app/data")({
  head: () => ({ meta: [{ title: "Buy Data — TechHub" }] }),
  component: DataPage,
});

function DataPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<DataInput | null>(null);
  const { hasPin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<DataInput>({
    resolver: zodResolver(dataSchema),
    defaultValues: { provider: "", phone: "", plan: "", amount: undefined },
  });

  const selectedProvider = form.watch("provider");
  const selectedPlan = form.watch("plan");

  const vtpassServiceId =
    providers.find((p) => p.value === selectedProvider)?.vtpassServiceId ?? "";

  const { data: variationsResponse, isLoading: isLoadingVariations } = useQuery({
    queryKey: ["variations", vtpassServiceId],
    queryFn: () => variationsApi.getVariations(vtpassServiceId),
    enabled: !!vtpassServiceId,
    staleTime: 1000 * 60 * 10,
  });

  const plans: Variation[] = variationsResponse?.data?.variations ?? [];

  function handleProviderChange(value: string) {
    form.setValue("provider", value, { shouldValidate: true });
    form.setValue("plan", "", { shouldValidate: false });
    form.setValue("amount", undefined, { shouldValidate: false });
  }

  function handlePlanChange(value: string) {
    form.setValue("plan", value, { shouldValidate: true });
    const plan = plans.find((p) => p.variation_code === value);
    if (plan && plan.amount > 0) {
      form.setValue("amount", plan.amount, { shouldValidate: true });
    }
  }

  async function onSubmit(values: DataInput) {
    if (!hasPin) {
      navigate({ to: "/setup-pin" });
      return;
    }
    setPendingValues(values);
    setPinDialogOpen(true);
  }

  async function executeData(pin: string) {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      const result = await billsApi.buyData({
        phone: pendingValues.phone,
        plan: pendingValues.plan,
        amount: pendingValues.amount ?? 0,
        provider: pendingValues.provider,
      }, pin);
      toast.success("Data purchased successfully!");
      updateWalletBalance(queryClient, result?.new_balance);
      form.reset();
      setPendingValues(null);
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
        title="Buy data"
        description="Cheap data bundles for MTN, Airtel, Glo and 9mobile."
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
                          onClick={() => handleProviderChange(p.value)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-sm font-medium transition hover:shadow-sm",
                            selectedProvider === p.value
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
                      name="plan"
                      render={() => (
                        <FormItem>
                          <FormLabel>Data plan</FormLabel>
                          <Select
                            disabled={!selectedProvider || isLoadingVariations}
                            value={selectedPlan}
                            onValueChange={handlePlanChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue
                                  placeholder={
                                    isLoadingVariations
                                      ? "Loading plans..."
                                      : selectedProvider
                                        ? "Select a plan"
                                        : "Select provider first"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans.map((p) => (
                                <SelectItem key={p.variation_code} value={p.variation_code}>
                                  {p.name}
                                  {p.amount > 0 ? ` — ₦${p.amount.toLocaleString()}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
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
                    Buy data
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
                <Wifi className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Buy Data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cheap data bundles for MTN, Airtel, Glo and 9mobile.
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

      <PinVerifyDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onVerified={(pin) => executeData(pin)}
      />
    </div>
  );
}
