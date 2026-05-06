-- Add password field to users table for email/password authentication
-- Migration: 002_add_password_to_users.sql

ALTER TABLE users ADD COLUMN password TEXT;

-- Add index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);