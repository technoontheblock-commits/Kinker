# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
  - Kauf-Seite (`/bonuscard`) mit Zahlungsauswahl (TWINT, Bank, SEPA, Bar)
  - Öffentliche Kartenansicht (`/bonuscard/view/[token]`) im Kinker-Design
  - Dashboard-Ansicht (`/dashboard/bonuscard`) für eingeloggte User
  - Scanner-Integration: Memberships werden neben Tickets erkannt und validiert
  - Admin-Panel (`/admin/bonuscards`) mit Liste, Details, Zahlungsbestätigung, Sperrung
  - E-Mail-Bestätigung mit QR-Code und Zahlungsinformationen
  - Wallet-API-Routen vorbereitet (Apple Wallet + Google Wallet) – deaktiviert bis Accounts vorhanden
- **DB Schema**: Neue Tabellen `bonus_cards` und `bonus_card_scans` mit Audit-Trail; `expires_at` Spalte mit 1-Jahres-Gültigkeit und Trigger
- **Membership Navigation**: Links zur Membership in Header, Dashboard-Sidebar und Admin-Panel hinzugefügt
- **Membership PDF**: E-Mail enthält jetzt PDF-Anhang mit Membership und QR-Code (statt Bild inline)
- **Membership Zahlungsreferenz**: Verwendungszweck bei allen Zahlungsmethoden ist jetzt die Kartennummer
- **Membership Banküberweisung**: IBAN, BIC und Kontoinhaber werden in E-Mail und PDF angezeigt
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
- **Membership View Padding**: Top padding auf `/bonuscard/view/[token]` von `pt-8` auf `pt-24` erhöht, damit die Karte nicht mehr in die fixe Navigation reinragt.
