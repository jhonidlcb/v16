import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { PartnerStats, ReferralData } from "@/types";

export function usePartner() {
  const { user } = useAuth();

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["/api/partners/me"],
    enabled: user?.role === "partner",
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/partners/referrals"],
    enabled: user?.role === "partner",
  });

  return {
    partner: partner as PartnerStats | undefined,
    referrals: referrals as ReferralData[] | undefined,
    isLoading: partnerLoading || referralsLoading,
  };
}
