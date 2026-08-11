export const en = {
  app: {
    main: "Hotel management",
  },
  topbar: {
    status: "Status bar",
    cash: "Cash",
    monthProfit: "Month result",
    occupancy: "Occupancy",
    reputation: "Standing",
    warnings: "Warnings",
    language: "Language",
    save: "Save",
    load: "Load",
  },
  hotel: {
    status: "Hotel status",
    inspect: "Inspect",
    serviceAreas: "Service areas",
  },
  management: {
    skip: "Skip to management content",
    areas: "Management areas",
    hotel: "Hotel",
    staff: "Staff",
    finance: "Finance",
    company: "Company",
  },
  settings: {
    presentation: "Presentation settings",
    accessibility: "Accessibility",
    textSize: "Text size",
    highContrast: "High contrast",
    reducedMotion: "Reduced motion",
    audio: "Audio",
    audioBus: {
      master: "Master",
      music: "Music",
      ambience: "Ambience",
      ui: "Interface",
      warnings: "Warnings",
    },
  },
  help: {
    guestSatisfaction: "Guest satisfaction",
    region: "{title} help",
    why: "{title}: Why?",
    empty: "No contributing factors are available yet.",
    close: "Close help",
    drivers: {
      businessDemand: "Business demand {value}%",
      newSupply: "New supply +{rooms} rooms",
    },
  },
  tutorial: {
    region: "Guided onboarding",
    heading: "Getting started",
    setRoomPrice: "Set your first room price.",
    inspectBookings: "Inspect upcoming bookings.",
    hireHousekeeping: "Hire a housekeeping employee.",
    complete: "Onboarding complete.",
    inspectAction: "Inspect bookings",
    dismiss: "Dismiss tutorial",
  },
  notifications: {
    region: "Notification center",
    heading: "Notifications",
    autoPause: "Auto-pause: {status}",
    grouped: "{count} grouped notifications",
    delegated: "Delegated to {delegate}",
    critical: "Immediate attention required",
    acknowledge: "Acknowledge",
    open: "Open {title}",
    causes: { negativeLiquidity: "Cash less payables is negative" },
    severity: {
      info: "Info",
      notice: "Notice",
      warning: "Warning",
      critical: "Critical",
    },
    pause: {
      idle: "idle",
      pending: "pending",
      accepted: "accepted",
      rejected: "rejected",
    },
  },
  room: {
    floor: "Floor {value}",
    fallback: "room",
    cleanliness: "cleanliness {value}",
    states: {
      VacantClean: "vacant clean",
      VacantDirty: "vacant dirty",
      Occupied: "occupied",
      OutOfOrder: "out of order",
    },
  },
  alerts: { liquidityCritical: "Liquidity is critical" },
  events: { guestCheckin: "Guest checked in" },
  alert: {
    "housekeeping-backlog": {
      title: "Housekeeping backlog",
      cause: "{rooms} rooms waiting for cleaning",
    },
    "cleaning-stockout": {
      title: "Cleaning supplies exhausted",
      cause: "Housekeeping cannot turn rooms around.",
    },
    "linen-short": {
      title: "Linen shortage",
      cause: "Rooms cannot be made up until the laundry catches up.",
    },
    security: {
      spaces: {
        title: "Security short",
        cause:
          "{inHouseGuests} in house, {eventGuests} at events, {openSpaces} spaces open.",
      },
    },
    "breakfast-queue": {
      title: "Breakfast queue",
      cause: "{queue} guests could not be served.",
    },
    "room-service-late": {
      title: "Room service delayed",
      cause: "{minutes} minutes door to door, mostly waiting for the lift.",
    },
    "spa-unstaffed": {
      title: "Spa unstaffed",
      cause:
        "{demand} requests and {sold} bookings, but only {therapists} therapists rostered.",
    },
    "security-short": {
      title: "Security short",
      cause:
        "{short} guards short; base {base}, event guests {eventGuests}, VIP level {vipLevel}.",
    },
    "staff-areas-crowded": {
      title: "Staff areas crowded",
      cause: "Changing rooms cannot take the whole shift at once.",
    },
    "construction-noise": {
      title: "Construction noise",
      cause: "{guests} guests are in the house while the site is live.",
    },
    "long-check-in": {
      title: "Long check-in",
      cause: "{bookingId} waited {waitedMinutes} minutes at reception.",
    },
    "complaint-unanswered": { title: "Complaint left unanswered" },
    recovery: {
      noFrontDesk: "Nobody is on the desk to authorise it.",
      insufficientCash:
        "The hotel has {cashMinor}, but the discount costs {costMinor}.",
    },
    "recovery-escalated": {
      title: "Recovery escalated",
      cause: "The manager may not authorise {expenseMinor} for {bookingId}.",
    },
    "booking-refused": {
      title: "Booking request refused",
      cause: {
        price: "{bookingId} was refused because its price was too high.",
        inventory:
          "{bookingId} was refused because no inventory remained on {dateKey}.",
      },
    },
    "conference-booked": {
      title: "Conference booked",
      cause:
        "{guests} delegates for {nights} day(s), {roomsBlocked} rooms blocked.",
    },
    insolvent: {
      title: "Insolvent",
      cause: "{memo} could not be paid in full.",
    },
    space: {
      title: "{spaceId} turned guests away",
      cause: {
        closed: "{spaceId} is closed at this time.",
        unstaffed:
          "{spaceId} needs {staffRequired} staff but has {staffOnDuty}.",
        atCapacity:
          "{spaceId} reached capacity {capacity} and turned away {turnedAway} guests.",
        demand: "{spaceId} served current demand.",
      },
    },
  },
} as const;
