import BookingForm from './BookingForm.jsx';
import BookingReceipt from './BookingReceipt.jsx';

export default function BookingSection({
  services,
  selectedServiceId,
  onSelectService,
  onSubmit,
  booking,
  message,
  submitting
}) {
  return (
    <section id="booking" className="booking-section">
      <div>
        <p className="eyebrow">PLAN A VISIT</p>
        <h2>
          Tell us what
          <br />
          your home needs.
        </h2>
        <p>
          Send a booking request with your contact details and preferred time.
          The request starts in a pending state.
        </p>
        <div className="note">
          A submitted request is not a confirmed appointment. A service team
          must confirm it.
        </div>
      </div>

      <div>
        <BookingForm
          services={services}
          selectedServiceId={selectedServiceId}
          onSelectService={onSelectService}
          onSubmit={onSubmit}
          submitting={submitting}
        />
        <p className="form-status" role="status">{message}</p>
        <BookingReceipt booking={booking} />
      </div>
    </section>
  );
}
