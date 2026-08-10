# 2D-Hotelansichten – Hotel Management Simulator

## 1. Grundaufbau der 2D-Hotelwelt

Das Hotel wird als **2D-isometrischer Gebäudeschnitt** dargestellt. Man blickt schräg von oben auf das Gebäude, sodass Bodenflächen, Räume, Flure und Personen gleichzeitig erkennbar sind.

Die Welt wird visuell über **PixiJS** dargestellt; die eigentliche Simulation läuft unabhängig davon. Die Hotelgrafik darf also niemals selbst entscheiden, ob ein Zimmer sauber oder ein Gast eingecheckt ist. Sie visualisiert den tatsächlichen Simulationszustand.

Eine mögliche technische Projektion:

```text
screenX = (gridX - gridY) × tileWidth / 2
screenY = (gridX + gridY) × tileHeight / 2
```

Im Implementierungsplan werden beispielsweise **64 × 32 Pixel große Isometrie-Tiles** verwendet. Das ist keine zwingende finale Grafikgröße, zeigt aber die beabsichtigte klassische 2:1-Isometrie.

---

## 2. Gesamtansicht des Hotels

Das ist die normale Spielansicht.

Das Gebäude steht zentral im Canvas und wird wie ein **aufgeschnittenes Puppenhaus** betrachtet.

```text
                    ┌──── 5. ETAGE ────────────┐
                   / Zimmer │ Zimmer │ Suite  /
                  /─────────┼────────┼────────/
                 / Flur        ● Gast        /
                └────────────────────────────┘

              ┌──── 4. ETAGE ───────────────┐
             / Zimmer │ Zimmer │ Zimmer    /
            /─────────┼────────┼───────────/
           /     Housekeeping →           /
          └───────────────────────────────┘

        ┌──── 3. ETAGE ─────────────────┐
       / Zimmer │ Zimmer │ Zimmer      /
      /─────────┼────────┼─────────────/
     /              ↑ Aufzug          /
    └─────────────────────────────────┘

  ┌──────── ERDGESCHOSS ────────────────────────┐
 / Lobby │ Rezeption │ Bar │ Restaurant │ Küche /
/ Gäste →→→        ↑ Warteschlange              /
└───────────────────────────────────────────────┘
```

Es geht ausdrücklich **nicht** darum, jedes Möbelstück als Simulationsobjekt zu behandeln. Die Ansicht soll vor allem operative Zustände verständlich machen.

Man erkennt auf einen Blick:

- wo Gäste sind,
- wo Mitarbeiter arbeiten,
- wo Warteschlangen entstehen,
- welche Zimmer problematisch sind,
- welche Einrichtungen ausgelastet sind,
- welche Wege belastet werden,
- welche Bereiche geschlossen sind,
- wo gebaut oder renoviert wird.

---

## 3. Das Gebäude selbst

Die Struktur ist nicht völlig frei baubar.

Jedes Hotel besitzt:

- Grundstück,
- Gebäudekörper,
- Etagen,
- feste Zugänge,
- Treppen,
- Aufzüge,
- Versorgungsschächte,
- nutzbare Module.

Das Hotel besitzt damit eine nachvollziehbare **architektonische Hülle**.

Innerhalb dieser Hülle können Räume verändert, zusammengelegt, geteilt oder umgenutzt werden.

Die 2D-Ansicht sollte deshalb eher wie ein **Hotelgrundriss in Isometrie** aussehen und nicht wie ein frei platzierbares Städtebau-Raster.

---

## 4. Etagenansicht

Der Spieler kann gezielt eine Etage auswählen.

Die anderen Etagen werden dann entweder ausgeblendet oder stark visuell zurückgenommen.

```text
         ZIMMER 401          ZIMMER 402
       ┌────────────┐      ┌────────────┐
      /    sauber  /      / schmutzig /
     /   ○ Gast   /      /    !       /
    └──────┬─────┘      └──────┬─────┘
           │                    │
═══════════╪════════ FLUR ══════╪══════════
           │
      ● Housekeeping
           →
                       ┌──────────┐
                       │ AUFZUG   │
                       │   ↑ ↓    │
                       └──────────┘
```

