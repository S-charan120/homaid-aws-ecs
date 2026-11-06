const serviceIcons = {
  cleaning: '✳',
  plumbing: '⌁',
  electrical: 'ϟ',
  'ac-service': '◌'
};

export default function ServiceCard({ service, index, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`service-card ${selected ? 'active' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(service.id)}
    >
      <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="service-icon" aria-hidden="true">
        {serviceIcons[service.id] || '⌂'}
      </span>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <b>Indicative ₹{service.indicativePriceINR}</b>
    </button>
  );
}
