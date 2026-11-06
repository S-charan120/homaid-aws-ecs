export default function BookingReceipt({ booking }) {
  if (!booking) return null;

  return (
    <div className="receipt">
      <b>Booking reference</b>
      <code>{booking.bookingId}</code>
      <b>Private access token — save it now</b>
      <code>{booking.accessToken}</code>
      <small>
        This token is shown once and is required to retrieve this booking.
      </small>
    </div>
  );
}
