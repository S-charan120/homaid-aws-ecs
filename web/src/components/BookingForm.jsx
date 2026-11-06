import { useState } from 'react';

const initialForm = {
  customerName: '',
  customerEmail: '',
  address: '',
  scheduledAt: '',
  notes: ''
};

export default function BookingForm({
  services,
  selectedServiceId,
  onSelectService,
  onSubmit,
  submitting
}) {
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const created = await onSubmit(form);
    if (created) {
      setForm(initialForm);
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>Request a service</h3>

      <label>
        Service
        <select
          value={selectedServiceId}
          onChange={event => onSelectService(event.target.value)}
          required
          disabled={!services.length}
        >
          {services.map(service => (
            <option value={service.id} key={service.id}>{service.name}</option>
          ))}
        </select>
      </label>

      <label>
        Your name
        <input
          name="customerName"
          value={form.customerName}
          onChange={updateField}
          minLength="2"
          maxLength="100"
          autoComplete="name"
          required
        />
      </label>

      <label>
        Email address
        <input
          name="customerEmail"
          type="email"
          value={form.customerEmail}
          onChange={updateField}
          autoComplete="email"
          required
        />
      </label>

      <label>
        Service address
        <textarea
          name="address"
          value={form.address}
          onChange={updateField}
          minLength="8"
          maxLength="500"
          autoComplete="street-address"
          rows="2"
          required
        />
      </label>

      <label>
        Preferred date and time
        <input
          name="scheduledAt"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={updateField}
          required
        />
      </label>

      <label>
        Notes (optional)
        <textarea
          name="notes"
          value={form.notes}
          onChange={updateField}
          maxLength="1000"
          rows="2"
        />
      </label>

      <button className="submit" type="submit" disabled={submitting || !services.length}>
        {submitting ? 'Submitting…' : 'Send booking request ↗'}
      </button>
    </form>
  );
}
