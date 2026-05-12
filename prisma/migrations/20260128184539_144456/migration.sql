-- DropForeignKey
ALTER TABLE "TenantSubscription" DROP CONSTRAINT "TenantSubscription_planId_fkey";

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