Diese Ansicht eignet sich insbesondere für:

- Zimmerprobleme,
- Housekeeping,
- Gästewege,
- Renovierungen,
- Lärmprobleme,
- Aufzugsauslastung,
- technische Störungen.

---

## 5. Gebäudeschnitt

Neben der einzelnen Etage gibt es einen **Gebäudeschnitt**.

Hier werden mehrere Etagen gleichzeitig gezeigt.

Der Vorteil ist, dass vertikale Zusammenhänge sichtbar werden.

Beispiel: Ein Restaurant im Erdgeschoss ist überlastet. Man sieht gleichzeitig:

- Gäste aus Etage 2,
- Gäste aus Etage 3,
- volle Aufzüge,
- die Warteschlange vor dem Frühstück,
- Servicepersonal,
- eventuell Room-Service-Verkehr.

Damit wird sichtbar:

> Das eigentliche Problem liegt möglicherweise nicht im Restaurant, sondern im Aufzug oder in der Küche.

---

## 6. Zimmeransicht

Zimmer sind direkt anklickbar.

Beim Hover sollte das Zimmer klar hervorgehoben werden. Beim Klick wird es selektiert und die Kamera kann leicht darauf fokussieren.

Der Inspector zeigt:

**Zimmer 407**

- Status
- aktueller Gast
- Preis
- Ausstattung
- Zustand
- letzte Renovierung
- offene Probleme

Visuell sollte gleichzeitig das ausgewählte Zimmer in der Welt markiert bleiben.

```text
┌─────────────────────────────┐
│ 407 · Doppelzimmer          │
│                             │
│ 🛏                            │
│       ○ Gast                │
│                             │
│ 🚿                 📺       │
│                             │
│ Zustand: sauber             │
└─────────────────────────────┘
```

Die Grafik muss nicht jedes Ausstattungsobjekt interaktiv machen. Ausstattung kann visuell repräsentiert werden, während die tieferen Daten im Inspector liegen.

---

## 7. Zimmerzustände

### Sauber

Das Zimmer befindet sich im normalen betriebsbereiten Zustand.

Keine Warnmarkierung.

### Schmutzig

Nach einem Check-out oder bei Reinigungsbedarf wird der Raum sichtbar als **dirty** markiert.

Housekeeping kann sichtbar auf dem Weg dorthin sein.

### Defekt

Ein technisches Problem wird direkt am Raum signalisiert.

```text
Zimmer 312
⚠ BAD / WASSER
```

### Geschlossen

Der Raum ist nicht für Gäste verfügbar.

Personen sollten ihn auch nicht normal benutzen.

### Im Umbau

Ein renoviertes Zimmer beziehungsweise ein renovierter Bereich muss als Baustelle erkennbar sein.

Der Spieler sieht dadurch auch, **welche Fläche gerade kein Geld verdient**.

### Überlastet

Dieser Zustand ist besonders für öffentliche Einrichtungen relevant.

Zum Beispiel Restaurant, Rezeption oder Bar.

Die Überlastung sollte primär durch die Situation selbst sichtbar werden und nicht nur durch ein rotes Symbol.

---

## 8. Lobbyansicht

Die Lobby ist einer der wichtigsten sichtbaren Bereiche.

Sie enthält beziehungsweise verbindet:

- Eingang,
- Orientierung,
- Rezeption,
- Check-in,
- Check-out,
- Gepäck,
- Concierge,
- Wartebereiche.

Später können hinzukommen:

- zusätzliche Reception Desks,
- Concierge Desk,
- Gepäcklager,
- Bell Service,
- Lobby Lounge,
- Business Corner,
- Self Check-in.

Die entscheidende visuelle Mechanik ist die **Warteschlange**.

```text
HOTEL EINGANG
     ↓

○   ○      ○
   Gäste kommen
       ↓

○ → ○ → ○ → ○ → ○
══════════════════
    REZEPTION

   👤     👤
   Desk 1 Desk 2

   Desk 3
   [unbesetzt]
```

