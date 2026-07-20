import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/gift-cards")({
  head: () => ({ meta: [{ title: "Gift Cards — TechHub" }] }),
  component: GiftCardsPage,
});

const cards = [
  { name: "Amazon", from: "#FF9900", to: "#232F3E", rate: "₦1,650 / $" },
  { name: "iTunes", from: "#A855F7", to: "#EC4899", rate: "₦1,620 / $" },
  { name: "Google Play", from: "#34A853", to: "#4285F4", rate: "₦1,600 / $" },
  { name: "Steam", from: "#171A21", to: "#66C0F4", rate: "₦1,580 / $" },
  { name: "Sephora", from: "#111", to: "#D32F2F", rate: "₦1,450 / $" },
  { name: "Walmart", from: "#0071CE", to: "#FFC220", rate: "₦1,500 / $" },
  { name: "eBay", from: "#E53238", to: "#F5AF02", rate: "₦1,470 / $" },
  { name: "Vanilla", from: "#111827", to: "#D32F2F", rate: "₦1,610 / $" },
];

function GiftCardsPage() {
  return (
    <div>
      <PageHeader title="Gift cards" description="Sell or buy popular gift cards at the best rates." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.button
            key={c.name}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -3 }}
            className="group text-left"
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10] w-full" style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` }}>
                <div className="absolute inset-0 p-4 text-white">
                  <Gift className="h-5 w-5 opacity-80" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="text-lg font-bold">{c.name}</div>
                    <Badge className="bg-white/20 text-[10px] text-white hover:bg-white/30">Gift Card</Badge>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Best rate</div>
                <div className="text-sm font-semibold">{c.rate}</div>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>
    </div>
  );
}