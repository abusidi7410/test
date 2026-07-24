import { apiFetch } from "./api";

export interface AdminUser {
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
  is_admin: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  wallet?: {
    id: number;
    balance: number;
    status: string;
    currency: string;
  };
}

export interface AdminTransaction {
  id: number;
  uuid: string;
  reference: string;
  type: string;
  service: string;
  amount: number;
  fee: number;
  status: "completed" | "pending" | "failed" | "approved" | "rejected";
  direction: "in" | "out";
  narration: string | null;
  user?: { id: number; first_name: string; last_name: string; email: string };
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_transactions: number;
  total_volume: number;
  pending_transactions: number;
  wallet_balance: number;
  revenue: number;
  recent_transactions: AdminTransaction[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  [key: string]: unknown;
}

function buildQuery(params?: ListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export const adminAuth = {
  login(email: string, password: string) {
    return apiFetch<{ user: AdminUser; token: string; is_admin: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return apiFetch<{ user: AdminUser; is_admin: boolean }>("/auth/me");
  },
};

export const adminDashboard = {
  getStats() {
    return apiFetch<AdminDashboardStats>("/admin/dashboard");
  },
};

export const adminUsers = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminUser>>(`/admin/users${buildQuery(params)}`);
  },
  get(id: number) {
    return apiFetch<{ user: AdminUser }>(`/admin/users/${id}`);
  },
  create(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiFetch<{ user: AdminUser }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: Partial<AdminUser>) {
    return apiFetch<{ user: AdminUser; message: string }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return apiFetch<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" });
  },
  suspend(id: number) {
    return apiFetch<{ message: string; user: AdminUser }>(`/admin/users/${id}/suspend`, {
      method: "POST",
    });
  },
  activate(id: number) {
    return apiFetch<{ message: string; user: AdminUser }>(`/admin/users/${id}/activate`, {
      method: "POST",
    });
  },
  ban(id: number) {
    return apiFetch<{ message: string; user: AdminUser }>(`/admin/users/${id}/ban`, {
      method: "POST",
    });
  },
  credit(id: number, data: { amount: number; narration?: string }) {
    return apiFetch<{ message: string; transaction: AdminTransaction }>(
      `/admin/users/${id}/credit`,
      { method: "POST", body: JSON.stringify(data) }
    );
  },
  debit(id: number, data: { amount: number; narration?: string }) {
    return apiFetch<{ message: string; transaction: AdminTransaction }>(
      `/admin/users/${id}/debit`,
      { method: "POST", body: JSON.stringify(data) }
    );
  },
  lockWallet(id: number) {
    return apiFetch<{ message: string }>(`/admin/users/${id}/lock-wallet`, {
      method: "POST",
    });
  },
  unlockWallet(id: number) {
    return apiFetch<{ message: string }>(`/admin/users/${id}/unlock-wallet`, {
      method: "POST",
    });
  },
};

export const adminAdmins = {
  list() {
    return apiFetch<{ data: AdminUser[] }>("/admin/admins");
  },
  get(id: number) {
    return apiFetch<{ user: AdminUser }>(`/admin/admins/${id}`);
  },
  create(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: string;
  }) {
    return apiFetch<{ user: AdminUser }>("/admin/admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: Partial<AdminUser>) {
    return apiFetch<{ message: string; user: AdminUser }>(`/admin/admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return apiFetch<{ message: string }>(`/admin/admins/${id}`, { method: "DELETE" });
  },
  suspend(id: number) {
    return apiFetch<{ message: string }>(`/admin/admins/${id}/suspend`, { method: "POST" });
  },
  activate(id: number) {
    return apiFetch<{ message: string }>(`/admin/admins/${id}/activate`, { method: "POST" });
  },
};

export const adminTransactions = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminTransaction>>(
      `/admin/transactions${buildQuery(params)}`
    );
  },
  get(id: number) {
    return apiFetch<{ transaction: AdminTransaction }>(`/admin/transactions/${id}`);
  },
  approve(id: number) {
    return apiFetch<{ message: string; transaction: AdminTransaction }>(
      `/admin/transactions/${id}/approve`,
      { method: "POST" }
    );
  },
  reject(id: number) {
    return apiFetch<{ message: string; transaction: AdminTransaction }>(
      `/admin/transactions/${id}/reject`,
      { method: "POST" }
    );
  },
  reverse(id: number) {
    return apiFetch<{ message: string; transaction: AdminTransaction }>(
      `/admin/transactions/${id}/reverse`,
      { method: "POST" }
    );
  },
};

export interface AdminVtuProvider {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  base_url: string;
  api_key: string | null;
  public_key: string | null;
  secret_key: string | null;
  username: string | null;
  password: string | null;
  authorization_token: string | null;
  webhook_secret: string | null;
  environment: "sandbox" | "production";
  status: "active" | "inactive";
  priority: number;
  is_default: boolean;
  supported_services: string[];
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  pending_requests: number;
  avg_response_time_ms: number | null;
  last_health_check_at: string | null;
  health_check_response: Record<string, unknown> | null;
  last_error: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderStatistics {
  provider: {
    id: number;
    name: string;
    slug: string;
    status: string;
    is_default: boolean;
    environment: string;
  };
  statistics: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    pending_requests: number;
    success_rate: number;
    avg_response_time_ms: number | null;
    last_used_at: string | null;
    last_health_check_at: string | null;
    last_error: string | null;
  };
  services: string[];
}

export interface ProviderGlobalStatistics {
  total_providers: number;
  active_providers: number;
  inactive_providers: number;
  default_provider: { id: number; name: string; slug: string } | null;
  providers: Array<
    AdminVtuProvider & {
      success_rate: number;
      status_label: string;
      environment_label: string;
    }
  >;
}

export interface ProviderTestResult {
  success: boolean;
  message: string;
  response_time_ms: number;
  status_code?: number;
}

export interface ProviderHealth {
  status: "healthy" | "unhealthy";
  last_check: string;
  response_time_ms: number;
  message: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
}

type ProviderCreateInput = {
  name: string;
  slug: string;
  logo?: string;
  base_url: string;
  api_key?: string;
  public_key?: string;
  secret_key?: string;
  username?: string;
  password?: string;
  authorization_token?: string;
  webhook_secret?: string;
  environment: "sandbox" | "production";
  status: "active" | "inactive";
  priority?: number;
  is_default?: boolean;
  supported_services: string[];
};

export const adminProviders = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminVtuProvider>>(
      `/admin/providers${buildQuery(params)}`
    );
  },
  all() {
    return apiFetch<{ providers: AdminVtuProvider[] }>("/admin/providers/all");
  },
  get(id: number) {
    return apiFetch<{ provider: AdminVtuProvider }>(`/admin/providers/${id}`);
  },
  create(data: ProviderCreateInput) {
    return apiFetch<{ provider: AdminVtuProvider }>("/admin/providers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(id: number, data: Partial<ProviderCreateInput>) {
    return apiFetch<{ provider: AdminVtuProvider; message: string }>(
      `/admin/providers/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    );
  },
  delete(id: number) {
    return apiFetch<{ message: string }>(`/admin/providers/${id}`, {
      method: "DELETE",
    });
  },
  toggleStatus(id: number) {
    return apiFetch<{ message: string; provider: AdminVtuProvider }>(
      `/admin/providers/${id}/toggle-status`,
      { method: "POST" }
    );
  },
  setDefault(id: number) {
    return apiFetch<{ message: string; provider: AdminVtuProvider }>(
      `/admin/providers/${id}/set-default`,
      { method: "POST" }
    );
  },
  updatePriority(id: number, priority: number) {
    return apiFetch<{ message: string; provider: AdminVtuProvider }>(
      `/admin/providers/${id}/priority`,
      { method: "PUT", body: JSON.stringify({ priority }) }
    );
  },
  testConnection(id: number) {
    return apiFetch<{
      provider: AdminVtuProvider;
      test_result: ProviderTestResult;
    }>(`/admin/providers/${id}/test-connection`, { method: "POST" });
  },
  healthCheck(id: number) {
    return apiFetch<{
      provider: AdminVtuProvider;
      health: ProviderHealth;
    }>(`/admin/providers/${id}/health-check`, { method: "POST" });
  },
  statistics(id: number) {
    return apiFetch<ProviderStatistics>(`/admin/providers/${id}/statistics`);
  },
  globalStatistics() {
    return apiFetch<ProviderGlobalStatistics>("/admin/providers/statistics");
  },
};

// Support Tickets
export interface SupportTicket {
  id: number;
  uuid: string;
  user_id: number | null;
  admin_id: number | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; first_name: string; last_name: string; email: string };
  assigned_to_admin?: { id: number; first_name: string; last_name: string; email: string };
  replies?: SupportTicketReply[];
}