Wenn nur zwei Receptionists arbeiten, darf die UI nicht einfach schreiben:

> Reception Capacity: 67 %

Man soll die Schlange tatsächlich sehen.

---

## 9. Warteschlangen

Warteschlangen sind **echte operative Objekte**.

Sie besitzen:

- Ankunftsrate,
- Servicekapazität,
- Wartezeit.

Sie können an mehreren Orten sichtbar werden:

### Rezeption

```text
○ ○ ○ ○ ○ ○ → Rezeption
```

### Restaurant

```text
○ ○ ○ ○ → Host Desk
```

### Aufzug

```text
○ ○ ○
○ ○
 ↑
[AUFZUG]
```

### Bar

Gäste warten sichtbar auf Bedienung.

Die Anzahl der dargestellten Personen muss nicht exakt der mathematischen Gesamtnachfrage entsprechen. Bei großen Mengen darf die Darstellung aggregieren.

---

## 10. Restaurantansicht

Das Restaurant ist kein einzelnes Icon.

Es besteht aus sichtbaren Funktionsbereichen.

```text
┌───────────────────────────────────────┐
│ RESTAURANT                            │
│                                       │
│ ○○     ○○      ○○      ○○            │
│ Tables                                │
│                                       │
│       ● Kellner →                     │
│                                       │
│ ○ ○ ○ → Host / Warteschlange          │
├───────────────────────────────────────┤
│ KÜCHE                                 │
│ Vorbereitung → warme Küche → Ausgabe  │
│      ● Koch        ● Koch             │
└───────────────────────────────────────┘
```

Beim Anklicken sollten folgende Informationen sichtbar werden:

- Sitzplätze,
- Auslastung,
- aktuelle Gäste,
- Personal,
- Wartezeit,
- Umsatz,
- Küchenengpass.

Der entscheidende Punkt ist, dass **Restaurant und Küche räumlich zusammenhängen**.

Ein Restaurant mit 180 Plätzen und einer Küche für nur 60 Gäste soll visuell wie ein Engpass wirken.

---

## 11. Küchenansicht

Im ausgebauten Spiel kann die Küche mehrere funktionale Module besitzen:

- Vorbereitung,
- warme Küche,
- kalte Küche,
- Patisserie,
- Spülküche,
- Kühlhaus,
- Tiefkühllager,
- Trockenlager,
- Room-Service-Staging.

Nicht jede Station muss schon im normalen Zoom vollständig beschriftet sein.

Beim Hineinzoomen können die jeweiligen Bereiche erscheinen.

```text
Restaurant
68 % belastet

Service
81 % belastet

Küche
94 % belastet
        ↑
        eigentlicher Engpass
```

---

## 12. Bar und Lounge

Bars müssen ebenfalls als lebendige Servicebereiche erscheinen.

Man sieht:

- Bartresen,
- Sitz- beziehungsweise Stehbereiche,
- Gäste,
- Bartender/Service,
- unbelegte Arbeitsplätze,
- Wartende.

```text
○ ○ ○ ○
Gäste

████████████ BAR ███████████

      ● Bartender

  [zweite Station unbesetzt]
```

Je länger Gäste warten, desto offensichtlicher wird das operative Problem.

---

## 13. Aufzüge

Aufzüge sind keine Animation ohne Bedeutung.

Sie besitzen in der Simulation:

- Kapazität,
- Fahrzeit,
- Warteschlange,
- Zustand.

```text
Etage 5     ○ ○      [↑]
                       │
Etage 4                │
                       │
Etage 3     ○ ○ ○    [●]
                       │
Etage 2                │
                       │
Lobby       ○ ○ ○ ○ ○ [ ]
```

Ein defekter Aufzug steht **sichtbar still**.

Er sollte nicht weiter animiert werden, während irgendwo nur ein Warnsymbol erscheint.

---

## 14. Treppen

Treppen bilden alternative vertikale Wege.

