import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@mui/material';
import { FaPenToSquare, FaTruck, FaXmark } from 'react-icons/fa6';
import AdminPageHeader from '../components/AdminPageHeader';
import {
  deleteDeliveryLog,
  getDeliveryLogById,
  getDeliveryLogs,
  updateDeliveryLog
} from '../../../services/deliveriesServices';
import { getDeliveryTypes } from '../../../services/deliveryTypeServices';
import DeliveryLogsTable from '../components/DeliveryLogsTable';
import SearchAndFilters from '../components/SearchAndFilters';
import Pagination from '../components/Pagination';
import useDebounce from '../hooks/useDebounce';
import './admin-delivery-logs.css';

const emptyEditForm = {
  date_received: '',
  delivery_for: 'Company',
  recipient_name: '',
  company_name: '',
  delivery_type: '',
  delivery_partner: '',
  courier_type_name: '',
  supplier_description: '',
  deliverer_name: '',
  description: '',
  is_status: 'Pending',
  received_by: '',
  received_at: ''
};

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function normalizeReferenceCode(value) {
  if (!value) return '—';
  return String(value).trim().toUpperCase();
}

function formatOptionalDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-CA');
}

function formatOptionalTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDeliveryItems(delivery) {
  const items = Array.isArray(delivery?.delivery_items)
    ? delivery.delivery_items
        .map((item) => ({
          name: String(item?.name || '').trim(),
          quantity: Number(item?.quantity || 1),
        }))
        .filter((item) => item.name)
    : [];

  if (!items.length) return delivery?.delivery_type || '—';
  return items.map((item) => `${item.name} (${item.quantity > 0 ? Math.floor(item.quantity) : 1})`).join(', ');
}

function getTotalItems(delivery) {
  const rawTotal = Number(delivery?.total_items || 0);
  if (Number.isFinite(rawTotal) && rawTotal > 0) return Math.floor(rawTotal);

  const items = Array.isArray(delivery?.delivery_items) ? delivery.delivery_items : [];
  const summed = items.reduce((sum, item) => sum + (Number(item?.quantity || 1) > 0 ? Math.floor(Number(item.quantity)) : 1), 0);
  return summed > 0 ? summed : 1;
}

