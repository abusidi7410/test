import { z } from "zod";

const nigerianPhoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export const fundWalletSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum funding amount is ₦100"),
  method: z.string().min(1, "Please select a funding method"),
});

export const transferSchema = z.object({
  recipient_bank: z.string().min(2, "Please select a bank"),
  account_number: z
    .string()
    .length(10, "Account number must be exactly 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  amount: z.coerce.number().min(100, "Minimum transfer amount is ₦100"),
  narration: z.string().optional(),
});

export const withdrawSchema = z.object({
  bank_code: z.string().min(2, "Please select a bank"),
  account_number: z
    .string()
    .length(10, "Account number must be exactly 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  account_name: z.string().min(2, "Account name is required"),
  amount: z.coerce.number().min(100, "Minimum withdrawal amount is ₦100"),
});

export const airtimeSchema = z.object({
  phone: z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),
  amount: z.coerce.number().min(50, "Minimum airtime amount is ₦50"),
  provider: z.string().min(1, "Please select a provider"),
});

export const dataSchema = z.object({
  phone: z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),
  plan: z.string().min(1, "Please select a plan"),
  provider: z.string().min(1, "Please select a provider"),
  amount: z.coerce.number().min(100, "Please select a valid data plan").optional(),
});

export const electricitySchema = z.object({
  meter_number: z.string().min(10, "Meter number must be at least 10 digits"),
  amount: z.coerce.number().min(500, "Minimum amount is ₦500"),
  provider: z.string().min(1, "Please select a provider"),
  meter_type: z.enum(["prepaid", "postpaid"], {
    required_error: "Please select meter type",
  }),
});

export const cableTvSchema = z.object({
  smartcard: z.string().min(8, "Smartcard number must be at least 8 digits"),
  package: z.string().min(1, "Please select a package"),
  provider: z.string().min(1, "Please select a provider"),
});

export const internetSchema = z.object({
  customer_id: z.string().min(1, "Customer ID is required"),
  plan: z.string().min(1, "Please select a plan"),
  provider: z.string().min(1, "Please select a provider"),
});

export const educationSchema = z.object({
  candidate_name: z.string().min(2, "Candidate name must be at least 2 characters"),
  quantity: z.coerce.number().min(1, "Minimum quantity is 1"),
  provider: z.string().min(1, "Please select a provider"),
});

export const bettingSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  amount: z.coerce.number().min(100, "Minimum amount is ₦100"),
  provider: z.string().min(1, "Please select a provider"),
});

export const airtimeToCashSchema = z.object({
  phone: z.string().regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),
  amount: z.coerce.number().min(500, "Minimum conversion amount is ₦500"),
  provider: z.string().min(1, "Please select a provider"),
});

export const profileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().optional(),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const settingsSchema = z.object({
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sms_alerts: z.boolean(),
  marketing_emails: z.boolean(),
  theme: z.string(),
  language: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type FundWalletInput = z.infer<typeof fundWalletSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type AirtimeInput = z.infer<typeof airtimeSchema>;
export type DataInput = z.infer<typeof dataSchema>;
export type ElectricityInput = z.infer<typeof electricitySchema>;
export type CableTvInput = z.infer<typeof cableTvSchema>;
export type InternetInput = z.infer<typeof internetSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type BettingInput = z.infer<typeof bettingSchema>;
export type AirtimeToCashInput = z.infer<typeof airtimeToCashSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