Sie müssen im Navigationsnetz berücksichtigt werden.

```text
Zimmer
  ↓
Flur
 ↙  ↘
Treppe Aufzug
```

Treppen sind nicht für alle Gäste gleich attraktiv.

Dadurch kann beispielsweise ein kaputter Aufzug besonders starke Auswirkungen auf ältere Gäste, Gäste mit Gepäck oder bestimmte Komfortsegmente haben.

Die genaue Segmentgewichtung ist visuell noch nicht abschließend festgelegt.

---

## 15. Housekeeping-Ansicht

Housekeeping sollte besonders stark über die Welt lesbar sein.

Zimmer erzeugen Aufgaben durch:

- Check-out,
- Stayover Cleaning,
- Sonderreinigung,
- Turndown,
- Inspektion.

```text
401  ✓
402  ✓
403  DIRTY
404  DIRTY
405  VIP · PRIORITÄT
406  DIRTY
407  CLEANING
408  ✓

             ● HK
              →
            Zimmer 405
```

Die konkrete Symbolsprache kann später festgelegt werden. Entscheidend ist die Sichtbarkeit der Zustände.

---

## 16. Personenansicht

Die Kamera unterstützt **Fokus auf Person**.

Klickt man einen sichtbaren Gast oder Mitarbeiter an, verfolgt beziehungsweise zentriert die Kamera ihn.

```text
Anna Weber — Housekeeping

Status
Zimmer 407 reinigen

Position
4. Etage

Route
Servicebereich
    ↓
Aufzug
    ↓
4. Etage
    ↓
407
```

Die sichtbare Person ist eine Darstellung des Simulationsagenten und nicht eine unabhängige Spielfigur.

---

## 17. Gäste

Gäste sollten als kleine, gut unterscheidbare Agenten sichtbar sein.

Nicht jeder Gast benötigt permanente Textlabels.

Aus Verhalten und Position kann man bereits viel erkennen:

- Gäste kommen an,
- stehen an der Rezeption,
- gehen zum Aufzug,
- gehen zum Zimmer,
- besuchen Restaurant oder Bar,
- verlassen das Hotel.

Dadurch entstehen **sichtbare Gästeflüsse**.

Das Hotel bekommt Leben, ohne zu einem Charakter-RPG zu werden.

---

## 18. Personal

Dasselbe gilt für Mitarbeiter.

Zum Beispiel:

- Receptionist steht am Desk,
- Housekeeper bewegt sich zwischen Zimmern,
- Kellner bewegt sich zwischen Restaurant und Servicebereich,
- Koch arbeitet in der Küche,
- Techniker bewegt sich zu einer Störung.

Fehlendes oder untätiges Personal soll sichtbar sein.

```text
Reception Desk 1  ●
Reception Desk 2  ●
Reception Desk 3  —
Reception Desk 4  —
```

Damit versteht der Spieler die Schlange sofort.

---

## 19. Problemfokus

Die Kamera besitzt **Fokus auf Problem**.

Klickt man beispielsweise auf:

> ⚠ Housekeeping backlog  
> 6 Zimmer warten auf Reinigung

springt beziehungsweise bewegt sich die Kamera zum betroffenen Bereich.

Dort werden die sechs problematischen Zimmer hervorgehoben.

Das gleiche Prinzip gilt für:

- kaputten Aufzug,
- Restaurantengpass,
- überlastete Rezeption,
- technische Störung,
- Bauproblem.

Das Notification-System und die Hotelwelt werden dadurch direkt miteinander verbunden.

---

## 20. Servicebereich-Overlay

**Servicebereiche** können hervorgehoben werden.

Normal:

```text
Hotel komplett dargestellt
```

Service-Overlay:

```text
Gästebereiche          zurückgenommen
Servicekorridore       hervorgehoben
Küche                  hervorgehoben
Lager                  hervorgehoben
Housekeeping           hervorgehoben
Technik                hervorgehoben
Aufzüge                 sichtbar
```

Damit lassen sich operative Logistikprobleme erkennen.

