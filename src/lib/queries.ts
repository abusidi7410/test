import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  walletApi,
  transactionApi,
  notificationApi,
  profileApi,
  referralApi,
  settingsApi,
  bankAccountApi,
} from "./api";
import type { AppSettings } from "./api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authApi.me(),
    staleTime: Infinity,
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.show(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useTransactions(params?: {
  page?: number;
  per_page?: number;
  type?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionApi.list(params),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSpendingSummary() {
  return useQuery({
    queryKey: ["spendingSummary"],
    queryFn: () => transactionApi.spendingSummary(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => notificationApi.unreadCount(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.show(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { first_name: string; last_name: string; phone?: string }) =>
      profileApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useReferrals() {
  return useQuery({
    queryKey: ["referrals"],
    queryFn: () => referralApi.index(),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.show(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppSettings) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bankAccounts"],
    queryFn: () => bankAccountApi.list(),
  });
}
