export type UserRole = "customer" | "vendor" | "admin";

export type ProfileStatus = "active" | "suspended" | "deactivated";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  credits_balance: number | null;
  created_at: string;
  status: ProfileStatus;
  suspended_at: string | null;
  suspended_reason: string | null;
};
