import { useEffect, useState } from 'react';
import BookingSection from './components/BookingSection.jsx';
import HeroSection from './components/HeroSection.jsx';
import ServicesSection from './components/ServicesSection.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';

const API_BASE = '/api';

export default function App() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [catalogMessage, setCatalogMessage] = useState('Loading services…');
  const [bookingMessage, setBookingMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) {
          throw new Error('Service catalogue is unavailable.');
        }

        const data = await response.json();
        if (cancelled) return;

        setServices(data.items || []);
        setSelectedServiceId(data.items?.[0]?.id || '');
        setCatalogMessage(data.items?.length ? '' : 'No services are available yet.');
      } catch (error) {
        if (!cancelled) {
          setCatalogMessage(error.message || 'Unable to load services.');
        }
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createBooking(formValues) {
    setSubmitting(true);
    setBooking(null);
    setBookingMessage('Submitting your request…');

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          ...formValues,
          serviceId: selectedServiceId,
          scheduledAt: new Date(formValues.scheduledAt).toISOString()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const details = data.details?.join(', ');
        throw new Error(details || data.error || 'Booking could not be submitted.');
      }

      setBooking(data);
      setBookingMessage('Your request has been recorded. The service team still needs to confirm the appointment.');
      return true;
    } catch (error) {
      setBookingMessage(error.message || 'Unable to submit your booking.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main>
        <HeroSection />
        <ServicesSection
          services={services}
          selectedServiceId={selectedServiceId}
          onSelectService={setSelectedServiceId}
          message={catalogMessage}
        />
        <BookingSection
          services={services}
          selectedServiceId={selectedServiceId}
          onSelectService={setSelectedServiceId}
          onSubmit={createBooking}
          booking={booking}
          message={bookingMessage}
          submitting={submitting}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
