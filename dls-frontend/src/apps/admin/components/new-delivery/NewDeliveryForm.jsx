import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CompanySearchSelect from '../CompanySearchSelect';
import { createDeliveryLog } from '../../../../services/deliveriesServices';
import { getCompanies } from '../../../../services/companyAPIServices';
import { getDeliveryPartners } from '../../../../services/deliveryPartnersServices';
import { getDeliveryTypes } from '../../../../services/deliveryTypeServices';

const defaultDeliveryTypes = [];

const initialForm = {
  delivery_for: 'Company',
  company_id: '',
  company_name_manual: '',
  recipient_name: '',
  deliverer_name: '',
  delivery_type: '',
  delivery_partner: '',
  description: ''
};

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
    const options = typeData
      .map((item) => {
        const raw = String(item?.name || '').trim();
        if (!raw) return null;
        return {
          value: raw.toLowerCase(),
          label: raw.charAt(0).toUpperCase() + raw.slice(1)
        };
      })
      .filter(Boolean);

    return options.length > 0 ? options : defaultDeliveryTypes;
  }, [typeData]);

  const createMutation = useMutation({
    mutationFn: createDeliveryLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setSuccessMessage('Delivery log created successfully.');
      setForm(initialForm);
    }
  });

  const onChange = (event) => {
    const { name, value } = event.target;
    setSuccessMessage('');

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

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();

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

    createMutation.mutate({
      date_received: now.toISOString(),
      delivery_for: form.delivery_for,
      recipient_name: form.recipient_name,
      company_name: companyName,
      delivery_type: form.delivery_type,
      delivery_partner: form.delivery_partner,
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
          <select className={inputClass} name="delivery_type" value={form.delivery_type} onChange={onChange} required>
            <option value="" disabled>
              Select delivery type
            </option>
            {deliveryTypeOptions.length === 0 ? (
              <option value="" disabled>No delivery types available</option>
            ) : null}
            {deliveryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

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
              Add a courier partner first. Supplier records are not allowed here.
            </p>
          ) : null}
        </Field>
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

      {createMutation.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Failed to create delivery log. Please check required fields and try again.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="admin-btn-secondary px-5 py-2.5"
          onClick={() => {
            setForm(initialForm);
            setSuccessMessage('');
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
