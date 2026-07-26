import { TOKEN_KEY } from "./constants";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  level: string;
  verified: boolean;
  email_verified_at: string | null;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  is_admin?: boolean;
  has_pin?: boolean;
}

export interface Wallet {
  id: number;
  balance: number;
  daily_limit: number;
  spent_today: number;
  spent_month: number;
  currency: string;
  status: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  uuid: string;
  reference: string;
  type: string;
  service: string;
  amount: number;
  fee: number;
  status: "completed" | "pending" | "failed";
  direction: "in" | "out";
  narration: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SpendingSummary {
  today: number;
  week: number;
  month: number;
  series: { day: string; amount: number }[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  level: string;
  verified: boolean;
  referral_code: string;
  created_at: string;
}

export interface Referral {
  id: number;
  name: string;
  email: string;
  status: "pending" | "completed";
  earned: number;
  joined_at: string;
}

export interface ReferralResponse {
  referral_link: string;
  referral_code: string;
  total_earned: number;
  referrals: Referral[];
}

export interface AppSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_alerts: boolean;
  marketing_emails: boolean;
  theme: string;
  language: string;
}

export interface BankAccount {
  id: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const body = await response.json().catch(() => null);
    const message = body?.message || "Unauthorized";
    if (token) {
      localStorage.removeItem(TOKEN_KEY);
    }
    throw new ApiError(message, 401);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.message || "An error occurred", response.status, data.errors);
  }

  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

interface RegisterResponse {
  user: User;
  token: string;
  has_pin?: boolean;
}

interface TransactionListParams {
  page?: number;
  per_page?: number;
  type?: string;
  status?: string;
  search?: string;
}

interface SpendingSummaryResponse {
  today: number;
  week: number;
  month: number;
  series: { day: string; amount: number }[];
}

interface FundAmountResponse {
  authorization_url: string;
  reference: string;
}

interface BillResponse {
  message: string;
  reference: string;
  new_balance?: number;
  [key: string]: unknown;
}

interface SettingsUpdateResponse {
  message: string;
  settings: AppSettings;
}

interface BankAccountStoreResponse {
  message: string;
  bank_account: BankAccount;
}

interface TransferResponse {
  message: string;
  transaction: Transaction;
  new_balance?: number;
}

interface NotificationCountResponse {
  count: number;
}

interface NotificationReadResponse {
  message: string;
}

