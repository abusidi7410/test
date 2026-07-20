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

function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

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
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox id="terms" className="mt-0.5" {...register("terms")} />
          <span>
            I agree to the{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
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
    </AuthLayout>
  );
}
