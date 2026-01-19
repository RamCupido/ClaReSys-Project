CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(100) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'STUDENT', -- STUDENT, TEACHER, ADMIN
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);