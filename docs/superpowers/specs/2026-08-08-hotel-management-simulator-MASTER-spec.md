# Hotel Management Simulator – MASTER Game & Systems Specification

**Datum:** 2026-08-08  
**Status:** Vollständige konsolidierte Designspezifikation  
**Plattform:** Browser  
**Client:** React + TypeScript  
**Spielmodus:** Singleplayer  
**Startjahr:** 1991  
**Historischer Modus:** Alternative, systemisch entstehende Geschichte  
**Gegenwarts-Meilenstein:** 2026, danach optional Endless  
**Darstellung:** 2D-isometrisches Hotel + Management-Dashboard  
**Bauprinzip:** Modulare Umnutzung und Erweiterung innerhalb vorgegebener Gebäudestrukturen  
**Markenwelt:** Reale Städte, ausschließlich fiktive Hotels, Hotelmarken, Unternehmen und Figuren  

---

## 0. Zweck dieser Master-Spezifikation

Dieses Dokument ist die verbindliche Produkt-, Gameplay-, Simulations- und Architekturgrundlage für den Hotel-Management-Simulator.

Es ersetzt die frühere Kurzfassung und integriert:

- alle im Chat freigegebenen Grundentscheidungen,
- die vollständige operative Hotelwirtschaft,
- die alternative Weltwirtschaft,
- die Langzeit-Kampagne von 1991 bis in eine alternative Gegenwart,
- die technischen Determinismus-, Worker-, Save- und Content-Regeln,
- die Original-Paritätsanforderungen,
- die 54 später explizit identifizierten Vollständigkeitspunkte,
- sowie die daraus abgeleiteten Non-Goals und Akzeptanzkriterien.

Dieses Dokument soll verhindern, dass spätere Implementierungspläne nur die Vision, aber nicht die notwendigen Systemregeln abdecken.

Jedes größere System ist deshalb in vier Ebenen beschrieben:

1. **Spielerentscheidung:** Was entscheidet der Spieler?
2. **Simulationsregel:** Was berechnet das Spiel daraus?
3. **Feedback:** Wie erkennt der Spieler Ursache und Wirkung?
4. **Skalierung:** Wie verändert sich das System vom einzelnen Hotel bis zur Hotelgruppe?

---

# Teil I – Produktvision und verbindliche Leitentscheidungen

## 1. Produktvision

Der Simulator ist ein eigenständiger geistiger Nachfolger klassischer Hotelmanagement-Spiele der frühen 1990er Jahre.

Der Spieler beginnt 1991 als Eigentümer und operativer Manager eines kleinen Hotels und kann sich über Jahrzehnte zu einem internationalen Hotelkonzern entwickeln.

Der Fokus bleibt immer auf Hotelmanagement.

Selbst im Late Game entsteht wirtschaftlicher Erfolg letztlich aus:

- guten Zimmerprodukten,
- passender Preisgestaltung,
- funktionierendem Service,
- zufriedenen Gästen,
- effizientem Personal,
- sinnvoller Infrastruktur,
- kontrollierten Kosten,
- und guten Standortentscheidungen.

Die Welt ist keine statische Kulisse.

Tourismus, Arbeitsmarkt, Immobilien, Technologie, Vertriebskanäle, Unternehmen, Verkehr, Regulierung und Konsum entwickeln sich systemisch weiter.

Der Spieler kann diese Entwicklung lokal und später regional oder international mitbeeinflussen.

Ab 1991 gibt es keine fest vorgeschriebene Zukunft.

Historische Entwicklungen liefern nur plausible Ausgangsbedingungen und mögliche Pfade.

Technologien, Krisen, Marktführer und wirtschaftliche Zentren können früher, später, anders oder gar nicht entstehen.

---

## 2. Verbindliche Designpfeiler

### 2.1 Hotelmanagement bleibt der Kern

Alle Meta-Systeme müssen auf den Hotelbetrieb zurückwirken.

Beispiele:

- Inflation verändert Einkauf und Löhne.
- Technologie verändert Gästewünsche und Vertrieb.
- neue Bahnverbindungen verändern Nachfrage.
- Regulierung verändert Personal- und Baukosten.
- Konzernwachstum verändert Einkaufsmacht und Delegation.

Kein Metasystem darf zu einem losgelösten Börsen- oder Weltwirtschaftsspiel werden.

### 2.2 1991 bis alternative Gegenwart

Die Karriere startet am 1. Januar 1991.

Der normale Langzeit-Meilenstein ist das jeweilige Gegenwartsjahr des Produkts; für diese Spezifikation ist das 2026.

Nach Erreichen 2026 kann die Partie optional als Endless-Simulation weiterlaufen.

Der Übergang in spätere Jahrzehnte wird nicht durch fixe Jahres-Trigger bestimmt, sondern durch:

- Technologieverfügbarkeit,
- Verbreitung,
- Gästewünsche,
- gesellschaftliche Trends,
- wirtschaftliche Rahmenbedingungen,
- Infrastruktur,
- und Investitionsentscheidungen.

### 2.3 Hybrid-Zeitmodell

Der Hotelbetrieb wirkt in Echtzeit lebendig.

Der Spieler kann jederzeit pausieren.

Verfügbare Spielgeschwindigkeiten:

- Pause,
- 1×,
- 2×,
- 4×,
- sehr schnell / strategischer Fast-Forward.

Operative Ereignisse laufen innerhalb von Tagen und Stunden.

Strategische Auswertungen erfolgen regelmäßig, insbesondere zum Monatsabschluss.

### 2.4 2D-isometrische Hotelwelt + Management-Dashboard

Der Spieler beobachtet sichtbare Gäste, Personal, Warteschlangen, Zimmerzustände und Einrichtungen in einer isometrischen Hotelansicht.

Tiefe Entscheidungen werden über Management-Ansichten getroffen.

Beide Ebenen müssen dieselbe Simulation zeigen.

Eine überlastete Rezeption darf nicht nur als Kennzahl existieren; sie muss als Warteschlange sichtbar werden.

### 2.5 Modularer Ausbau statt freier Architektur-Sandbox

Gebäude besitzen eine feste strukturelle Hülle.

Der Spieler kann:

- Flächen umnutzen,
- Module zusammenlegen,
- Module teilen,
- Etagen freischalten,
- Gebäudeteile anbauen, sofern der Standort dies erlaubt,
- Bereiche renovieren,
- Technik nachrüsten.

Der Spieler baut nicht jede einzelne Wand frei.

### 2.6 Vom Einzelhotel zur internationalen Gruppe

Die Rolle verändert sich:

- Anfang: operativer Hotelmanager,
- danach: Eigentümer,
- später: Unternehmer,
- Late Game: Konzernchef.

Neue Hotels und Städte werden über Kapital, Reputation, Managementkapazität und Marktbedingungen zugänglich.

### 2.7 Nur Singleplayer

Nicht im Scope:

- Online-Multiplayer,
- lokaler Hotseat,
- kompetitive Mehrspieler-Ligen.

Konkurrenz entsteht ausschließlich durch simulierte KI-Unternehmen.

### 2.8 Easy to learn, hard to master

Jedes komplexe System bietet:

- verständliche Defaults,
- Automatisierung,
- Ursachenanzeigen,
- optional tiefe Detailsteuerung.

Einsteiger können delegieren.

Experten können detailliert optimieren.

### 2.9 Retro-Modern

Die visuelle Identität startet mit frühem 90er-Geschäfts- und Hotelcharme.

Mit der Welt verändert sich:

- Technik,
- Büroästhetik,
- Hotelmöblierung,
- Uniformen,
- Kommunikationsmittel,
- Management-UI-Optik.

Die Bedienlogik bleibt über Jahrzehnte stabil.

### 2.10 Eigenständiger geistiger Nachfolger

Das Spiel übernimmt keine geschützten Originalassets.

Es verwendet:

- eigenen Titel,
- eigene Hotelmarken,
- eigene Figuren,
- eigene Grafiken,
- eigene Texte,
- eigene Soundwelt.

Das Original dient nur als historische Designreferenz für Mechanik-Parität.

### 2.11 Reale Städte, fiktive Hotels

Städte können real sein.

Hotelketten, Häuser, Marken und direkte Konkurrenten sind fiktiv.

Standortfaktoren dürfen reale Eigenschaften abstrahiert modellieren.

### 2.12 Freie Karriere mit Story-Meilensteinen

Es gibt keine lineare Missionskette.

Meilensteine geben Orientierung, zum Beispiel:

- erstes profitables Jahr,
- erste Renovierung,
- erster Vier-Sterne-Standard,
- zweites Hotel,
- erste eigene Marke,
- erste internationale Expansion,
- Konzernzentrale,
- Marktführerschaft.

### 2.13 Alternative Geschichte

Nach dem Startzustand 1991 gibt es keine garantierten historischen Ereignisse.

Beispielsweise darf eine bestimmte Finanzkrise nicht einfach an ein fixes Jahr gebunden sein.

Sie muss aus wirtschaftlichen Risiken und Auslösern entstehen.

### 2.14 Systemische Weltökonomie

Gäste, Unternehmen, Arbeitsmarkt, Immobilien, Tourismus, Infrastruktur und Technologie beeinflussen sich gegenseitig.

Die Hotels des Spielers sind Teil dieses Systems.

---

## 3. Core Gameplay Loop

Der zentrale Kreislauf lautet:

1. **Beobachten** – Hotelbetrieb und Markt beobachten.
2. **Analysieren** – Ursachen für Probleme und Chancen erkennen.
3. **Entscheiden** – Preise, Personal, Einkauf, Marketing, Bau oder Strategie ändern.
4. **Ausführen** – Entscheidungen benötigen Zeit, Geld und Ressourcen.
5. **Beobachten** – Auswirkungen im Hotel sichtbar verfolgen.
6. **Auswerten** – operative und finanzielle Ergebnisse erhalten.
7. **Reagieren** – Strategie an neue Bedingungen anpassen.
8. **Investieren** – Qualität, Kapazität und Effizienz verbessern.
9. **Expandieren** – neue Hotels, Städte und Marken erschließen.
10. **Delegieren** – operative Arbeit zunehmend an Manager übertragen.

Das Kerngefühl soll immer sein:

**Problem erkennen → Ursache verstehen → Entscheidung treffen → reale Folgen sehen → wirtschaftliche Wirkung auswerten → Strategie anpassen.**

---

## 4. Spielstart, Schwierigkeit und Karriereende

### 4.1 Standardstart

Der Standardspielstart liegt am 1. Januar 1991.

Die erste Kampagnenphase konzentriert sich auf ein kleines bis mittleres Hotel.

Empfohlener Default für den ersten spielbaren Vertical Slice:

- Stadt: Frankfurt am Main,
- 24 Zimmer,
- einfache Rezeption,
- Housekeeping,
- Frühstücksraum,
- kleine Küche,
- grundlegende Haustechnik,
- begrenztes Startkapital,
- laufender Kredit oder hoher Finanzierungsbedarf.

Die endgültige Vollversion darf mehrere Startstädte anbieten.

### 4.2 Schwierigkeitsgrade

Schwierigkeit verändert keine versteckten unfairen KI-Boni.

Sie kann beeinflussen:

- Startkapital,
- Kreditzins-Aufschlag,
- Fehlertoleranz der Gäste,
- Prognosegenauigkeit,
- Arbeitsmarktknappheit,
- Krisenpuffer,
- Stärke automatischer Assistenten,
- Informationsgrad der UI.

Empfohlene Presets:

- **Einsteiger:** großzügiger Cash-Puffer, bessere Assistenten, mehr Erklärungen.
- **Standard:** neutrale Wirtschaftsregeln.
- **Experte:** knappere Liquidität, größere Prognoseunsicherheit, weniger Hilfestellung.

### 4.3 Sandbox-Optionen

Optional können Spieler einzelne Parameter anpassen:

- Wirtschaftsschwankung,
- Krisenhäufigkeit,
- Konkurrenzaggressivität,
- Startkapital,
- Technologiegeschwindigkeit,
- Baukostenvolatilität,
- Informationsgenauigkeit.

### 4.4 Karriereende

Das Erreichen von 2026 ist ein Karriere-Meilenstein, kein harter Spielstopp.

Danach stehen zur Wahl:

- Karrierebilanz anzeigen und beenden,
- als Endless-Partie weiterspielen.

### 4.5 Game Over

Game Over tritt erst ein, wenn der gesamte Unternehmensverbund wirtschaftlich nicht mehr rettbar ist.

Vorher sind möglich:

- Verkauf einzelner Hotels,
- Restrukturierung,
- Kreditumschuldung,
- Investoreneinstieg,
- Asset-Verkauf,
- Marktrückzug,
- Personalabbau,
- Sanierung.

---

# Teil II – Zeit, Nachfrage, Buchung und Gästereise

## 5. Kalender, Hoteltag, Saison und Nachfragezeitachse

### 5.1 Simulationskalender

Die Simulation verwendet einen echten Kalender mit:

- Datum,
- Wochentag,
- Monat,
- Jahr,
- lokalen Feiertagen,
- Schulferien,
- Saisonphasen,
- Messekalendern,
- Eventkalendern.

### 5.2 Hoteltag

Der Hoteltag besitzt klare operative Phasen:

- Nachtbetrieb,
- Frühstück,
- Check-out-Welle,
- Zimmerreinigung,
- Check-in-Vorbereitung,
- Check-in-Welle,
- Abendbetrieb,
- Tagesabschluss.

### 5.3 Zimmernacht

Die zentrale Belegungseinheit ist die Zimmernacht.

Buchungsdatum und Aufenthaltsdatum sind getrennt.

Ein Gast kann Monate vor dem tatsächlichen Aufenthalt buchen.

### 5.4 Check-in und Check-out

Hotels besitzen standardisierte Zeiten, die über Regeln oder Markenstandards verändert werden können.

Mögliche Features:

- Early Check-in,
- Late Check-out,
- Gepäckaufbewahrung,
- Express Check-out,
- Nachtanreise.

### 5.5 Wochentagseffekte

Nachfrage unterscheidet sich nach Segment.

Beispiel Businesshotel:

- Montag bis Donnerstag stark,
- Freitag schwächer,
- Wochenende abhängig von Freizeitangebot.

Beispiel Resort:

- Wochenende und Ferien stärker,
- Wochentage saisonabhängig.

### 5.6 Saison

Saisonalität entsteht aus:

- Klima,
- Ferien,
- Geschäftszyklen,
- Veranstaltungen,
- lokalen Attraktionen,
- Verkehrsanbindung.

### 5.7 Wetter

Wetter beeinflusst kurzfristig:

- Anreise,
- Außenbereiche,
- Freizeitnachfrage,
- Energieverbrauch,
- Betriebsausfälle.

Wetter darf kein beliebiger Zufallsmalus sein.

Es muss aus regional plausiblen Wetter- und Klimarisiken entstehen.

### 5.8 Nachfragequellen

Hotelübernachtungen entstehen aus:

- Geschäftsreisen,
- Freizeittourismus,
- Gruppenreisen,
- Messen,
- Kongressen,
- Veranstaltungen,
- Luxusreisen,
- Long Stay,
- Crew-/Transportbedarf,
- Sonderereignissen.

### 5.9 Nachfrage ist erklärbar

Das UI darf nicht nur melden:

`Business Demand -18 %`.

Es muss Ursachen nennen, zum Beispiel:

- zwei Großunternehmen bauen Stellen ab,
- Messe wurde in eine andere Stadt verlegt,
- neuer Wettbewerber bringt 250 Zimmer in den Markt,
- Flugverbindungen wurden reduziert.


