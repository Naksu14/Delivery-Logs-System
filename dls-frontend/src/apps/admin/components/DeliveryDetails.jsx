import React from 'react';

const DeliveryDetails = ({ delivery }) => {
  return (
    <div>
      <p><strong>Date Received:</strong> {new Date(delivery.date_received).toLocaleString()}</p>
      <p><strong>Delivery For:</strong> {delivery.delivery_for}</p>
      <p><strong>Recipient:</strong> {delivery.recipient_name}</p>
      <p><strong>Company:</strong> {delivery.company_name}</p>
      <p><strong>Delivery Type:</strong> {delivery.delivery_type}</p>
      <p><strong>Delivery Partner:</strong> {delivery.delivery_partner}</p>
      <p><strong>Courier/Supplier:</strong> {delivery.courier_type_name}</p>
      <p><strong>Supplier Description:</strong> {delivery.supplier_description}</p>
      <p><strong>Deliverer:</strong> {delivery.deliverer_name}</p>
      <p><strong>Description:</strong> {delivery.description}</p>
      <p><strong>Status:</strong> {delivery.is_status}</p>
      <p><strong>Received By:</strong> {delivery.received_by}</p>
      <p><strong>Received At:</strong> {new Date(delivery.received_at).toLocaleString()}</p>
      {delivery.receiver_signature && <img src={delivery.receiver_signature} alt="Receiver Signature" />}
    </div>
  );
};

export default DeliveryDetails;