import re

# 1. Update PixiHotelScene.ts narrowing fix
with open("src/render/PixiHotelScene.ts", "r") as f:
    content = f.read()

draw_building_search = """      let tile = tileMap.get(placement.id);

      const requiresRebuild = !tile || tile.x !== placement.x || tile.y !== placement.y;

      if (requiresRebuild) {
        if (tile) {
          this.tiles.removeChild(tile).destroy();
        }
        tile = new Graphics()
          .moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          // Without an edge, neighbouring rooms in the same state melt into one
          // slab and the building stops reading as a set of rooms.
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
        tile.position.set(placement.x, placement.y);
        tile.label = placement.id;

        // The same stable id the semantic DOM control uses, so clicking the
        // world and clicking the room list are the same action.
        tile.eventMode = "static";
        tile.cursor = "pointer";
        tile.on("pointertap", () => this.onSelectRoom?.(placement.id));
        // Hover is a pure presentation state: it lights the tile the pointer is
        // over without asking React to redraw the page for a mouse move.
        tile.on("pointerover", () => {
          this.hoveredId = placement.id;
          tile!.tint = HOVER_TINT;
        });
        tile.on("pointerout", () => {
          if (this.hoveredId === placement.id) this.hoveredId = null;
          tile!.tint = LIGHT_TINT[lightingFor(this.lastModel?.minuteOfDay ?? 720)];
        });

        this.tiles.addChild(tile);
      } else {
        // Update existing tile
        tile.clear();
        tile.moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
      }

      tile.tint = tint;
      if (this.hoveredId === placement.id) tile.tint = HOVER_TINT;"""

draw_building_replace = """      let tile = tileMap.get(placement.id);

      const requiresRebuild = !tile || tile.label == null || tile.eventMode !== "static";

      if (requiresRebuild) {
        if (tile) {
          this.tiles.removeChild(tile).destroy();
        }
        tile = new Graphics()
          .moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          // Without an edge, neighbouring rooms in the same state melt into one
          // slab and the building stops reading as a set of rooms.
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });
        tile.position.set(placement.x, placement.y);
        tile.label = placement.id;

        // The same stable id the semantic DOM control uses, so clicking the
        // world and clicking the room list are the same action.
        tile.eventMode = "static";
        tile.cursor = "pointer";
        tile.on("pointertap", () => this.onSelectRoom?.(placement.id));
        // Hover is a pure presentation state: it lights the tile the pointer is
        // over without asking React to redraw the page for a mouse move.
        tile.on("pointerover", () => {
          this.hoveredId = placement.id;
          if (tile) tile.tint = HOVER_TINT;
        });
        tile.on("pointerout", () => {
          if (this.hoveredId === placement.id) this.hoveredId = null;
          if (tile) tile.tint = LIGHT_TINT[lightingFor(this.lastModel?.minuteOfDay ?? 720)];
        });

        this.tiles.addChild(tile);
      } else {
        // Update existing tile
        const safeTile = tile!;
        safeTile.clear();
        safeTile.moveTo(0, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, 0)
          .lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
          .lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
          .closePath()
          .fill(STATE_COLOURS[placement.state] ?? 0x888888)
          .stroke({ width: 1, color: 0x0e1114, alignment: 1 });

        // If x or y differs, update position without full rebuild.
        if (safeTile.x !== placement.x || safeTile.y !== placement.y) {
          safeTile.position.set(placement.x, placement.y);
        }
      }

      // Safe to assign because `tile` is guaranteed to be constructed or existing by here.
      const safeTile = tile!;
      safeTile.tint = tint;
      if (this.hoveredId === placement.id) safeTile.tint = HOVER_TINT;"""

content = content.replace(draw_building_search, draw_building_replace)

# Narrow labels during cleanup
cleanup_search = """    // Remove stale tiles
    for (let i = this.tiles.children.length - 1; i >= 0; i--) {
      const child = this.tiles.children[i];
      if (!activeIds.has(child.label)) {
        this.tiles.removeChild(child).destroy();
      }
    }

    const tileMap = new Map(this.tiles.children.map(c => [c.label, c as Graphics]));"""

cleanup_replace = """    // Remove stale tiles
    for (let i = this.tiles.children.length - 1; i >= 0; i--) {
      const child = this.tiles.children[i];
      if (typeof child.label !== "string" || !activeIds.has(child.label)) {
        this.tiles.removeChild(child).destroy();
      }
    }

    const tileMap = new Map(this.tiles.children.map(c => [c.label as string, c as Graphics]));"""
content = content.replace(cleanup_search, cleanup_replace)

with open("src/render/PixiHotelScene.ts", "w") as f:
    f.write(content)

# 2. Update HotelView roomProblems and rates formatting
with open("src/ui/HotelView.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'problems.push({ key: "room.problems.outOfService", values: { state: humanRoomState(room.state) } });',
    'problems.push({ key: "room.problems.outOfService", values: { state: "room.states." + room.state } });'
)

content = content.replace(
    'formatDm(rateMinor)',
    'formatDm(rateMinor, props.locale ?? "en-GB")'
)

with open("src/ui/HotelView.tsx", "w") as f:
    f.write(content)

# 3. Update TopBar to fallback to English instead of just displaying the key
with open("src/ui/TopBar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '{translateGame(locale, "topbar.save" as any) || "Save"}',
    '{translateGame(locale, "topbar.save" as any) === "topbar.save" ? "Save" : (translateGame(locale, "topbar.save" as any) || "Save")}'
)

content = content.replace(
    '{translateGame(locale, "topbar.load" as any) || "Load"}',
    '{translateGame(locale, "topbar.load" as any) === "topbar.load" ? "Load" : (translateGame(locale, "topbar.load" as any) || "Load")}'
)