## 6. Buchungs-, Reservierungs- und Vertriebssystem

### 6.1 Grundprinzip

Eine Buchung entsteht nicht zufällig direkt im Hotel.

Sie entsteht aus einer Reiseabsicht eines Gästesegments oder einer Reisegruppe.

Der Ablauf lautet:

**Reisebedarf → Hotelsuche → Vergleich → Kanalwahl → Angebot → Buchung → mögliche Änderung/Stornierung → Anreise oder No-Show.**

### 6.2 Buchungsattribute

Jede Reservierung enthält mindestens:

- Reservierungs-ID,
- Reisepartei,
- Buchungsdatum,
- Anreisedatum,
- Abreisedatum,
- Anzahl Nächte,
- gewünschte Zimmerkategorie,
- gebuchte Zimmeranzahl,
- Rate Plan,
- Vertriebskanal,
- Gesamtpreis,
- Stornierungsregel,
- Zahlungsregel,
- Status,
- Segment,
- gegebenenfalls Firmen- oder Gruppenvertrag.

### 6.3 Buchungsvorlauf

Segmente unterscheiden sich im Lead Time.

Beispiele:

- Geschäftsreisende buchen häufig kurzfristiger,
- Feriengäste teilweise Monate im Voraus,
- Kongresse und Gruppen sehr früh,
- Walk-ins gar nicht im Voraus.

Der Lead Time beeinflusst:

- Forecast,
- Preisstrategie,
- Stornierungsrisiko,
- Verfügbarkeit.

### 6.4 Aufenthaltsdauer

Die Length of Stay hängt ab von:

- Segment,
- Reisegrund,
- Saison,
- Preis,
- Eventdauer,
- Hotelangebot.

Long-Stay-Gäste können Wochen oder Monate bleiben.

### 6.5 Stornierungen

Reservierungen können stornierbar oder nicht stornierbar sein.

Stornierungswahrscheinlichkeit hängt ab von:

- Segment,
- Vorlauf,
- Preisbedingungen,
- Kanal,
- Eventänderungen,
- wirtschaftlichen Schocks.

Mögliche Folgen:

- kein Umsatz,
- Stornogebühr,
- verlorene Anzahlung,
- kurzfristig wieder frei werdende Kapazität.

### 6.6 No-Shows

Gebuchte Gäste können nicht erscheinen.

No-Show-Wahrscheinlichkeit hängt ab von:

- Rate Plan,
- Zahlungsabsicherung,
- Kanal,
- Segment,
- Reiseunsicherheit.

No-Shows sind eine Grundlage für Überbuchungsstrategien.

### 6.7 Walk-ins

Gäste können ohne Reservierung anreisen.

Walk-in-Nachfrage hängt ab von:

- Standort,
- Tageszeit,
- aktueller Stadtauslastung,
- Reiseunterbrechungen,
- Verkehr,
- Hotel-Sichtbarkeit.

### 6.8 Direktbuchung

Direktbuchungen können entstehen über:

- Telefon,
- Brief/Fax in früheren Epochen,
- Rezeption,
- Corporate Sales,
- später Hotelwebsite,
- später mobile App.

Direktbuchungen verursachen normalerweise geringere externe Provisionen.

### 6.9 Reisebüros

Reisebüros sind besonders in frühen Jahrzehnten relevant.

Sie können:

- Einzelbuchungen vermitteln,
- Pakete verkaufen,
- Kontingente halten,
- Provisionen verlangen.

### 6.10 Firmenverträge

Unternehmen können Firmenraten erhalten.

Ein Vertrag enthält:

- Rabatt oder Fixrate,
- erwartetes Volumen,
- gültige Tage,
- Blackout Dates,
- Stornoregeln,
- Zahlungsziel.

Der Spieler entscheidet zwischen:

- sicherem Volumen,
- und potenziell höherem Tagespreis im offenen Markt.

### 6.11 Gruppenreservierungen

Gruppen können mehrere Zimmer gleichzeitig buchen.

Gruppen besitzen:

- Zimmerblock,
- Release Date,
- Gruppenrate,
- gemeinsame Zahlungsbedingungen,
- optional Catering oder Veranstaltungsleistungen.

### 6.12 Kontingente

Vertriebspartner können feste oder flexible Zimmerkontingente erhalten.

Kontingente reduzieren frei verkaufbare Kapazität.

Nicht abgerufene Kontingente müssen zu definierten Zeitpunkten wieder freigegeben werden können.

### 6.13 Online Travel Agencies

OTAs erscheinen erst, wenn die zugrundeliegende Technologie und Marktstruktur existiert.

Sie bieten:

- Reichweite,
- Vergleichbarkeit,
- Conversion,
- aber Provision und Preisdruck.

### 6.14 Kanalprovisionen

Jeder Kanal kann Kosten besitzen:

- feste Provision,
- prozentuale Provision,
- Marketinggebühren,
- technische Gebühren.

Nettozimmerumsatz muss Kanalgebühren berücksichtigen.

### 6.15 Channel Inventory

Der Spieler kann später steuern:

- welche Kategorien auf welchen Kanälen verfügbar sind,
- welche Rate Plans dort verkauft werden,
- welche Kontingente gelten.

### 6.16 Überbuchung

Hotels können bewusst mehr Buchungen akzeptieren als physische Zimmer verfügbar sind.

Grundlage:

- erwartete Stornierungen,
- No-Shows,
- frühe Abreisen.

Risiko:

- alle Gäste erscheinen,
- Gäste müssen ausgelagert werden,
- Entschädigungen,
- Reputationsschaden,
- mögliche Medienwirkung.

### 6.17 Displaced Guests

Bei Überbuchung muss das Hotel:

- Ersatzhotel organisieren,
- Transfer bezahlen,
- Preisunterschied übernehmen,
- gegebenenfalls zusätzliche Entschädigung zahlen.

---

## 7. Revenue Management

### 7.1 Entscheidungsdimensionen

Preise werden mindestens nach folgenden Dimensionen gesteuert:

- Hotel,
- Zimmerkategorie,
- Aufenthaltsdatum,
- Segment,
- Rate Plan,
- Vertriebskanal,
- Nachfragezustand.

### 7.2 Rate Plans

Beispiele:

- Flexible Rate,
- Non-Refundable,
- Frühstück inklusive,
- Firmenrate,
- Gruppenrate,
- Wochenendrate,
- Long-Stay-Rate,
- Package Rate.

### 7.3 Restriktionen

Revenue Management kann verwenden:

- Minimum Length of Stay,
- Maximum Length of Stay,
- Closed to Arrival,
- Closed to Departure,
- Rate Floor,
- Rate Ceiling,
- Channel Closure,
- Mindestvorausbuchungszeit.

### 7.4 Nachfrageforecast

Forecasts basieren auf:

- Pickup,
- aktueller Buchungslage,
- historischem Verlauf des eigenen Savegames,
- Wochentag,
- Saison,
- Events,
- Marktangebot,
- Preisposition,
- Wirtschaftslage.

Forecasts sind niemals perfekt.

Sie besitzen Unsicherheit.

### 7.5 Preiselastizität

Segmente reagieren unterschiedlich auf Preisänderungen.

Ein Preis weit oberhalb der Zahlungsbereitschaft reduziert Conversion.

Ein sehr niedriger Preis kann Nachfrage erhöhen, aber:

- Umsatz pro Zimmer senken,
- falsche Segmente anziehen,
- Qualitätswahrnehmung beeinflussen.

### 7.6 Gruppenpreis

Bei Gruppen muss der Spieler Opportunitätskosten beachten.

Eine Gruppe kann früh sichere 80 Zimmer buchen.

Der Spieler muss vergleichen:

- Gruppenumsatz,
- Zusatzumsatz,
- versus später mögliche höhere Einzelraten.

### 7.7 Überbuchungsstrategie

Revenue Management berechnet eine empfohlene Überbuchungsgrenze aus:

- historischer Stornoquote,
- No-Show-Quote,
- Reservierungsqualität,
- Walk-Kosten,
- Reputationsrisiko.

### 7.8 ADR

**Average Daily Rate** = Zimmerumsatz / verkaufte Zimmer.

### 7.9 RevPAR

**Revenue per Available Room** = Zimmerumsatz / verfügbare Zimmer.

Alternativ:

ADR × Auslastung.

### 7.10 GOPPAR

**Gross Operating Profit per Available Room** wird später als profitability-orientierte Kennzahl genutzt.

### 7.11 Automatischer Revenue Manager

Ein automatischer Revenue Manager besitzt:

- ForecastSkill,
- PricingStrategy,
- RiskTolerance,
- ChannelSkill,
- GroupBusinessSkill.

Er optimiert innerhalb der vom Spieler gesetzten Grenzen.

### 7.12 Spielerregeln

Der Spieler kann Limits setzen:

- Mindestpreis,
- Höchstpreis,
- gewünschte Auslastung,
- maximale Überbuchung,
- priorisierte Segmente,
- Kanalkostenlimit.

---

## 8. Gästemodell und Reiseparteien

### 8.1 Reiseparteien

Die zentrale Einheit ist nicht zwingend eine Einzelperson.

Mögliche Party Types:

- Einzelreisender,
- Paar,
- Familie,
- Freundesgruppe,
- Firmenreisegruppe,
- Reisegruppe,
- Eventgruppe.

### 8.2 Gästesegmente

Mindestens:

- Business,
- Leisure,
- Family,
- Group,
- Luxury,
- Long Stay,
- Event,
- Budget.

### 8.3 Gastattribute

Gäste oder Reiseparteien besitzen abstrahierte Attribute:

- Budget,
- Zahlungsbereitschaft,
- Qualitätsanspruch,
- Preissensitivität,
- Serviceanspruch,
- Wartezeittoleranz,
- Sauberkeitsanspruch,
- Lärmempfindlichkeit,
- bevorzugte Ausstattung,
- bevorzugte Lage,
- Loyalität.

### 8.4 Reisebedarf

Ein Gast entsteht aus einer Reiseursache.

Beispiele:

- Kundentermin,
- Messe,
- Urlaub,
- Familienbesuch,
- Hochzeit,
- Konzert,
- Projektarbeit.

### 8.5 Hotelsuche

Der Gast bildet eine Consideration Set aus verfügbaren Hotels.

Die Sichtbarkeit hängt ab von:

- Vertriebskanälen,
- Marketing,
- Markenbekanntheit,
- Firmenvertrag,
- Reisebüro,
- Lage,
- Verfügbarkeit.

### 8.6 Vergleich

Der Gast bewertet unter anderem:

- Preis,
- Lage,
- Qualität,
- Reputation,
- Ausstattung,
- Marke,
- Buchungsbedingungen.

### 8.7 Buchung

Der Gast wählt die beste Option innerhalb seiner Wahrnehmung.

Nicht jeder Gast kennt jedes Hotel.

### 8.8 Anreise

Anreisezeit hängt ab von:

- Verkehrsmittel,
- Reisegrund,
- Entfernung,
- Wetter,
- Verkehrsproblemen.

### 8.9 Aufenthalt

Gäste können benutzen:

- Zimmer,
- Restaurant,
- Bar,
- Wellness,
- Fitness,
- Konferenz,
- Room Service,
- Parken,
- Zusatzservices.

### 8.10 Zufriedenheit

Zufriedenheit wird aus Teilbewertungen berechnet:

- Buchungserlebnis,
- Anreise,
- Check-in,
- Zimmer,
- Sauberkeit,
- Lärm,
- Personal,
- F&B,
- Zusatzservices,
- Preis-Leistung,
- Problembehandlung.

### 8.11 Beschwerden

Probleme können Beschwerden erzeugen.

Beispiele:

- Zimmer nicht sauber,
- lange Check-in-Wartezeit,
- Lärm,
- defekte Klimaanlage,
- falsche Rechnung,
- Restaurantwartezeit.

### 8.12 Service Recovery

Das Hotel kann reagieren durch:

- persönliche Entschuldigung,
- technisches Problem beheben,
- Zimmerwechsel,
- Upgrade,
- Getränk oder Mahlzeit,
- Rabatt,
- Rückerstattung,
- Gutschein,
- Loyalty-Gutschrift.

Eine gute Recovery kann negative Erlebnisse teilweise kompensieren.

### 8.13 Mitarbeiterbefugnisse

Manager können festlegen, welche Entschädigungen Mitarbeiter selbständig gewähren dürfen.

### 8.14 Check-out

Beim Check-out entstehen:

- finale Rechnung,
- Zahlungsabschluss,
- Zimmerstatus `Vacant Dirty`,
- Feedbackchance.

### 8.15 Bewertung

Bewertungen unterscheiden sich nach Medienepoche.

Frühe Epochen:

- Mundpropaganda,
- Reiseführer,
- Zeitungen.

Spätere Epochen:

- Bewertungsportale,
- Social Media,
- Influencer.

### 8.16 Loyalität

Zufriedene Gäste können Stammgäste werden.

Loyalität kann auf:

- Hotel,
- Marke,
- Konzern

bezogen sein.

### 8.17 CRM

Später können Gästeprofile verwendet werden für:

- Präferenzen,
- vergangene Aufenthalte,
- Angebotskommunikation,
- Loyalty-Programme.

---

## 9. Front Office und Housekeeping

### 9.1 Zimmerzustandsmaschine

Jedes Zimmer besitzt einen klaren Status.

Mindestens:

- `VacantClean`,
- `VacantDirty`,
- `Occupied`,
- `Reserved`,
- `Inspected`,
- `OutOfOrder`,
- `Blocked`.

### 9.2 Check-in-Bedingungen

Ein Gast kann nur eingecheckt werden, wenn:

- Reservierung gültig ist oder Walk-in akzeptiert wird,
- Zimmer zugewiesen ist,
- Zimmer bezugsfertig ist,
- Zahlungs-/Garantieregel erfüllt ist.

### 9.3 Early Check-in

Early Check-in ist möglich, wenn ein fertiges Zimmer vorhanden ist.

Er kann kostenlos oder kostenpflichtig sein.

### 9.4 Late Check-out

Late Check-out reduziert die verfügbare Reinigungszeit und kann die nächste Anreise gefährden.

### 9.5 Zimmerzuteilung

Die Rezeption ordnet Buchungen konkreten Zimmern zu.

Prioritäten können sein:

- Kategorie,
- Wunschlage,
- ruhiges Zimmer,
- zusammenliegende Familienzimmer,
- Stammgastpräferenz.

### 9.6 Zimmerwechsel

Bei Problemen kann ein Gast in ein anderes Zimmer wechseln.

Der Wechsel erzeugt operative Arbeit und gegebenenfalls Upgrade-Kosten.

### 9.7 Housekeeping-Aufträge

Aufträge entstehen durch:

- Check-out,
- Stayover Cleaning,
- Sonderreinigung,
- Turndown Service,
- Inspektion.

### 9.8 Priorisierung

Housekeeping kann priorisieren:

- nächste Anreise,
- VIP,
- frühe Ankunft,
- Beschwerde,
- Standardreihenfolge.

### 9.9 Reinigungskapazität

Reinigung benötigt:

- Mitarbeiterzeit,
- Wäsche,
- Reinigungsmittel,
- gegebenenfalls Supervisor-Inspektion.

### 9.10 Inspektion

Qualitätskontrollen können Fehler entdecken, bevor Gäste einchecken.

### 9.11 Lost & Found

Zurückgelassene Gegenstände können einen einfachen Lost-&-Found-Prozess erzeugen.

