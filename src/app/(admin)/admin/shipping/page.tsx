import { AdminShell } from "@/components/admin-shell";
import { getAdminConfig } from "@/lib/admin-store";
import { ShippingForm } from "./shipping-form";

export default async function AdminShippingPage() {
  const config = await getAdminConfig();
  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-brand-darkest">Shipping</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Toggle the on-site shipping estimate and set per-zone fees. Final
        shipping is still confirmed by the team on the call.
      </p>
      <div className="mt-8">
        <ShippingForm initial={config.shipping} />
      </div>
    </AdminShell>
  );
}
