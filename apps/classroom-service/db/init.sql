CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(50) UNIQUE NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  location_details varchar(255),
  is_operational boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_classrooms_code ON classrooms(code);