### 9.12 Verspätete Zimmerfreigabe

Wenn Zimmer nicht rechtzeitig sauber sind:

- Check-in-Warteschlange steigt,
- Gästezufriedenheit sinkt,
- Lobby wird belastet,
- Entschädigungen können entstehen.

---

# Teil III – Hotelprodukt, Bereiche und operative Systeme

## 10. Gebäude- und Ausbauprinzip

### 10.1 Gebäudestruktur

Jedes Hotel besitzt:

- Grundstück,
- Gebäudekörper,
- Etagen,
- feste Zugänge,
- Treppen,
- Aufzüge,
- Versorgungsschächte,
- nutzbare Module.

### 10.2 Raumplatzierung

Ein Raum benötigt:

- ausreichend Fläche,
- Zugang,
- technische Versorgung,
- gegebenenfalls Fenster,
- gegebenenfalls Wasseranschluss,
- erforderliche Technologie.

### 10.3 Keine linearen Level

Ein Restaurant wird nicht nur von Level 1 auf Level 2 verbessert.

Der Spieler verändert reale Eigenschaften:

- Fläche,
- Sitzplätze,
- Küche,
- Konzept,
- Ausstattung,
- Personal,
- Technik.

### 10.4 Bau- und Renovierungsprozess

Jedes Projekt durchläuft:

1. Planung,
2. Kostenangebot,
3. Genehmigungsprüfung,
4. Bauphase,
5. Abnahme,
6. Wiedereröffnung.

### 10.5 Bauzeit

Umbauten brauchen simulierte Zeit.

Große Projekte können Monate oder Jahre dauern.

### 10.6 Baulärm

Renovierungen können angrenzende Bereiche beeinträchtigen.

Folgen:

- Beschwerden,
- geringere Attraktivität,
- temporär nicht verkaufbare Zimmer.

### 10.7 Kostenrisiko

Große Projekte können Kostenüberschreitungen oder Verzögerungen haben.

Risiko hängt ab von:

- Projektkomplexität,
- Baukonjunktur,
- Planungskompetenz,
- Gebäudezustand.

---

## 11. Zimmer und Suiten

### 11.1 Kategorien

Mögliche Kategorien:

- Einzelzimmer,
- Doppelzimmer,
- Twin-Zimmer,
- Familienzimmer,
- Business-Zimmer,
- Executive-Zimmer,
- barrierefreies Zimmer,
- Junior-Suite,
- Suite,
- Luxus-Suite,
- Long-Stay-Apartment,
- Themenzimmer,
- Penthouse-Suite.

### 11.2 Qualitätsattribute

Zimmerqualität setzt sich zusammen aus:

- Größe,
- Bettkomfort,
- Badqualität,
- Möblierung,
- Technik,
- Zustand,
- Sauberkeit,
- Lärm,
- Aussicht,
- Stil.

### 11.3 Schlafmodule

Beispiele:

- einfaches Bett,
- Qualitätsmatratze,
- Premiumbett,
- Pillow-Menü,
- Schlafsofa,
- Zustellbett.

### 11.4 Badezimmermodule

Beispiele:

- Gemeinschaftsbad bei sehr einfachen Häusern,
- Standardbad,
- hochwertiges Bad,
- Dusche,
- Badewanne,
- Dusche + Badewanne,
- Doppelwaschbecken,
- Luxusbad,
- Whirlpool.

### 11.5 Technikmodule

Frühe Technologien:

- Telefon,
- Radio,
- Röhrenfernseher,
- Minibar.

Spätere mögliche Technologien:

- Satelliten-TV,
- Internetanschluss,
- WLAN,
- Flatscreen,
- Smart-TV,
- USB-Ladestationen,
- Smart-Room-Steuerung,
- digitale Schlüssel.

Die Verfügbarkeit ist technologieabhängig, nicht jahresfix.

### 11.6 Businessmodule

- Schreibtisch,
- Faxzugang,
- Direktwahltelefon,
- Internet,
- ergonomischer Arbeitsplatz,
- Videokonferenztechnik.

### 11.7 Komfortmodule

- Klimaanlage,
- Schallschutz,
- Safe,
- Kaffeemaschine,
- hochwertige Minibar,
- Bademantel,
- Premium-Pflegeprodukte.

### 11.8 Alterung

Zimmer altern physisch und kommerziell.

Ein technisch funktionierendes Zimmer kann stilistisch veraltet sein.

### 11.9 Soft Renovation

Ändert:

- Oberflächen,
- Möbel,
- Farben,
- Dekoration.

### 11.10 Technical Renovation

Ändert:

- Elektrik,
- Netzwerk,
- Klima,
- Sanitär,
- technische Infrastruktur.

### 11.11 Full Renovation

Zimmer wird temporär geschlossen und umfassend modernisiert.

### 11.12 Conversion

Mehrere Zimmer können zu Suiten zusammengelegt werden.

Große Einheiten können wieder geteilt werden, sofern Gebäudestruktur dies erlaubt.

---

## 12. Lobby und Rezeption

### 12.1 Grundfunktionen

Die Lobby steuert:

- Ankunft,
- Orientierung,
- Wartekapazität,
- Check-in,
- Check-out,
- Gepäck,
- Concierge.

### 12.2 Erweiterungen

- zusätzliche Rezeptionsplätze,
- Concierge Desk,
- Gepäcklager,
- Bell Service,
- Lobby Lounge,
- Business Corner,
- Self Check-in,
- Mobile Check-in,
- Digital Key Support.

### 12.3 Kapazität

Zu wenige Rezeptionsplätze erzeugen Warteschlangen.

Zu viel Kapazität erzeugt unnötige Personal- und Flächenkosten.

### 12.4 Automatisierung

Technologie kann Personalbedarf reduzieren, aber nicht jeden Service ersetzen.

Premiumgäste können weiterhin persönlichen Service bevorzugen.

---

## 13. Restaurant, Küche und Food & Beverage

### 13.1 Restaurantkonzepte

- Frühstücksraum,
- klassisches Hotelrestaurant,
- Buffetrestaurant,
- regionales Restaurant,
- internationales Restaurant,
- Familienrestaurant,
- Fine Dining,
- Rooftop-Restaurant.

### 13.2 Öffnungszeiten

Jeder F&B-Bereich besitzt Öffnungszeiten.

Öffnungszeiten beeinflussen:

- Personalbedarf,
- Gästeservice,
- Umsatz,
- Energieverbrauch.

### 13.3 Sitzplätze und Reservierung

Restaurants besitzen:

- Sitzplatzkapazität,
- Reservierungsslots,
- Walk-in-Kapazität,
- Warteliste.

### 13.4 Externe Gäste

Restaurants und Bars können externe lokale Gäste anziehen.

Ein erfolgreiches Restaurant kann selbst zur Destination werden.

### 13.5 Speisekarte

Die Speisekarte enthält Gerichte mit:

- Rezept,
- Zutaten,
- Portionskosten,
- Verkaufspreis,
- Zubereitungszeit,
- Qualitätsanspruch.

### 13.6 Rezepte und Zutaten

Ein Gericht kann nur produziert werden, wenn:

- Zutaten vorhanden sind,
- Küchenstationen verfügbar sind,
- qualifiziertes Personal vorhanden ist.

### 13.7 Frühstücksmodelle

Mögliche Angebote:

- kein Frühstück,
- optionales Frühstück,
- Frühstück inklusive,
- Buffet,
- À-la-carte-Frühstück.

### 13.8 Pensionen

Bei passenden Hoteltypen später möglich:

- Halbpension,
- Vollpension,
- All-inclusive-nahe Modelle.

### 13.9 Mise-en-place

Vorbereitungskapazität beeinflusst Servicegeschwindigkeit.

### 13.10 Allergien und Sonderwünsche

Das System abstrahiert Allergien und Ernährungswünsche als Serviceanforderungen.

### 13.11 Menu Engineering

Der Spieler kann Gerichte nach:

- Beliebtheit,
- Marge,
- Aufwand,
- Positionierung

analysieren.

### 13.12 Küchenmodule

- Vorbereitung,
- warme Küche,
- kalte Küche,
- Patisserie,
- Spülküche,
- Kühlhaus,
- Tiefkühllager,
- Trockenlager,
- Room-Service-Staging.

### 13.13 Engpässe

Ein 180-Sitzplätze-Restaurant mit einer 60-Gäste-Küche erzeugt:

- lange Wartezeit,
- Stress,
- Qualitätsabfall,
- schlechte Bewertungen.

### 13.14 Lebensmittelverschwendung

Überproduktion und Verderb verursachen Kosten.

Gute Planung reduziert Waste.

### 13.15 Bar und Lounge

Mögliche Konzepte:

- Hotelbar,
- Cocktailbar,
- Lobbybar,
- Sportsbar,
- Weinbar,
- Executive Lounge,
- Rooftop-Bar,
- Nachtclub.

### 13.16 Room Service

Stufen:

- Frühstück aufs Zimmer,
- eingeschränkte Speisekarte,
- Abendservice,
- 24-Stunden-Service,
- Luxusservice.

Room Service benötigt:

- Küche,
- Servicepersonal,
- Transportkapazität,
- Aufzüge.

---

## 14. Wellness, Fitness und reservierbare Nebenleistungen

### 14.1 Wellnessmodule

- Sauna,
- Dampfbad,
- Ruhebereich,
- Massage,
- Whirlpool,
- Innenpool,
- Außenpool,
- Beauty,
- Behandlungsräume,
- Spa-Suiten,
- Thermalbereich,
- Private Spa,
- Medical Wellness,
- Hydrotherapie.

### 14.2 Ressourcenverbrauch

Spa erhöht:

- Wasserverbrauch,
- Energieverbrauch,
- Wäschebedarf,
- Spezialpersonal,
- Wartung.

### 14.3 Reservierung

Behandlungen besitzen:

- Zeitfenster,
- Raumkapazität,
- Mitarbeiterkapazität,
- Reservierung,
- Warteliste.

### 14.4 Fitness

Ausbaustufen entstehen durch reale Module:

- Basisgeräte,
- Kraftbereich,
- Cardio,
- Umkleiden,
- Trainer,
- Kurse,
- Yoga,
- Personal Training.

### 14.5 Kapazitätslogik für Zusatzservices

Auch andere Services können Slots besitzen:

- Airport-Shuttle,
- Parkplätze,
- Konferenzräume,
- Coworking,
- Kinderbetreuung.

Jeder reservierbare Service besitzt:

- Öffnungszeiten,
- Kapazität,
- Preis,
- Personalbedarf,
- Warteliste oder Verfügbarkeitslogik.

---

## 15. Konferenz-, Gruppen- und Veranstaltungsgeschäft

### 15.1 Räume

- Besprechungszimmer,
- Seminarraum,
- Konferenzraum,
- Ballsaal,
- Kongresssaal,
- Eventhalle.

### 15.2 Technik

Frühe Technik kann umfassen:

- Flipchart,
- Dia-Projektor,
- Overheadprojektor,
- Telefonkonferenz.

Spätere Technologien können umfassen:

- Beamer,
- digitale Präsentation,
- Videokonferenz,
- Streaming,
- hybride Events.

Verfügbarkeit hängt von der Technologieentwicklung ab.

### 15.3 Sales Lead

Veranstaltungsgeschäft beginnt mit einem Lead.

Leadattribute:

- Kunde,
- Datum,
- Teilnehmerzahl,
- Raumwunsch,
- Zimmerbedarf,
- Cateringbedarf,
- Budget.

### 15.4 Angebot

Der Spieler oder Sales Manager erstellt ein Angebot aus:

- Raummiete,
- Zimmerblock,
- Catering,
- Technik,
- Zusatzleistungen.

### 15.5 Verhandlung

Kunden können Preis oder Leistungen verhandeln.

### 15.6 Deposit

Große Events können Anzahlungen verlangen.

### 15.7 Storno

Verträge besitzen Stornofristen und Gebühren.

### 15.8 Zimmerblöcke

Events können Zimmerkontingente blockieren.

### 15.9 Durchführung

Während des Events entstehen reale Lasten:

- Check-in-Spitzen,
- F&B-Spitzen,
- Technikbedarf,
- Reinigung,
- Security,
- Aufzugslast.

### 15.10 Stadtwirkung

Große Eventkapazität kann neue Veranstaltungen in die Stadt ziehen.

---

## 16. Housekeeping und Wäscherei-Infrastruktur

### 16.1 Reinigungsmittellager

Bestand begrenzt operative Reinigung.

### 16.2 Wäschelager

Benötigt Bestände an:

- Bettwäsche,
- Handtüchern,
- Tischwäsche,
- Bademänteln.

### 16.3 Etagenlager

Etagenlager reduzieren Laufwege.

### 16.4 Interne Wäscherei

Vorteile:

- bessere Kontrolle,
- schnelle Verfügbarkeit,
- Skaleneffekte.

Nachteile:

- Fläche,
- Personal,
- Wasser,
- Energie,
- Wartung.

### 16.5 Externe Wäscherei

Vorteile:

- weniger eigene Infrastruktur,
- variable Kosten.

Nachteile:

- Lieferabhängigkeit,
- Vertragskosten,
- längere Reaktionszeit.

---

## 17. Technik, Gebäudeversorgung und Wartung

### 17.1 Technische Anlagen

- Heizung,
- Klimatisierung,
- Strom,
- Wasser,
- Aufzüge,
- Notstrom,
- Brandschutz,
- IT,
- Gebäudeautomation.

### 17.2 Anlagenattribute

Jede Anlage besitzt:

- Kapazität,
- Effizienz,
- Zustand,
- Alter,
- Wartungsintervall,
- Ausfallwahrscheinlichkeit.

### 17.3 Präventive Wartung

Wartung senkt Ausfallrisiko und verlängert Lebensdauer.

### 17.4 Reaktive Reparatur

Defekte erzeugen Reparaturaufträge.

### 17.5 Ersatzinvestition

Sehr alte Anlagen können wirtschaftlich schlechter sein als ein Ersatz.

### 17.6 Lebensdauer

Technik altert auch bei guter Wartung.

### 17.7 Betriebsfolgen

Defekte können verursachen:

- Zimmerausfall,
- Serviceausfall,
- Gästebeschwerden,
- Energieverschwendung,
- Sicherheitsprobleme.

### 17.8 Wartungspriorität

Technikteam priorisiert nach:

- Sicherheit,
- Gästeauswirkung,
- Umsatzverlust,
- Folgeschaden.

---

## 18. Personal, Arbeitsmarkt und Mitarbeiterentwicklung

### 18.1 Abteilungen

Mindestens:

- Rezeption,
- Housekeeping,
- Küche,
- Service,
- Technik,
- Sicherheit,
- Verwaltung,
- Sales,
- Marketing,
- Revenue Management,
- HR.

### 18.2 Bewerbermarkt

Bewerber entstehen aus dem lokalen Arbeitsmarkt.

Anzahl und Qualität hängen ab von:

- Arbeitslosigkeit,
- Lohnniveau,
- Arbeitgeberreputation,
- Standortattraktivität,
- Berufsangebot.

### 18.3 Mitarbeiterattribute

- Qualifikation,
- Erfahrung,
- Motivation,
- Gehaltserwartung,
- Belastung,
- Zuverlässigkeit,
- Entwicklungspotenzial.

### 18.4 Arbeitsverträge

Verträge können unterscheiden:

- Vollzeit,
- Teilzeit,
- Aushilfe,
- befristet,
- gegebenenfalls saisonal.

### 18.5 Dienstplanung

