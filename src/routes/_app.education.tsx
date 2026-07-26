import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
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
import { educationSchema, type EducationInput } from "@/lib/validations";
import { billsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PinVerifyDialog } from "@/components/PinVerifyDialog";
import { updateWalletBalance } from "@/lib/queries";

const providers = [
  { name: "WAEC", value: "waec", color: "#111827" },
  { name: "NECO", value: "neco", color: "#D32F2F" },
  { name: "JAMB", value: "jamb", color: "#059669" },
  { name: "NABTEB", value: "nabteb", color: "#0EA5E9" },
];

export const Route = createFileRoute("/_app/education")({
  head: () => ({ meta: [{ title: "Education — TechHub" }] }),
  component: EducationPage,
});

function EducationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<EducationInput | null>(null);
  const { hasPin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: { provider: "", candidate_name: "", quantity: 1 },
  });

  async function onSubmit(values: EducationInput) {
    if (!hasPin) {
      navigate({ to: "/setup-pin" });
      return;
    }
    setPendingValues(values);
    setPinDialogOpen(true);
  }

  async function executeEducation(pin: string) {
    if (!pendingValues) return;
    setIsSubmitting(true);
    try {
      const result = await billsApi.buyEducationPin({
        candidate_name: pendingValues.candidate_name,
        quantity: pendingValues.quantity,
        provider: pendingValues.provider,
      }, pin);
      toast.success("Education PIN purchased successfully!");
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
        title="Education payments"
        description="Buy exam PINs and pay for education-related services."
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
                      Select exam body
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
                      name="candidate_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full name of candidate"
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
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 1"
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
                    Buy PIN
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
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Education</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Buy exam PINs and pay for education-related services.
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
        onVerified={(pin) => executeEducation(pin)}
      />
    </div>
  );
}
