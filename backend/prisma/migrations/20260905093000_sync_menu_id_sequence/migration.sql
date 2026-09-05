-- Keep the Menu identity sequence aligned after seed data uses explicit IDs.
SELECT setval(
  pg_get_serial_sequence('"Menu"', 'id'),
  COALESCE((SELECT MAX("id") FROM "Menu"), 1),
  true
);