Schichtplanung berücksichtigt:

- Öffnungszeiten,
- erwartete Nachfrage,
- Mindestbesetzung,
- Qualifikation,
- Urlaub,
- Krankheit,
- gesetzliche Ruhezeiten.

### 18.6 Überstunden

Überstunden erhöhen kurzfristig Kapazität.

Langfristig erhöhen sie:

- Kosten,
- Belastung,
- Fehler,
- Fluktuationsrisiko.

### 18.7 Krankheit

Krankheit reduziert kurzfristig verfügbare Kapazität.

### 18.8 Urlaub

Urlaub muss geplant werden und reduziert verfügbare Arbeitszeit.

### 18.9 Weiterbildung

Training kostet Zeit und Geld, verbessert aber Qualifikation.

### 18.10 Beförderung

Mitarbeiter können neue Rollen übernehmen.

Langfristige Karrierepfade sollen möglich sein.

### 18.11 Kündigung

Mitarbeiter können kündigen wegen:

- schlechter Bezahlung,
- hoher Belastung,
- schlechtem Management,
- besseren Angeboten.

### 18.12 Entlassung

Spieler können Personal reduzieren, mit möglichen Kosten und Reputationsfolgen.

### 18.13 Arbeitgeberreputation

Arbeitgeberreputation beeinflusst:

- Bewerberanzahl,
- Bewerberqualität,
- Gehaltsforderungen,
- Fluktuation.

### 18.14 Personalbereiche

Mögliche Infrastruktur:

- Umkleide,
- Pausenraum,
- Kantine,
- Mitarbeiterlounge,
- Schulungsraum,
- Personalbüro,
- Gesundheitsangebot,
- Managementbüro.

### 18.15 Managementautomation

Abteilungsleiter können Schichten automatisch planen.

Der Spieler definiert:

- Budget,
- Mindestservice,
- Überstundenlimit,
- Personalreserve.

---

## 19. Einkauf, Lager und Lieferanten

### 19.1 Beschaffungskategorien

- Lebensmittel,
- Getränke,
- Reinigungsmittel,
- Amenities,
- Bettwäsche,
- Handtücher,
- Ersatzteile,
- Bürobedarf,
- technische Verbrauchsmaterialien.

### 19.2 Lieferantenattribute

- Preis,
- Qualität,
- Lieferzeit,
- Zuverlässigkeit,
- Mindestmenge,
- Zahlungsziel,
- Vertragslaufzeit,
- regionale Verfügbarkeit.

### 19.3 Lieferantenvertrag

Verträge können enthalten:

- Mindestabnahme,
- Rabatte,
- Laufzeit,
- Kündigungsfrist,
- Preisindexierung.

### 19.4 Lagerkapazität

Lager ist physisch begrenzt.

Zu wenig Lager erzeugt Lieferengpässe.

Zu viel Lager bindet Kapital und Fläche.

### 19.5 Verderb

Lebensmittel besitzen Haltbarkeit.

Überbestand erzeugt Waste.

### 19.6 Bestellpunkt

Automatische Systeme können nach Mindestbestand bestellen.

### 19.7 Lieferzeit

Nicht jede Bestellung ist sofort verfügbar.

### 19.8 Stockout

Fehlender Bestand kann verursachen:

- fehlende Gerichte,
- fehlende Amenities,
- Reinigungsausfall,
- Reparaturverzögerung.

### 19.9 Zentraler Einkauf

Später kann die Hotelgruppe Lieferverträge bündeln.

Vorteile:

- bessere Preise,
- Standardisierung,
- Verhandlungsmacht.

Nachteile:

- geringere lokale Flexibilität,
- Konzentrationsrisiko.

---

## 20. Parken, Mobilität, Shops, Sicherheit und Spezialbereiche

### 20.1 Parken

Mögliche Anlagen:

- Außenparkplatz,
- Tiefgarage,
- Valet,
- Busparkplatz.

### 20.2 Mobilität

Mögliche Services:

- Taxistand,
- Mietwagen,
- Airport-Shuttle,
- Fahrradstation,
- E-Bike-Verleih,
- später EV-Laden,
- später Carsharing.

Wert und Verfügbarkeit hängen von Technologie und Gesellschaft ab.

### 20.3 Shops

Mögliche Flächen:

- Zeitungskiosk,
- Souvenirshop,
- Blumenladen,
- Friseur,
- Boutique,
- Reisebüro,
- Convenience-Shop.

### 20.4 Betreibermodell

Shops können:

- selbst betrieben,
- verpachtet

werden.

### 20.5 Außenbereiche

- Terrasse,
- Garten,
- Innenhof,
- Pool,
- Spielplatz,
- Biergarten,
- Dachterrasse,
- Privatstrand.

### 20.6 Sicherheit

Mögliche Module:

- Safeanlage,
- Sicherheitszentrale,
- Kameras,
- Zugangskontrolle,
- Nachtwache,
- Brandschutz,
- Evakuierungssysteme.

### 20.7 Hotelkonzepte

Spezialisierungen entstehen aus Systemkombinationen.

Beispiele:

**Businesshotel**

- Executive Lounge,
- Coworking,
- Meetingcenter.

**Familienhotel**

- Kinderbetreuung,
- Spielzimmer,
- Familienrestaurant.

**Wellnesshotel**

- großer Spa,
- Medical Wellness,
- Ruhebereiche.

**Luxushotel**

- Concierge,
- Butler-Service,
- Luxus-Suiten,
- Private Dining.

**Airporthotel**

- Shuttle,
- frühes Frühstück,
- schnelle Check-ins,
- Crew-Angebote.

**Kongresshotel**

- Eventhallen,
- Catering,
- Veranstaltungstechnik.

---

## 21. Hotelklassifikation und Markenstandards

### 21.1 Eigene abstrahierte Klassifikation

Das Spiel verwendet eine eigene, international konsistente Qualitätsklassifikation.

Sie ist von realen Länder-Sterne-Systemen inspiriert, aber nicht deren exakte juristische Kopie.

### 21.2 Qualitätsstufen

Eine höhere Stufe verlangt konkrete Anforderungen.

Beispiele:

- Mindestzimmerqualität,
- Servicezeiten,
- Rezeptionserreichbarkeit,
- Sanitärstandard,
- Personalabdeckung,
- bestimmte Einrichtungen,
- Wartungsniveau.

### 21.3 Keine XP-Sterne

Sterne oder Qualitätsstufen werden nicht über Erfahrungspunkte freigeschaltet.

### 21.4 Markenstandard

Eine Marke kann definieren:

- Zielsegment,
- Mindestzimmergröße,
- Bettenstandard,
- Badstandard,
- Pflichtservices,
- Designrahmen,
- Servicelevel,
- Preispositionierung.

### 21.5 Brand Audit

Hotels können gegen Markenstandards geprüft werden.

Abweichungen können:

- Reputation reduzieren,
- Franchiseprobleme erzeugen,
- Renovierungsbedarf auslösen.


# Teil IV – Finanzen, Markt, Marke und Unternehmensführung

## 22. Finanzsystem

### 22.1 Grundprinzip

Finanzen werden nicht als einzelne Bargeldzahl simuliert.

Mindestens getrennt werden:

- Cash,
- Forderungen,
- Verbindlichkeiten,
- Schulden,
- Anlagevermögen,
- laufende Erlöse,
- laufende Aufwendungen,
- Investitionen.

### 22.2 GuV

Die Gewinn- und Verlustrechnung enthält mindestens:

**Umsatz**

- Zimmer,
- F&B,
- Events,
- Wellness,
- Parken,
- Shops und Pachten,
- Zusatzleistungen.

**Betriebsaufwand**

- Personal,
- Waren,
- Energie,
- Wasser,
- Vertrieb,
- Marketing,
- Wartung,
- Verwaltung,
- Versicherung.

**Weitere Positionen**

- Abschreibung,
- Zinsen,
- Steuern.

### 22.3 Cashflow

Gewinn ist nicht gleich Liquidität.

Cashflow berücksichtigt:

- Zahlungsziele,
- Anzahlungen,
- Kreditraten,
- Investitionen,
- Lieferantenrechnungen,
- Steuerzahlungen.

### 22.4 Bilanz

Die Simulation nutzt eine vereinfachte Bilanz mit:

- Vermögen,
- Cash,
- Immobilienwert,
- Anlagen,
- Schulden,
- Eigenkapital.

### 22.5 CapEx und OpEx

Investitionen in langfristige Anlagen sind CapEx.

Laufende Betriebskosten sind OpEx.

Diese Trennung beeinflusst:

- Cashflow,
- Abschreibung,
- Investitionsanalyse.

### 22.6 Abschreibung

Technische Anlagen, Möbel und Gebäudeinvestitionen können über Nutzungsdauer abgeschrieben werden.

Die Simulation bleibt spielerisch abstrahiert, aber wirtschaftlich konsistent.

### 22.7 Kredite

Kredite besitzen:

- Nominalbetrag,
- Zinssatz,
- Laufzeit,
- Tilgungsprofil,
- Sicherheiten,
- Covenants oder vereinfachte Bedingungen.

### 22.8 Zinsmodelle

Möglich sind:

- Festzins,
- variabler Zins.

Variable Zinsen reagieren auf Marktzinssätze.

### 22.9 Tilgung

Tilgung kann beispielsweise erfolgen als:

- Annuität,
- lineare Tilgung,
- endfällige Finanzierung bei Spezialfällen.

### 22.10 Kreditwürdigkeit

Bonität hängt ab von:

- Cashflow,
- Verschuldung,
- Unternehmensgröße,
- Reputation,
- Sicherheiten,
- bisheriger Zahlungshistorie.

### 22.11 Sicherheiten

Immobilien oder andere Vermögenswerte können Kredite absichern.

### 22.12 Zahlungsziele

Lieferanten und Firmenkunden können unterschiedliche Zahlungsfristen besitzen.

### 22.13 Steuern

Steuern werden abstrahiert, aber als reale Cash- und Ergebnisposition modelliert.

Sie können sich nach Land und Regulierung ändern.

### 22.14 Insolvenz

Ein Hotel oder Unternehmen gerät nicht allein wegen eines Verlustmonats in Insolvenz.

Kritisch werden:

- fehlende Liquidität,
- nicht bediente Verbindlichkeiten,
- auslaufende Kreditlinien,
- negative Finanzierungsperspektive.

### 22.15 Restrukturierung

Vor Game Over stehen Maßnahmen zur Verfügung:

- Refinanzierung,
- Asset Sale,
- Hotelverkauf,
- Kostenprogramm,
- Kapitalerhöhung,
- Investor,
- Schuldenschnitt als seltenes Ereignis.

### 22.16 Konzernfinanzierung

Im Late Game kann die Gruppe:

- Kapital zentral verwalten,
- Hotels intern finanzieren,
- konzernweite Kredite aufnehmen,
- Investitionsbudgets verteilen.

### 22.17 Treasury

Treasury verwaltet:

- Liquiditätsreserven,
- Währungen,
- Zinsrisiken,
- größere Finanzierungen.

---

## 23. Eigentum, Pacht, Managementvertrag und Franchise

### 23.1 Eigentum

Der Konzern besitzt Immobilie und Betrieb.

Vorteile:

- volle Kontrolle,
- Immobilienwertsteigerung.

Nachteile:

- hoher Kapitalbedarf,
- hohe Konzentration von Risiko.

### 23.2 Pacht / Lease

Der Konzern betreibt das Hotel und zahlt Pacht.

Vorteile:

- weniger Immobilienkapital.

Nachteile:

- feste Verpflichtungen,
- geringere Flexibilität.

### 23.3 Managementvertrag

Der Konzern betreibt ein Hotel für einen externen Eigentümer.

Er erhält Management Fees.

Der Eigentümer finanziert typischerweise große Immobilieninvestitionen.

### 23.4 Franchise

Ein externer Betreiber nutzt Marke und Standards des Konzerns.

Der Konzern erhält Gebühren.

Risiko:

- geringere operative Kontrolle,
- mögliche Markenschäden durch schlechte Partner.

### 23.5 Immobilien- und Betriebstrennung

Die Simulation darf Immobilieneigentum und Hotelbetrieb als getrennte wirtschaftliche Rollen behandeln.

---

## 24. Versicherung, Risiko und Schadensfälle

### 24.1 Versicherungsarten

Mögliche abstrahierte Policen:

- Gebäude,
- Inventar,
- Betriebsausfall,
- Haftpflicht,
- Elementarschaden,
- Cyberrisiko in späteren Epochen.

### 24.2 Versicherungsparameter

- Prämie,
- Selbstbehalt,
- Deckungsgrenze,
- Ausschlüsse.

### 24.3 Schadensfälle

Mögliche Fälle:

- Feuer,
- Wasserschaden,
- Einbruch,
- Gästeunfall,
- Technikschaden,
- Betriebsunterbrechung.

### 24.4 Unterversicherung

Der Spieler kann Prämien sparen, trägt dann aber mehr Risiko.

### 24.5 Schadenabwicklung

Versicherung zahlt nicht zwingend sofort.

Schäden können Cashflow temporär belasten.

---

## 25. Sales, Marketing, CRM und Loyalty

### 25.1 Marketingziel

Marketing erzeugt nicht pauschal Nachfrage.

Es verändert:

- Bekanntheit,
- Consideration,
- Markenimage,
- Segmentreichweite,
- Direktbuchungswahrscheinlichkeit.

### 25.2 Frühe Kanäle

Mögliche frühe Marketingkanäle:

- Zeitung,
- Reiseführer,
- Radio,
- Außenwerbung,
- Mailings,
- Reisebürokooperationen,
- PR.

### 25.3 Spätere Kanäle

Je nach Technologie:

- Website,
- Suchmaschinen,
- Onlinewerbung,
- Social Media,
- Influencer,
- CRM-Mailings,
- App-Kommunikation.

### 25.4 Kampagnenparameter

Eine Kampagne besitzt:

- Budget,
- Zielsegment,
- Region,
- Kanal,
- Laufzeit,
- Botschaft,
- erwartete Reichweite.

### 25.5 Attribution

Das UI soll grob erklären, welche Buchungen wahrscheinlich durch Marketing beeinflusst wurden.

Attribution ist unsicher, nicht perfekt.

### 25.6 Sales

Sales bearbeitet:

- Firmenkunden,
- Gruppen,
- Reiseveranstalter,
- MICE-Kunden,
- lokale Partnerschaften.

### 25.7 Sales Pipeline

Sales Leads besitzen Status:

- Prospect,
- Contacted,
- Offer,
- Negotiation,
- Won,
- Lost.

### 25.8 CRM

CRM speichert abstrahiert:

- Aufenthalte,
- Präferenzen,
- Beschwerden,
- Loyalty,
- Firmenbeziehungen.

### 25.9 Loyalty-Programm

Später können Hotelgruppen eigene Programme einführen.

Mögliche Benefits:

- Punkte,
- Upgrades,
- Late Check-out,
- Loungezugang,
- Direktbuchungsvorteile.

### 25.10 Loyalty-Ökonomie

Loyalty erhöht Bindung, erzeugt aber Kosten durch Benefits und Einlösungen.

---

## 26. Mehrdimensionale Reputation und Prestige

### 26.1 Hotelreputation

Bewertet die konkrete Qualität eines einzelnen Hauses.

### 26.2 Markenreputation

Überträgt Erwartungen zwischen Hotels derselben Marke.

### 26.3 Konzernreputation

Beeinflusst Investoren, Partner und Managementtalente.

### 26.4 Arbeitgeberreputation

