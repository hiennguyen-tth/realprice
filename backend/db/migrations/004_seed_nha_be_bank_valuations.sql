-- Add baseline bank valuation rows for Nha Be so land detail pages have
-- a usable lender estimate even when the original seed was not loaded.

INSERT INTO bank_valuations (
  district,
  ward,
  street_name,
  land_type,
  bank_name,
  valuation_per_m2,
  ltv_ratio,
  effective_from,
  effective_to
)
SELECT *
FROM (
  VALUES
    ('Nha Be', NULL, NULL, 'residential'::land_type_enum, 'Vietcombank',  35000000::BIGINT, 0.700::NUMERIC, '2024-01-01'::DATE, NULL::DATE),
    ('Nha Be', NULL, NULL, 'residential'::land_type_enum, 'BIDV',         32000000::BIGINT, 0.700::NUMERIC, '2024-01-01'::DATE, NULL::DATE),
    ('Nha Be', NULL, NULL, 'residential'::land_type_enum, 'Techcombank',  34000000::BIGINT, 0.750::NUMERIC, '2024-01-01'::DATE, NULL::DATE),
    ('Nha Be', NULL, NULL, 'residential'::land_type_enum, 'VPBank',       30000000::BIGINT, 0.650::NUMERIC, '2024-01-01'::DATE, NULL::DATE),
    ('Nha Be', NULL, NULL, 'agricultural'::land_type_enum, 'BIDV',        12000000::BIGINT, 0.600::NUMERIC, '2024-01-01'::DATE, NULL::DATE)
) AS seed(district, ward, street_name, land_type, bank_name, valuation_per_m2, ltv_ratio, effective_from, effective_to)
WHERE NOT EXISTS (
  SELECT 1
  FROM bank_valuations bv
  WHERE bv.district = seed.district
    AND bv.ward IS NOT DISTINCT FROM seed.ward
    AND bv.street_name IS NOT DISTINCT FROM seed.street_name
    AND bv.land_type = seed.land_type
    AND bv.bank_name = seed.bank_name
    AND bv.effective_from = seed.effective_from
);
