# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dynamic Payment Links**: Zahlungslinks und Verwendungszwecke werden jetzt dynamisch vom Backend generiert (Preis, Produktname, Verwendungszweck)
- **Cash Payment Instructions**: Bei Barzahlung wird auf der Erfolgsseite eine Schritt-für-Schritt-Anleitung angezeigt (Kartennummer bereithalten → Bezahlen → Aktivieren lassen)
- **QR Code Scanner**: Vollständiger QR-Code-Scanner für Membership-Karten mit `html5-qrcode`
  - Kamera-Berechtigung wird explizit beim Start angefragt
  - Audio-Feedback (Beep bei gültig/ungültig) und haptisches Feedback (Vibration)
  - Dauerscan-Modus mit automatischer Weiterschaltung nach 2.5 Sekunden
  - Session-basierte Sperre: Dieselbe Karte kann nicht doppelt gescannt werden
  - Scan-Verlauf mit Zeitstempel und Status-Indikator
  - Manueller Fallback-Eingabe jederzeit verfügbar
  - Vollbildmodus: Scanner nimmt die gesamte Bildschirmgrösse ein
- **Scanner Admin Navigation**: Scanner-Link in der Admin-Sidebar hinzugefügt
- **Admin Membership Details**: Ablaufdatum (`Gültig bis`) wird jetzt auf der Admin Detailseite angezeigt
- **SumUp Online Payments**: Vollständige Integration des SumUp SDK für Kreditkarten- und Wallet-Zahlungen
  - `@sumup/sdk` als Payment-Provider installiert
  - `lib/sumup.ts`: SDK-Client mit Error Handling, Problem Details (RFC 9457) Typen und Helpers
  - API Route `POST /api/sumup/checkout`: Erstellt SumUp Checkout mit Hosted Checkout
  - API Route `GET /api/sumup/checkout/verify`: Verifiziert Checkout-Status bei SumUp
  - `/checkout/success`: Server Component zeigt Zahlungserfolg, verifiziert bei SumUp und erstellt Order aus dem Warenkorb
  - `/checkout/cancel`: Abbruchseite mit Link zurück zum Shop
  - Checkout-Button im Merch-Warenkorb (`/merch`) integriert
  - Order wird automatisch in Supabase `orders` + `order_items` gespeichert nach erfolgreicher Zahlung
  - Warenkorb wird nach Order-Erstellung geleert
  - `SUMUP_API_KEY` und `SUMUP_MERCHANT_CODE` als neue Env-Variablen
- **DB Schema**: Migration `20250604_add_sumup_payment_method.sql` erweitert `orders.payment_method` Check Constraint um `sumup`
- **Kinker Membership**: Digitale Membership für 100 CHF mit QR-Code und 1 Jahr Gültigkeit
  - Kauf-Seite (`/membership`) mit Zahlungsauswahl (TWINT, Bank, SEPA, Bar)
  - Öffentliche Kartenansicht (`/membership/view/[token]`) im Kinker-Design
  - Dashboard-Ansicht (`/dashboard/membership`) für eingeloggte User
  - Scanner-Integration: Memberships werden neben Tickets erkannt und validiert
  - Admin-Panel (`/admin/memberships`) mit Liste, Details, Zahlungsbestätigung, Sperrung
  - E-Mail-Bestätigung mit QR-Code und Zahlungsinformationen
  - Wallet-API-Routen vorbereitet (Apple Wallet + Google Wallet) – deaktiviert bis Accounts vorhanden
- **DB Schema**: Neue Tabellen `bonus_cards` und `bonus_card_scans` mit Audit-Trail; `expires_at` Spalte mit 1-Jahres-Gültigkeit und Trigger
- **Membership Navigation**: Links zur Membership in Header, Dashboard-Sidebar und Admin-Panel hinzugefügt
- **Membership PDF**: E-Mail enthält jetzt PDF-Anhang mit Membership und QR-Code (statt Bild inline)
- **Membership Zahlungsreferenz**: Verwendungszweck bei allen Zahlungsmethoden ist jetzt die Kartennummer
- **Membership Banküberweisung**: IBAN, BIC und Kontoinhaber werden in E-Mail und PDF angezeigt
- **Membership Seite**: Schritt-für-Schritt-Anleitung "So funktioniert's" hinzugefügt (kaufen → speichern → QR-Code scannen)
- **Membership Karte**: 1-Jahr-Gültigkeit direkt auf der Karten-Vorschau angezeigt
- **Membership Benefits**: Preisermässigung präzisiert auf "5 CHF Rabatt an der Abendkasse"
- **Account deletion**: UI and hardened RLS policies for secure account deletion.
- **Cookie consent banner**: Implemented cookie consent with overhauled privacy policy.
- **Eventfrog sync**: Sync single Eventfrog events by ID with fallback DB loading.
- **Eventfrog full sync**: Sync ALL Kinker events using multiple Eventfrog API strategies.
- **Admin event sync button**: Added button to trigger Eventfrog event synchronization.

