-- Optional external link (datasheet, product page, etc.) per inventory item.
alter table public.inventory_items add column if not exists link text;
