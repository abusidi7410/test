export const user = {
  name: "Alex Morgan",
  email: "alex@techhub.io",
  phone: "+234 803 555 0142",
  avatar: "",
  level: "Level 2 — Verified",
  verified: true,
  balance: 248530.75,
  dailyLimit: 500000,
  spentToday: 12400,
  spentMonth: 184320,
  referralEarnings: 15200,
  cashback: 3400,
  rewards: 8,
};

export type TxStatus = "Completed" | "Pending" | "Failed";
export interface Transaction {
  id: string;
  date: string;
  service: string;
  amount: number;
  status: TxStatus;
  direction: "in" | "out";
}

export const transactions: Transaction[] = [
  { id: "TXN-8842", date: "2026-07-20 09:14", service: "Airtime — MTN", amount: 2000, status: "Completed", direction: "out" },
  { id: "TXN-8841", date: "2026-07-19 22:03", service: "Wallet Funding", amount: 50000, status: "Completed", direction: "in" },
  { id: "TXN-8840", date: "2026-07-19 18:41", service: "Data — Glo 10GB", amount: 3200, status: "Completed", direction: "out" },
  { id: "TXN-8839", date: "2026-07-19 12:05", service: "Electricity — Ikeja", amount: 8500, status: "Pending", direction: "out" },
  { id: "TXN-8838", date: "2026-07-18 20:12", service: "Transfer — Jane Doe", amount: 15000, status: "Completed", direction: "out" },
  { id: "TXN-8837", date: "2026-07-18 14:28", service: "Cable TV — DSTV", amount: 12400, status: "Completed", direction: "out" },
  { id: "TXN-8836", date: "2026-07-17 09:44", service: "Airtime to Cash", amount: 5000, status: "Failed", direction: "in" },
  { id: "TXN-8835", date: "2026-07-16 16:19", service: "Referral Bonus", amount: 1200, status: "Completed", direction: "in" },
  { id: "TXN-8834", date: "2026-07-16 08:02", service: "Gift Card — Amazon", amount: 22000, status: "Completed", direction: "out" },
  { id: "TXN-8833", date: "2026-07-15 19:37", service: "Internet — Spectranet", amount: 18500, status: "Completed", direction: "out" },
  { id: "TXN-8832", date: "2026-07-15 10:11", service: "Wallet Funding", amount: 100000, status: "Completed", direction: "in" },
  { id: "TXN-8831", date: "2026-07-14 17:52", service: "Education — WAEC PIN", amount: 15500, status: "Completed", direction: "out" },
];

export const spendingSeries = [
  { day: "Mon", amount: 8400 },
  { day: "Tue", amount: 12200 },
  { day: "Wed", amount: 6800 },
  { day: "Thu", amount: 18400 },
  { day: "Fri", amount: 14100 },
  { day: "Sat", amount: 22300 },
  { day: "Sun", amount: 9100 },
];

export function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}