export interface SupportTicketReply {
  id: number;
  support_ticket_id: number;
  sender_type: 'admin' | 'user';
  sender_id: number;
  message: string;
  created_at: string;
}

export const adminSupport = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<SupportTicket>>(`/admin/support${buildQuery(params)}`);
  },
  get(id: number) {
    return apiFetch<{ ticket: SupportTicket }>(`/admin/support/${id}`);
  },
  assign(id: number, adminId: number) {
    return apiFetch<{ message: string; ticket: SupportTicket }>(`/admin/support/${id}/assign`, {
      method: 'POST', body: JSON.stringify({ admin_id: adminId }),
    });
  },
  updateStatus(id: number, status: string) {
    return apiFetch<{ message: string; ticket: SupportTicket }>(`/admin/support/${id}/status`, {
      method: 'PUT', body: JSON.stringify({ status }),
    });
  },
  close(id: number) {
    return apiFetch<{ message: string; ticket: SupportTicket }>(`/admin/support/${id}/close`, { method: 'POST' });
  },
  reopen(id: number) {
    return apiFetch<{ message: string; ticket: SupportTicket }>(`/admin/support/${id}/reopen`, { method: 'POST' });
  },
  reply(id: number, message: string) {
    return apiFetch<{ message: string; reply: SupportTicketReply }>(`/admin/support/${id}/reply`, {
      method: 'POST', body: JSON.stringify({ message }),
    });
  },
};