Beeinflusst Arbeitsmarkt und Mitarbeiterbindung.

### 26.5 Medienreputation

Beeinflusst, wie stark Ereignisse aufgegriffen werden.

### 26.6 Channel Reputation

Spätere Buchungsplattformen können eigene Bewertungswerte führen.

### 26.7 Persönliches Prestige

Der Spieler bzw. die Unternehmerfigur kann Prestige aufbauen.

Prestige beeinflusst:

- Zugang zu Immobilien,
- Finanzierungsgespräche,
- hochwertige Bewerber,
- Geschäftspartner.

Prestige ersetzt keine Wirtschaftlichkeit.

---

## 27. Energie, Wasser, Nachhaltigkeit und Versorgung

### 27.1 Energieverbrauch

Energie entsteht aus realen Verbrauchern:

- Heizung,
- Klima,
- Küche,
- Wäscherei,
- Wellness,
- Beleuchtung,
- IT,
- Aufzüge.

### 27.2 Wasserverbrauch

Wasser entsteht aus:

- Gästezimmern,
- Küche,
- Wäscherei,
- Pool,
- Spa,
- Reinigung.

### 27.3 Versorgungsverträge

Hotels können Verträge mit Versorgern besitzen.

Parameter:

- Grundpreis,
- Verbrauchspreis,
- Laufzeit,
- Preisbindung.

### 27.4 Versorgungsausfall

Seltene Ausfälle können operative Probleme erzeugen.

Notstrom reduziert einige Risiken.

### 27.5 Nachhaltigkeitsinvestitionen

Beispiele:

- Dämmung,
- moderne Heizung,
- Wärmerückgewinnung,
- Solar,
- effizientere Beleuchtung,
- wassersparende Armaturen,
- intelligente Gebäudesteuerung.

### 27.6 Kein Green-Score-Spiel

Nachhaltigkeit wirkt durch:

- Kosten,
- Verbrauch,
- Regulierung,
- Gästewünsche,
- Reputation.

### 27.7 Abfall

Abfall entsteht besonders aus:

- F&B,
- Verpackungen,
- Verbrauchsmaterialien.

### 27.8 Lieferketten

Regionale oder nachhaltige Lieferketten können:

- teurer sein,
- Reputation erhöhen,
- Transport- oder Krisenrisiken verändern.

---

## 28. Standortsuche, Entwicklung und Pre-Opening

### 28.1 Expansionsprozess

Neue Hotels entstehen nicht direkt per Klick.

Prozess:

1. Stadtanalyse,
2. Standortsuche,
3. Objekt-/Grundstücksprüfung,
4. Machbarkeitsstudie,
5. Verhandlung,
6. Finanzierung,
7. Genehmigung,
8. Bau oder Umbau,
9. Rekrutierung,
10. Pre-Opening-Marketing,
11. Eröffnung.

### 28.2 Standortanalyse

Bewertet:

- Nachfrage,
- Konkurrenz,
- Grundstückspreis,
- Verkehr,
- Arbeitsmarkt,
- Tourismus,
- regulatorisches Risiko.

### 28.3 Machbarkeitsstudie

Liefert Forecasts mit Unsicherheit.

### 28.4 Pre-Opening

Vor Eröffnung müssen unter anderem organisiert werden:

- Mitarbeiter,
- Lieferanten,
- IT,
- Inventar,
- Sales,
- Marketing,
- Buchungsfreigabe.

### 28.5 Ramp-up

Neue Hotels erreichen nicht sofort stabile Auslastung.

Marktbekanntheit und Prozesse benötigen Zeit.

---

## 29. Marktforschung und Informationsunsicherheit

### 29.1 Keine perfekte Information

Der Spieler sieht nicht alle zukünftigen Werte exakt.

### 29.2 Forecast-Bandbreite

Prognosen können als:

- Basiswert,
- optimistisches Szenario,
- pessimistisches Szenario

angezeigt werden.

### 29.3 Informationsqualität

Qualität steigt durch:

- erfahrene Manager,
- Marktforschung,
- bessere IT,
- mehr historische Daten,
- externe Berater.

### 29.4 Kosten

Bessere Information kostet Geld.

### 29.5 Überraschungen

Selbst gute Forecasts können durch neue Ereignisse falsch werden.

---

# Teil V – Stadt, Weltwirtschaft, Konkurrenz und alternative Geschichte

## 30. Stadtmodell

### 30.1 Stadtattribute

Jede spielbare Stadt besitzt mindestens:

- Bevölkerung,
- Arbeitskräfte,
- Einkommen,
- Unternehmensaktivität,
- Freizeit-Tourismus,
- Geschäftsreisen,
- Messe-/Kongressaktivität,
- internationale Erreichbarkeit,
- Hotelangebot,
- Immobilienpreise,
- Baukosten,
- Löhne,
- Energiepreise,
- Sicherheit,
- Kultur-/Freizeitattraktivität.

### 30.2 Dynamik

Diese Werte verändern sich systemisch.

### 30.3 Hotels beeinflussen die Stadt

Ein großer Hotel- oder Kongresscluster kann:

- Jobs schaffen,
- zusätzliche Veranstaltungen ermöglichen,
- Dienstleister anziehen,
- Grundstückspreise erhöhen,
- Nachfrage nach Verkehrsanbindung steigern.

### 30.4 Sättigung

Der Einfluss von Hotels besitzt abnehmenden Grenznutzen.

Ein zehntes Konferenzhotel erzeugt nicht denselben zusätzlichen Effekt wie das erste.

### 30.5 Zeitverzögerung

Stadtentwicklung reagiert nicht sofort.

Neue Infrastruktur oder Unternehmensansiedlung benötigt Zeit.

---

## 31. Verkehr und Erreichbarkeit

### 31.1 Verkehrsträger

Aggregiert modelliert werden können:

- Straße,
- Bahn,
- Flughafen,
- öffentlicher Nahverkehr.

### 31.2 Kapazität

Verkehrsknoten besitzen Kapazität und Qualität.

### 31.3 neue Verbindungen

Neue Flug- oder Bahnverbindungen können Nachfrage erhöhen.

### 31.4 Wegfall

Unprofitable Verbindungen können verschwinden.

### 31.5 Hotelwirkung

Starke Geschäftsnachfrage kann neue Verbindungen wirtschaftlich attraktiver machen.

### 31.6 Airporthotel

Airporthotels reagieren besonders auf:

- Flugplan,
- Crewbedarf,
- Anschlussprobleme,
- Nachtflüge.

---

## 32. Weitere Wirtschaftsakteure

Die Welt simuliert nicht nur Hotels.

Aggregierte Akteure können entstehen, wachsen und verschwinden:

- Unternehmen,
- Messeveranstalter,
- Eventveranstalter,
- Reiseveranstalter,
- Attraktionen,
- Verkehrsunternehmen,
- Immobilieninvestoren.

Diese Akteure erzeugen oder verändern Hoteldemand.

Eine Stadt darf nicht dynamische Hotels besitzen, während alle Nachfragequellen für immer statisch bleiben.

---

## 33. Konkurrenz-KI

### 33.1 Gleiche ökonomische Regeln

KI-Unternehmen unterliegen denselben Marktpreisen, Zinsen, Löhnen, Baukosten und Nachfragebedingungen wie der Spieler.

### 33.2 Keine Cheat-Boni

Erfolg des Spielers löst keine versteckten KI-Geldboni aus.

### 33.3 Unterschiedliche Simulationstiefe

Gleiche Regeln bedeuten nicht identische Rechentiefe.

Nicht sichtbare KI-Hotels dürfen aggregiert simuliert werden.

### 33.4 Informationsgrenzen

Konkurrenten kennen nicht die Zukunft.

Sie besitzen eigene Forecast-Qualität.

### 33.5 Entscheidungsfrequenz

KI entscheidet in unterschiedlichen Zyklen:

- Preise häufig,
- Personal operativ,
- Renovierung seltener,
- Expansion strategisch.

### 33.6 Strategietypen

Beispiele:

- Budgetstandardisierung,
- Luxusfokus,
- Familienunternehmen,
- Lifestyle,
- Immobilieninvestor,
- aggressive Expansion.

### 33.7 Investitionsentscheidung

KI vergleicht:

- erwartete Rendite,
- Kapitalbedarf,
- Schulden,
- Risiko,
- Portfoliofit.

### 33.8 Marktaustritt

Schwache Unternehmen können:

- Hotels verkaufen,
- Standorte verlassen,
- insolvent werden.

### 33.9 Rivalen

Ausgewählte Konkurrenten erhalten:

- Namen,
- Portrait,
- Persönlichkeit,
- Risikoaffinität,
- Erinnerungen an Beziehungen.

### 33.10 Rivalenbeziehungen

Interaktionen können beeinflusst werden durch:

- Hotelkäufe,
- Grundstückskonkurrenz,
- Personalabwerbung,
- Preiskriege,
- Kooperation,
- Fusionen.

### 33.11 Kein Plot Armor

Ein wichtiger Rivale kann früh scheitern.

Ein unbekannter Konkurrent kann zum Marktführer werden.

---

## 34. Makroökonomie

### 34.1 Kernvariablen

- Inflation,
- Zinsen,
- Kreditverfügbarkeit,
- Arbeitslosigkeit,
- Löhne,
- Energiepreise,
- Immobilienpreise,
- Konsum,
- Unternehmensinvestitionen,
- Reiseausgaben.

### 34.2 Rückkopplung

Beispiel:

niedrige Zinsen
→ mehr Kredit
→ mehr Bau
→ steigende Grundstückspreise
→ Überkapazität
→ Margendruck
→ Insolvenzen.

### 34.3 Systemische Krisen

Krisen entstehen aus Verwundbarkeit plus Auslöser.

### 34.4 Keine fixen Krisendaten

Eine Finanzkrise ist nicht fest an 2008 gebunden.

### 34.5 Marktaustritt als Stabilisator

Überkapazität kann durch:

- Schließungen,
- Insolvenz,
- Umnutzung,
- Investitionsstopp

wieder sinken.

### 34.6 Angebotselastizität

Hohe Preise und starke Nachfrage locken Investitionen an.

Bau dauert jedoch Zeit.

### 34.7 Kapazitätsgrenzen

Städte besitzen physische und wirtschaftliche Grenzen.

### 34.8 Abnehmender Grenznutzen

Mehr Infrastruktur oder Hotels erzeugen nicht unbegrenzt exponentielles Wachstum.

### 34.9 Produktivitätsanker

Langfristige Kosten- und Produktivitätstrends verhindern unrealistische exponentielle Entkopplung.

### 34.10 natürliche Gegenkräfte

Beispiele:

- steigende Löhne bei Arbeitskräftemangel,
- steigende Grundstückspreise bei Boom,
- neue Konkurrenz bei hohen Margen,
- sinkende Investition bei hohen Zinsen.

---

## 35. Schwarze Schwäne, Wetterrisiken und seltene Ereignisse

### 35.1 Seltene Ereignisse

Mögliche Klassen:

- Naturkatastrophen,
- Konflikte,
- Epidemien,
- Energiekrisen,
- große technische Durchbrüche.

### 35.2 Bedingungen

Ereignisse sollen regionale oder systemische Voraussetzungen besitzen.

### 35.3 Keine reine Bestrafung

Ein Ereignis kann für manche Unternehmen Krise und für andere Chance sein.

### 35.4 Versicherbarkeit

Bestimmte Risiken können versichert sein.

---

## 36. Technologie und alternative Geschichte

### 36.1 Keine feste Technologie-Timeline

Technologien haben keine garantierten Jahreszahlen nach 1991.

Jahresangaben dienen nur als Plausibilitätsreferenz für normale Ausgangsszenarien.

### 36.2 Technologiezyklus

Jede Technologie besitzt:

1. Voraussetzungen,
2. Entstehung,
3. frühe Adoption,
4. Massenadoption,
5. Standardisierung,
6. Veralterung.

### 36.3 Voraussetzungen

Technologien können abhängen von:

- anderen Technologien,
- Infrastruktur,
- Kapital,
- Nachfrage,
- Regulierung,
- Unternehmensinvestitionen.

### 36.4 Netzwerkeffekte

Ein Buchungsnetzwerk wird wertvoller, wenn mehr Hotels und Gäste teilnehmen.

### 36.5 konkurrierende Standards

Mehrere Standards können gleichzeitig existieren.

Beispiele:

- unterschiedliche Zahlungssysteme,
- Buchungsnetzwerke,
- digitale Schlüsselstandards.

### 36.6 Kostenkurve

Neue Technologie ist zunächst teuer und wird mit Verbreitung günstiger.

### 36.7 Adoption

Hotels müssen Technologie aktiv einführen.

Kosten können umfassen:

- Hardware,
- Software,
- Schulung,
- Umbau,
- Wartung.

### 36.8 Relevante Technologiefelder

- Computerisierung,
- elektronische Zahlung,
- Property Management Systems,
- Internet,
- Websites,
- Onlinebuchung,
- WLAN,
- Smartphones,
- Mobile Booking,
- digitale Schlüssel,
- Smart Rooms,
- Gebäudeautomation,
- Forecasting,
- KI-gestützte Managementsysteme.

### 36.9 alternative Plattformwirtschaft

In einer Partie können große OTAs dominieren.

In einer anderen können Hotelketten eigene Direktnetze etablieren.

### 36.10 UI reagiert auf reale Simulationsentwicklung

Die Benutzeroberfläche darf nicht automatisch 2010 Smartphone-Symbole zeigen, wenn Smartphones in dieser Welt noch keine relevante Adoption erreicht haben.

---

## 37. Gesellschaftliche Gästetrends

Gästewünsche verändern sich dynamisch.

Mögliche Trends:

- Nichtraucherzimmer,
- Businessservices,
- Fitness,
- Wellness,
- Internet,
- schnelles WLAN,
- Nachhaltigkeit,
- mobile Services,
- Coworking,
- individuelle Erlebnisse.

Trends besitzen:

- Entstehung,
- Zielgruppen,
- Verbreitung,
- Sättigung,
- mögliche Gegenbewegungen.

---

## 38. Politik, Regulierung und Compliance

### 38.1 Regulatorische Bereiche

- Steuern,
- Mindestlohn,
- Tourismusabgabe,
- Umweltstandard,
- Bauvorschrift,
- Arbeitsrecht,
- Visaregeln,
- Datenschutz,
- Hygiene,
- Lebensmittelsicherheit,
- Brandschutz,
- Barrierefreiheit.

### 38.2 Dynamik

Regeln können sich in der simulierten Welt ändern.

### 38.3 Compliance

Nicht erfüllte Regeln können verursachen:

- Bußgelder,
- Betriebsauflagen,
- Bereichsschließung,
- Reputationsschaden.

### 38.4 Abstraktion

Das Spiel simuliert relevante wirtschaftliche Folgen, nicht vollständige reale Gesetzestexte.

---

## 39. Währungen und internationale Expansion

### 39.1 Mehrere Währungen

Internationale Hotels können lokale Währungen verwenden.

### 39.2 Wechselkurse

Wechselkurse verändern:

- konsolidierte Ergebnisse,
- Reisekosten,
- Einkauf,
- Finanzierung.

### 39.3 Währungsrisiko

Ein Hotel kann lokal profitabel sein, aber im Konzernbericht durch Wechselkurse schwanken.

### 39.4 DM-Start

Deutsche Hotels starten 1991 mit DM.

### 39.5 Euro

Die reale Euro-Einführung wird nicht blind als garantiertes Datum erzwungen.