Gerade später bei Room Service, großen Restaurants, Events, Housekeeping und Engineering wird diese Ansicht wichtig.

---

## 21. Renovierungs- und Bauansicht

Die normale Hotelstruktur bleibt erhalten, aber Räume können:

- umgenutzt,
- zusammengelegt,
- geteilt,
- renoviert,
- technisch nachgerüstet

werden.

Ein Bauprojekt durchläuft:

**Planung → Angebot → Genehmigung → Bau → Abnahme → Wiedereröffnung**

In der 2D-Welt sollte deshalb der Raum sichtbar seinen Zustand wechseln.

```text
Zimmer 401   NORMAL

      ↓ Renovierung startet

Zimmer 401
╱╱╱ BAUSTELLE ╱╱╱
geschlossen

      ↓

Zimmer 401
NEU RENOVIERT
```

Die exakte grafische Baustellendarstellung ist eine Designentscheidung; der Status „im Umbau“ ist spezifiziert.

---

## 22. Tag- und Nacht-Darstellung

Die Hotelansicht verändert sich mit der Tageszeit.

Dazu gehören:

- veränderte Beleuchtung,
- veränderte Aktivität.

### Morgens

- Frühstück sehr aktiv,
- viele Check-outs,
- Housekeeping startet.

### Nachmittag

- Check-ins,
- Lobbybelastung.

### Abends

- Restaurant,
- Bar,
- Veranstaltungen.

### Nacht

- weniger Aktivität,
- beleuchtete Zimmer,
- eventuell Nachtpersonal.

Es ist also nicht nur ein dunkler Farbfilter. Auch die **sichtbaren Agentenströme ändern sich**.

---

## 23. Zoomstufen

### Weit herausgezoomt

Man sieht vor allem:

- Etagenstruktur,
- Raumstatus,
- große Warteschlangen,
- wichtige Störungen,
- Aktivitätsschwerpunkte.

Einzelne Agenten werden reduziert.

### Normaler Zoom

Das ist die Hauptspielstufe.

Man erkennt:

- Gäste,
- Mitarbeiter,
- Räume,
- Wege,
- Warteschlangen,
- Einrichtungen.

### Nahzoom

Hier werden mehr Details sichtbar:

- einzelne Zimmer,
- Raumfunktion,
- Agenten,
- Arbeitsplätze,
- feinere Statusinformationen.

Details dürfen beim Herauszoomen vereinfacht werden.

---

## 24. Begrenzung der sichtbaren Menschen

Nicht jeder simulierte Gast muss gleichzeitig gezeichnet werden.

Nur eine begrenzte Zahl von Personen wird vollständig gerendert. Nicht sichtbare Nachfrage bleibt aggregiert.

Der Performance-Plan betrachtet bis zu **500 sichtbare Agenten** als relevante Größenordnung.

Das bedeutet: 1.000 Gäste können simuliert werden, während nur ein sinnvoll ausgewählter Teil davon als einzelne Figur erscheint.

Die Wirtschaftssimulation bleibt trotzdem identisch.

---

## 25. Navigation der Kamera

Vorgesehen sind:

- **Pan**
- **Zoom**
- **Fokus auf Problem**
- **Fokus auf Raum**
- **Fokus auf Person**

Daraus ergibt sich praktisch:

### Linke Maustaste / Touch

Räume oder Personen auswählen.

### Drag

Hotel verschieben.

### Mausrad / Pinch

Zoom.

### Benachrichtigung anklicken

Zum Problem springen.

### Etage auswählen

Andere Etagen ausblenden beziehungsweise zurücknehmen.

Die konkrete Tastenbelegung kann später final festgelegt werden.

---

## 26. Permanente Top-Bar

Während der Hotelansicht bleibt oben ständig sichtbar:

**Datum · Uhrzeit · Geschwindigkeit · Cash · Monats-P/L · Auslastung · Reputation · Warnungen**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 15.03.1991   14:32   ▶ 2× │ DM 482.340 │ +18.420 │ OCC 82% │ ★ 74 │
└─────────────────────────────────────────────────────────────────────┘

                         HOTEL
                         ↓
                    Isometrische Welt
