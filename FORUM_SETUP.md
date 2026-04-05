# Forum System Setup

## Voraussetzungen

Das Forum-System benötigt folgende Datenbanktabellen in Supabase:

- `forum_categories` - Hauptkategorien
- `forum_subcategories` - Unterkategorien
- `forum_posts` - Forum-Posts
- `forum_comments` - Kommentare

## Installation

### Schritt 1: SQL Script ausführen

1. Gehe zu deiner [Supabase Console](https://app.supabase.io)
2. Wähle dein Projekt aus
3. Klicke auf "SQL Editor" im linken Menü
4. Klicke auf "New query"
5. Kopiere den Inhalt der Datei `supabase-forum-hierarchical.sql`
6. Füge den SQL-Code in den Editor ein
7. Klicke auf "Run"

### Schritt 2: Überprüfung

Nach dem Ausführen des Scripts solltest du folgende Tabellen haben:

```sql
-- Test-Query zum Überprüfen
SELECT * FROM forum_categories;
```

Es sollten 4 Standard-Kategorien angezeigt werden:
- Kinker Club
- Veranstaltungen
- Community
- Support

### Schritt 3: RLS Policies

Das Script erstellt automatisch RLS (Row Level Security) Policies:

- **Lesen**: Jeder kann Kategorien, Posts und Kommentare lesen
- **Schreiben**: Nur eingeloggte Benutzer können Posts/Kommentare erstellen
- **Admin**: Nur Admins können Kategorien und Unterkategorien verwalten

## Fehlerbehebung

### Fehler: "FORUM_SCHEMA_MISSING"

**Ursache**: Die Datenbanktabellen existieren nicht.

**Lösung**: Führe das SQL-Script `supabase-forum-hierarchical.sql` in Supabase aus (siehe Schritt 1).

### Fehler: "relation 'forum_subcategories' does not exist"

**Ursache**: Du hast möglicherweise nur das alte Schema (`supabase-forum-schema.sql`) ausgeführt.

**Lösung**: 
1. Führe `supabase-forum-hierarchical.sql` aus (dieses enthält das vollständige Schema)
2. Oder: Führe beide Scripts nacheinander aus

### Fehler: "unique constraint violated"

**Ursache**: Ein Kategorie-Slug existiert bereits.

**Lösung**: Wähle einen eindeutigen Slug für die neue Kategorie.

## Dateien

- `supabase-forum-hierarchical.sql` - Vollständiges Schema mit hierarchischen Kategorien
- `supabase-forum-schema.sql` - Altes Schema (veraltet, nicht mehr verwenden)

## API Endpunkte

Nach erfolgreicher Einrichtung stehen folgende Endpunkte zur Verfügung:

- `GET /api/forum/categories` - Alle Kategorien abrufen
- `POST /api/forum/categories` - Neue Kategorie erstellen (Admin)
- `PUT /api/forum/categories` - Kategorie aktualisieren (Admin)
- `DELETE /api/forum/categories?id={id}` - Kategorie löschen (Admin)
- `GET /api/forum/subcategories` - Alle Unterkategorien abrufen
- `POST /api/forum/subcategories` - Neue Unterkategorie erstellen (Admin)
- `GET /api/forum/posts` - Alle Posts abrufen
- `POST /api/forum/posts` - Neuen Post erstellen
- `GET /api/forum/comments` - Kommentare abrufen
- `POST /api/forum/comments` - Kommentar erstellen