Eine gemeinsame europäische Währungsentwicklung kann als stark wahrscheinlicher, aber systemisch/politisch bedingter Pfad modelliert werden.

Alternativ kann für Produktklarheit ein historisch fixierter Währungsrahmen als konfigurierbare Ausnahme definiert werden.

Für die Kernvision gilt: Wirtschaftspfade sollen sich grundsätzlich verändern können.

---

# Teil VI – Konzern, Expansion und Kampagne

## 40. Konzernstruktur

### 40.1 Hotelportfolio

Jedes Hotel bleibt eine eigenständige operative Einheit.

### 40.2 Regionen

Mit Wachstum können Hotels Regionaldirektoren zugeordnet werden.

### 40.3 Konzernzentrale

Zentrale Funktionen:

- Finance,
- Treasury,
- HR,
- Einkauf,
- Marketing,
- Revenue Strategy,
- IT,
- Development.

### 40.4 Shared Services

Funktionen können zentralisiert werden.

Vorteile:

- Skaleneffekte,
- Standards,
- bessere Daten.

Nachteile:

- Bürokratie,
- geringere lokale Flexibilität.

### 40.5 interne Budgets

Jedes Hotel erhält:

- operatives Budget,
- Personalbudget,
- CapEx-Budget.

### 40.6 Zielvorgaben

Konzern kann Ziele setzen:

- GOP,
- Gästezufriedenheit,
- Personalfluktuation,
- Marktanteil,
- Markenstandard.

---

## 41. Managerdelegation und Governance

### 41.1 Managerfähigkeiten

Manager besitzen Skills und Stil.

### 41.2 Delegierbare Bereiche

- Preise,
- Personal,
- Einkauf,
- Marketing,
- kleinere Reparaturen,
- lokale Sales-Entscheidungen.

### 41.3 Entscheidungsgrenzen

Spieler setzt Limits.

Beispiel:

Hoteldirektor darf:

- Personal innerhalb Budget einstellen,
- Preise innerhalb Bandbreite ändern,
- Reparaturen bis 50.000 durchführen.

Er darf nicht:

- Hotel verkaufen,
- Millionenumbau starten,
- Konzernkredit aufnehmen.

### 41.4 Eskalation

Manager eskalieren Entscheidungen, die Limits überschreiten.

### 41.5 Managerqualität

Ein schlechter Manager kann:

- Chancen verpassen,
- zu spät reagieren,
- Personal falsch planen.

Ein guter Manager ist nicht perfekt.

### 41.6 Kontrolle

Der Spieler kann jederzeit eingreifen.

---

## 42. Juristische Einheiten

### 42.1 Abstraktion

Der Konzern darf Tochtergesellschaften abstrahiert abbilden.

### 42.2 Gründe

Relevant für:

- lokale Finanzierung,
- Steuern,
- Joint Ventures,
- Verkäufe,
- Risikoabgrenzung.

### 42.3 Kein Steuerberater-Simulator

Die Struktur bleibt spielbar und verständlich.

---

## 43. Markenportfolio

### 43.1 Markentypen

Beispiele:

- Budget,
- Business,
- Boutique,
- Resort,
- Luxury.

### 43.2 Markenbekanntheit

Bekanntheit kann regional unterschiedlich sein.

### 43.3 Brand Fit

Nicht jedes Objekt passt zu jeder Marke.

### 43.4 Rebranding

Hotels können Marke wechseln.

Kosten:

- Renovierung,
- Marketing,
- temporäre Unsicherheit.

---

## 44. Übernahmen, Fusionen und Verkäufe

### 44.1 Hotelkauf

Vor Kauf sieht der Spieler eine Due-Diligence-Zusammenfassung.

### 44.2 Due Diligence

Enthält:

- Umsatz,
- Schulden,
- Zustand,
- Renovierungsstau,
- Verträge,
- Personal,
- Markenrechte,
- Risiken.

### 44.3 Unternehmenserwerb

Später können ganze Gruppen übernommen werden.

### 44.4 Integration

Nach Übernahme:

- Marke behalten,
- rebranden,
- verkaufen,
- Funktionen zentralisieren.

### 44.5 Fusion

Fusionen können strategische Vorteile und Integrationsrisiken besitzen.

---

## 45. Kampagne, Story und dynamische Ereignisse

### 45.1 Keine lineare Story

Story entsteht aus der Simulation.

### 45.2 Karriere-Meilensteine

Beispiele:

- erstes profitables Jahr,
- erste Millionen Umsatz,
- erster großer Umbau,
- zweites Hotel,
- erste Marke,
- internationale Expansion,
- Konzernzentrale,
- 50. Hotel.

### 45.3 Eventbedingungen

Events besitzen Voraussetzungen.

Beispiel Überbuchungsskandal:

- aggressive Überbuchung,
- hohe Auslastung,
- tatsächlich verdrängte Gäste,
- Medieninteresse.

### 45.4 Positive Ereignisse

- prominenter Gast,
- Restaurantdurchbruch,
- neues Großunternehmen,
- wachsende Messe,
- überraschend erfolgreiche Marke.

### 45.5 Langfristige Entscheidungen

Entscheidungen können Jahrzehnte später wirken.

Beispiel:

Beteiligung an einem jungen Buchungsnetzwerk.

### 45.6 Keine Gut/Böse-Punkte

Strategische Entscheidungen werden nicht moralisch mit simplen Punkten bewertet.

Beispiel defizitäres Hotel:

- sanieren,
- verkaufen,
- schließen,
- Luxusumbau.

Jede Option besitzt andere wirtschaftliche und soziale Folgen.

---

## 46. Schlüsselmitarbeiter

Neben normalen Mitarbeitern existieren langfristig erinnerungswürdige Führungskräfte.

Mögliche Rollen:

- Hoteldirektor,
- Küchenchef,
- Finance Director,
- HR Director,
- Marketing Director,
- Revenue Manager,
- Regional Director.

Ein Mitarbeiter kann über Jahrzehnte Karriere machen.

Diese Figuren stärken Unternehmensgeschichte, ohne das Spiel in ein Rollenspiel zu verwandeln.

---

## 47. Medienlandschaft

### 47.1 frühe Medien

- Zeitung,
- Reiseführer,
- Fernsehen,
- Mundpropaganda.

### 47.2 spätere Medien

- Onlineportale,
- Bewertungsseiten,
- Blogs,
- Social Media,
- Influencer.

### 47.3 Krisendynamik

Die Geschwindigkeit und Reichweite von Reputationsereignissen verändert sich mit Medienentwicklung.

---

## 48. Welt- und Unternehmenschronik

### 48.1 Unternehmenschronik

Speichert wichtige Ereignisse wie:

- Eröffnungen,
- Übernahmen,
- Krisen,
- Rekorde,
- Rivalenkonflikte,
- Markenstarts.

### 48.2 Weltchronik

Speichert wichtige Weltentwicklungen:

- neue Wirtschaftszentren,
- Technologieplattformen,
- Krisen,
- Verkehrsentwicklungen,
- große Unternehmensfusionen.

### 48.3 Ziel

Der Spieler soll nach Jahrzehnten sagen können:

**„So hat sich meine Welt entwickelt.“**


# Teil VII – Benutzeroberfläche, Isometrie, Onboarding und Feedback

## 49. Hauptansicht und UI-Grundprinzip

### 49.1 Zwei Ebenen

Die Oberfläche verbindet:

- lebendige isometrische Hotelwelt,
- Management-Dashboard.

### 49.2 direkte Selektion

Klick auf ein Zimmer zeigt:

- Status,
- Gast,
- Preis,
- Ausstattung,
- Zustand,
- letzte Renovierung,
- offene Probleme.

Klick auf ein Restaurant zeigt:

- Sitzplätze,
- Auslastung,
- aktuelle Gäste,
- Personal,
- Wartezeit,
- Umsatz,
- Küchenengpass.

### 49.3 Probleme sichtbar machen

Beispiele:

- defekter Aufzug steht sichtbar,
- Lobby zeigt Warteschlange,
- schmutzige Zimmer werden markiert,
- überlastete Bar zeigt fehlende Bedienung.

### 49.4 Top-Bar

Permanent sichtbar:

- Datum,
- Uhrzeit,
- Spielgeschwindigkeit,
- Cash,
- Monatsgewinn/-verlust,
- Auslastung,
- Reputation,
- Warnungen.

---

## 50. Management-Navigation

### 50.1 Hotel

- Übersicht,
- Zimmer,
- Ausstattung,
- Bau,
- Renovierung,
- Technik.

### 50.2 Gäste

- Zufriedenheit,
- Beschwerden,
- Segmente,
- Bewertungen,
- Stammgäste,
- Loyalty.

### 50.3 Personal

- Mitarbeiter,
- Bewerber,
- Abteilungen,
- Schichten,
- Gehälter,
- Training,
- Arbeitsklima.

### 50.4 Finanzen

- GuV,
- Cashflow,
- Bilanz,
- Kredite,
- Investitionen,
- Kostenanalyse,
- Versicherungen.

### 50.5 Revenue

- Preise,
- Forecast,
- Buchungslage,
- Pickup,
- Rate Plans,
- Wettbewerb,
- Channels,
- Überbuchung.

### 50.6 Marketing & Sales

- Kampagnen,
- Zielgruppen,
- PR,
- Marken,
- CRM,
- Firmenkunden,
- Leads.

### 50.7 Gastronomie

- Restaurants,
- Bars,
- Menüs,
- Einkauf,
- Food Cost,
- Waste.

### 50.8 Markt

- Stadt,
- Konkurrenz,
- Immobilien,
- Tourismus,
- Events,
- Verkehr,
- Arbeitsmarkt.

### 50.9 Unternehmen

- Portfolio,
- Marken,
- Manager,
- Zentrale,
- Expansion,
- Treasury,
- M&A.

---

## 51. Ursachenanalyse statt Zahlenfriedhof

### 51.1 Warum-Anzeige

Wichtige Kennzahlen besitzen Driver Analysis.

Beispiel:

**Auslastung 63 %, -8 Prozentpunkte**

Treiber:

- Business Demand -12 %,
- neue Konkurrenz +240 Zimmer,
- eigener Preis +9 % über Markt,
- Messeeffekt +4 %,
- Reputation +2 %.

### 51.2 Ebenen der Detailtiefe

Einsteiger:

`Restaurant überlastet.`

Fortgeschritten:

`Küche 94 % | Service 81 % | Sitzplätze 68 % | Wartezeit 24 min.`

Experte:

- einzelne Stationen,
- Schichten,
- Rezepte,
- Mitarbeiter,
- Nachfrageverlauf.

---

## 52. Monatsabschluss

Jeder Monat erhält eine kompakte Managementauswertung.

Mindestens:

- Umsatz,
- operativer Gewinn,
- Cashflow,
- Auslastung,
- ADR,
- RevPAR,
- Gästezufriedenheit,
- Personalfluktuation.

Drei Kernbereiche:

### Was lief gut?

Beispiel:

`Konferenzgeschäft erreichte einen Rekord.`

### Was lief schlecht?

Beispiel:

`Housekeeping verursachte 43 verspätete Zimmerfreigaben.`

### Was verändert sich?

Beispiel:

`Zwei Wettbewerber planen neue Hotels.`

---

## 53. Late-Game-Portfolioansicht

Der Spieler kann alle Hotels vergleichen.

Pro Hotel sichtbar:

- Stadt,
- Marke,
- Qualitätsstufe,
- Auslastung,
- Gewinn,
- Cashbedarf,
- Warnungen,
- Manager,
- Renovierungsbedarf.

Drilldown:

**Konzern → Region → Hotel → Abteilung → einzelnes Zimmer.**

---

## 54. Notification Management

### 54.1 Prioritätsstufen

- Info,
- Hinweis,
- Warnung,
- Kritisch.

### 54.2 Filter

Spieler können Benachrichtigungen filtern nach:

- Hotel,
- Region,
- System,
- Kritikalität.

### 54.3 Auto-Pause

Spieler können definieren, welche Ereignisse die Simulation pausieren.

### 54.4 Delegierte Meldungen

Wenn ein Manager ein Problem selbst lösen darf, kann die Meldung niedriger priorisiert werden.

### 54.5 Late-Game-Schutz

Das System muss verhindern, dass 30 Hotels gleichzeitig unkontrollierbare Benachrichtigungsfluten erzeugen.

---

## 55. Isometrische Hotelwelt

### 55.1 Renderer

Die isometrische Welt ist eine eigene Präsentationsschicht und enthält keine autoritative Wirtschaftslogik.

### 55.2 Kamera

Kamera unterstützt:

- Pan,
- Zoom,
- Fokus auf Problem,
- Fokus auf Raum,
- Fokus auf Person.

### 55.3 Etagen

Spieler können:

- Etage auswählen,
- obere Etagen ausblenden,
- Gebäudeschnitt darstellen,
- Servicebereiche hervorheben.

### 55.4 Raumselektion

Räume besitzen klare Click-/Touch-Ziele.

### 55.5 Agentenbewegung

Sichtbare Agenten benutzen ein abstrahiertes Navigationsnetz.

### 55.6 Pathfinding

Navigation berücksichtigt:

- Türen,
- Flure,
- Treppen,
- Aufzüge,
- gesperrte Bereiche.

### 55.7 Aufzüge

Aufzüge besitzen:

- Kapazität,
- Fahrzeit,
- Warteschlange,
- Zustand.

### 55.8 Treppen

Treppen sind alternative Wege, aber nicht für alle Gäste gleich attraktiv.

### 55.9 Warteschlangen

Warteschlangen sind echte operative Objekte mit:

- Ankunftsrate,
- Servicekapazität,
- Wartezeit.

### 55.10 Raumzustände

Visuelle Zustände zeigen:

- sauber,
- schmutzig,
- defekt,
- geschlossen,
- im Umbau,
- überlastet.

### 55.11 Tag/Nacht

Beleuchtung und Aktivität verändern sich mit Tageszeit.

### 55.12 Animationen

Animationen sollen Zustand verständlich machen, nicht Simulation doppeln.

### 55.13 sichtbare Agentengrenze

Nur eine begrenzte Zahl von Personen wird vollständig gerendert.

Nicht sichtbare Nachfrage bleibt aggregiert.

### 55.14 LOD

Bei Zoom-Out können Agenten und Details vereinfacht werden.

---

## 56. Retro-Modern-UI-Evolution

### 56.1 frühe Ästhetik

Mögliche Elemente:

- Papier,
- frühe Desktop-Software,
- Fax,
- Telefon,
- analoge Icons.

### 56.2 digitale Entwicklung

Mit Adoption neuer Technologien verändern sich:

- Panels,
- Geräte,
- Kommunikationsdarstellung,
- Datenvisualisierung.

### 56.3 stabile Bedienung

Navigation, Tastenkürzel und Informationshierarchie bleiben konsistent.

---

## 57. Onboarding und Zugänglichkeit

### 57.1 Tutorial

Das Tutorial führt nicht über abstrakte Menüs, sondern über konkrete Hotelprobleme.

Beispiel:

1. erstes Zimmer reinigen,
2. ersten Preis setzen,
3. Gast einchecken,
4. Schichtproblem lösen,
5. Monatsabschluss verstehen.

### 57.2 kontextuelle Hilfe

Jede wichtige Kennzahl besitzt kurze Erklärung.

### 57.3 empfohlene Aktionen

Assistenten können Vorschläge machen, ohne automatisch auszuführen.

### 57.4 Automatisierungs-Presets

