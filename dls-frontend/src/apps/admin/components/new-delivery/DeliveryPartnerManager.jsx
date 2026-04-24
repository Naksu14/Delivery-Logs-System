import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDeliveryPartner,
  deleteDeliveryPartner,
  getDeliveryPartners,
  updateDeliveryPartner
} from '../../../../services/deliveryPartnersServices';
import {
  createDeliveryType,
  deleteDeliveryType,
  getDeliveryTypes
} from '../../../../services/deliveryTypeServices';
import { FaPenToSquare, FaPlus, FaTrash, FaTruck } from 'react-icons/fa6';

const emptyForm = {
  type: 'courier',
  name: ''
};

const inputClass =
  'admin-input-control';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function TypeBadge({ type }) {
  const isCourier = String(type).toLowerCase() === 'courier';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${isCourier ? 'bg-lime-100 text-lime-900' : 'bg-slate-100 text-slate-700'}`}
    >
      {type}
    </span>
  );
}

export default function DeliveryPartnerManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [typeForm, setTypeForm] = useState('');
  const [typeFeedback, setTypeFeedback] = useState('');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: getDeliveryPartners,
    select: (data) => (Array.isArray(data) ? data : [])
  });

  const { data: deliveryTypes = [], isLoading: isTypesLoading } = useQuery({
    queryKey: ['delivery-types'],
    queryFn: getDeliveryTypes,
    select: (data) => (Array.isArray(data) ? data : [])
  });

  const courierCount = useMemo(
    () => partners.filter((partner) => String(partner?.type).toLowerCase() === 'courier').length,
    [partners]
  );

  const supplierCount = useMemo(
    () => partners.filter((partner) => String(partner?.type).toLowerCase() === 'supplier').length,
    [partners]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setFeedback('');
  };

  const createMutation = useMutation({
    mutationFn: createDeliveryPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      resetForm();
      setFeedback('Delivery partner created successfully.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDeliveryPartner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      resetForm();
      setFeedback('Delivery partner updated successfully.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDeliveryPartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      setDeleteModal(null);
      setFeedback('Delivery partner deleted.');
    }
  });

  const createTypeMutation = useMutation({
    mutationFn: createDeliveryType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-types'] });
      setTypeForm('');
      setTypeFeedback('Delivery type created successfully.');
    }
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => deleteDeliveryType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-types'] });
      setDeleteModal(null);
      setTypeFeedback('Delivery type deleted.');
    }
  });

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      type: form.type,
      name: form.type === 'courier' ? form.name.trim() : null
    };

    createMutation.mutate(payload);
  };

  const beginEdit = (partner) => {
    setEditModal({
      id: partner.id,
      type: String(partner.type || 'courier').toLowerCase(),
      name: partner.name || ''
    });
    setDeleteModal(null);
    setFeedback('');
  };

  const submitEditModal = (event) => {
    event.preventDefault();
    if (!editModal?.id) return;

    const payload = {
      type: editModal.type,
      name: editModal.type === 'courier' ? String(editModal.name || '').trim() : null
    };

    if (payload.type === 'courier' && !payload.name) {
      setFeedback('Courier partner name is required.');
      return;
    }

    updateMutation.mutate(
      { id: editModal.id, payload },
      {
        onSuccess: () => {
          setEditModal(null);
        }
      }
    );
  };

  const beginDeletePartner = (partner) => {
    if (String(partner?.type).toLowerCase() === 'supplier') {
      setFeedback('Supplier partners cannot be removed.');
      return;
    }

    setDeleteModal({
      kind: 'partner',
      id: partner.id,
      label: partner.name || 'unnamed supplier'
    });
    setFeedback('');
  };

  const beginDeleteType = (type) => {
    setDeleteModal({
      kind: 'type',
      id: type.id,
      label: type.name
    });
    setTypeFeedback('');
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.kind === 'partner') {
      deleteMutation.mutate(deleteModal.id);
      return;
    }
    deleteTypeMutation.mutate(deleteModal.id);
  };

  const isDeletePending = deleteMutation.isPending || deleteTypeMutation.isPending;
  const isCourierForm = String(form.type).toLowerCase() === 'courier';

  const submitType = (event) => {
    event.preventDefault();
    setTypeFeedback('');
    createTypeMutation.mutate({ name: typeForm.trim() });
  };

  const submitPartner = (event) => {
    if (!isCourierForm) {
      event.preventDefault();
      setFeedback('Only courier partners can be added or updated here.');
      return;
    }

    submit(event);
  };

  return (
    <section className="space-y-4">
      <div className="admin-panel space-y-4 rounded-[24px] p-4 sm:p-5">
        <div className="admin-panel-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <FaTruck className="text-lime-500" />
              <span className="admin-heading-lg text-lg">Delivery Partner Management</span>
            </div>
            <p className="admin-muted-text mt-1 text-sm">
              Create, update, and remove courier or supplier partners used by delivery entries.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
            <span className="rounded-full bg-lime-100 px-3 py-1 text-lime-900">Courier {courierCount}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Supplier {supplierCount}</span>
          </div>
        </div>

        <form onSubmit={submitPartner} className="admin-panel-soft space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(320px,1fr)_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Partner Type</span>
              <select
                className={inputClass}
                value={form.type}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    type: nextType,
                    name: nextType === 'courier' ? prev.name : ''
                  }));
                  setFeedback('');
                }}
              >
                <option value="courier">Courier</option>
                <option value="supplier" disabled>
                  Supplier (disabled)
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Partner Name {form.type === 'courier' ? '*' : '(optional)'}
              </span>
              <input
                className={inputClass}
                value={form.name}
                required={form.type === 'courier'}
                placeholder={form.type === 'courier' ? 'Enter courier partner name' : 'Leave blank to store NULL'}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                  setFeedback('');
                }}
              />
            </label>

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || !isCourierForm}
              className="admin-btn-primary inline-flex w-full px-5 py-2.5 xl:w-auto"
            >
              <FaPlus />
              Create Partner
            </button>
          </div>

          {feedback ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {feedback}
            </div>
          ) : null}

          {createMutation.isError || updateMutation.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Failed to save delivery partner. Check the fields and try again.
            </div>
          ) : null}
        </form>

        <div className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-slate-500">Existing Partners</h3>
            <span className="text-xs font-semibold text-slate-500">{partners.length} records</span>
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-sm text-slate-500">Loading partners...</div>
          ) : partners.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No delivery partners found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{partner.name || '—'}</td>
                      <td className="px-4 py-3"><TypeBadge type={partner.type} /></td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(partner.createdAt || partner.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="admin-btn-secondary inline-flex gap-1 px-3 py-1.5 text-xs"
                            onClick={() => beginEdit(partner)}
                          >
                            <FaPenToSquare />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={String(partner?.type).toLowerCase() === 'supplier'}
                            title={
                              String(partner?.type).toLowerCase() === 'supplier'
                                ? 'Supplier cannot be removed'
                                : 'Delete partner'
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                            onClick={() => beginDeletePartner(partner)}
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <section className="admin-panel space-y-4 rounded-[24px] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="admin-heading-lg text-lg">Delivery Type Management</h3>
            <p className="admin-muted-text mt-1 text-sm">Create and manage delivery types used in new delivery entries.</p>
          </div>
          <span className="admin-muted-text text-xs font-semibold">Create any delivery type</span>
        </div>

        <form onSubmit={submitType} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block w-full sm:max-w-xs">
            <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Type</span>
            <input
              className={inputClass}
              type="text"
              placeholder="e.g. parcel, mail, document"
              value={typeForm}
              onChange={(event) => setTypeForm(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={createTypeMutation.isPending}
            className="admin-btn-primary px-5 py-2.5"
          >
            <FaPlus />
            {createTypeMutation.isPending ? 'Creating...' : 'Create Type'}
          </button>
        </form>

        {typeFeedback ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {typeFeedback}
          </div>
        ) : null}

        {createTypeMutation.isError || deleteTypeMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Failed to update delivery types.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isTypesLoading ? (
            <div className="px-4 py-4 text-sm text-slate-500">Loading delivery types...</div>
          ) : deliveryTypes.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">No delivery types found.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold capitalize text-slate-900">{type.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        onClick={() => beginDeleteType(type)}
                        disabled={deleteTypeMutation.isPending}
                      >
                        <FaTrash />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {editModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.3)] sm:p-6">
            <h4 className="text-lg font-extrabold text-slate-900">Edit Delivery Partner</h4>
            <form onSubmit={submitEditModal} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Partner Type
                </span>
                <input
                  className={inputClass}
                  value={editModal.type === 'courier' ? 'Courier' : 'Supplier'}
                  disabled
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Partner Name {editModal.type === 'courier' ? '*' : '(optional)'}
                </span>
                <input
                  className={inputClass}
                  value={editModal.name}
                  required={editModal.type === 'courier'}
                  onChange={(event) =>
                    setEditModal((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  placeholder={editModal.type === 'courier' ? 'Enter courier partner name' : 'No name for supplier'}
                  disabled={updateMutation.isPending}
                />
              </label>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setEditModal(null)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary px-4 py-2"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.3)] sm:p-6">
            <h4 className="text-lg font-extrabold text-slate-900">Confirm Delete</h4>
            <p className="mt-2 text-sm text-slate-600">
              {deleteModal.kind === 'partner'
                ? 'Delete this delivery partner?'
                : 'Delete this delivery type?'}{' '}
              <span className="font-bold text-slate-900">{deleteModal.label}</span>
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setDeleteModal(null)}
                disabled={isDeletePending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-60"
                onClick={confirmDelete}
                disabled={isDeletePending}
              >
                {isDeletePending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
