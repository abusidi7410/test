import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SocialButtons } from "@/components/brand/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { loginSchema, type LoginInput } from "@/lib/validations";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — TechHub" },
      {
        name: "description",
        content: "Log in to your TechHub account to manage your wallet and payments.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue managing your TechHub account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block text-xs font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="h-11"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle password visibility"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox id="remember" defaultChecked /> Remember me
        </label>
        <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <>
              Log in <ArrowRight className="ml-1 h-4 w-4" />
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
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Create Account
        </Link>
      </p>
    </AuthLayout>
  );
}
