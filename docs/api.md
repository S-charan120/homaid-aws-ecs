# Homaid API

The API catalogue is served at `GET /api/services`. A booking is created with `POST /api/bookings`, using a service ID, customer name/email, address, future appointment timestamp and optional notes.

Each successful booking returns a booking ID and a one-time access token. The API stores only the SHA-256 hash of that token. Retrieve booking status using `GET /api/bookings/:id` with the token in `X-Booking-Token`.

Only the administrator can transition a booking using `PATCH /api/bookings/:id/status` and `X-Admin-Token`. Allowed transitions:
- requested → confirmed or cancelled
- confirmed → in_progress or cancelled
- in_progress → completed
- completed/cancelled are terminal

Invalid transitions return HTTP 409. Request validation failures return HTTP 400.
