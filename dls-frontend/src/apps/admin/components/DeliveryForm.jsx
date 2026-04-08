import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { updateDelivery } from '../../../services/deliveriesServices';

const DeliveryForm = ({ delivery, onFormSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    delivery_type: '',
    deliverer_name: '',
    courier_type_name: '',
    description: '',
    received_by: '',
    is_status: 'Pending',
  });

  useEffect(() => {
    if (delivery) {
      setFormData({
        company_name: delivery.company_name,
        delivery_type: delivery.delivery_type,
        deliverer_name: delivery.deliverer_name,
        courier_type_name: delivery.courier_type_name,
        description: delivery.description,
        received_by: delivery.received_by,
        is_status: delivery.is_status,
      });
    }
  }, [delivery]);

  const queryClient = useQueryClient();

  const mutation = useMutation(delivery ? (data) => updateDelivery(delivery.id, data) : (data) => createDelivery(data), {
    onSuccess: () => {
      queryClient.invalidateQueries('deliveries');
      onFormSubmit();
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Add form fields for each editable property */}
      <div className="flex justify-end gap-4 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
      </div>
    </form>
  );
};

export default DeliveryForm;