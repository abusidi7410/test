import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Zap, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { electricitySchema, type ElectricityInput } from "@/lib/validations";
import { billsApi, type MeterVerification } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PinVerifyDialog } from "@/components/PinVerifyDialog";
import { updateWalletBalance } from "@/lib/queries";

const providers = [
  { name: "Ikeja Electric", value: "ikeja", color: "#D32F2F" },
  { name: "Eko Electricity", value: "eko", color: "#0EA5E9" },
  { name: "Abuja Electric", value: "abuja", color: "#F59E0B" },
  { name: "Kano Electric", value: "kano", color: "#059669" },
  { name: "Ibadan Electric", value: "ibadan", color: "#7C3AED" },
  { name: "Enugu Electric", value: "enugu", color: "#DB2777" },
  { name: "Benin Electric", value: "benin", color: "#0891B2" },
  { name: "Port Harcourt Electric", value: "ph", color: "#65A30D" },
];

export const Route = createFileRoute("/_app/electricity")({
  head: () => ({ meta: [{ title: "Electricity — TechHub" }] }),
  component: ElectricityPage,
});

function ElectricityPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [meterInfo, setMeterInfo] = useState<MeterVerification | null>(null);
  const [verified, setVerified] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ElectricityInput | null>(null);
  const { hasPin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ElectricityInput>({
    resolver: zodResolver(electricitySchema),
    defaultValues: {
      provider: "",
      meter_number: "",
      amount: undefined,
      meter_type: undefined,
    },
  });

  const selectedProvider = form.watch("provider");
  const meterNumber = form.watch("meter_number");
  const meterType = form.watch("meter_type");

  async function handleVerifyMeter() {
    if (!selectedProvider || !meterNumber || !meterType) {
      toast.error("Please select provider, meter type, and enter meter number first.");
      return;
    }

    setIsVerifying(true);
    setMeterInfo(null);
    setVerified(false);

    try {
      const response = await billsApi.verifyMeter({
        meter_number: meterNumber,
        provider: selectedProvider,
        meter_type: meterType,
      });
      setMeterInfo(response.data);
      setVerified(true);
      toast.success("Meter verified successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Meter verification failed";
      toast.error(message);
      setVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }

  async function onSubmit(values: ElectricityInput) {
    if (!hasPin) {
      navigate({ to: "/setup-pin" });
      return;
    }
    setPendingValues(values);
    setPinDialogOpen(true);
  }

  async function executeElectricity(pin: string) {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      const result = await billsApi.payElectricity({
        meter_number: pendingValues.meter_number,
        amount: pendingValues.amount,
        provider: pendingValues.provider,
        meter_type: pendingValues.meter_type,
      }, pin);
      toast.success("Electricity token purchased successfully!");
      updateWalletBalance(queryClient, result?.new_balance);
      form.reset();
      setMeterInfo(null);
      setVerified(false);
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
        title="Pay electricity bill"
        description="Instant electricity tokens from all major DisCos."
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
                      Select DisCo
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {providers.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            form.setValue("provider", p.value, { shouldValidate: true });
                            setMeterInfo(null);
                            setVerified(false);
                          }}
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
                          <span className="truncate">{p.name}</span>
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
                      name="meter_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meter number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Prepaid / postpaid meter number"
                              className="h-11"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setMeterInfo(null);
                                setVerified(false);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="meter_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meter type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              setMeterInfo(null);
                              setVerified(false);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select meter type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prepaid">Prepaid</SelectItem>
                              <SelectItem value="postpaid">Postpaid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      disabled={isVerifying || !selectedProvider || !meterNumber || !meterType}
                      onClick={handleVerifyMeter}
                    >
                      {isVerifying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : verified ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="mr-2 h-4 w-4" />
                      )}
                      {verified ? "Verified" : "Verify Meter"}
                    </Button>
                    {!verified &&
                      meterInfo === null &&
                      selectedProvider &&
                      meterNumber &&
                      meterType && (
                        <p className="text-xs text-muted-foreground">
                          Click verify to check meter details before payment
                        </p>
                      )}
                  </div>

                  {meterInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-green-700 dark:text-green-300">
                            Meter Verified
                          </p>
                          {meterInfo.customer_name && (
                            <p>
                              <span className="text-muted-foreground">Name: </span>
                              <span className="font-medium">{meterInfo.customer_name}</span>
                            </p>
                          )}
                          {meterInfo.customer_address && (
                            <p>
                              <span className="text-muted-foreground">Address: </span>
                              <span className="font-medium">{meterInfo.customer_address}</span>
                            </p>
                          )}
                          {meterInfo.tariff && (
                            <p>
                              <span className="text-muted-foreground">Tariff: </span>
                              <span className="font-medium">{meterInfo.tariff}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="₦1,000 minimum"
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
                    disabled={isSubmitting || !verified}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buy token
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
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Electricity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Instant electricity tokens from all major DisCos.
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
        onVerified={(pin) => executeElectricity(pin)}
      />
    </div>
  );
}
