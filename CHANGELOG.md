# Changelog

Alle wichtigen Änderungen am Kinker-Projekt werden in dieser Datei dokumentiert.

## [Unreleased] - 2026-07-12

### Projekt: NFC-Armband Cashless-System für Festivals

#### Zusammenfassung
Das bestehende QR-Code-/Nutzer-basierte Bar-Cashless-System wurde vollständig durch ein anonymes, wiederverwendbares NFC-Armband-System ersetzt. Das System ist für Events bis 1.000 Personen ausgelegt, wird aber zunächst mit 100 Gästen getestet.

#### Motivation
- Schnellerer Bezahlprozess an der Bar
- Keine App- oder Account-Pflicht für Gäste
- Einfachere Aufladung an Stationen
- Wiederverwendbare Armbänder
- Rückerstattung von Restguthaben nach dem Event

---

### Datenbank

#### Neue Migration
- `supabase/migrations/20250712_nfc_bracelet_cashless_system.sql`

#### Entfernte Tabellen
- `bar_wallets`
- `bar_wallet_transactions`

#### Entfernte Funktionen
- `process_bar_payment(...)`
- `process_bar_topup(...)`
- `handle_new_bar_wallet()`
- Alter `get_event_bar_stats(UUID)`

#### Entfernte Trigger
- `on_public_user_created` auf `public.users` (auto-erstellte Bar-Wallets)

#### Neue Tabelle: `bar_bracelets`
Speichert jedes NFC-Armband als eigenständige Wallet.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Primärschlüssel |
| `nfc_uid` | TEXT | Eindeutige NFC-Chip-ID |
| `balance` | DECIMAL(10,2) | Aktuelles Guthaben |
| `currency` | TEXT | Währung (CHF) |
| `status` | TEXT | active, disabled, lost, refunded, void |
| `event_id` | UUID | Optionale Event-Zuordnung |
| `issued_at` | TIMESTAMPTZ | Ausgabezeitpunkt |
| `activated_at` | TIMESTAMPTZ | Aktivierungszeitpunkt |
| `deactivated_at` | TIMESTAMPTZ | Deaktivierungszeitpunkt |
| `replaced_by_bracelet_id` | UUID | Verweis auf Ersatzarmband |
| `note` | TEXT | Interne Notiz |
| `metadata` | JSONB | Zusätzliche Daten |
| `created_at` / `updated_at` | TIMESTAMPTZ | Standardzeitstempel |

#### Neue Tabelle: `bar_bracelet_transactions`
Unveränderliches Transaktionsprotokoll für Armbänder.

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Primärschlüssel |
| `bracelet_id` | UUID | Verweis auf Armband |
| `order_id` | UUID | Verweis auf Bar-Bestellung |
| `event_id` | UUID | Event-Zuordnung |
| `bar_id` | UUID | Bar-Zuordnung |
| `amount` | DECIMAL(10,2) | Betrag |
| `type` | TEXT | top_up, payment, tip, refund, cancel |
| `status` | TEXT | pending, completed, failed, cancelled |
| `description` | TEXT | Beschreibung |
| `reference` | TEXT | Externe Referenz |
| `metadata` | JSONB | Zusatzdaten |
| `created_at` | TIMESTAMPTZ | Zeitstempel |

#### Geänderte Tabelle: `bar_orders`
- Entfernt: `customer_id`
- Neu: `bracelet_id` (FK auf `bar_bracelets`)

#### Neue Datenbankfunktionen
- `process_bracelet_topup(p_nfc_uid, p_staff_id, p_amount, p_payment_method, p_reference, p_event_id, p_bar_id)`
- `process_bracelet_payment(p_order_number, p_nfc_uid, p_staff_id, p_items, p_tip_amount, p_receipt_type, p_event_id, p_bar_id)`
- `get_bracelet_by_nfc_uid(p_nfc_uid)`
- `replace_bracelet(p_old_nfc_uid, p_new_nfc_uid, p_staff_id, p_reference)`
- `refund_bracelet_balance(p_nfc_uid, p_staff_id, p_reference)`
- `get_event_bar_stats(p_event_id)` (aktualisiert)

---

### Backend / API

