import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";

export function ServicePagePlaceholder({
  title,
  description,
  icon: Icon,
  fields,
  ctaLabel = "Continue",
  providers,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  fields: { label: string; placeholder: string; type?: string }[];
  ctaLabel?: string;
  providers?: { name: string; color: string }[];
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              {providers && (
                <div className="mb-6">
                  <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Select provider</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {providers.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-left text-sm font-medium transition hover:border-primary/50 hover:shadow-sm"
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
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.label} className={fields.length % 2 === 1 && f === fields[fields.length - 1] ? "sm:col-span-2" : ""}>
                    <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{f.label}</Label>
                    <Input type={f.type ?? "text"} placeholder={f.placeholder} className="h-11" />
                  </div>
                ))}
              </div>
              <Button className="mt-6 h-11 w-full sm:w-auto sm:px-8">{ctaLabel}</Button>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">About {title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Processing time</span><span className="font-medium">Instant</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Service fee</span><span className="font-medium">₦0.00</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Availability</span><span className="font-medium text-[color:var(--success)]">24 / 7</span></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}