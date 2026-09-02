export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  phone: string;
  pinHash: string;
  name: string;
  promoCode?: string | null;
  role: UserRole;
  balance: number;
  monthlyTarget: number;
  monthlyAchieved: number;
  createdAt: string;
}

export interface WeeklyPerformance {
  id: string;
  userId: string;
  day: string;
  amount: number;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: "commission" | "withdrawal" | "bonus" | "prospect";
  label: string;
  amount: number;
  createdAt: string;
}

export interface Prospect {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  paymentRef?: string | null;
  rewardAmount: number;
  status: "qualified";
  createdAt: string;
}

export interface AppSettings {
  prospectRewardAmount: number;
  apiKey: string;
}

export interface Database {
  users: User[];
  weeklyPerformance: WeeklyPerformance[];
  withdrawals: Withdrawal[];
  activities: Activity[];
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  phone: string;
  name: string;
}

export type PublicUser = Omit<User, "pinHash">;
