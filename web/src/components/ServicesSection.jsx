import ServiceCard from './ServiceCard.jsx';

export default function ServicesSection({
  services,
  selectedServiceId,
  onSelectService,
  message
}) {
  return (
    <section id="services" className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">WHAT NEEDS DOING?</p>
          <h2>Services for your space</h2>
        </div>
        <p>Choose a category to start a request.</p>
      </div>

      {services.length > 0 && (
        <div className="cards">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              selected={selectedServiceId === service.id}
              onSelect={onSelectService}
            />
          ))}
        </div>
      )}

      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}
