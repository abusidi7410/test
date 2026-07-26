import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from "@tanstack/react-query";
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
import type { AppSettings, Wallet } from "./api";

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
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function updateWalletBalance(queryClient: QueryClient, newBalance?: number) {
  if (newBalance !== undefined) {
    queryClient.setQueryData<Wallet>(["wallet"], (old) => {
      if (!old) return old;
      return { ...old, balance: newBalance };
    });
  }
  queryClient.invalidateQueries({ queryKey: ["wallet"] });
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useSpendingSummary() {
  return useQuery({
    queryKey: ["spendingSummary"],
    queryFn: () => transactionApi.spendingSummary(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: () => notificationApi.unreadCount(),
    staleTime: 30_000,
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
    staleTime: 60_000,
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
    staleTime: 60_000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.show(),
    staleTime: 300_000,
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
    staleTime: 60_000,
  });
}
