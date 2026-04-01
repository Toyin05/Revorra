import { Task, User, Earning, GamePlay, TaskCompletion } from "./types";

export const SAMPLE_TASKS: Task[] = [
  { id: "t1", title: "Visit Our Website", description: "Visit the Revorra homepage and explore features.", link: "https://revorra.com", reward: 0.7, status: "active" },
  { id: "t2", title: "Join Telegram Channel", description: "Join our official Telegram channel for updates.", link: "https://t.me/revorra", reward: 0.7, status: "active" },
  { id: "t3", title: "Follow on Instagram", description: "Follow Revorra on Instagram and like our latest post.", link: "https://instagram.com/revorra", reward: 0.7, status: "active" },
  { id: "t4", title: "Subscribe on YouTube", description: "Subscribe to Revorra YouTube and watch our intro video.", link: "https://youtube.com/revorra", reward: 0.7, status: "active" },
  { id: "t5", title: "Follow on Twitter/X", description: "Follow us on X and retweet the pinned post.", link: "https://x.com/revorra", reward: 0.7, status: "active" },
  { id: "t6", title: "Join Discord Server", description: "Join the Revorra Discord community.", link: "https://discord.gg/revorra", reward: 0.7, status: "active" },
];

export const TOP_EARNERS = [
  { name: "Adebayo O.", earnings: 4250, avatar: "AO" },
  { name: "Chioma N.", earnings: 3890, avatar: "CN" },
  { name: "Kwame A.", earnings: 3120, avatar: "KA" },
  { name: "Fatima B.", earnings: 2980, avatar: "FB" },
  { name: "David M.", earnings: 2540, avatar: "DM" },
];

export const SPIN_REWARDS = [0.2, 0.5, 0.8, 1, 1.5, 2, 3, 4, 5, 6, 7, 10, 15, 20];

export const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "Cameroon"];

export const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

const STORAGE_KEYS = {
  user: "revorra_user",
  earnings: "revorra_earnings",
  completions: "revorra_completions",
  gamePlays: "revorra_game_plays",
  lastShare: "revorra_last_share",
  payout: "revorra_payout",
  withdrawals: "revorra_withdrawals",
  coupons: "revorra_coupons",
};

export function getUser(): User | null {
  const d = localStorage.getItem(STORAGE_KEYS.user);
  return d ? JSON.parse(d) : null;
}

export function saveUser(user: User) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function getEarnings(): Earning[] {
  const d = localStorage.getItem(STORAGE_KEYS.earnings);
  return d ? JSON.parse(d) : [];
}

export function addEarning(e: Omit<Earning, "id">) {
  const earnings = getEarnings();
  earnings.unshift({ ...e, id: crypto.randomUUID() });
  localStorage.setItem(STORAGE_KEYS.earnings, JSON.stringify(earnings));
}

export function getCompletions(): TaskCompletion[] {
  const d = localStorage.getItem(STORAGE_KEYS.completions);
  return d ? JSON.parse(d) : [];
}

export function addCompletion(c: Omit<TaskCompletion, "id">) {
  const completions = getCompletions();
  completions.push({ ...c, id: crypto.randomUUID() });
  localStorage.setItem(STORAGE_KEYS.completions, JSON.stringify(completions));
}

export function getGamePlays(): GamePlay[] {
  const d = localStorage.getItem(STORAGE_KEYS.gamePlays);
  return d ? JSON.parse(d) : [];
}

export function addGamePlay(g: Omit<GamePlay, "id">) {
  const plays = getGamePlays();
  plays.push({ ...g, id: crypto.randomUUID() });
  localStorage.setItem(STORAGE_KEYS.gamePlays, JSON.stringify(plays));
}

export function getTodayGamePlays(game: string): number {
  const today = new Date().toDateString();
  return getGamePlays().filter(g => g.game === game && new Date(g.played_at).toDateString() === today).length;
}

export function getLastShare(): string | null {
  return localStorage.getItem(STORAGE_KEYS.lastShare);
}

export function setLastShare() {
  localStorage.setItem(STORAGE_KEYS.lastShare, new Date().toISOString());
}

export function canShareToday(): boolean {
  const last = getLastShare();
  if (!last) return true;
  const diff = Date.now() - new Date(last).getTime();
  return diff > 24 * 60 * 60 * 1000;
}

export function getPayout() {
  const d = localStorage.getItem(STORAGE_KEYS.payout);
  return d ? JSON.parse(d) : null;
}

export function savePayout(p: any) {
  localStorage.setItem(STORAGE_KEYS.payout, JSON.stringify(p));
}

export function getWithdrawals() {
  const d = localStorage.getItem(STORAGE_KEYS.withdrawals);
  return d ? JSON.parse(d) : [];
}

export function addWithdrawal(w: any) {
  const ws = getWithdrawals();
  ws.unshift({ ...w, id: crypto.randomUUID(), created_at: new Date().toISOString(), status: "pending" });
  localStorage.setItem(STORAGE_KEYS.withdrawals, JSON.stringify(ws));
}

export function getValidCoupons(): string[] {
  const d = localStorage.getItem(STORAGE_KEYS.coupons);
  return d ? JSON.parse(d) : ["REVORRA2024", "EARNNOW", "CASHOUT1"];
}

export function clearUserData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}
