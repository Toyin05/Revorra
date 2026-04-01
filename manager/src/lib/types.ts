export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  referral_balance: number;
  task_balance: number;
  onehub_balance: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  link: string;
  reward: number;
  status: "active" | "inactive";
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
}

export interface Earning {
  id: string;
  user_id: string;
  date: string;
  activity: string;
  amount: number;
  wallet: "referral" | "task" | "onehub";
}

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet: "referral" | "task" | "onehub";
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  coupon_code: string;
}

export interface GamePlay {
  id: string;
  user_id: string;
  game: "tic-tac-toe" | "spin-win";
  reward: number;
  played_at: string;
}

export interface PayoutDetails {
  method: "bank" | "crypto";
  country?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  crypto_wallet?: string;
}
