# Cashless-System Kinker – Konzept

## Ziel
Auf der Kinker-Website soll ein Cashless-System entstehen. Kunden können Guthaben entweder an der Abendkasse (Bargeld oder Karte) oder später online im Shop aufladen. Das Guthaben wird in einem Wallet verwaltet und kann an der Bar bargeldlos ausgegeben werden.

## Implementierter Bar-Workflow
Die Bar-Seite ist unter **`/bar`** erreichbar und funktioniert als eingeklebter Kiosk-Modus:

1. **Scanner** öffnet sich automatisch (selbstgebauter QR-Scanner, kein Plugin).
2. Bar-Personal scannt den Kunden-Wallet-QR-Code.
3. Es erscheint das **Bestellmenü** mit Name/Guthaben und Produktauswahl.
4. Nach „Bestätigen“ wechselt das Display in den **Kundenmodus**.
5. Kunde wählt Trinkgeld, tippt „X CHF bezahlen“ und wählt den digitalen Beleg.
6. Nach erfolgreicher Bezahlung erscheint der Erfolgsbildschirm mit Restguthaben; nach ca. 6 Sekunden wird automatisch zum Scanner zurückgesetzt.

## Datenbank-Tabellen (Bar-Bereich)
- `bar_products` – Produkte, die an der Bar verkauft werden
- `bar_wallets` – Wallet pro Kunde mit `qr_token` und `balance`
- `bar_orders` / `bar_order_items` – Bar-Bestellungen
- `bar_wallet_transactions` – Alle Wallet-Bewegungen (`top_up`, `payment`, `tip`, `refund`, `cancel`)
- `process_bar_payment(...)` – PostgreSQL-Funktion für atomare Bezahlung (Wallet sperren, Order anlegen, Guthaben abbuchen)

## Grundprinzip

- Jedes Mitglied/Kunde besitzt ein **Wallet**.
- Alle Guthaben-Bewegungen laufen über eine **unveränderliche Transaktionstabelle**.
- Aufladen und Bezahlen sind strikt getrennte Aktionen mit unterschiedlichen Berechtigungen.
- Alle kritischen Buchungen werden protokolliert (Wer? Wann? Was? Wo?).

## Rollen

| Rang | Darf aufladen | Darf abbuchen | Darf stornieren |
|---|---|---|---|
| Admin | Ja | Ja | Ja |
| Abendkasse | Ja | Nein | Nur eigenes/Ausnahmen |
| Bar-Personal | Nein | Ja | Nur mit Supervisor-Freigabe |
| Kunde | Nur online (Shop) | Nein | Nein |

## 1. Guthaben aufladen

### 1.1 Abendkasse (Terminal)

Nur Benutzer mit der Rolle **`bar`** (für das Bar-Personal) bzw. später **`abendkasse`** können Guthaben vergeben. Die aktuelle `/bar`-Seite verwendet die Rolle **`bar`**.

Ablauf:

1. Kasse scannt den Kunden-QR-Code oder sucht den Kunden per Name/Telefon.
2. Kasse gibt den Betrag ein.
3. Kasse wählt Zahlungsart:
   - **Bargeld**
   - **Karte** (SumUp / Stripe / Terminal)
4. Bei Bargeld nimmt die Kasse das Geld entgegen und bestätigt die Aufladung.
5. Bei Karte wird die Zahlung über das Terminal/Checkout ausgelöst und nach erfolgreicher Bestätigung gutgeschrieben.
6. Eine `top_up`-Transaktion wird erstellt.

### 1.2 Online-Top-Up im Shop

- Der Shop bekommt einen virtuellen Artikel **„Wallet-Guthaben“**.
- Der Kunde wählt einen Betrag aus und geht durch den bestehenden Checkout.
- Nach erfolgreicher Zahlung (SumUp/Stripe/Cash/Banktransfer) wird das Guthaben gutgeschrieben.
- Banktransfer-Zahlungen bleiben solange ausstehend, bis die Zahlung manuell bestätigt wird.

## 2. Bezahlen an der Bar

### 2.1 Kundenidentifikation

Der Kunde wird an der Bar über seinen **Wallet-QR-Code** erkannt:

- Format: `KINKER-WALLET-<qr_token>`
- Der QR-Code enthält keine persönlichen Daten, sondern nur ein sicheres Token.
- Optional kann später ein NFC-Armband ergänzt werden.

Der Scanner ist selbst gebaut (`getUserMedia` + `jsqr`), verarbeitet ausschliesslich QR-Codes und versucht, bei dunklen Umgebungen die Kamera-Taschenlampe sowie kontinuierliche Belichtung/Fokus zu aktivieren.

### 2.2 Bar-Personal-Seite

1. Bar-Personal scannt den Kunden-QR-Code oder hält das NFC-Armband an das Lesegerät.
2. Das System zeigt:
   - Name (nur Vorname)
   - Aktuelles Guthaben
   - Letzte Bestellungen
3. Bar-Personal tippt die Bestellung ein (Produkte / Mengen).
4. System prüft, ob das Guthaben ausreicht.
5. Wenn ja, wechselt das Tablet in den **Kundenmodus**.

### 2.3 Kundenmodus (Kunden-Display)

Das Tablet dreht sich zum Kunden (oder ein separates Kundendisplay wird aktiv). Der Kunde sieht:

