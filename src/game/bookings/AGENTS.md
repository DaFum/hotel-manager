# Booking conventions

- Validate reservation terms at creation; later lifecycle phases must be able to use persisted bookings without discovering malformed arithmetic inputs.
- Change booking status through the lifecycle transition functions so guards and history remain authoritative.