```

Damit muss der Spieler für die wichtigsten Informationen die Welt nicht verlassen.

---

## 27. Rauminspector

Zusätzlich zur Pixi-Welt gibt es einen **React-basierten Room Inspector**.

```text
                         ┌──────────────────────┐
                         │ ZIMMER 407           │
                         │ Doppelzimmer         │
                         │                      │
      HOTEL              │ Belegt               │
                         │ Gast: M. Schneider   │
                         │ Rate: DM 185         │
                         │ Zustand: 87 %        │
                         │ Sauberkeit: sauber   │
                         │                      │
                         │ Problem: —           │
                         │                      │
                         │ [Details öffnen]     │
                         └──────────────────────┘
```

Der Canvas ist damit nicht die einzige Interaktionsmöglichkeit.

---

## 28. Barrierefreie Parallelansicht

Pixi darf **nicht die einzige Möglichkeit sein, das Hotel zu bedienen**.

Dafür existiert eine semantische DOM-Parallelansicht.

```text
Hotelstatus

Etage 1
  Zimmer 101 — Vacant Clean     [Inspect]
  Zimmer 102 — Vacant Dirty     [Inspect]
  Zimmer 103 — Occupied         [Inspect]

Etage 2
  ...
```

Dadurch bleiben wichtige Funktionen:

- tastaturbedienbar,
- Screenreader-kompatibel,
- unabhängig von Pixel-Hitboxes erreichbar.

---

## 29. Spätere sichtbare Hotelbereiche

Die erste Version enthält mindestens:

- Zimmer,
- Rezeption,
- Housekeeping,
- Frühstücksrestaurant,
- Küche,
- Personal,
- Wartung.

Spätere Ausbaustufen können ergänzen:

- Bar,
- Wellness,
- Fitness,
- Konferenzräume,
- Room Service,
- Engineering,
- Staff Areas,
- Parken,
- Security.

Die gleiche isometrische Darstellungslogik bleibt bestehen.

---

## 30. Zentrale visuelle Regel

Die wichtigste Regel der gesamten 2D-Hotelansicht lautet:

> **Ein operatives Problem muss möglichst als physische Situation im Hotel sichtbar werden.**

Nicht nur:

> Rezeption: 123 % Auslastung

sondern:

**sichtbare Schlange + besetzte Desks + unbesetzte Arbeitsplätze.**

Nicht nur:

> Aufzug: Störung

sondern:

**stehender Aufzug + wartende Gäste + veränderte Personenwege.**

Nicht nur:

> Housekeeping Backlog: 6

sondern:

**sechs schmutzige Zimmer + Housekeeper auf der Etage + Gäste, deren Zimmer noch nicht fertig ist.**

Nicht nur:

> Restaurant Capacity Problem

sondern:

**freie Tische + trotzdem wartende Gäste + überlastete Küche.**

Genau dadurch unterscheidet sich die 2D-Hotelwelt von einem hübschen Hintergrund für ein Management-Dashboard.

---

## 31. Zusammenfassung der 2D-Hotelansichten

Die eigentlichen 2D-Hotelansichten sind:

**Gesamthotel → Gebäudeschnitt → einzelne Etage → Raumfokus → Personenfokus → Problemfokus → Service-Overlay → Bau-/Renovierungszustand**

Alle Ansichten arbeiten mit:

- Pan,
- Zoom,
- dynamischer Tageszeit,
- sichtbaren Simulationszuständen,
- direkter Verbindung zwischen Welt und Managementoberfläche.

Noch nicht verbindlich festgelegt sind unter anderem:

- finale Sprite-Größe,
- exakter Kamerawinkel außerhalb der Isometrieformel,
- Wandhöhe,
- Fassadendarstellung,
- konkrete Farbpalette,
- genaue Position des Inspectors,
- endgültige Maus- und Tastenkürzel.

Diese Punkte sollten daher nicht als bereits beschlossen behandelt werden.
