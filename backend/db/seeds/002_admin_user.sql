-- Admin User Seed for RealPrice
-- ============================================================
-- USAGE:
--   psql $DATABASE_URL -f backend/db/seeds/002_admin_user.sql
--
-- To login:
--   POST /api/auth/send-otp   { "phone": "+84900000001" }
--   POST /api/auth/verify-otp { "phone": "+84900000001", "code": "xxxxxx" }
--   → returns accessToken, use it as: Authorization: Bearer <token>
--
-- To trigger crawl manually:
--   curl -X POST https://your-api.com/api/admin/crawler/trigger \
--        -H "Authorization: Bearer <accessToken>"
--
-- IMPORTANT: Change the phone number to a real number before running in production!
-- ============================================================

INSERT INTO users (phone, full_name, email, role, is_active)
VALUES (
  '+84963058667',
  'Admin RealPrice',
  'admin@realprice.vn',
  'admin',
  true
)
ON CONFLICT (phone) DO UPDATE
  SET role      = 'admin',
      full_name = EXCLUDED.full_name,
      is_active = true;

-- If you want a second admin with a different phone, uncomment and edit below:
-- INSERT INTO users (phone, full_name, email, role, is_active)
-- VALUES ('+84xxxxxxxxx', 'Admin 2', 'admin2@realprice.vn', 'admin', true)
-- ON CONFLICT (phone) DO UPDATE SET role = 'admin', is_active = true;