export const authApi = {
  login(email: string, password: string) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  logout() {
    return apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  me() {
    return apiFetch<{ user: User }>("/auth/me");
  },

  forgotPassword(email: string) {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};

export interface PaymentVerifyResponse {
  status: "success" | "pending" | "failed";
  reference: string;
  amount: number;
  balance: number;
  message: string;
}

export const walletApi = {
  show() {
    return apiFetch<Wallet>("/wallet");
  },

  fund(data: { amount: number; method: string }) {
    return apiFetch<FundAmountResponse>("/wallet/fund", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const paymentApi = {
  verify(reference: string) {
    return apiFetch<PaymentVerifyResponse>(`/payment/verify/${encodeURIComponent(reference)}`);
  },
};

export const transactionApi = {
  list(params?: TransactionListParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.per_page) searchParams.set("per_page", String(params.per_page));
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return apiFetch<TransactionListResponse>(`/transactions${query ? `?${query}` : ""}`);
  },

  show(uuid: string) {
    return apiFetch<{ transaction: Transaction }>(`/transactions/${uuid}`);
  },

  spendingSummary() {
    return apiFetch<SpendingSummaryResponse>("/transactions/spending-summary");
  },
};

export const profileApi = {
  async show(): Promise<Profile> {
    const res = await apiFetch<{ profile: Profile }>("/profile");
    return res.profile;
  },

  update(data: { first_name: string; last_name: string; phone?: string }) {
    return apiFetch<{ message: string; profile: Profile }>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return apiFetch<{ message: string }>("/profile/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

export const notificationApi = {
  async list(): Promise<Notification[]> {
    const res = await apiFetch<{ notifications: Notification[] }>("/notifications");
    return res.notifications;
  },

  async unreadCount(): Promise<number> {
    const res = await apiFetch<NotificationCountResponse>("/notifications/unread-count");
    return typeof res === "number" ? res : res.count ?? 0;
  },

  markRead(id: number) {
    return apiFetch<NotificationReadResponse>(`/notifications/${id}/read`, { method: "PUT" });
  },

  markAllRead() {
    return apiFetch<NotificationReadResponse>("/notifications/read-all", { method: "PUT" });
  },
};

export const referralApi = {
  index() {
    return apiFetch<ReferralResponse>("/referrals");
  },

  link() {
    return apiFetch<{ referral_link: string }>("/referrals/link");
  },
};

export const settingsApi = {
  async show(): Promise<AppSettings> {
    const res = await apiFetch<{ settings: AppSettings }>("/settings");
    return res.settings;
  },

  update(data: AppSettings) {
    return apiFetch<SettingsUpdateResponse>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

export const bankAccountApi = {
  list() {
    return apiFetch<{ bank_accounts: BankAccount[] }>("/bank-accounts");
  },

  store(data: { bank_code: string; account_number: string; account_name: string }) {
    return apiFetch<BankAccountStoreResponse>("/bank-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  destroy(id: number) {
    return apiFetch<{ message: string }>(`/bank-accounts/${id}`, {
      method: "DELETE",
    });
  },

  setDefault(id: number) {
    return apiFetch<{ message: string }>(`/bank-accounts/${id}/default`, { method: "PUT" });
  },
};

export interface MeterVerification {
  customer_name: string | null;
  customer_address: string | null;
  meter_number: string;
  meter_type: string;
  tariff: string | null;
  max_demand: string | null;
}

export interface Variation {
  name: string;
  variation_code: string;
  amount: number;
  fixed_price: boolean;
}

export interface VariationsResponse {
  service_id: string;
  variations: Variation[];
}

export const billsApi = {
  buyAirtime(data: { phone: string; amount: number; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/airtime", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  buyData(data: { phone: string; plan: string; amount: number; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/data", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  payElectricity(data: {
    meter_number: string;
    amount: number;
    provider: string;
    meter_type: string;
  }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/electricity", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  verifyMeter(data: { meter_number: string; provider: string; meter_type: string }) {
    return apiFetch<{ data: MeterVerification }>("/bills/verify-meter", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  subscribeCable(data: { smartcard: string; package: string; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/cable-tv", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  subscribeInternet(data: { customer_id: string; plan: string; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/internet", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  buyEducationPin(data: { candidate_name: string; quantity: number; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/education", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  fundBetting(data: { user_id: string; amount: number; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/betting", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  convertAirtime(data: { phone: string; amount: number; provider: string }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<BillResponse>("/bills/airtime-to-cash", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  requeryTransaction(reference: string) {
    return apiFetch<BillResponse>(`/transactions/${reference}/requery`, {
      method: "POST",
    });
  },
};

export const variationsApi = {
  getVariations(serviceId: string) {
    return apiFetch<{ data: VariationsResponse }>(`/variations/${serviceId}`);
  },
};

export const transferApi = {
  store(data: {
    recipient_bank: string;
    account_number: string;
    amount: number;
    narration?: string;
  }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<TransferResponse>("/transfers", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },
};

export const withdrawApi = {
  store(data: { bank_code: string; account_number: string; account_name: string; amount: number }, pin?: string) {
    const headers: Record<string, string> = {};
    if (pin) headers["X-Transaction-Pin"] = pin;
    return apiFetch<TransferResponse>("/withdrawals", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },
};

export interface GiftCard {
  id: number;
  user_id: number;
  transaction_id: number | null;
  card_name: string;
  card_number: string;
  card_pin: string | null;
  card_value: number;
  exchange_rate: number;
  naira_value: number;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const giftCardApi = {
  list() {
    return apiFetch<{ gift_cards: GiftCard[] }>("/gift-cards").then((res) => res.gift_cards);
  },

  store(data: {
    card_name: string;
    card_number: string;
    card_pin?: string;
    card_value: number;
    exchange_rate: number;
  }) {
    return apiFetch<{ message: string; gift_card: GiftCard }>("/gift-cards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  show(id: number) {
    return apiFetch<{ gift_card: GiftCard }>(`/gift-cards/${id}`);
  },
};

export const pinApi = {
  set(data: { pin: string; pin_confirmation: string; current_pin?: string }) {
    return apiFetch<{ message: string }>("/profile/pin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  verify(pin: string) {
    return apiFetch<{ message: string }>("/profile/pin/verify", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },

  status() {
    return apiFetch<{ has_pin: boolean; pin_set_at: string | null }>("/profile/pin/status");
  },

  requestReset() {
    return apiFetch<{ message: string }>("/profile/pin/reset/request", {
      method: "POST",
    });
  },

  resetConfirm(data: { otp: string; pin: string; pin_confirmation: string }) {
    return apiFetch<{ message: string }>("/profile/pin/reset/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