Einsteiger können vorkonfigurierte Automatisierung nutzen.

### 57.5 Tastatursteuerung

Alle zentralen Managementfunktionen müssen per Tastatur erreichbar sein.

### 57.6 Skalierung

UI unterstützt vergrößerte Schrift und skalierbare Panels.

### 57.7 Kontrast

Kritische Zustände dürfen nicht nur durch Farbe kommuniziert werden.

### 57.8 Bewegung

Option für reduzierte Animationen.

### 57.9 Screenreader-Alternative

Wichtige Managementinformationen müssen semantisch in React-DOM verfügbar sein.

Die Canvas-/Renderer-Welt darf nicht die einzige Informationsquelle sein.

---

## 58. Audio und Feedback

### 58.1 Hotelatmosphäre

Soundscape reagiert auf:

- Auslastung,
- Tageszeit,
- Hoteltyp,
- aktive Bereiche.

### 58.2 UI-Sounds

Bestätigungen und Warnungen erhalten zurückhaltendes Audiofeedback.

### 58.3 kritische Alarme

Nur echte kritische Situationen dürfen alarmierende Sounds erzeugen.

### 58.4 Musik

Musik kann sich stilistisch über die Jahrzehnte entwickeln, ohne reale geschützte Musik zu kopieren.

### 58.5 Audiooptionen

Getrennte Lautstärke für:

- Musik,
- Ambiente,
- UI,
- Warnungen.

---

# Teil VIII – Technische Architektur

## 59. Architekturgrundsatz

**React rendert und bedient das Spiel. React ist nicht die Simulation.**

Die autoritative Simulation läuft von Beginn an außerhalb des React-Main-Threads in einem Web Worker.

Hauptsysteme:

1. Simulation Engine,
2. Domain State,
3. Commands,
4. Domain Events,
5. Content/Data Layer,
6. Worker Protocol,
7. Isometric Renderer,
8. React UI,
9. Persistence,
10. Debug/Observability.

---

## 60. Simulationszeit und Tick-Ebenen

### 60.1 Minute / häufig

- sichtbare Bewegung,
- Warteschlangen,
- Check-in,
- Aufzüge,
- Restaurantbetrieb,
- Zimmerstatus.

### 60.2 stündlich

- Personalbelastung,
- Reinigung,
- Restaurantnachfrage,
- Energie,
- Technik.

### 60.3 täglich

- neue Nachfrage,
- Buchungen,
- Stornierungen,
- No-Shows,
- Bewertungen,
- Lieferungen,
- Mitarbeiterzufriedenheit.

### 60.4 monatlich

- GuV,
- Kreditservice,
- Marktanteil,
- Wettbewerberinvestitionen,
- Stadtentwicklung,
- Technologiediffusion,
- wichtige Eventauswertung.

### 60.5 jährlich

- langfristige Trends,
- große Immobilienentwicklungen,
- strategische KI,
- Konzernentwicklung,
- Gesellschaftstrends.

---

## 61. Command-System

### 61.1 Prinzip

Spieleraktionen werden als typisierte Commands an die Simulation geschickt.

Beispiele:

- `SetRoomRate`,
- `HireEmployee`,
- `FireEmployee`,
- `CreateShift`,
- `PlacePurchaseOrder`,
- `StartRenovation`,
- `TakeLoan`,
- `AcceptGroupContract`,
- `ChangeOverbookingLimit`,
- `AssignManager`.

### 61.2 Command-Aufbau

Jeder Command enthält mindestens:

- commandId,
- gameTime,
- actor,
- payload,
- expectedStateVersion optional.

### 61.3 Validierung

Commands werden vor Ausführung validiert.

Beispiel `StartRenovation` prüft:

- Besitz/Berechtigung,
- Fläche,
- Cash/Finanzierung,
- technische Voraussetzungen,
- Projektkonflikte.

### 61.4 Ablehnung

Ungültige Commands verändern keinen Zustand.

Sie liefern strukturierten Fehler zurück.

---

## 62. Domain Events

Commands erzeugen nach erfolgreicher Verarbeitung Domain Events.

Beispiele:

- `RoomRateChanged`,
- `EmployeeHired`,
- `ReservationCreated`,
- `GuestCheckedIn`,
- `RoomBecameDirty`,
- `ReviewCreated`,
- `LoanTaken`,
- `RenovationStarted`.

Events können von mehreren Systemen verarbeitet werden.

Beispiel `ReviewCreated` beeinflusst:

- Reputation,
- Marketing,
- Chronicle,
- Story Evaluation.

---

## 63. Determinismus

### 63.1 Ziel

Gleicher Zustand + gleiche Commands + gleiche RNG-Zustände = gleiches Ergebnis.

### 63.2 Seeded RNG

Die Simulation nutzt deterministische Zufallszahlengeneratoren.

### 63.3 getrennte RNG-Streams

Empfohlene Streams:

- guests,
- staffing,
- failures,
- economy,
- events,
- weather,
- AI.

Ein neues visuelles Zufallsereignis darf nicht plötzlich Wirtschaftsresultate verändern.

### 63.4 RNG-State im Save

Alle relevanten Stream-Zustände werden gespeichert.

---

## 64. Deterministische Simulationsreihenfolge

Für denselben Tick gilt eine feste Reihenfolge.

Beispiel:

1. Commands anwenden,
2. Zeitfortschritt,
3. Anreisen/Abreisen,
4. Room State,
5. Staff Service,
6. Facility Throughput,
7. Verbrauch/Lager,
8. Wartung/Ausfälle,
9. Zufriedenheit,
10. Finanzbuchungen,
11. Demand/Booking Updates,
12. Events,
13. Snapshot erzeugen.

Simultane Objekte werden nach stabiler ID-Reihenfolge verarbeitet.

---

## 65. Numerische Regeln

### 65.1 Geld

Geld wird nicht als JavaScript-Floating-Point-Eurobetrag gespeichert.

Es wird in kleinster Einheit als Integer gespeichert.

Beispiele:

- Pfennig,
- Cent,
- jeweilige lokale Minor Unit.

### 65.2 Fixed Point

Prozentsätze und Raten verwenden definierte Fixed-Point-Skalierung, wo Determinismus relevant ist.

### 65.3 Rundung

Jede Berechnungsklasse erhält feste Rundungsregel.

Beispiele:

- Preise auf Minor Unit,
- Steuern mit definierter Banker's/half-up-Regel,
- Prozentkennzahlen erst bei Anzeige runden.

### 65.4 keine NaN/Infinity

State Guards verbieten:

- NaN,
- Infinity,
- negative Zimmeranzahl,
- Auslastung > physisch möglicher Grenze ohne explizite Buchungsüberhangdefinition.

---

## 66. Web-Worker-Architektur

### 66.1 Worker von Beginn an

Die Simulation läuft im Worker, nicht erst nach späterer Performanceoptimierung.

### 66.2 Main Thread

Main Thread verantwortet:

- React,
- Input,
- Pixi/Renderer,
- Audio,
- UI-State.

### 66.3 Worker

Worker verantwortet:

- autoritativen Game State,
- Simulation,
- AI,
- Economy,
- Commands,
- Save Snapshot Preparation.

---

## 67. Worker-Protokoll

### 67.1 Nachrichten UI → Worker

- `INIT_GAME`,
- `LOAD_GAME`,
- `COMMAND`,
- `SET_SPEED`,
- `PAUSE`,
- `RESUME`,
- `REQUEST_SAVE`,
- `REQUEST_DETAILS`.

### 67.2 Nachrichten Worker → UI

- `READY`,
- `COMMAND_ACCEPTED`,
- `COMMAND_REJECTED`,
- `STATE_DELTA`,
- `SNAPSHOT`,
- `DOMAIN_EVENTS`,
- `SAVE_DATA`,
- `SIMULATION_ERROR`,
- `PERF_SAMPLE`.

### 67.3 Versionierung

Worker-Protokoll besitzt Versionsnummer.

### 67.4 Fehler

Worker-Fehler dürfen UI nicht still hängen lassen.

Die UI zeigt Recovery-Optionen.

---

## 68. Game State

Top-Level-State enthält mindestens:

- meta,
- calendar,
- economy,
- currencies,
- technologies,
- cities,
- companies,
- hotels,
- laborMarkets,
- transport,
- events,
- history,
- settings,
- rngState.

Hotel-State enthält mindestens:

- identity,
- ownership,
- building,
- rooms,
- facilities,
- departments,
- employees,
- guests,
- reservations,
- inventory,
- suppliers,
- finances,
- reputation,
- pricing,
- maintenance,
- management.

---

## 69. Sichtbare Agenten vs. statistische Population

### 69.1 Aggregation

Die Welt simuliert nicht Millionen einzelne Touristen.

### 69.2 Materialisierung

Nur relevante Gäste des aktiven Hotels werden als sichtbare Agenten materialisiert.

### 69.3 Konsistenz

Materialisierung darf keine zusätzliche Nachfrage erzeugen.

Sie ist Darstellung einer bereits berechneten Reisepartei.

---

## 70. Content-Schema

### 70.1 Datengetrieben

Content wird nicht hart in UI-Komponenten codiert.

### 70.2 Stabile IDs

Jedes Content-Objekt besitzt stabile ID.

Beispiele:

- `city.frankfurt.de`,
- `room.standard.single`,
- `tech.wifi`,
- `facility.breakfast_room`.

### 70.3 Schema-Version

Content-Schemas besitzen Version.

### 70.4 Referenzvalidierung

Ungültige IDs oder fehlende Referenzen werden beim Build/Load erkannt.

### 70.5 Einheiten

Datenfelder deklarieren eindeutige Einheiten.

Beispiele:

- minorCurrency,
- squareMeters,
- minutes,
- percentBasisPoints.

### 70.6 Defaults

Defaults werden zentral definiert und nicht still in mehreren Systemen dupliziert.

---

## 71. Content-Authoring-Werkzeuge

Benötigt werden interne Tools für:

- Städte,
- Technologien,
- Zimmermodule,
- Facilities,
- Events,
- Gästesegmente,
- Rezepte,
- Lieferanten,
- Konkurrenten,
- Markenstandards.

### 71.1 Validator

Der Validator prüft:

- IDs,
- Referenzen,
- Einheiten,
- Wertebereiche,
- Technologieabhängigkeiten.

### 71.2 Balancing-Editor

Parameter sollen bearbeitbar sein, ohne Engine-Code umzuschreiben.

---

## 72. Persistenz und Savegames

### 72.1 Browser-Speicher

IndexedDB ist der primäre lokale Speicher.

### 72.2 Save Slots

Mehrere manuelle Slots.

### 72.3 Autosaves

- monatlich,
- jährlich,
- optional vor Großentscheidungen.

### 72.4 Recovery Saves

Mehrere vorherige Autosaves bleiben erhalten.

### 72.5 Save-Version

Save enthält Strukturversion.

### 72.6 Content-Version

Save enthält verwendete Content-Versionen.

### 72.7 Migration

Ältere Saves werden über explizite Migrationen geladen.

### 72.8 Content-Update-Semantik

Für Contentänderungen muss definiert werden:

- übernimmt alter Save neue Balancingwerte,
- oder konserviert er alte Werte?

Empfehlung:

Strukturelle Definitionen werden migriert; reine Balancingparameter können versionsabhängig eingefroren werden, wenn sonst die laufende Partie fundamental kippt.

### 72.9 Export

Savegames können als Datei exportiert werden.

### 72.10 Import

Exportierte Saves können wieder importiert werden.

### 72.11 Cloud Saves

Nicht P0, aber Architektur darf spätere Cloud-Synchronisation nicht verhindern.

---

## 73. Transaktionen und Fehlerrobustheit

### 73.1 Transaktionale Großaktionen

Hotelkauf, Kredit oder Großumbau werden atomar verarbeitet.

### 73.2 Validierung beim Laden

Ungültige Saves werden nicht blind gestartet.

### 73.3 Recovery

Bei Worker- oder Savefehler kann der letzte Recovery Save geladen werden.

### 73.4 Fehlerisolierung

Ein fehlerhafter Gast darf nicht die gesamte Simulation zerstören.

---

## 74. Observability, Replay und Debug-Trace

### 74.1 Command Trace

Debugmodus kann Commands protokollieren.

### 74.2 Event Trace

Domain Events werden bei Bedarf mit Ursache protokolliert.

### 74.3 RNG Trace

Für schwer reproduzierbare Fehler kann der verwendete RNG-Stream und Draw-Index geloggt werden.

### 74.4 Replay

Ein Save plus Command-Log kann Simulation reproduzieren.

### 74.5 State Diff

Debugwerkzeuge können Unterschiede zwischen zwei Simulationen anzeigen.

### 74.6 Ursache-Wirkung

Ein Debugtrace soll beantworten können:

- Welcher Command änderte den Preis?
- Warum wurde diese Buchung erzeugt?
- Warum wurde ein Mitarbeiter überlastet?
- Warum änderte sich Cash?

---

## 75. Performancebudgets

Ziele werden messbar definiert.

### 75.1 UI

Ziel:

- 60 FPS bei normaler Hotelansicht auf Zielhardware,
- keine längeren Main-Thread-Blocks durch Simulation.

### 75.2 Worker-Latenz

Normale Commands sollen typischerweise innerhalb eines kleinen zweistelligen Millisekundenbudgets bestätigt werden, sofern kein Fast-Forward läuft.

### 75.3 Simulationsbudget

Ein normaler Simulationstick muss unter dem für die gewählte Geschwindigkeit verfügbaren Workerbudget bleiben.

### 75.4 sichtbare Agenten

Zielwert für aktive Szene wird als Performancekonfiguration festgelegt, beispielsweise 200–500 sichtbare Agenten je nach Hardwareprofil.

### 75.5 Speicher

Save- und History-Daten werden komprimiert/aggregiert, bevor sie unbegrenzt wachsen.

### 75.6 Reife Kampagne

Architekturziel:

- ca. 60 Spielerhotels,
- 25+ aktive Städte,
- 40 Konkurrenten,
- mehrere Jahrzehnte Historie.

### 75.7 Savegröße

Savegröße erhält ein explizites Monitoring-Budget.

### 75.8 Benchmark

CI bzw. Entwicklungsworkflow enthält deterministische Simulationsbenchmarks.

---

## 76. Testing

### 76.1 Unit Tests

Testen isolierte Regeln:

- Preiselastizität,
- Zimmerstatus,
- Fixed-Point-Geld,
- Lager,
- Schichtkapazität.

### 76.2 Systemtests

Testen Ketten:

- niedriger Preis → höhere Conversion → höhere Auslastung → Housekeepinglast,
- niedrige Zinsen → Bauinvestition → mehr Zimmerangebot.

### 76.3 Determinismustests

Gleiche Seeds und Commands müssen identischen State Hash erzeugen.

### 76.4 Save-Migrationstests

Jede Save-Migration besitzt Fixtures.

### 76.5 Long-Run-Tests

Automatisierte 30–50 Jahre prüfen:

- runaway money,
- vollständigen KI-Kollaps,
- unrealistische Immobilienpreise,
- permanente Arbeitsmarktblockade,
- Technologie-Stillstand,
- exponentielle Nachfrage.

### 76.6 Property Tests

Wichtige Invarianten:

- Cash ist Integer,
- Zimmeranzahl nicht negativ,
- verkaufte physische Zimmernächte überschreiten reale Kapazität nur im Reservierungsbestand, nicht im tatsächlichen Aufenthalt,
- Bilanzgleichungen bleiben konsistent.

### 76.7 E2E