function DetailBlock({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${highlight ? 'border-lime-300 bg-lime-50/70' : 'border-slate-200 bg-white'} hover:-translate-y-0.5 hover:shadow-md`}>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-500">{label}</p>
      <p className="text-sm font-semibold leading-5 text-slate-900 break-words">{value || '—'}</p>
    </div>
  );
}

function ModalShell({ open, onClose, title, subtitle, icon: Icon, children, actions, size = 'lg' }) {
  if (!open) return null;

  const maxWidthClass = size === 'sm' ? 'max-w-xs' : size === 'xl' ? 'max-w-3xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label={`Close ${title} modal`}
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full items-start justify-center">
        <div className={`relative my-1 flex w-full ${maxWidthClass} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_20px_56px_rgba(0,0,0,0.16)] ring-1 ring-black/5 sm:my-2 sm:max-h-[calc(100vh-4rem)]`}>
          <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4df45] text-slate-900 shadow-[0_10px_20px_rgba(191,209,55,0.3)]">
              <Icon className="text-xl" />
            </div>
            <div>
              <span className="text-[1.55rem] font-extrabold leading-tight text-slate-900">{title}</span>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
            onClick={onClose}
          >
            <FaXmark />
          </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">{children}</div>

          <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:px-7">{actions}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={`block ${wide ? 'col-span-full' : ''}`}>
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function AdminDeliveryLogs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type, limit]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['deliveries', page, limit, debouncedSearch, status, type],
    queryFn: () => getDeliveryLogs({ page, limit, search: debouncedSearch, status, type }),
    placeholderData: (previousData) => previousData
  });

  const { data: deliveryTypesData = [] } = useQuery({
    queryKey: ['delivery-types'],
    queryFn: getDeliveryTypes,
    select: (response) => (Array.isArray(response) ? response : [])
  });

  const deliveries = useMemo(() => data?.items || [], [data]);
  const deliveryTypeOptions = useMemo(
    () =>
      deliveryTypesData
        .map((item) => item?.name || item?.type || item?.delivery_type || '')
        .filter(Boolean),
    [deliveryTypesData]
  );
  const hasNoData = !isLoading && !isError && deliveries.length === 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDeliveryLog(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setEditOpen(false);
      setSelectedDelivery(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDeliveryLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setDeleteOpen(false);
      setSelectedDelivery(null);
    }
  });

  const openView = async (delivery) => {
    try {
      const fullRecord = delivery?.id ? await getDeliveryLogById(delivery.id) : delivery;
      setSelectedDelivery(fullRecord);
      setViewOpen(true);
    } catch {
      setSelectedDelivery(delivery);
      setViewOpen(true);
    }
  };

  const openEdit = async (delivery) => {
    try {
      const fullRecord = delivery?.id ? await getDeliveryLogById(delivery.id) : delivery;
      setSelectedDelivery(fullRecord);
      setEditForm({
        ...emptyEditForm,
        ...fullRecord,
        received_at: toDatetimeLocal(fullRecord?.received_at)
      });
      setEditOpen(true);
    } catch {
      setSelectedDelivery(delivery);
      setEditForm({
        ...emptyEditForm,
        ...delivery,
        received_at: toDatetimeLocal(delivery?.received_at)
      });
      setEditOpen(true);
    }
  };

  const openDelete = (delivery) => {
    setSelectedDelivery(delivery);
    setDeleteOpen(true);
  };

  const submitEdit = (event) => {
    event.preventDefault();
    if (!selectedDelivery?.id) return;

    const payload = {
      date_received: editForm.date_received,
      delivery_for: editForm.delivery_for,
      recipient_name: editForm.recipient_name,
      company_name: editForm.company_name,
      delivery_type: editForm.delivery_type,
      delivery_partner: editForm.delivery_partner,
      courier_type_name: editForm.courier_type_name,
      supplier_description: editForm.supplier_description,
      deliverer_name: editForm.deliverer_name,
      description: editForm.description
    };

    updateMutation.mutate({ id: selectedDelivery.id, payload });
  };

  return (
    <section className="delivery-logs-page">
      <header className="delivery-logs-page__header">
        <AdminPageHeader
          title="Delivery Logs"
          subtitle="View and manage all delivery records"
        />
      </header>

      <div className="delivery-logs-card">
        <SearchAndFilters
          search={search}
          status={status}
          type={type}
          deliveryTypeOptions={deliveryTypeOptions}
          setSearch={setSearch}
          setStatus={setStatus}
          setType={setType}
        />

        {isFetching && !isLoading ? <p className="delivery-logs-state">Updating results...</p> : null}
        {isError && <p className="delivery-logs-state is-error">Error fetching delivery records.</p>}

        <DeliveryLogsTable
          deliveries={deliveries}
          isLoading={isLoading}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
        />

        {hasNoData ? (
          <div className="delivery-logs-empty-state" role="status" aria-live="polite">
            <h3>No delivery records found</h3>
            <p>Try adjusting your search keyword or filter selections.</p>
          </div>
        ) : null}

        {!isError ? (
          <Pagination
            currentPage={data?.meta?.currentPage || page}
            totalPages={data?.meta?.totalPages || 1}
            onPageChange={setPage}
            pageSize={limit}
            onPageSizeChange={setLimit}
            totalItems={data?.meta?.totalItems || 0}
          />
        ) : null}

        <ModalShell
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          title="Delivery Information"
          subtitle="Review the delivery record details"
          icon={FaTruck}
          actions={(
            <>
              <button type="button" className="delivery-modal__btn is-secondary" onClick={() => setViewOpen(false)}>Cancel</button>
              <button type="button" className="delivery-modal__btn is-primary" onClick={() => setViewOpen(false)}>Okay</button>
            </>
          )}
        >
          <section className="mb-4 rounded-[22px] border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Overview</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailBlock label="Date & Time" value={selectedDelivery?.date_received ? `${formatOptionalDate(selectedDelivery.date_received)} ${formatOptionalTime(selectedDelivery.date_received)}` : '—'} />
              <DetailBlock label="Reference Code" value={normalizeReferenceCode(selectedDelivery?.reference_code)} highlight />
              <DetailBlock label="Company" value={selectedDelivery?.company_name} />
              <DetailBlock label="Delivery Items" value={formatDeliveryItems(selectedDelivery)} />
              <DetailBlock label="Total Items" value={String(getTotalItems(selectedDelivery))} highlight />
              <DetailBlock label="Deliverer" value={selectedDelivery?.deliverer_name} />
              <DetailBlock label="Courier/Supplier" value={selectedDelivery?.courier_type_name || selectedDelivery?.delivery_partner} />
              <DetailBlock label="Status" value={selectedDelivery?.is_status} highlight />
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Record Notes</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailBlock label="Received By" value={selectedDelivery?.received_by} />
              <DetailBlock label="Received At" value={selectedDelivery?.received_at ? `${formatOptionalDate(selectedDelivery.received_at)} ${formatOptionalTime(selectedDelivery.received_at)}` : '—'} />
              <div className="sm:col-span-2">
                <DetailBlock label="Description" value={selectedDelivery?.description} />
              </div>
              <div className="sm:col-span-2">
                <DetailBlock label="Recipient" value={selectedDelivery?.recipient_name} />
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-4 mt-4">
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Receiver Signature</h3>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {selectedDelivery?.receiver_signature ? (
                <img
                  src={selectedDelivery.receiver_signature}
                  alt="Receiver signature"
                  className="max-h-[260px] w-full max-w-[420px] rounded-3xl border border-slate-200 bg-slate-50 object-contain"
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Signature image not available.
                </div>
              )}
            </div>
          </section>
        </ModalShell>

        <ModalShell
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Delivery Details"
          subtitle="Update non-verification fields for this record"
          icon={FaPenToSquare}
          size="xl"
          actions={(
            <>
              <button type="button" className="delivery-modal__btn is-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="submit" form="delivery-edit-form" className="delivery-modal__btn is-primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        >
          <form id="delivery-edit-form" onSubmit={submitEdit} className="space-y-4">
            <section className="rounded-[22px] border border-slate-200 bg-white p-4">
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Verification</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Reference Code">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm uppercase outline-none transition cursor-not-allowed opacity-75"
                    value={normalizeReferenceCode(editForm.reference_code)}
                    readOnly
                  />
                </Field>
                <Field label="Status">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm outline-none transition cursor-not-allowed opacity-75"
                    value={editForm.is_status ?? 'Pending'}
                    readOnly
                  />
                </Field>
                <Field label="Received By">
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm outline-none transition cursor-not-allowed opacity-75"
                    value={editForm.received_by || '—'}
                    readOnly
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[22px] border border-slate-200 bg-white p-4">
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Editable Fields</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  ['Company', 'company_name', editForm.company_name],
                  ['Recipient Name', 'recipient_name', editForm.recipient_name],
                  ['Delivery Type', 'delivery_type', editForm.delivery_type],
                  ['Delivery Partner', 'delivery_partner', editForm.delivery_partner],
                  ['Courier Type', 'courier_type_name', editForm.courier_type_name]
                ].map(([label, key, value]) => (
                  <Field key={key} label={label}>
                    <input
                      className="w-full rounded-2xl border text-gray-700 border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cfd84d] focus:ring-4 focus:ring-[#d4df45]/15"
                      value={value ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </Field>
                ))}
                <div className="md:col-span-3">
                  <Field label="Description">
                    <textarea
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#cfd84d] focus:ring-4 focus:ring-[#d4df45]/15"
                      value={editForm.description ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-[#e9e36f] bg-[#fefce8] px-4 py-3 text-xs text-[#9a8f12]">
              Delivery release is secured and can only be completed by kiosk verification using the matching reference code and signature.
            </div>

            {updateMutation.isError ? <Alert severity="error">Failed to update delivery record.</Alert> : null}
          </form>
        </ModalShell>

        <ModalShell
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Delivery"
          subtitle="This action cannot be undone"
          icon={FaTruck}
          size="sm"
          actions={(
            <>
              <button type="button" className="delivery-modal__btn is-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button
                type="button"
                className="delivery-modal__btn is-primary"
                onClick={() => selectedDelivery?.id && deleteMutation.mutate(selectedDelivery.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        >
          <p className="text-sm leading-6 text-slate-700">
            Delete <strong className="font-extrabold text-slate-900">{selectedDelivery?.company_name || 'this delivery'}</strong>? This action cannot be undone.
          </p>
          {deleteMutation.isError ? <Alert severity="error" sx={{ mt: 2 }}>Failed to delete delivery record.</Alert> : null}
        </ModalShell>
      </div>
    </section>
  );
}
