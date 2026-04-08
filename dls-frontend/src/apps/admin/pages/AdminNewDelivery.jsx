import { useAuth } from '../../../context/AuthContext';
import DeliveryPartnerManager from '../components/new-delivery/DeliveryPartnerManager';
import NewDeliveryForm from '../components/new-delivery/NewDeliveryForm';

export default function AdminNewDelivery() {
  const { user } = useAuth();
  const canManagePartners = user?.role === 'admin';

  return (
    <section className="space-y-4">
      <div className="mx-auto w-full">
        <h1 className="admin-page__title">Delivery Workspace</h1>
        <p className="admin-page__subtitle">
          Manage partner and delivery-type inputs, then create delivery logs from one workspace.
        </p>
      </div>

      <div className="mx-auto grid w-full gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-6">
          {canManagePartners ? (
            <DeliveryPartnerManager />
          ) : (
            <div className="admin-card">
              <p className="text-sm font-semibold text-slate-600">
                Partner management is available to admin users only.
              </p>
            </div>
          )}
        </div>

        <div className="admin-card">
          <NewDeliveryForm />
        </div>
      </div>
    </section>
  )
}
