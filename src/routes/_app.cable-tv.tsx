import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tv, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
import { cableTvSchema, type CableTvInput } from "@/lib/validations";
import { billsApi, variationsApi, type Variation } from "@/lib/api";
import { cn } from "@/lib/utils";

const providers = [
  { name: "DSTV", value: "dstv", color: "#00539F" },
  { name: "GOTV", value: "gotv", color: "#00A859" },
  { name: "Startimes", value: "startimes", color: "#F26522" },
];

export const Route = createFileRoute("/_app/cable-tv")({
  head: () => ({ meta: [{ title: "Cable TV — TechHub" }] }),
  component: CableTvPage,
});

function CableTvPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CableTvInput>({
    resolver: zodResolver(cableTvSchema),
    defaultValues: { provider: "", smartcard: "", package: "" },
  });

  const selectedProvider = form.watch("provider");
  const selectedPackage = form.watch("package");

  const { data: variationsResponse, isLoading: isLoadingVariations } = useQuery({
    queryKey: ["variations", selectedProvider],
    queryFn: () => variationsApi.getVariations(selectedProvider),
    enabled: !!selectedProvider,
    staleTime: 1000 * 60 * 10,
  });

  const packages: Variation[] = variationsResponse?.data?.variations ?? [];

  async function onSubmit(values: CableTvInput) {
    setIsSubmitting(true);
    try {
      await billsApi.subscribeCable({
        smartcard: values.smartcard,
        package: values.package,
        provider: values.provider,
      });
      toast.success("Cable TV subscription successful!");
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
        title="Cable TV subscription"
        description="Renew DSTV, GOTV and Startimes in seconds."
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
                          onClick={() => {
                            form.setValue("provider", p.value, { shouldValidate: true });
                            form.setValue("package", "", { shouldValidate: false });
                          }}
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
                      name="smartcard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Smartcard / IUC number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10-digit smartcard number"
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
                      name="package"
                      render={() => (
                        <FormItem>
                          <FormLabel>Package</FormLabel>
                          <Select
                            disabled={!selectedProvider || isLoadingVariations}
                            value={selectedPackage}
                            onValueChange={(v) =>
                              form.setValue("package", v, { shouldValidate: true })
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue
                                  placeholder={
                                    isLoadingVariations
                                      ? "Loading packages..."
                                      : selectedProvider
                                        ? "Select a package"
                                        : "Select provider first"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {packages.map((pkg) => (
                                <SelectItem key={pkg.variation_code} value={pkg.variation_code}>
                                  {pkg.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    Subscribe
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
                <Tv className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About Cable TV</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Renew DSTV, GOTV and Startimes in seconds.
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
