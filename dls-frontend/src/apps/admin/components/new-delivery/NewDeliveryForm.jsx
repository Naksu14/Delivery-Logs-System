import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CompanySearchSelect from '../CompanySearchSelect';
import { createDeliveryLog } from '../../../../services/deliveriesServices';
import { getCompanies } from '../../../../services/companyAPIServices';
import { getDeliveryPartners } from '../../../../services/deliveryPartnersServices';
import { getDeliveryTypes } from '../../../../services/deliveryTypeServices';

const defaultDeliveryTypes = ['Parcel', 'Mail', 'Other'];
const defaultDeliveryByTypes = ['Courier', 'Supplier'];

const initialForm = {
  delivery_for: 'Company',
  company_id: '',
  company_name_manual: '',
  recipient_name: '',
  deliverer_name: '',
  delivery_items: [],
  delivery_by: '',
  delivery_partner: '',
  supplier_description: '',
  description: ''
};

function createDeliveryItem(name = '', quantity = 1) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    customName: '',
    quantity,
  };
}

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
}

function isOtherDeliveryType(name) {
  return String(name || '').trim().toLowerCase() === 'other';
}

function resolveDeliveryItemName(item) {
  const selectedName = String(item?.name || '').trim();
  if (!selectedName) return '';
  if (!isOtherDeliveryType(selectedName)) return selectedName;
  return String(item?.customName || '').trim();
}

function normalizeDeliveryItemsForPayload(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item?.id,
      name: resolveDeliveryItemName(item),
      quantity: normalizeQuantity(item?.quantity),
    }))
    .filter((item) => item.name);
}

function formatDeliveryItemsSummary(items = []) {
  return normalizeDeliveryItemsForPayload(items)
    .map((item) => `${item.name} (${item.quantity})`)
    .join(', ');
}

function getCompanyLabel(company) {
  if (!company) return '';
  return company.branch ? `${company.company_name}` : company.company_name;
}

