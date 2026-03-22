-- Check if events exist
SELECT * FROM events;

-- If empty, insert sample data:
INSERT INTO events (id, name, date, time, end_time, description, full_description, lineup, image, ticket_url, type, price, timetable) VALUES
(
  'techno-tuesday-001',
  'TECHNO TUESDAY',
  '2026-04-07',
  '23:00',
  '06:00',
  'Weekly underground techno session with local and international DJs.',
  'Join us every Tuesday for the darkest techno night in Basel.',
  ARRAY['Marco Bailey', 'Basel Underground Collective', 'KINKER Residents'],
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/techno-tuesday-001',
  'clubnight',
  'CHF 25',
  '[{"time": "23:00", "artist": "KINKER Residents"},{"time": "01:00", "artist": "Basel Underground Collective"},{"time": "03:00", "artist": "Marco Bailey"},{"time": "05:00", "artist": "B2B Closing"}]'::jsonb
),
(
  'hard-sessions-042',
  'HARD SESSIONS #42',
  '2026-04-12',
  '22:00',
  '08:00',
  'Industrial hard techno all night long. Bring your energy.',
  'Hard Sessions returns for its 42nd edition.',
  ARRAY['SNTS', 'Somniac One', 'Nico Moreno', 'KOR'],
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/hard-sessions-042',
  'special',
  'CHF 35',
  '[{"time": "22:00", "artist": "KOR"},{"time": "00:00", "artist": "Somniac One"},{"time": "02:00", "artist": "Nico Moreno"},{"time": "04:00", "artist": "SNTS"},{"time": "06:30", "artist": "Closing Set"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