- Bestellübersicht mit Einzelpreisen
- Gesamtsumme der Bestellung
- Aktuelles Guthaben vor dem Einkauf
- Erwartetes Restguthaben nach dem Einkauf

Der Kundenbildschirm läuft im **Kiosk-Modus** – er kann nicht aus Versehen verlassen oder andere Bereiche öffnen.

#### Trinkgeld

- Der Kunde kann Trinkgeld hinzufügen:
  - Kein Trinkgeld
  - 1 CHF
  - 2 CHF
  - 3 CHF
  - 5 CHF
  - Eigener Betrag
- Bei Auswahl eines fixen Betrags aktualisiert sich die Summe sofort.
- Bei „Eigener Betrag“ öffnet sich ein Ziffernblock.
- **Limit:** Der eingegebene Trinkgeld-Betrag kann das aktuelle Restguthaben nicht übersteigen. Gibt der Kunde z. B. 100 CHF ein, hat aber nur noch 20 CHF Restguthaben, wird das Feld automatisch auf 20 CHF gesetzt.

#### Bezahlbestätigung

- Nach Trinkgeld-Auswahl erscheint ein großer Button mit der finalen Summe:
  - **„X CHF bezahlen“**
- Erst durch Tippen auf diesen Button wird das Guthaben abgebucht.
- Diese aktive Bestätigung durch den Kunden ersetzt eine separate PIN-Eingabe.

#### Beleg-Auswahl

Nach erfolgreicher Bezahlung erscheint:

**„Möchtest du einen Beleg?“**

Optionen:

- **In der App speichern**
- **Per E-Mail senden**
  - Ist im Kundenprofil keine E-Mail-Adresse hinterlegt, ist dieser Button **ausgegraut** und zeigt:
    - **„Keine Email Hinterlegt“**
- **Kein Beleg**

> **Wichtig:** Es gibt **keine Druckoption** an der Bar. Belege sind ausschliesslich digital verfügbar.

Wenn der Kunde „Per E-Mail“ wählt und eine E-Mail-Adresse hinterlegt ist, wird die Beleg-Art in der Bestellung gespeichert. Der tatsächliche E-Mail-Versand kann später an diesen Status gekoppelt werden. Anschliessend erscheint kurz:

- „Bezahlt – Restguthaben: X CHF“

Danach springt der Bildschirm automatisch zurück zur Startansicht für den nächsten Kunden.

### 2.4 Buchung im Hintergrund

Bei erfolgreicher Bezahlung werden folgende Buchungen erstellt:

- Eine `payment`-Transaktion für den Bestellbetrag.
- Eine separate `tip`-Transaktion für das Trinkgeld (sofern ausgewählt).
- Eine Bestellung/Order für die Abrechnung und das Inventar.
- Ein Eintrag im Transaktionslog mit Zeitstempel, Bar-Standort und bearbeitendem Mitarbeiter.

Alle Buchungen müssen atomar laufen, damit keine Doppelbuchungen oder Race-Conditions entstehen.

## 3. Stornos und Rückbuchungen

- Bar-Personal oder ein Supervisor kann die letzte Transaktion aufrufen.
- Bei Storno wird eine Gegenbuchung vom Typ `refund` oder `cancel` erstellt.
- Das Guthaben wird wieder gutgeschrieben.
- Jede Stornierung wird protokolliert (Wer? Wann? Warum?).

## 4. Tagesabschluss

Jede Bar und die Abendkasse brauchen am Ende des Tages eine Übersicht:

- Wallet-Umsatz (über Guthaben bezahlt)
- Direktzahlungen an der Bar (Cash/Karte)
- Trinkgelder gesamt
- Anzahl Transaktionen
- Stornos
- Abgleich mit Inventar / ausgegebenen Getränken

## 5. Offline-Fall

- Primär wird auf stabiles Internet (idealerweise LTE-Backup) gesetzt.
- Falls kurzzeitig keine Verbindung besteht, kann ein lokaler Zwischenspeicher genutzt werden. Dafür braucht es:
  - Limits pro Kunde,
  - Duplikatserkennung,
  - eine saubere Synchronisierungslogik.

## 6. Sicherheit & „Stuck“-Verhalten der Bar-Seite

- Die Seite `/bar` kann nur mit der Rolle **`bar`** geöffnet werden.
- Browser-„Zurück“ und versehentliches Neuladen werden abgefangen (`beforeunload` + `popstate`).
- Wake-Lock hält das Display an; ein Keep-Alive-Call alle 60 Sekunden hält die Session frisch.
- Kritische Buchungen laufen über die Service-Role-API, nicht direkt vom Client.
- Wallet-Zugriffe werden gegen Race-Conditions abgesichert (`FOR UPDATE` in `process_bar_payment`).
- Der Kunden-QR-Code enthält keine lesbaren persönlichen Daten.
- Auf dem Kundendisplay werden nur Vorname und Guthaben angezeigt.

## 7. Offene Punkte / Entscheidungen

- NFC-Armbänder beschaffen oder zuerst nur QR-Code nutzen?
- Soll es eine separate App geben oder reicht die mobile Website?
- Soll Bargeld an der Bar noch möglich sein (Split-Payment)?
- Soll nicht ausgegebenes Guthaben am Ende zurückerstattet werden können?
- Welches Kartenterminal wird an der Abendkasse eingesetzt?