with open("src/ui/TopBar.tsx", "w") as f:
    f.write(content)

# 4. Update GameSimulation to add localization keys for alerts
with open("src/game/simulation/GameSimulation.ts", "r") as f:
    content = f.read()

content = content.replace(
    'title: "Housekeeping backlog",\n        cause: `${dirty} rooms waiting for cleaning`,',
    'title: "alert.housekeeping-backlog.title",\n        cause: `${dirty}`, // Store data instead of prose'
)

import re
alert_matches = re.finditer(r'pushAlert\(\{\s*id:\s*"([^"]+)",\s*severity:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*cause:\s*([^,]+)', content)
for match in alert_matches:
    full_match = match.group(0)
    id_val = match.group(1)
    severity = match.group(2)
    title = match.group(3)
    cause = match.group(4)
    if title != id_val + ".title":
        new_title = id_val + ".title"
        new_cause = cause
        if cause.startswith('"') and cause.endswith('"'):
            new_cause = '"' + id_val + '.cause"'
        content = content.replace(
            full_match,
            f'pushAlert({{\n        id: "{id_val}",\n        severity: "{severity}",\n        title: "{new_title}",\n        cause: {new_cause}'
        )

with open("src/game/simulation/GameSimulation.ts", "w") as f:
    f.write(content)

# 5. Update en.ts and de.ts with all the missing explicit keys
with open("src/i18n/resources/en.ts", "r") as f:
    content = f.read()

# Add keys
missing_keys = """  "alert.housekeeping-backlog.title": "Housekeeping backlog",
  "alert.housekeeping-backlog.cause": "{value} rooms waiting for cleaning",
  "alert.cleaning-stockout.title": "Cleaning supplies exhausted",
  "alert.cleaning-stockout.cause": "No cleaning units in stock",
  "alert.linen-short.title": "Linen shortage",
  "alert.linen-short.cause": "Insufficient clean linen",
  "alert.security.spaces.title": "Security short",
  "alert.breakfast-queue.title": "Breakfast queue",
  "alert.room-service-late.title": "Room service delayed",
  "alert.spa-unstaffed.title": "Spa unstaffed",
  "alert.spa-unstaffed.cause": "No therapists scheduled",
  "alert.security-short.title": "Security short",
  "alert.staff-areas-crowded.title": "Staff areas crowded",
  "alert.staff-areas-crowded.cause": "Staff capacity exceeded",
  "alert.construction-noise.title": "Construction noise",
  "alert.long-check-in.title": "Long check-in",
  "alert.complaint-unanswered.title": "Complaint left unanswered",
  "alert.recovery-escalated.title": "Recovery escalated",
  "alert.booking-refused.title": "Booking request refused",
  "alert.conference-booked.title": "Conference booked",
  "alert.insolvent.title": "Insolvent",
  "alert.space.title": "Space turned guests away",
  "topbar.save": "Save",
  "topbar.load": "Load",
  app: {
    main: "Hotel management",
    telemetry: {
      command: "Command: {status}",
      saves: "Saves committed: {count}"
    },
  },"""

content = content.replace(
    'app: {\n    main: "Hotel management",\n    telemetry: {\n      command: "Command: {status}",\n      saves: "Saves committed: {count}"\n    },\n  },',
    missing_keys
)

content = content.replace('    save: "Save",\n    load: "Load",', '')

with open("src/i18n/resources/en.ts", "w") as f:
    f.write(content)

with open("src/i18n/resources/de.ts", "r") as f:
    content = f.read()

missing_keys_de = """  "alert.housekeeping-backlog.title": "Reinigungsrückstand",
  "alert.housekeeping-backlog.cause": "{value} Zimmer warten auf Reinigung",
  "alert.cleaning-stockout.title": "Reinigungsmittel aufgebraucht",
  "alert.cleaning-stockout.cause": "Keine Reinigungseinheiten vorrätig",
  "alert.linen-short.title": "Wäschemangel",
  "alert.linen-short.cause": "Unzureichend saubere Wäsche",
  "alert.security.spaces.title": "Sicherheit knapp",
  "alert.breakfast-queue.title": "Frühstücksschlange",
  "alert.room-service-late.title": "Zimmerservice verspätet",
  "alert.spa-unstaffed.title": "Spa unterbesetzt",
  "alert.spa-unstaffed.cause": "Keine Therapeuten eingeplant",
  "alert.security-short.title": "Sicherheit knapp",
  "alert.staff-areas-crowded.title": "Personalbereiche überfüllt",
  "alert.staff-areas-crowded.cause": "Personalkapazität überschritten",
  "alert.construction-noise.title": "Baulärm",
  "alert.long-check-in.title": "Langer Check-in",
  "alert.complaint-unanswered.title": "Beschwerde unbeantwortet",
  "alert.recovery-escalated.title": "Wiedergutmachung eskaliert",
  "alert.booking-refused.title": "Buchungsanfrage abgelehnt",
  "alert.conference-booked.title": "Konferenz gebucht",
  "alert.insolvent.title": "Insolvent",
  "alert.space.title": "Räumlichkeit wies Gäste ab",
  "topbar.save": "Speichern",
  "topbar.load": "Laden",
  app: {
    main: "Hotelmanagement",
    telemetry: {
      command: "Befehl: {status}",
      saves: "Gespeichert: {count}"
    },
  },"""

content = content.replace(
    'app: {\n    main: "Hotelmanagement",\n    telemetry: {\n      command: "Befehl: {status}",\n      saves: "Gespeichert: {count}"\n    },\n  },',
    missing_keys_de
)

content = content.replace('    save: "Speichern",\n    load: "Laden",', '')

with open("src/i18n/resources/de.ts", "w") as f:
    f.write(content)
