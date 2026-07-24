import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SocialButtons } from "@/components/brand/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — TechHub" },
      { name: "description", content: "Create your TechHub account in seconds." },
    ],
  }),
  component: RegisterPage,
});

function formatBackendErrors(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "errors" in err &&
    err.errors &&
    typeof err.errors === "object"
  ) {
    const errors = err.errors as Record<string, string[]>;
    const messages = Object.entries(errors)
      .map(([field, msgs]) => `${field.replace(/_/g, " ")}: ${msgs.join(", ")}`)
      .join("\n");
    return messages || "Registration failed. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return "Registration failed. Please try again.";
}

function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsContent, setTermsContent] = useState<"terms" | "privacy">("terms");
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const openTerms = (type: "terms" | "privacy") => {
    setTermsContent(type);
    setTermsOpen(true);
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      toast.success("Account created successfully!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(formatBackendErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join TechHub and start moving money smarter.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs font-medium">First name</Label>
            <Input placeholder="Alex" className="h-11" {...register("first_name")} />
            {errors.first_name && (
              <p className="mt-1 text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium">Last name</Label>
            <Input placeholder="Morgan" className="h-11" {...register("last_name")} />
            {errors.last_name && (
              <p className="mt-1 text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Email address</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="h-11"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Phone number (optional)</Label>
          <Input
            type="tel"
            placeholder="+234 800 000 0000"
            className="h-11"
            {...register("phone")}
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs font-medium">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-11"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium">Confirm password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="h-11"
              {...register("password_confirmation")}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-xs text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox id="terms" className="mt-0.5" {...register("terms")} />
            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={() => openTerms("terms")}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                Terms
              </button>{" "}
              &{" "}
              <button
                type="button"
                onClick={() => openTerms("privacy")}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
        </div>
        <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <>
              Create account <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          OR
        </span>
        <Separator className="flex-1" />
      </div>
      <SocialButtons />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {termsContent === "terms" ? "Terms & Conditions" : "Privacy Policy"}
            </DialogTitle>
            <DialogDescription>Please read carefully before accepting.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            {termsContent === "terms" ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using TechHub ("the Platform"), you agree to be bound by these
                  Terms and Conditions. If you do not agree to these terms, please do not use the
                  Platform.
                </p>
                <h3 className="font-semibold text-foreground">2. Description of Service</h3>
                <p>
                  TechHub is a financial technology platform that provides digital wallet services,
                  bill payments, airtime/data purchases, fund transfers, and other financial
                  services. TechHub is not a bank and does not provide banking services.
                </p>
                <h3 className="font-semibold text-foreground">3. Account Registration</h3>
                <p>
                  You must be at least 18 years old to create an account. You agree to provide
                  accurate, current, and complete information during registration and to keep your
                  account information up to date. You are responsible for maintaining the
                  confidentiality of your account credentials.
                </p>
                <h3 className="font-semibold text-foreground">4. Wallet and Funds</h3>
                <p>
                  Funds loaded into your TechHub wallet are held in trust accounts managed by our
                  partner banks. TechHub does not pay interest on wallet balances. You may fund your
                  wallet through approved payment methods, and funds are subject to applicable
                  transaction limits.
                </p>
                <h3 className="font-semibold text-foreground">5. Transactions and Fees</h3>
                <p>
                  All transactions are subject to applicable fees which will be displayed before you
                  confirm any transaction. TechHub reserves the right to modify fees with reasonable
                  notice. Transaction limits may apply based on your account level and verification
                  status.
                </p>
                <h3 className="font-semibold text-foreground">6. Prohibited Activities</h3>
                <p>
                  You agree not to use the Platform for any unlawful purpose, to engage in
                  fraudulent activities, to money launder, to fund terrorism, or to violate any
                  applicable laws or regulations. TechHub reserves the right to suspend or terminate
                  accounts engaged in prohibited activities.
                </p>
                <h3 className="font-semibold text-foreground">7. Limitation of Liability</h3>
                <p>
                  TechHub shall not be liable for any indirect, incidental, special, or
                  consequential damages arising from your use of the Platform. Our total liability
                  shall not exceed the total amount of fees paid by you in the twelve (12) months
                  preceding the claim.
                </p>
                <h3 className="font-semibold text-foreground">
                  8. Account Suspension and Termination
                </h3>
                <p>
                  TechHub reserves the right to suspend or terminate your account at any time if we
                  suspect fraudulent, unauthorized, or illegal activity, or a violation of these
                  Terms. You may also close your account at any time by contacting support.
                </p>
                <h3 className="font-semibold text-foreground">9. Dispute Resolution</h3>
                <p>
                  Any disputes arising from these Terms shall be resolved through arbitration in
                  accordance with the laws of the Federal Republic of Nigeria. You agree to submit
                  to the jurisdiction of Nigerian courts for any matters not subject to arbitration.
                </p>
                <h3 className="font-semibold text-foreground">10. Changes to Terms</h3>
                <p>
                  TechHub may update these Terms at any time. Continued use of the Platform after
                  changes constitutes acceptance of the new Terms. We will notify you of material
                  changes via email or in-app notification.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground">1. Information We Collect</h3>
                <p>
                  We collect personal information you provide during registration including your
                  name, email address, phone number, and government-issued identification for
                  verification purposes. We also collect transaction data, device information, and
                  usage data when you interact with the Platform.
                </p>
                <h3 className="font-semibold text-foreground">2. How We Use Your Information</h3>
                <p>
                  Your information is used to provide and improve our services, process
                  transactions, verify your identity, comply with legal obligations, detect and
                  prevent fraud, and communicate with you about your account and our services.
                </p>
                <h3 className="font-semibold text-foreground">3. Information Sharing</h3>
                <p>
                  We do not sell your personal information. We share information with service
                  providers who assist in operating the Platform (payment processors, identity
                  verification services), as required by law, or with your explicit consent.
                </p>
                <h3 className="font-semibold text-foreground">4. Data Security</h3>
                <p>
                  We implement industry-standard security measures including encryption of data in
                  transit and at rest, secure server infrastructure, regular security audits, and
                  access controls. However, no method of transmission over the Internet is 100%
                  secure.
                </p>
                <h3 className="font-semibold text-foreground">5. Data Retention</h3>
                <p>
                  We retain your personal information for as long as your account is active or as
                  needed to provide services. We may retain information as required by law, to
                  resolve disputes, and enforce our agreements.
                </p>
                <h3 className="font-semibold text-foreground">6. Your Rights</h3>
                <p>
                  You have the right to access, correct, or delete your personal information. You
                  may also request a copy of the data we hold about you. To exercise these rights,
                  contact our support team at support@techhub.io.
                </p>
                <h3 className="font-semibold text-foreground">7. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar technologies to maintain your session, remember your
                  preferences, and analyze usage patterns. You can control cookie settings through
                  your browser preferences.
                </p>
                <h3 className="font-semibold text-foreground">8. Children's Privacy</h3>
                <p>
                  The Platform is not intended for users under 18 years of age. We do not knowingly
                  collect personal information from children. If we become aware that a child has
                  provided us with personal information, we will take steps to delete it.
                </p>
                <h3 className="font-semibold text-foreground">9. Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of
                  material changes by posting the new policy on the Platform and updating the "Last
                  Updated" date.
                </p>
                <h3 className="font-semibold text-foreground">10. Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy, please contact us at
                  support@techhub.io.
                </p>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end">
            <Button onClick={() => setTermsOpen(false)} className="h-9 px-4">
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  );
}
