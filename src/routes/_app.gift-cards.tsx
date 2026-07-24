import { createFileRoute } from "@tanstack/react-router";
import { Gift, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/gift-cards")({
  head: () => ({ meta: [{ title: "Gift Cards — TechHub" }] }),
  component: GiftCardsPage,
});

const cards = [
  { name: "Amazon", from: "#FF9900", to: "#232F3E" },
  { name: "iTunes", from: "#A855F7", to: "#EC4899" },
  { name: "Google Play", from: "#34A853", to: "#4285F4" },
  { name: "Steam", from: "#171A21", to: "#66C0F4" },
  { name: "Sephora", from: "#111", to: "#D32F2F" },
  { name: "Walmart", from: "#0071CE", to: "#FFC220" },
  { name: "eBay", from: "#E53238", to: "#F5AF02" },
  { name: "Vanilla", from: "#111827", to: "#D32F2F" },
];

function GiftCardsPage() {
  return (
    <div>
      <PageHeader
        title="Gift cards"
        description="Buy and sell popular gift cards at competitive rates."
      />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Coming Soon</span>
        </div>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Gift card trading is currently being developed. Stay tuned for updates!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="pointer-events-none"
          >
            <Card className="overflow-hidden opacity-60">
              <div
                className="relative aspect-[16/10] w-full"
                style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` }}
              >
                <div className="absolute inset-0 p-4 text-white">
                  <Gift className="h-5 w-5 opacity-80" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="text-lg font-bold">{c.name}</div>
                    <Badge className="bg-white/20 text-[10px] text-white hover:bg-white/30">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">Available soon</div>
                <div className="text-sm font-semibold text-muted-foreground">
                  —
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
