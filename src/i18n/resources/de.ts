export const de = {
  app: {
    main: "Hotelverwaltung",
    telemetry: {
      command: "Befehl: {status}",
      saves: "Gespeicherte Spielstände: {count}",
    },
  },
  topbar: {
    status: "Statusleiste",
    cash: "Bargeld",
    monthProfit: "Monatsergebnis",
    occupancy: "Auslastung",
    reputation: "Ruf",
    warnings: "Warnungen",
    language: "Sprache",
    save: "Speichern",
    load: "Laden",
  },
  hotel: {
    status: "Hotelstatus",
    inspect: "Prüfen",
    serviceAreas: "Servicebereiche",
  },
  agent: {
    people: "Personen im Hotel",
    follow: "Folgen",
    detail: "Personendetail",
    identity: "Identität",
    statusLabel: "Status",
    position: "Position",
    route: "Route",
    status: {
      sleeping: "Schläft",
      breakfast: "Beim Frühstück",
      "out-in-city": "In der Stadt",
      "evening-drink": "Abends an der Bar",
      "waiting-check-in": "Wartet auf den Check-in",
      working: "Bei der Arbeit",
      "off-duty": "Dienstfrei",
      absent: "Abwesend",
    },
  },
  world: {
    goToProblem: "Gehe zu {title}: {cause}",
  },
  fnb: {
    title: "Speisen und Getränke",
    outlets: {
      breakfastRoom: "Frühstücksraum",
      bar: "Bar",
      roomService: "Zimmerservice",
      restaurant: "Restaurant",
    },
    metrics: {
      seats: "Sitzplätze: {seats}",
      covers: "Bewirtungen: {served}/{demand} (Kapazität {capacity})",
      waitlisted: "Warteliste: {waitlisted}",
      serviceLoad: "Serviceauslastung: {load}",
      kitchenLoad: "Küchenauslastung: {load}",
      averageWait: "Wartezeit: {minutes} Minuten",
      waste: "Abfall: {covers} Bewirtungen",
      foodCost: "Wareneinsatz: {cost}",
      limitedBy: "Begrenzt durch: {cause}",
    },
  },
  facility: {
    cause: {
      closed: "geschlossen",
      demand: "aktuelle Nachfrage",
      seating: "Sitzplätze",
      serviceStaff: "Servicepersonal",
      kitchenLine: "Küchenlinie",
      stock: "Bestand",
      miseEnPlace: "Mise en Place",
      transport: "Servicetransport",
      elevator: "Aufzugskapazität",
    },
  },
  expense: {
    revenue: "Erlöskorrektur",
    operating: "Betriebsausgabe",
    capital: "Investitionsausgabe",
    investing: "Anlageausgabe",
    borrowing: "Kreditaufnahme",
    equity: "Eigenkapitaltransaktion",
    financing: "Finanzierungsausgabe",
    settlement: "Begleichung einer Verbindlichkeit",
  },
  management: {
    skip: "Zum Verwaltungsinhalt springen",
    areas: "Verwaltungsbereiche",
    mainView: "Hauptansicht",
    hotel: "Hotel",
    staff: "Personal",
    finance: "Finanzen",
    revenue: "Erlöse",
    marketing: "Marketing & Vertrieb",
    market: "Markt",
    company: "Unternehmen",
    campaign: "Kampagne",
  },
  settings: {
    presentation: "Darstellungseinstellungen",
    accessibility: "Barrierefreiheit",
    textSize: "Textgröße",
    highContrast: "Hoher Kontrast",
    reducedMotion: "Weniger Bewegung",
    audio: "Audio",
    audioBus: {
      master: "Gesamt",
      music: "Musik",
      ambience: "Ambiente",
      ui: "Oberfläche",
      warnings: "Warnungen",
    },
  },
  help: {
    guestSatisfaction: "Gästezufriedenheit",
    region: "Hilfe zu {title}",
    why: "{title}: Warum?",
    empty: "Noch sind keine Einflussfaktoren verfügbar.",
    close: "Hilfe schließen",
    drivers: {
      businessDemand: "Geschäftsnachfrage {value} %",
      newSupply: "Neues Angebot +{rooms} Zimmer",
    },
  },
  tutorial: {
    region: "Geführter Einstieg",
    heading: "Erste Schritte",
    setRoomPrice: "Lege deinen ersten Zimmerpreis fest.",
    inspectBookings: "Prüfe die kommenden Buchungen.",
    hireHousekeeping: "Stelle eine Reinigungskraft ein.",
    complete: "Einführung abgeschlossen.",
    inspectAction: "Buchungen prüfen",
    dismiss: "Einführung ausblenden",
  },
  notifications: {
    region: "Benachrichtigungszentrale",
    heading: "Benachrichtigungen",
    autoPause: "Automatische Pause: {status}",
    grouped: "{count} gebündelte Benachrichtigungen",
    delegated: "Delegiert an {delegate}",
    critical: "Sofortige Aufmerksamkeit erforderlich",
    acknowledge: "Bestätigen",
    open: "{title} öffnen",
    openAction: "Öffnen",
    causes: {
      negativeLiquidity: "Bargeld abzüglich Verbindlichkeiten ist negativ",
    },
    severity: {
      info: "Info",
      notice: "Hinweis",
      warning: "Warnung",
      critical: "Kritisch",
    },
    pause: {
      idle: "inaktiv",
      pending: "ausstehend",
      accepted: "angewendet",
      rejected: "abgelehnt",
    },
  },
  room: {
    floor: "Etage {value}",
    fallback: "Zimmer",
    cleanliness: "Sauberkeit {value}",
    guestLabel: "Gast {code}",
    condition: {
      serviceable: "betriebsbereit",
      unserviceable: "nicht betriebsbereit",
    },
    renovation: {
      planning: "Planung",
      approval: "Freigabe",
      construction: "Bau",
      acceptance: "Abnahme",
      complete: "Wiedereröffnet",
    },
    detail: {
      status: "Status",
      occupancy: "Belegung",
      occupied: "Belegt",
      vacant: "Frei",
      category: "Kategorie",
      guest: "Gast",
      rate: "Rate",
      departing: "Abreise",
      condition: "Zustand",
      cleanliness: "Sauberkeit",
      renovationPhase: "Renovierungsphase",
      openProblems: "Offene Probleme",
      none: "keine",
      notPriced: "ohne Preis",
      fittedOutAs: "Ausgebaut als",
      yearsSinceRefit: "Jahre seit Umbau",
    },
    problems: {
      none: "Kein offenes Problem",
      needsCleaning: "Reinigung nötig ({cleanliness})",
      outOfService: "Außer Betrieb: {state}",
      renovating: "In Renovierung",
      renovation: {
        planning: "Planungsphase",
        approval: "Freigabephase",
        construction: "Bauphase",
        acceptance: "Abnahmeprüfung",
        complete: "Wiedereröffnet",
      },
    },
    states: {
      VacantClean: "frei und sauber",
      VacantDirty: "frei und unsauber",
      Occupied: "belegt",
      OutOfOrder: "außer Betrieb",
    },
  },
  alerts: { liquidityCritical: "Liquidität ist kritisch" },
  events: { guestCheckin: "Gast eingecheckt" },
  alert: {
    "housekeeping-backlog": {
      title: "Reinigungsrückstand",
      cause: "{rooms} Zimmer warten auf Reinigung",
    },
    "cleaning-stockout": {
      title: "Reinigungsmittel aufgebraucht",
      cause: "Die Zimmerreinigung kann keine Zimmer fertigstellen.",
    },
    "linen-short": {
      title: "Wäschemangel",
      cause: "Zimmer können erst nach Abschluss der Wäsche bezogen werden.",
    },
    security: {
      spaces: {
        title: "Sicherheit knapp",
        cause:
          "{inHouseGuests} im Haus, {eventGuests} bei Veranstaltungen, {openSpaces} Bereiche geöffnet.",
      },
    },
    "breakfast-queue": {
      title: "Frühstücksschlange",
      cause: "{queue} Gäste konnten nicht bedient werden.",
    },
    "fnb-wait": {
      title: "Verzögerung im Gastronomieservice",
      cause:
        "{outletId}: {waitlisted} warten bei Nachfrage {demand} und Kapazität {capacity}; durchschnittliche Wartezeit {averageWaitMinutes} Minuten.",
    },
    "spa-unstaffed": {
      title: "Spa unterbesetzt",
      cause:
        "{demand} Anfragen und {sold} Buchungen, aber nur {therapists} Therapeuten im Dienst.",
    },
    "security-short": {
      title: "Sicherheit knapp",
      cause:
        "{short} Wachkräfte fehlen; Basis {base}, Veranstaltungsgäste {eventGuests}, VIP-Stufe {vipLevel}.",
    },
    "staff-areas-crowded": {
      title: "Personalbereiche überfüllt",
      cause: "Die Umkleiden fassen nicht die gesamte Schicht zugleich.",
    },
    "construction-noise": {
      title: "Baulärm",
      cause: "{guests} Gäste sind während der Bauarbeiten im Haus.",
    },
    "long-check-in": {
      title: "Langer Check-in",
      cause: "{bookingId} wartete {waitedMinutes} Minuten an der Rezeption.",
    },
    "complaint-unanswered": { title: "Beschwerde unbeantwortet" },
    recovery: {
      noFrontDesk: "An der Rezeption ist niemand zur Genehmigung im Dienst.",
      insufficientCash:
        "Das Hotel hat {cashMinor}, der Nachlass kostet jedoch {costMinor}.",
    },
    "recovery-escalated": {
      title: "Wiedergutmachung eskaliert",
      cause:
        "Die Leitung darf {expenseMinor} für {bookingId} nicht genehmigen.",
    },
    "booking-refused": {
      title: "Buchungsanfrage abgelehnt",
      cause: {
        price: "{bookingId} wurde wegen eines zu hohen Preises abgelehnt.",
        inventory:
          "{bookingId} wurde abgelehnt, weil am {dateKey} kein Kontingent mehr frei war.",
      },
    },
    "conference-booked": {
      title: "Konferenz gebucht",
      cause:
        "{guests} Teilnehmer für {nights} Tag(e), {roomsBlocked} Zimmer blockiert.",
    },
    insolvent: {
      title: "Insolvent",
      cause: "Die {expense} konnte nicht vollständig bezahlt werden.",
    },
    space: {
      title: "{spaceId} musste Gäste abweisen",
      cause: {
        closed: "{spaceId} ist derzeit geschlossen.",
        unstaffed:
          "{spaceId} benötigt {staffRequired} Mitarbeiter, hat aber {staffOnDuty}.",
        atCapacity:
          "{spaceId} erreichte die Kapazität {capacity} und wies {turnedAway} Gäste ab.",
        demand: "{spaceId} bediente die aktuelle Nachfrage.",
      },
    },
  },
} as const;
