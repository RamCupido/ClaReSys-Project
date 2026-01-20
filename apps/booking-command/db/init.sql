CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    classroom_id UUID NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_classroom_id ON bookings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);