// Payment Gateways
export interface PaymentGateway {
  id: number;
  name: string;
  display_name: string;
  public_key: string | null;
  secret_key: string | null;
  webhook_secret: string | null;
  merchant_id: string | null;
  status: string;
  is_default: boolean;
  settings: Record<string, unknown> | null;
  test_mode: boolean;
  created_at: string;
  updated_at: string;
}

export const adminGateways = {
  list() {
    return apiFetch<{ gateways: PaymentGateway[] }>('/admin/gateways');
  },
  get(id: number) {
    return apiFetch<{ gateway: PaymentGateway }>(`/admin/gateways/${id}`);
  },
  create(data: Partial<PaymentGateway>) {
    return apiFetch<{ gateway: PaymentGateway }>('/admin/gateways', {
      method: 'POST', body: JSON.stringify(data),
    });
  },
  update(id: number, data: Partial<PaymentGateway>) {
    return apiFetch<{ gateway: PaymentGateway; message: string }>(`/admin/gateways/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
  },
  toggleStatus(id: number) {
    return apiFetch<{ message: string; gateway: PaymentGateway }>(`/admin/gateways/${id}/toggle-status`, { method: 'POST' });
  },
  setDefault(id: number) {
    return apiFetch<{ message: string; gateway: PaymentGateway }>(`/admin/gateways/${id}/set-default`, { method: 'POST' });
  },
  testConnection(id: number) {
    return apiFetch<{ success: boolean; message: string; response_time_ms: number }>(`/admin/gateways/${id}/test-connection`, { method: 'POST' });
  },
};

// Reports
export const adminReports = {
  generate(params: { type: string; period: string; start_date?: string; end_date?: string }) {
    return apiFetch<Record<string, unknown>>(`/admin/reports${buildQuery(params as ListParams)}`);
  },
  exportCsv(params: { type: string; period: string; start_date?: string; end_date?: string }) {
    const query = buildQuery(params as ListParams);
    const url = `${import.meta.env.VITE_API_URL || '/api'}/admin/reports/export${query}`;
    const token = localStorage.getItem('techhub_token');
    window.open(`${url}${query.includes('?') ? '&' : '?'}token=${token}`, '_blank');
  },
};

// Admin Wallet Management
export interface AdminWallet {
  id: number;
  user_id: number;
  available_balance: number;
  ledger_balance: number;
  cashback_balance: number;
  bonus_balance: number;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; first_name: string; last_name: string; email: string };
}

export const adminWallets = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminWallet>>(`/admin/wallets${buildQuery(params)}`);
  },
  get(id: number) {
    return apiFetch<{ wallet: AdminWallet }>(`/admin/wallets/${id}`);
  },
  credit(id: number, data: { amount: number; narration?: string }) {
    return apiFetch<{ message: string; wallet: AdminWallet }>(`/admin/wallets/${id}/credit`, {
      method: 'POST', body: JSON.stringify(data),
    });
  },
  debit(id: number, data: { amount: number; narration?: string }) {
    return apiFetch<{ message: string; wallet: AdminWallet }>(`/admin/wallets/${id}/debit`, {
      method: 'POST', body: JSON.stringify(data),
    });
  },
  lock(id: number) {
    return apiFetch<{ message: string; wallet: AdminWallet }>(`/admin/wallets/${id}/lock`, { method: 'POST' });
  },
  unlock(id: number) {
    return apiFetch<{ message: string; wallet: AdminWallet }>(`/admin/wallets/${id}/unlock`, { method: 'POST' });
  },
  history(id: number, params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminTransaction>>(`/admin/wallets/${id}/history${buildQuery(params)}`);
  },
};

// Broadcasts
export interface AdminBroadcast {
  id: number;
  title: string;
  message: string;
  type: string;
  target: string;
  target_users: number[] | null;
  target_roles: string[] | null;
  sent_by: number;
  sent_at: string | null;
  recipients_count: number;
  status: string;
  created_at: string;
}

export const adminBroadcasts = {
  list(params?: ListParams) {
    return apiFetch<PaginatedResponse<AdminBroadcast>>(`/admin/notifications/history${buildQuery(params)}`);
  },
  get(id: number) {
    return apiFetch<{ broadcast: AdminBroadcast }>(`/admin/notifications/history/${id}`);
  },
  send(data: {
    title: string;
    message: string;
    type: string;
    target: string;
    target_users?: number[];
    target_roles?: string[];
  }) {
    return apiFetch<{ broadcast: AdminBroadcast; message: string }>('/admin/notifications/send', {
      method: 'POST', body: JSON.stringify(data),
    });
  },
  delete(id: number) {
    return apiFetch<{ message: string }>(`/admin/notifications/history/${id}`, { method: 'DELETE' });
  },
};

// System Settings
export const adminSettings = {
  getGroup(group: string) {
    return apiFetch<Record<string, unknown>>(`/admin/settings?group=${group}`);
  },
  updateGroup(group: string, settings: Record<string, unknown>) {
    return apiFetch<{ message: string }>(`/admin/settings/${group}`, {
      method: 'PUT', body: JSON.stringify({ settings }),
    });
  },
};
