import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { transferSchema, type TransferInput } from "@/lib/validations";
import { transferApi } from "@/lib/api";

const banks = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Opay", code: "000" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "SunTrust Bank", code: "100" },
  { name: "Union Bank", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "VFD Microfinance Bank", code: "090110" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

export const Route = createFileRoute("/_app/transfer")({
  head: () => ({ meta: [{ title: "Transfer — TechHub" }] }),
  component: TransferPage,
});

function TransferPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipient_bank: "", account_number: "", amount: undefined, narration: "" },
  });

  async function onSubmit(values: TransferInput) {
    setIsSubmitting(true);
    try {
      await transferApi.store({
        recipient_bank: values.recipient_bank,
        account_number: values.account_number,
        amount: values.amount,
        narration: values.narration || undefined,
      });
      toast.success("Transfer successful!");
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
        title="Send money"
        description="Transfer instantly to any TechHub user or Nigerian bank account."
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="recipient_bank"
                      render={() => (
                        <FormItem>
                          <FormLabel>Recipient bank</FormLabel>
                          <Select
                            value={form.watch("recipient_bank")}
                            onValueChange={(v) =>
                              form.setValue("recipient_bank", v, { shouldValidate: true })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {banks.map((b) => (
                                <SelectItem key={b.code} value={b.code}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="account_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10-digit account number"
                              className="h-11"
                              maxLength={10}
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
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="₦0.00"
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
                    <FormField
                      control={form.control}
                      name="narration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Narration <span className="text-muted-foreground">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="What's this for?" className="h-11" {...field} />
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
                    Continue transfer
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
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Transfer</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Transfer instantly to any TechHub user or Nigerian bank account.
              </p>
              <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processing time</span>
                  <span className="font-medium">Instant</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="font-medium">₦10.00</span>
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
