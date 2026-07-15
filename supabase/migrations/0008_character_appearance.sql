-- Swap the single whole-body emoji (base_id) for a real layered appearance:
-- skin tone, hair, facial hair, body build, legs, outfit, armor — each
-- independently editable. Stored as jsonb since the slot catalog will keep
-- growing; validated at the application layer, not the DB.
alter table characters drop column base_id;
alter table characters add column appearance jsonb not null default '{}'::jsonb;