### Changed
- **Events page**: Switched to SSR, filters past events, and fetches fresh Eventfrog data on every request.
- **Event loading**: Events page now loads from both Eventfrog API and local DB.
- **Eventfrog pagination**: Increased pages loaded from 5 to 20 to catch more events.
- **Hotels**: Translated hotel content to English.
- **Tram lines**: Corrected tram lines to 10 and 11.
- **Event cards**: Removed price display from event cards.
- **Event detail**: Removed price from event detail page.

### Fixed
- **Admin Orders API**: `GET /api/orders` listet jetzt korrekt alle Orders für das Admin-Payment-Dashboard
- **Admin Orders parsing**: `app/admin/page.tsx` parsed `data.orders` korrekt statt das ganze Response-Objekt
- **Membership Status**: Membership ist erst `active` wenn Zahlung bestätigt wurde (vorher war sie sofort aktiv)
- **Event title crash**: Fixed `toLowerCase` crash when `event.title` is an object instead of a string.
- **Event title extraction**: Fixed event title extraction and Eventfrog ticket link for synced events.
- **Empty events**: Filter out unnamed/empty events from display and sync.
- **Event date validation**: Validate event dates to prevent empty string DB errors.
- **Event deletion**: Cascade delete `event_tickets`, `order_items`, `cart_items` before deleting event.
- **Event delete error**: Better error logging for event delete + client error display.
- **Eventfrog large IDs**: Handle Eventfrog large IDs exceeding JS `Number.MAX_SAFE_INTEGER`.
- **Membership View Padding**: Top padding auf `/membership/view/[token]` von `pt-8` auf `pt-24` erhöht, damit die Karte nicht mehr in die fixe Navigation reinragt.

### Changed
- **Membership Card View (Mobile)**: Karte wechselt auf Mobile ins Portrait-Format (`3:4`) mit deutlich vergrössertem QR-Code (192×192px) für einfaches Scannen an der Abendkasse
- **Admin Status Buttons**: Status-Änderungen (bezahlt/aktivieren/sperren) werden jetzt sofort live übernommen ohne Seiten-Neuladen
- **Scanner Layout**: Manuelle Eingabe und Scan-Verlauf wurden unter das Scanner-Fenster verschoben

### Added
- **Admin Mobile Layout**: Vollständig responsives Admin-Dashboard für mobile Geräte
  - Neues `app/admin/layout.tsx` mit zentralem Auth-Guard und Sidebar-Management
  - Mobile Slide-in-Navigation mit Hamburger-Menü, Overlay und Animation
  - Sidebar wird auf Desktop fixed, auf Mobile als Overlay dargestellt
  - Alle Admin-Seiten (`/admin`, `/admin/memberships`, `/admin/membership/validierung`, `/admin/advertising`) nutzen jetzt das Shared Layout
- **Admin Table Scroll**: Tabellen im Admin-Bereich sind jetzt horizontal scrollbar (`overflow-x-auto`) für kleine Bildschirme
- **Admin Performance**: Ladezeit-Optimierungen im Admin-Dashboard
  - Auth-Check entfernt aus `page.tsx` (wird jetzt zentral im Layout gemacht)
  - On-Demand Datenladen: Nur Dashboard-Daten werden initial geladen, andere Tabs laden bei erstmaligem Öffnen
  - `<img>` durch `next/image` ersetzt für Lazy Loading und automatische Optimierung
  - Board-Page (`/admin/board`) in dedizierte Komponenten aufgeteilt (`SortableCard`, `SortableList`, `CardModal`, `types`)
  - Admin-Hauptseite (`/admin`) in 12 lazy-loaded Tab-Komponenten aufgeteilt via `next/dynamic`, reduziert von 2875 auf 915 Zeilen (-68%)

### Fixed
- **Membership PDF Attachment**: PDF wird jetzt zuverlässig als E-Mail-Anhang verschickt durch Verwendung eines PNG-Buffers für den QR-Code statt Data-URL
- **Referral Points Sync**: Referral-Belohnungen (200 Punkte) werden jetzt korrekt in das Rewards-System synchronisiert (`user_rewards` + `points_history`) und sind auf `/rewards` sichtbar
