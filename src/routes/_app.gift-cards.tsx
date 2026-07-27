import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Loader2, Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { giftCardApi, type GiftCard } from "@/lib/api";
import { z } from "zod";

export const Route = createFileRoute("/_app/gift-cards")({
  head: () => ({ meta: [{ title: "Gift Cards — Techub" }] }),
  component: GiftCardsPage,
});

const giftCardSchema = z.object({
  card_name: z.string().min(1, "Card name is required"),
  card_number: z.string().min(1, "Card number is required"),
  card_pin: z.string().optional(),
  card_value: z.number().min(1, "Card value must be greater than 0"),
  exchange_rate: z.number().min(0.01, "Exchange rate is required"),
});

type GiftCardInput = z.infer<typeof giftCardSchema>;

const cardBrands = [
  { name: "Amazon", value: "amazon" },
  { name: "iTunes", value: "itunes" },
  { name: "Google Play", value: "google_play" },
  { name: "Steam", value: "steam" },
  { name: "Sephora", value: "sephora" },
  { name: "Walmart", value: "walmart" },
  { name: "eBay", value: "ebay" },
  { name: "Vanilla", value: "vanilla" },
  { name: "Other", value: "other" },
];

function GiftCardsPage() {
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["gift-cards"],
    queryFn: () => giftCardApi.list(),
  });

  const form = useForm<GiftCardInput>({
    resolver: zodResolver(giftCardSchema),
    defaultValues: {
      card_name: "",
      card_number: "",
      card_pin: "",
      card_value: undefined,
      exchange_rate: 1500,
    },
  });

  const nairaValue = form.watch("card_value") && form.watch("exchange_rate")
    ? (form.watch("card_value") * form.watch("exchange_rate")).toFixed(2)
    : "0.00";

  async function onSubmit(values: GiftCardInput) {
    setIsSubmitting(true);
    try {
      await giftCardApi.store(values);
      toast.success("Gift card submitted successfully! Your wallet has been credited.");
      form.reset();
      setSellDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["gift-cards"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "redeemed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "expired": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div>
      <PageHeader
        title="Gift cards"
        description="Buy and sell popular gift cards at competitive rates."
        actions={
          <Button onClick={() => setSellDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Sell Gift Card
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : giftCards && giftCards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {giftCards.map((card: GiftCard, i: number) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{card.card_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.card_number.slice(0, 4)}...{card.card_number.slice(-4)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(card.status)}>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Value</span>
                      <p className="font-medium">${card.card_value.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Naira</span>
                      <p className="font-medium">₦{card.naira_value.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate</span>
                      <p className="font-medium">₦{card.exchange_rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-medium">{new Date(card.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Gift className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No gift cards yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sell your first gift card to get started.
          </p>
          <Button className="mt-4" onClick={() => setSellDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Sell Gift Card
          </Button>
        </div>
      )}

      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell Gift Card</DialogTitle>
            <DialogDescription>
              Enter your gift card details to sell and receive naira in your wallet.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="card_name"
                render={() => (
                  <FormItem>
                    <FormLabel>Card brand</FormLabel>
                    <Select
                      value={form.watch("card_name")}
                      onValueChange={(v) => form.setValue("card_name", v, { shouldValidate: true })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardBrands.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
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
                name="card_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter card number" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card PIN <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter card PIN" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="card_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (USD)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="$0.00"
                          type="number"
                          step="0.01"
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (₦/USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-lg bg-muted p-3 text-center">
                <span className="text-sm text-muted-foreground">You'll receive</span>
                <p className="text-2xl font-bold text-primary">₦{Number(nairaValue).toLocaleString()}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSellDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sell Card
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
