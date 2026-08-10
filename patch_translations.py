import json

def patch_en():
    with open("src/i18n/resources/en.ts", "r") as f:
        content = f.read()

    # 1. Add topbar.save and topbar.load
    content = content.replace(
        'language: "Language",',
        'language: "Language",\n    save: "Save",\n    load: "Load",'
    )

    # 2. Add telemetry keys in app
    content = content.replace(
        'main: "Hotel management",',
        'main: "Hotel management",\n    telemetry: {\n      command: "Command: {status}",\n      saves: "Saves committed: {count}"\n    },'
    )

    # 3. Add room.problems and room.detail
    room_additions = """states: {
      VacantClean: "vacant clean",
      VacantDirty: "vacant dirty",
      Occupied: "occupied",
      OutOfOrder: "out of order",
    },
    detail: {
      status: "Status",
      category: "Category",
      guest: "Guest",
      rate: "Rate",
      departing: "Departing",
      condition: "Condition",
      fittedOutAs: "Fitted out as",
      yearsSinceRefit: "Years since refit",
      openProblems: "Open problems",
      notPriced: "not priced",
      none: "none",
    },
    problems: {
      outOfService: "Out of service: {state}",
      needsCleaning: "Needs housekeeping: cleanliness {cleanliness}",
      renovating: "Shut for renovation",
      none: "Nothing outstanding in this room.",
    },"""
    content = content.replace("""states: {
      VacantClean: "vacant clean",
      VacantDirty: "vacant dirty",
      Occupied: "occupied",
      OutOfOrder: "out of order",
    },""", room_additions)

    with open("src/i18n/resources/en.ts", "w") as f:
        f.write(content)

def patch_de():
    with open("src/i18n/resources/de.ts", "r") as f:
        content = f.read()

    content = content.replace(
        'language: "Sprache",',
        'language: "Sprache",\n    save: "Speichern",\n    load: "Laden",'
    )

    content = content.replace(
        'main: "Hotelmanagement",',
        'main: "Hotelmanagement",\n    telemetry: {\n      command: "Befehl: {status}",\n      saves: "Gespeichert: {count}"\n    },'
    )

    room_additions = """states: {
      VacantClean: "frei und sauber",
      VacantDirty: "frei und unsauber",
      Occupied: "belegt",
      OutOfOrder: "außer Betrieb",
    },
    detail: {
      status: "Status",
      category: "Kategorie",
      guest: "Gast",
      rate: "Preis",
      departing: "Abreise",
      condition: "Zustand",
      fittedOutAs: "Ausstattung",
      yearsSinceRefit: "Jahre seit Renovierung",
      openProblems: "Offene Probleme",
      notPriced: "kein Preis",
      none: "kein Gast",
    },
    problems: {
      outOfService: "Außer Betrieb: {state}",
      needsCleaning: "Benötigt Reinigung: Sauberkeit {cleanliness}",
      renovating: "Wegen Renovierung geschlossen",
      none: "Nichts Auffälliges in diesem Zimmer.",
    },"""
    content = content.replace("""states: {
      VacantClean: "frei und sauber",
      VacantDirty: "frei und unsauber",
      Occupied: "belegt",
      OutOfOrder: "außer Betrieb",
    },""", room_additions)

    with open("src/i18n/resources/de.ts", "w") as f:
        f.write(content)

patch_en()
patch_de()
