import { getAdminConfig } from "@/lib/admin-store";
import { PH_REGIONS } from "@/lib/ph-regions";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const config = await getAdminConfig();
  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="mb-6 text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        Checkout
      </h1>
      <CheckoutForm shipping={config.shipping} regions={PH_REGIONS} />
    </div>
  );
}
