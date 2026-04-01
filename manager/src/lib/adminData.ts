// Admin data helpers – works alongside existing user localStorage data

import type { User, Task, Earning, TaskCompletion, GamePlay, Withdrawal } from "./types";

// Sample tasks
export const SAMPLE_TASKS: Task[] = [
  { id: "t1", title: "Visit Our Website", description: "Visit the Revorra homepage and explore features.", link: "https://revorra.com", reward: 0.7, status: "active" },
  { id: "t2", title: "Join Telegram Channel", description: "Join our official Telegram channel for updates.", link: "https://t.me/revorra", reward: 0.7, status: "active" },
  { id: "t3", title: "Follow on Instagram", description: "Follow Revorra on Instagram and like our latest post.", link: "https://instagram.com/revorra", reward: 0.7, status: "active" },
  { id: "t4", title: "Subscribe on YouTube", description: "Subscribe to Revorra YouTube and watch our intro video.", link: "https://youtube.com/revorra", reward: 0.7, status: "active" },
  { id: "t5", title: "Follow on Twitter/X", description: "Follow us on X and retweet the pinned post.", link: "https://x.com/revorra", reward: 0.7, status: "active" },
  { id: "t6", title: "Join Discord Server", description: "Join the Revorra Discord community.", link: "https://discord.gg/revorra", reward: 0.7, status: "active" },
];

const STORAGE_KEYS = {
  user: "revorra_user",
  earnings: "revorra_earnings",
  completions: "revorra_completions",
  gamePlays: "revorra_game_plays",
  withdrawals: "revorra_withdrawals",
};

/* ── Users ── */
export function getAllUsers(): User[] {
  const u = localStorage.getItem(STORAGE_KEYS.user);
  return u ? [JSON.parse(u)] : [];
}

export function suspendUser(userId: string) {
  addAdminLog("suspend_user", userId);
}

export function banUser(userId: string) {
  addAdminLog("ban_user", userId);
}

/* ── User Data Functions (needed by admin) ── */
export function getEarnings(): Earning[] {
  const d = localStorage.getItem(STORAGE_KEYS.earnings);
  return d ? JSON.parse(d) : [];
}

export function getCompletions(): TaskCompletion[] {
  const d = localStorage.getItem(STORAGE_KEYS.completions);
  return d ? JSON.parse(d) : [];
}

export function getWithdrawals(): Withdrawal[] {
  const d = localStorage.getItem(STORAGE_KEYS.withdrawals);
  return d ? JSON.parse(d) : [];
}

export function getGamePlays(): GamePlay[] {
  const d = localStorage.getItem(STORAGE_KEYS.gamePlays);
  return d ? JSON.parse(d) : [];
}

/* ── Tasks ── */
export function getAdminTasks(): Task[] {
  const d = localStorage.getItem("revorra_admin_tasks");
  if (d) return JSON.parse(d);
  localStorage.setItem("revorra_admin_tasks", JSON.stringify(SAMPLE_TASKS));
  return SAMPLE_TASKS;
}

export function saveAdminTasks(tasks: Task[]) {
  localStorage.setItem("revorra_admin_tasks", JSON.stringify(tasks));
}

/* ── Sponsored Posts ── */
export interface SponsoredPost {
  id: string;
  title: string;
  description: string;
  link: string;
  reward: number;
  status: "active" | "inactive";
  shares: number;
  created_at: string;
}

export function getSponsoredPosts(): SponsoredPost[] {
  const d = localStorage.getItem("revorra_sponsored_posts");
  return d ? JSON.parse(d) : [{
    id: "sp1", title: "Share Revorra on WhatsApp", description: "Share our link to WhatsApp status",
    link: "https://revorra.com", reward: 0.4, status: "active" as const, shares: 0, created_at: new Date().toISOString(),
  }];
}

export function saveSponsoredPosts(posts: SponsoredPost[]) {
  localStorage.setItem("revorra_sponsored_posts", JSON.stringify(posts));
}

/* ── Game Settings ── */
export interface GameSettings {
  daily_attempts: number;
  spin_rewards: number[];
  enabled: boolean;
}

export function getGameSettings(): Record<string, GameSettings> {
  const d = localStorage.getItem("revorra_game_settings");
  return d ? JSON.parse(d) : {
    "spin-win": { daily_attempts: 2, spin_rewards: [0.2,0.5,0.8,1,1.5,2,3,4,5,6,7,10,15,20], enabled: true },
    "tic-tac-toe": { daily_attempts: 2, spin_rewards: [], enabled: true },
  };
}

