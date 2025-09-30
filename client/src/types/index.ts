export interface ContactFormData {
  fullName: string;
  email: string;
  company?: string;
  serviceType?: string;
  budget?: string;
  message: string;
  acceptTerms: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activePartners: number;
  activeProjects: number;
  monthlyRevenue: string;
  totalRevenue: number;
  totalProjects: number;
  totalTickets: number;
}

export interface PartnerStats extends DashboardStats {
  referralCode: string;
  commissionRate: string;
  referralLink: string;
}

export interface ReferralData {
  id: number;
  status: string;
  commissionAmount: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  projectPrice: string;
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}