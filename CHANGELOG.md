# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Bonuscard / Stammgastkarte**: Digitale Karte für 100 CHF mit QR-Code
  - Kauf-Seite (`/bonuscard`) mit Zahlungsauswahl (TWINT, Bank, SEPA, Bar)
  - Öffentliche Kartenansicht (`/bonuscard/view/[token]`) im Kinker-Design
  - Dashboard-Ansicht (`/dashboard/bonuscard`) für eingeloggte User
  - Scanner-Integration: Bonuscards werden neben Tickets erkannt und validiert
  - Admin-Panel (`/admin/bonuscards`) mit Liste, Details, Zahlungsbestätigung, Sperrung
  - E-Mail-Bestätigung mit QR-Code und Zahlungsinformationen
  - Wallet-API-Routen vorbereitet (Apple Wallet + Google Wallet) – deaktiviert bis Accounts vorhanden
- **DB Schema**: Neue Tabellen `bonus_cards` und `bonus_card_scans` mit Audit-Trail
- **Bonuscard Navigation**: Links zur Bonuscard in Header, Dashboard-Sidebar und Admin-Panel hinzugefügt
- **Bonuscard PDF**: E-Mail enthält jetzt PDF-Anhang mit Karte und QR-Code (statt Bild inline)
- **Bonuscard Zahlungsreferenz**: Verwendungszweck bei allen Zahlungsmethoden ist jetzt die Kartennummer
- **Bonuscard Banküberweisung**: IBAN, BIC und Kontoinhaber werden in E-Mail und PDF angezeigt
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
- **Bonuscard Status**: Karte ist erst `active` wenn Zahlung bestätigt wurde (vorher war sie sofort aktiv)
- **Event title crash**: Fixed `toLowerCase` crash when `event.title` is an object instead of a string.
- **Event title extraction**: Fixed event title extraction and Eventfrog ticket link for synced events.
- **Empty events**: Filter out unnamed/empty events from display and sync.
- **Event date validation**: Validate event dates to prevent empty string DB errors.
- **Event deletion**: Cascade delete `event_tickets`, `order_items`, `cart_items` before deleting event.
- **Event delete error**: Better error logging for event delete + client error display.
- **Eventfrog large IDs**: Handle Eventfrog large IDs exceeding JS `Number.MAX_SAFE_INTEGER`.