export function saveGameSettings(s: Record<string, GameSettings>) {
  localStorage.setItem("revorra_game_settings", JSON.stringify(s));
}

/* ── Coupons ── */
export interface Coupon {
  id: string;
  code: string;
  wallet: "referral" | "task" | "onehub";
  expiry: string;
  used: boolean;
}

export function getCoupons(): Coupon[] {
  const d = localStorage.getItem("revorra_admin_coupons");
  return d ? JSON.parse(d) : [
    { id: "c1", code: "REVORRA2024", wallet: "referral", expiry: "2025-12-31", used: false },
    { id: "c2", code: "EARNNOW", wallet: "task", expiry: "2025-12-31", used: false },
    { id: "c3", code: "CASHOUT1", wallet: "onehub", expiry: "2025-12-31", used: false },
  ];
}

export function saveCoupons(c: Coupon[]) {
  localStorage.setItem("revorra_admin_coupons", JSON.stringify(c));
}

/* ── Notifications ── */
export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  image?: string;
  button_text?: string;
  button_link?: string;
  type: "popup" | "banner" | "broadcast";
  active: boolean;
  created_at: string;
}

export function getNotifications(): AdminNotification[] {
  const d = localStorage.getItem("revorra_admin_notifications");
  return d ? JSON.parse(d) : [{
    id: "n1", title: "Welcome to Revorra!", description: "Complete today's tasks and start earning.",
    type: "popup" as const, active: true, created_at: new Date().toISOString(),
  }];
}

export function saveNotifications(n: AdminNotification[]) {
  localStorage.setItem("revorra_admin_notifications", JSON.stringify(n));
}

/* ── Platform Settings ── */
export interface PlatformSettings {
  welcome_bonus: number;
  referral_reward: number;
  indirect_referral_reward: number;
  min_withdrawal_referral: number;
  min_withdrawal_task: number;
  min_withdrawal_onehub: number;
  game_attempts: number;
}

export function getPlatformSettings(): PlatformSettings {
  const d = localStorage.getItem("revorra_platform_settings");
  return d ? JSON.parse(d) : {
    welcome_bonus: 1.5,
    referral_reward: 0.5,
    indirect_referral_reward: 0.2,
    min_withdrawal_referral: 35,
    min_withdrawal_task: 89,
    min_withdrawal_onehub: 16,
    game_attempts: 2,
  };
}

export function savePlatformSettings(s: PlatformSettings) {
  localStorage.setItem("revorra_platform_settings", JSON.stringify(s));
}

/* ── Admin Activity Logs ── */
export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target: string;
  timestamp: string;
}

export function getAdminLogs(): AdminLog[] {
  const d = localStorage.getItem("revorra_admin_logs");
  return d ? JSON.parse(d) : [];
}

export function addAdminLog(action: string, target: string) {
  const admin = JSON.parse(localStorage.getItem("revorra_admin") || "{}");
  const logs = getAdminLogs();
  logs.unshift({
    id: crypto.randomUUID(),
    admin_id: admin.id || "unknown",
    action,
    target,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("revorra_admin_logs", JSON.stringify(logs.slice(0, 200)));
}

/* ── VTU ── */
export interface VTUTransaction {
  id: string;
  user: string;
  phone: string;
  network: string;
  amount: number;
  type: "airtime" | "data";
  status: "success" | "failed" | "pending";
  date: string;
}

export function getVTUTransactions(): VTUTransaction[] {
  const d = localStorage.getItem("revorra_vtu_transactions");
  return d ? JSON.parse(d) : [];
}

export interface NetworkConfig {
  name: string;
  enabled: boolean;
}

export function getNetworkConfigs(): NetworkConfig[] {
  const d = localStorage.getItem("revorra_network_configs");
  return d ? JSON.parse(d) : [
    { name: "MTN", enabled: true },
    { name: "Airtel", enabled: true },
    { name: "Glo", enabled: true },
    { name: "9mobile", enabled: true },
  ];
}

export function saveNetworkConfigs(c: NetworkConfig[]) {
  localStorage.setItem("revorra_network_configs", JSON.stringify(c));
}