#### Geänderte Routen
| Route | Änderung |
|---|---|
| `app/api/bar/scan/route.ts` | Akzeptiert jetzt `nfc_uid` statt QR-Code |
| `app/api/bar/pay/route.ts` | Ruft `process_bracelet_payment` auf |
| `app/api/topup/scan/route.ts` | Akzeptiert jetzt `nfc_uid` statt QR-Code |
| `app/api/topup/route.ts` | Ruft `process_bracelet_topup` auf |
| `app/api/admin/bar-reports/[id]/route.ts` | Liest aus `bar_bracelet_transactions` |

#### Neue Routen
| Route | Zweck |
|---|---|
| `app/api/admin/bracelets/route.ts` | Liste aller Armbänder / Bulk-Import |
| `app/api/admin/bracelets/[id]/route.ts` | Status/Notiz eines Armbands aktualisieren |
| `app/api/admin/bracelets/replace/route.ts` | Verlorenes Armband ersetzen |
| `app/api/admin/bracelets/refund/route.ts` | Restguthaben erstatten |

#### Entfernte Routen
- `app/api/bar/search/route.ts`
- `app/api/topup/search/route.ts`

---

### Frontend / UI

#### Neue Komponenten
| Datei | Zweck |
|---|---|
| `components/bar/nfc-scanner.tsx` | NFC-Scan-Eingabe (Tastatur-Emulation) |
| `app/admin/bracelets/page.tsx` | Admin-Verwaltung für Armbänder |

#### Geänderte Komponenten
| Datei | Änderung |
|---|---|
| `app/bar/components/bar-page.tsx` | NFC-Scan-Flow statt QR-Scanner |
| `app/bar/components/order-menu.tsx` | Zeigt Armband-UID und Guthaben |
| `app/bar/components/customer-checkout.tsx` | Kunden-Checkout mit Armband, E-Mail-Beleg entfernt |
| `app/topup/components/topup-page.tsx` | NFC-Aufladeflow statt QR |
| `components/admin-sidebar.tsx` | Menüpunkt "Armbänder" hinzugefügt |
| `components/bar/types.ts` | `Bracelet`-Typ ersetzt `Customer` |
| `lib/bar.ts` | NFC-UID-Helfer, QR-Helfer entfernt |

#### Entfernte Komponenten / Seiten
- `app/dashboard/wallet/page.tsx`
- `app/dashboard/wallet/components/wallet-view.tsx`
- `components/bar/qr-scanner.tsx`
- `components/bar/customer-search.tsx`

#### Geänderte Verlinkungen
- `app/dashboard/layout.tsx`: Wallet-Menüpunkt entfernt
- `components/wallet-promo-section.tsx`: Texte auf NFC-Armbänder angepasst, Wallet-Link entfernt
- `app/checkout/success/page.tsx`: Online-Wallet-Topup-Zweig entfernt

---

### Typen
- `lib/database.types.ts` aktualisiert
  - `BarWallet` → `BarBracelet`
  - `BarWalletTransaction` → `BarBraceletTransaction`
  - `BarOrder` verwendet `bracelet_id` statt `customer_id`

---

### Hardware / Zahlungsabwicklung
- **Zahlungsgerät**: SumUp Solo Light bleibt für Kartenzahlungen an Aufladestationen
- **NFC-Reader**: Werden als Tastatur-Emulation betrieben, UI lauscht auf UID-Eingabe
- **Armbänder**: Wiederverwendbar, primär für 100er-Test, skalierbar auf 1.000

---

### Sicherheit
- Eindeutige Identifikation über NFC-UID
- Armband-Status: active, disabled, lost, refunded, void
- Sperren und Ersatz möglich
- Rückerstattung von Restguthaben möglich
- Keine Pflicht zu personenbezogenen Daten oder Fotos

---

### Build-Status
- `npm run build` erfolgreich am 2026-07-12
- Keine neuen TypeScript-/ESLint-Fehler durch diese Änderungen

---

### Bekannte Einschränkungen / Nächste Schritte
- Migration muss noch in Supabase ausgeführt werden
- NFC-Hardware muss bestellt und getestet werden
- 100er-Pilot-Event planen
- Optional: Verlustschutz via Telefonnummer/E-Mail ergänzen
