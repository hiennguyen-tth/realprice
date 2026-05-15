-- Compatibility patch for older price_history tables.
-- Production currently stores aggregate land history as avg_price and does not
-- have price. Older deployed API code references ph.price, so keep avg_price
-- intact and add/backfill price without changing table semantics.

ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS price BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'price_history'
      AND column_name = 'avg_price'
  ) THEN
    EXECUTE 'UPDATE price_history SET price = avg_price WHERE price IS NULL';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_price_history_land_id
  ON price_history(land_id, recorded_at DESC);