function getLocalDateTimeLabel(date = new Date()) {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function Field({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'admin-input-control';

export default function NewDeliveryForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    select: (data) => (Array.isArray(data) ? data : [])
  });

  const { data: partnerData = [], isLoading: isPartnersLoading } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: getDeliveryPartners,
    select: (data) => (Array.isArray(data) ? data : [])
  });

  const { data: typeData = [] } = useQuery({
    queryKey: ['delivery-types'],
    queryFn: getDeliveryTypes,
    select: (data) => (Array.isArray(data) ? data : [])
  });

  const courierPartners = useMemo(
    () =>
      partnerData.filter(
        (partner) => String(partner?.type).toLowerCase() === 'courier' && Boolean(partner?.name)
      ),
    [partnerData]
  );

  const deliveryTypeOptions = useMemo(() => {
    const apiOptions = typeData
      .map((item) => {
        const raw = String(item?.name || '').trim();
        if (!raw) return null;
        const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        return {
          value: normalized,
          label: normalized
        };
      })
      .filter(Boolean)
      .filter((option) => !isOtherDeliveryType(option?.value));

    const fallbackOptions = defaultDeliveryTypes
      .filter((type) => !isOtherDeliveryType(type))
      .map((type) => ({ value: type, label: type }));

    const baseOptions = apiOptions.length > 0 ? apiOptions : fallbackOptions;
    return [...baseOptions, { value: 'Other', label: 'Other' }];
  }, [typeData]);

  const totalItems = useMemo(
    () => normalizeDeliveryItemsForPayload(form.delivery_items).reduce((sum, item) => sum + item.quantity, 0),
    [form.delivery_items]
  );

  const createMutation = useMutation({
    mutationFn: createDeliveryLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setSuccessMessage('Delivery log created successfully.');
      setSubmitError('');
      setForm(initialForm);
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.message;
      const fallback = 'Failed to create delivery log. Please check required fields and try again.';
      setSubmitError(Array.isArray(apiMessage) ? apiMessage[0] : apiMessage || fallback);
    }
  });

  const addDeliveryItem = () => {
    setSuccessMessage('');
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      delivery_items: [...(Array.isArray(prev.delivery_items) ? prev.delivery_items : []), createDeliveryItem('', 1)],
    }));
  };

  const updateDeliveryItem = (itemId, field, value) => {
    setSuccessMessage('');
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      delivery_items: (Array.isArray(prev.delivery_items) ? prev.delivery_items : []).map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: field === 'quantity' ? normalizeQuantity(value) : value,
              ...(field === 'name' && !isOtherDeliveryType(value) ? { customName: '' } : {}),
            }
          : item
      )
    }));
  };

  const adjustDeliveryItemQuantity = (itemId, delta) => {
    setSuccessMessage('');
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      delivery_items: (Array.isArray(prev.delivery_items) ? prev.delivery_items : []).map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          quantity: Math.max(1, normalizeQuantity(item.quantity) + delta),
        };
      })
    }));
  };

  const removeDeliveryItem = (itemId) => {
    setSuccessMessage('');
    setSubmitError('');
    setForm((prev) => ({
      ...prev,
      delivery_items: (Array.isArray(prev.delivery_items) ? prev.delivery_items : []).filter((item) => item.id !== itemId)
    }));
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setSuccessMessage('');
    setSubmitError('');

    if (name === 'delivery_for') {
      setForm((prev) => ({
        ...prev,
        delivery_for: value,
        company_id: value === 'Company' ? prev.company_id : '',
        company_name_manual: value === 'Company' ? prev.company_name_manual : ''
      }));
      return;
    }

    if (name === 'company_id') {
      setForm((prev) => ({
        ...prev,
        company_id: value,
        company_name_manual: value === 'not-listed' ? prev.company_name_manual : ''
      }));
      return;
    }

    if (name === 'delivery_by') {
      setForm((prev) => ({
        ...prev,
        delivery_by: value,
        delivery_partner: '',
        supplier_description: ''
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setSubmitError('');

    const now = new Date();
    const selectedCompany = companies.find((company) => String(company?.id) === String(form.company_id));
    const companyName =
      form.delivery_for === 'Individual'
        ? form.recipient_name.trim()
        : form.company_id === 'not-listed'
          ? form.company_name_manual.trim()
          : selectedCompany
            ? getCompanyLabel(selectedCompany)
            : '';

    const preparedDeliveryItems = (Array.isArray(form.delivery_items) ? form.delivery_items : [])
      .map((item) => ({
        id: item?.id,
        name: String(item?.name || '').trim(),
        customName: String(item?.customName || '').trim(),
        quantity: normalizeQuantity(item?.quantity),
      }));

    const hasMissingCustomOther = preparedDeliveryItems.some(
      (item) => isOtherDeliveryType(item.name) && !item.customName
    );

    if (hasMissingCustomOther) {
      setSubmitError('Please provide a custom delivery type for every item set to Other.');
      return;
    }

    const normalizedDeliveryItems = normalizeDeliveryItemsForPayload(preparedDeliveryItems).map((item) => ({
      name: item.name,
      quantity: item.quantity,
    }));

    if (normalizedDeliveryItems.length === 0) {
      setSubmitError('Please add at least one delivery item before creating the log.');
      return;
    }

    if (!form.delivery_by) {
      setSubmitError('Please select Delivery By (Courier or Supplier).');
      return;
    }

    if (form.delivery_by === 'Courier' && !form.delivery_partner) {
      setSubmitError('Please select a courier partner.');
      return;
    }

    if (form.delivery_by === 'Supplier' && !form.supplier_description.trim()) {
      setSubmitError('Please enter supplier description.');
      return;
    }

    const deliveryTypeSummary = formatDeliveryItemsSummary(preparedDeliveryItems);
    const totalItemCount = normalizedDeliveryItems.reduce((sum, item) => sum + item.quantity, 0);

    createMutation.mutate({
      date_received: now.toISOString(),
      delivery_for: form.delivery_for,
      recipient_name: form.recipient_name,
      company_name: companyName,
      delivery_type: deliveryTypeSummary,
      delivery_items: normalizedDeliveryItems,
      total_items: totalItemCount,
      delivery_partner: form.delivery_by === 'Supplier' ? 'Supplier' : form.delivery_partner,
      courier_type_name: form.delivery_by === 'Courier' ? form.delivery_partner : undefined,
      supplier_description:
        form.delivery_by === 'Supplier' ? form.supplier_description.trim() : undefined,
      deliverer_name: form.deliverer_name,
      description: form.description,
      is_status: 'Pending',
      received_at: now.toISOString()
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-5xl space-y-4">
      <div className="admin-panel-soft flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="admin-heading-lg text-lg sm:text-xl">Delivery Log Entry</span>
          <p className="admin-muted-text mt-1 text-sm">Create a delivery record using managed partner and delivery-type inputs.</p>
        </div>
        <div className="rounded-xl border border-[#dbe48c] bg-[#f8fadf] px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Date Received</p>
          <p className="text-sm font-bold text-slate-900">{getLocalDateTimeLabel()}</p>
        </div>
      </div>

      <section className="admin-panel grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <Field label="Delivery For" required>
          <select className={inputClass} name="delivery_for" value={form.delivery_for} onChange={onChange} required>
            <option value="Company">Company</option>
            <option value="Individual">Individual</option>
          </select>
        </Field>

        {form.delivery_for === 'Company' ? (
          <Field label="Company" required>
            <CompanySearchSelect
              companies={companies}
              valueId={form.company_id}
              onChange={(valueId) => {
                setSuccessMessage('');
                setForm((prev) => ({
                  ...prev,
                  company_id: valueId,
                  company_name_manual: valueId === 'not-listed' ? prev.company_name_manual : '',
                }));
              }}
              loading={isCompaniesLoading}
              disabled={isCompaniesLoading}
              includeNotListed
              placeholder="Select company"
            />
          </Field>
        ) : (
          <div className="hidden md:block" aria-hidden="true" />
        )}

        {form.delivery_for === 'Company' && form.company_id === 'not-listed' ? (
          <Field label="Company Name (Manual)" required>
            <input
              className={inputClass}
              name="company_name_manual"
              value={form.company_name_manual}
              onChange={onChange}
              required
              placeholder="Type company name"
            />
          </Field>
        ) : null}

        <Field label="Recipient Name" required>
          <input
            className={inputClass}
            name="recipient_name"
            value={form.recipient_name}
            onChange={onChange}
            required
            placeholder="Enter recipient name"
          />
        </Field>
      </section>

      <section className="admin-panel grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <Field label="Deliverer Name" required>
          <input
            className={inputClass}
            name="deliverer_name"
            value={form.deliverer_name}
            onChange={onChange}
            required
            placeholder="Name of person delivering"
          />
        </Field>

        <Field label="Delivery Type" required>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="space-y-3">
              {(Array.isArray(form.delivery_items) ? form.delivery_items : []).map((item, index) => (
                <div
                  key={item.id}
                  className={`space-y-2 ${index !== form.delivery_items.length - 1 ? 'border-b border-slate-100 pb-3' : ''}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className={inputClass}
                      value={item.name || ''}
                      onChange={(event) => updateDeliveryItem(item.id, 'name', event.target.value)}
                    >
                      <option value="" disabled>
                        Select delivery type
                      </option>
                      {deliveryTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => adjustDeliveryItemQuantity(item.id, -1)}
                          className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-200"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-bold text-slate-900">
                          {normalizeQuantity(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustDeliveryItemQuantity(item.id, 1)}
                          className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-200"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDeliveryItem(item.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.04em] text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {isOtherDeliveryType(item.name) ? (
                    <input
                      className={inputClass}
                      value={item.customName || ''}
                      onChange={(event) => updateDeliveryItem(item.id, 'customName', event.target.value)}
                      placeholder="Type custom delivery type"
                      required
                    />
                  ) : null}
                </div>
              ))}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={addDeliveryItem}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.04em] text-slate-700 hover:bg-slate-100"
                >
                  + Add delivery type
                </button>
                <div className="rounded-lg border border-[#dbe48c] bg-[#f8fadf] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-700">
                  Total items: {totalItems}
                </div>
              </div>
            </div>
          </div>
        </Field>

        <Field label="Delivery By" required>
          <select
            className={inputClass}
            name="delivery_by"
            value={form.delivery_by}
            onChange={onChange}
            required
          >
            <option value="" disabled>
              Select delivery by
            </option>
            {defaultDeliveryByTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        {form.delivery_by === 'Courier' ? (
          <Field label="Courier Partner" required>
            <select
              className={inputClass}
              name="delivery_partner"
              value={form.delivery_partner}
              onChange={onChange}
              required
              disabled={isPartnersLoading || courierPartners.length === 0}
            >
              <option value="" disabled>
                {isPartnersLoading ? 'Loading courier partners...' : 'Select courier partner'}
              </option>
              {courierPartners.map((partner) => (
                <option key={partner.id} value={partner.name}>
                  {partner.name}
                </option>
              ))}
            </select>
            {!isPartnersLoading && courierPartners.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                No courier partners available. Please add one first.
              </p>
            ) : null}
          </Field>
        ) : null}

        {form.delivery_by === 'Supplier' ? (
          <Field label="Supplier Description" required>
            <input
              className={inputClass}
              name="supplier_description"
              value={form.supplier_description}
              onChange={onChange}
              required
              placeholder="Enter supplier information"
            />
          </Field>
        ) : null}
      </section>

      <section className="admin-panel p-4">
        <Field label="Notes">
          <textarea
            className={`${inputClass} min-h-[120px]`}
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Optional notes"
          />
        </Field>
      </section>

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {createMutation.isError || submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {submitError || 'Failed to create delivery log. Please check required fields and try again.'}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="admin-btn-secondary px-5 py-2.5"
          onClick={() => {
            setForm(initialForm);
            setSuccessMessage('');
            setSubmitError('');
          }}
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="admin-btn-primary px-6 py-2.5"
        >
          {createMutation.isPending ? 'Saving...' : 'Create Delivery Log'}
        </button>
      </div>
    </form>
  );
}