Browser-E2E prüft:

- Spiel starten,
- Preis ändern,
- Gast buchen/einchecken,
- Personal ändern,
- Monat abschließen,
- speichern,
- laden.

---

## 77. Balancing und Langzeitstabilität

### 77.1 Fast Simulation

Interne Tools können Jahrzehnte ohne Rendering simulieren.

### 77.2 Kennzahlen

Balancing-Dashboard zeigt:

- Hotelanzahl,
- Auslastung,
- ADR,
- RevPAR,
- Insolvenzen,
- Löhne,
- Grundstückspreise,
- Technologieadoption,
- Vermögen,
- Nachfrage.

### 77.3 Anti-Runaway-Prüfungen

Automatische Checks erkennen:

- exponentielles Stadtwachstum,
- unendliche Margen,
- monopolistische Dauerzustände ohne Gegenkräfte,
- Preis-/Lohnentkopplung.

---

## 78. Lokalisierung und internationale Darstellung

### 78.1 Sprache

Engine enthält keine fest codierten UI-Texte.

### 78.2 Zahlen

Formatierung ist locale-abhängig.

### 78.3 Datum

Datumsformat ist locale-abhängig.

### 78.4 Währungen

Darstellung berücksichtigt:

- Symbol,
- Minor Units,
- Position des Symbols.

### 78.5 Einheiten

Einheiten können lokalisiert dargestellt werden.

### 78.6 Namen

Städte, Personen und Unternehmen können lokalisierte Anzeigenamen besitzen.

---

# Teil IX – Original-Parität und Produktgrenzen

## 79. Original-Paritätsprinzip

Der Anspruch lautet nicht, geschützte Assets zu kopieren.

Der Anspruch lautet:

**die strategische Funktion belegbarer Originalsysteme zu verstehen und in moderner Form mindestens gleichwertig abzubilden.**

Für jedes Originalsystem wird dokumentiert:

1. belegter Funktionsbegriff,
2. vermuteter/gesicherter Originalzweck,
3. strategische Entscheidung,
4. moderne Umsetzung,
5. bewusste Abweichung.

Nicht verifizierte Mechaniken werden nicht als historische Tatsache behauptet.

---

## 80. Mindest-Paritätsmatrix aus dem bereitgestellten C64-Material

### 80.1 `STELLEN`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Recruiting / offene Stellen / Personal.  
**Status:** übernommen und wesentlich vertieft.

### 80.2 `SERVICE`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Servicelevel, Gästebetreuung, Front Office, F&B, Recovery.  
**Status:** übernommen und vertieft.

### 80.3 `BANK`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Kredite, Cash, Finanzierung, Treasury.  
**Status:** übernommen und vertieft.

### 80.4 `WERBUNG`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Marketing, Kampagnen, PR, Kanäle.  
**Status:** übernommen und vertieft.

### 80.5 `HOTELS`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Hotel-/Portfolioverwaltung.  
**Status:** übernommen und stark erweitert.

### 80.6 `PREISE`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Revenue Management, Rate Plans, Segmentpreise.  
**Status:** übernommen und stark erweitert.

### 80.7 `VERSICHERUNG`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Versicherungen, Schadensfälle, Risikotransfer.  
**Status:** übernommen und vertieft.

### 80.8 `VERTRAG`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Lieferanten-, Firmen-, Gruppen-, Betreiber- und andere Verträge.  
**Status:** übernommen und systematisiert.

### 80.9 `ZEITUNG`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Medien-, Markt- und Ereignisfeedback; frühe Zeitung als Informationskanal.  
**Status:** übernommen als Teil dynamischer Medienlandschaft.

### 80.10 `RENOV`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Soft/Technical/Full Renovation, Conversion.  
**Status:** übernommen und stark erweitert.

### 80.11 `BANKROTT`

**Belegt:** Funktionsbegriff im Diskettenmaterial.  
**Moderne Entsprechung:** Insolvenz, Restrukturierung, Game-Over-Regeln.  
**Status:** übernommen und differenziert.

### 80.12 `POOL`

**Belegt:** Pool-Bezug im Diskettenmaterial.  
**Moderne Entsprechung:** Pool/Spa/Wellness-Infrastruktur.  
**Status:** übernommen und erweitert.

### 80.13 weitere Originalprüfung

Weitere Originalfunktionen müssen bei belastbarer Verifikation ergänzt werden.

Nicht belegte Funktionen werden in der Matrix als `unverified` geführt.

---

## 81. Verhaltensparität

Feature-Parität allein reicht nicht.

Für jedes belegte System wird geprüft:

- Welche Entscheidung musste der Spieler treffen?
- Welche Ressource war knapp?
- Welcher Trade-off entstand?
- Welche Folge wurde sichtbar?

Beispiel `PREISE`:

Nicht ausreichend:

`Es gibt irgendwo ein Preisfeld.`

Erforderlich:

Preis muss echte Nachfrage, Auslastung und Umsatz beeinflussen.

Beispiel `VERSICHERUNG`:

Nicht ausreichend:

`Versicherung existiert als Checkbox.`

Erforderlich:

Prämie muss gegen Schadensrisiko und Liquidität abgewogen werden.

---

## 82. Non-Goals

Explizit nicht Teil der Kernvision:

- kein Multiplayer,
- kein Hotseat,
- kein vollständig freier Wandbau,
- keine Simulation jedes einzelnen Stadtbewohners,
- keine vollständige Regierungssimulation,
- kein realer Hotelmarken-Clone,
- keine geschützten Originalgrafiken oder Texte,
- keine garantierte historische Zukunft nach 1991,
- keine Cheat-KI nur wegen Spielerfolg,
- kein Zwang, jedes Hotel manuell zu micromanagen,
- kein Zwang, jede Einrichtung in jedem Hotel zu bauen,
- kein vollständiger Steuerrechts-Simulator,
- keine exakte reale Gesetzesdatenbank.

---

## 83. Acceptance Principles für neue Features

Ein neues Feature gehört nur ins Spiel, wenn es mindestens einen dieser Zwecke erfüllt:

- erzeugt eine verständliche Hotelmanagement-Entscheidung,
- erzeugt sichtbare operative Folgen,
- verstärkt den Langzeitfortschritt,
- vertieft systemische Kausalität,
- erzeugt sinnvolle kurz-/langfristige Trade-offs,
- verbessert Delegation,
- erklärt die Simulation besser,
- unterstützt Original-Verhaltensparität.

Komplexität ohne Entscheidung oder Feedback wird abgelehnt.

---

# Teil X – Implementierungszerlegung

## 84. Subprojekt 1 – 1991 Single-Hotel Vertical Slice

Ziel:

Kernspiel mit einem Hotel beweisen.

Enthält mindestens:

- React-App,
- Web-Worker-Simulation,
- deterministische Uhr,
- Frankfurt-1991-Baseline,
- ein Hotel,
- isometrische Ansicht,
- Zimmer,
- Rezeption,
- Housekeeping,
- Frühstücksrestaurant/Küche,
- Basis-Personal,
- Basis-Beschaffung,
- Buchungen,
- Preise,
- Finanzen,
- Wartung,
- Monatsabschluss,
- IndexedDB Save/Load,
- Ursachenanzeigen.

---

## 85. Subprojekt 2 – Hotel Depth & Specialization

Erweitert:

- tiefere Zimmerprodukte,
- Bar,
- Wellness,
- Fitness,
- Konferenz,
- Room Service,
- Engineering,
- Staff Areas,
- Parken,
- Security,
- Spezialhotelkonzepte.

---

## 86. Subprojekt 3 – City Market & Competitors

Erweitert:

- Stadtwirtschaft,
- Arbeitsmarkt,
- Immobilien,
- Verkehr,
- Konkurrenten,
- Marktanteil,
- Marktein-/austritt.

---

## 87. Subprojekt 4 – Technology & Alternative History

Erweitert:

- Technologieabhängigkeiten,
- Standards,
- Diffusion,
- Gesellschaftstrends,
- Makroökonomie,
- systemische Krisen.

---

## 88. Subprojekt 5 – Multi-Hotel Company & Brands

Erweitert:

- Portfolio,
- Direktoren,
- Regionen,
- Zentrale,
- Marken,
- Eigentumsmodelle,
- Expansion,
- M&A,
- Treasury.

---

## 89. Subprojekt 6 – Emergent Campaign & Narrative

Erweitert:

- Rivalen,
- Schlüsselmitarbeiter,
- Medien,
- Eventketten,
- Chronik,
- Prestige,
- langfristige Entscheidungen.

---

## 90. Subprojekt 7 – Scale, Content, Accessibility & Polish

Erweitert:

- weitere Städte,
- Contentmenge,
- Lokalisierung,
- Accessibility,
- Audio,
- Balancing,
- Performance,
- QA,
- Authoring Tools.

---

# Teil XI – Traceability der 54 Vollständigkeitsanforderungen

## 91. Traceability-Matrix

Die folgenden Anforderungen sind verbindlich auf konkrete Kapitel abgebildet.

### Erste Lückenanalyse – 22 Punkte

1. **Buchung/Reservierung/Distribution** → Kapitel 6.  
2. **Revenue Management** → Kapitel 7.  
3. **vollständiges Gästemodell** → Kapitel 8.  
4. **Finanzsystem** → Kapitel 22.  
5. **Einkauf/Lager/Lieferanten** → Kapitel 19.  
6. **Personal/Arbeitsmarkt** → Kapitel 18.  
7. **Bau/Renovierung/Wartung** → Kapitel 10 und 17.  
8. **Hotelklassifikation/Markenstandards** → Kapitel 21 und 43.  
9. **Kalender/Saison/Nachfrage** → Kapitel 5.  
10. **Konkurrenz-KI** → Kapitel 33.  
11. **Konzern/Expansion** → Kapitel 28 und 40–44.  
12. **Start/Schwierigkeit/Karriereende** → Kapitel 4.  
13. **Alternative Geschichte vs. fixe Jahrzehnte** → Kapitel 36.  
14. **Währungen/internationale Expansion** → Kapitel 39.  
15. **Original-Parität** → Kapitel 79–81.  
16. **Singleplayer/geistiger Nachfolger** → Kapitel 2.7 und 2.10.  
17. **Command-System** → Kapitel 61.  
18. **Numerische Regeln** → Kapitel 65.  
19. **Web Worker von Beginn an** → Kapitel 66.  
20. **Isometrische Welt** → Kapitel 55.  
21. **Onboarding/Accessibility** → Kapitel 57.  
22. **Anti-Runaway-Balancing** → Kapitel 34 und 77.  

### Zweite Lückenanalyse – 32 Punkte

23. **Sales/Marketing/CRM/Loyalty** → Kapitel 25.  
24. **Front Office/Housekeeping State Machine** → Kapitel 9.  
25. **F&B-Betrieb** → Kapitel 13.  
26. **Gruppen/Kongress/Eventgeschäft** → Kapitel 15.  
27. **reservierbare Nebenleistungen** → Kapitel 14.  
28. **Service Recovery** → Kapitel 8.11–8.13.  
29. **mehrdimensionale Reputation** → Kapitel 26.  
30. **Betreiberformen** → Kapitel 23.  
31. **Standortentwicklung/Pre-Opening** → Kapitel 28.  
32. **Marktforschung/Unsicherheit** → Kapitel 29.  
33. **Versicherung/Schäden** → Kapitel 24.  
34. **Compliance** → Kapitel 38.  
35. **Verkehr/Erreichbarkeit** → Kapitel 31.  
36. **Wetter/Klima** → Kapitel 5.7 und 35.  
37. **Energie/Wasser/Versorgung** → Kapitel 27.  
38. **Managerdelegation/Governance** → Kapitel 41.  
39. **juristische Einheiten** → Kapitel 42.  
40. **Hoteltag/Betriebszeitlogik** → Kapitel 5.2–5.4.  
41. **Technologieabhängigkeiten/Standards** → Kapitel 36.  
42. **Makrostabilisierung** → Kapitel 34.  
43. **weitere Wirtschaftsakteure** → Kapitel 32.  
44. **Original-Verhaltensparität** → Kapitel 81.  
45. **Content-Schema** → Kapitel 70.  
46. **Content Authoring** → Kapitel 71.  
47. **Observability/Replay** → Kapitel 74.  
48. **Worker-Protokoll** → Kapitel 67.  
49. **Performancebudgets** → Kapitel 75.  
50. **Save-Content-Versionierung** → Kapitel 72.6–72.8.  
51. **Lokalisierung** → Kapitel 78.  
52. **Audio/Feedback** → Kapitel 58.  
53. **Notification Management** → Kapitel 54.  
54. **Scope/Non-Goals** → Kapitel 82.  

---

# Teil XII – Abschlusskriterien der Spezifikation

## 92. Konsistenzregeln

### 92.1 Zukunft

1991 ist fix.

Spätere Geschichte ist nicht fix.

### 92.2 Technologie

Technologie wird durch Bedingungen und Adoption bestimmt, nicht durch fest codierte Jahrzehnte.

### 92.3 KI

KI nutzt dieselben ökonomischen Rahmenbedingungen, darf aber aggregierter simuliert werden.

### 92.4 Geld

Geld ist Fixed-Point/Integer, nicht Float.

### 92.5 Simulation

Autoritative Simulation lebt im Worker.

### 92.6 UI

UI zeigt Zustand, besitzt ihn aber nicht autoritativ.

### 92.7 Gebäude

Modularer Umbau innerhalb definierter Strukturen, kein freier Architekturmodus.

### 92.8 Marke

Reale Städte sind erlaubt; reale Hotelmarken werden nicht benötigt oder kopiert.

---

## 93. Definition of Design Complete

Diese Spezifikation gilt als designseitig vollständig, wenn:

- alle 14 Leitentscheidungen enthalten sind,
- alle 54 Traceability-Punkte auf konkrete Regeln zeigen,
- keine offenen Platzhalter vorhanden sind,
- keine widersprüchlichen Technologie-Jahresregeln existieren,
- Worker, Command, Determinismus und Fixed-Point verbindlich sind,
- Original-Parität ausdrücklich von Asset-Kopie getrennt ist,
- jedes große Gameplay-System Entscheidung, Regel und Feedback besitzt.

---

## 94. Änderungsprozess

Neue Anforderungen nach Freigabe werden als Designänderung behandelt.

Jede Änderung muss prüfen:

1. welche bestehenden Systeme betroffen sind,
2. ob Traceability geändert werden muss,
3. ob Saves migriert werden müssen,
4. ob Long-Run-Balancing betroffen ist,
5. ob Subprojekt-Scope geändert wird.

---

## 95. Schlussbild

Der Spieler startet 1991 mit einem kleinen Hotel, begrenztem Kapital und unmittelbaren operativen Problemen.

Er entscheidet über:

- Preise,
- Personal,
- Gäste,
- Einkauf,
- Qualität,
- Technik,
- Renovierung,
- Marketing,
- Finanzierung.

Das Hotel reagiert sichtbar.

Die Stadt reagiert wirtschaftlich.

Konkurrenten reagieren strategisch.

Technologien und Vertriebssysteme verändern die Branche.

Der Spieler wächst vom Manager zum Unternehmer und später zum Konzernchef.

Trotzdem bleibt jeder Erfolg auf die gleiche Grundfrage zurückführbar:

**Führen wir Hotels, in denen die richtigen Gäste zum richtigen Preis zuverlässig eine gute Erfahrung bekommen – und ist das wirtschaftlich nachhaltig?**

Das ist der dauerhafte Kern des Spiels.

