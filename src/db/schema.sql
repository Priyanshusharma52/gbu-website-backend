-- =====================================
-- CREATE DATABASE
-- =====================================
-- Run once manually from postgres DB in pgAdmin/psql:
-- CREATE DATABASE gbu;
-- Then connect to gbu database and run this file.

BEGIN;

  -- =====================================
  -- DROP ALL EXISTING TABLES (DESTRUCTIVE)
  -- =====================================
  DO $$
  DECLARE
  r RECORD;
BEGIN
  FOR r IN
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
  LOOP
  EXECUTE format
  ('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
END LOOP;
END $$;

-- =====================================
-- TABLES
-- =====================================
CREATE TABLE notices
(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published_date DATE,
  type VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  views INT DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  pdf_url TEXT
);

CREATE TABLE news
(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author VARCHAR(100),
  department VARCHAR(100),
  category VARCHAR(100),
  published_date DATE,
  priority VARCHAR(50) DEFAULT 'medium',
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'published',
  image_url TEXT,
  tags JSONB DEFAULT '[]'
  ::jsonb
);


  CREATE TABLE events
  (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organizer VARCHAR(255),
    venue VARCHAR(255),
    type VARCHAR(100),
    mode VARCHAR(50) DEFAULT 'Offline',
    status VARCHAR(20),
    price VARCHAR(50) DEFAULT 'Free',
    attendees INT DEFAULT 0,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    time_string VARCHAR(50),
    year VARCHAR(10),
    cover_image TEXT,
    registration_url TEXT,
    tags JSONB DEFAULT '[]'
    ::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  agenda JSONB DEFAULT '[]'::jsonb,
  speakers JSONB DEFAULT '[]'::jsonb
);

    -- =====================================
    -- INSERT ONLY 1 RECORD PER TABLE
    -- =====================================
    INSERT INTO notices
      (title, content, published_date, type, priority, views, is_new, pdf_url)
    VALUES
      (
        'End Semester Examination Schedule - June 2025',
        'The final schedule for End Semester Examinations (June 2025) is now available. Students are advised to download the PDF and prepare accordingly.',
        '2025-05-25',
        'Exam',
        'high',
        1245,
        TRUE,
        'https://gbu.ac.in/notices/exam-schedule-june-2025.pdf'
);

    INSERT INTO news
      (title, excerpt, content, author, department, category, published_date, priority, views, likes, is_featured, status, image_url, tags)
    VALUES
      (
        'GBU Inaugurates Centre for Artificial Intelligence and Machine Learning',
        'GBU launched a state-of-the-art Centre for AI and ML research.',
        'The new centre will focus on machine learning, natural language processing, computer vision, and robotics.',
        'Dr. Rajesh Kumar',
        'Research Cell',
        'Research',
        '2024-06-20',
        'high',
        2847,
        156,
        TRUE,
        'published',
        'https://gburif.org/images/intro-carousel/gautam-buddha-university-3.jpg',
        '["AI", "Research", "Innovation", "Technology"]'
    ::jsonb
);

    INSERT INTO events
      (
      id,
      title,
      description,
      organizer,
      venue,
      type,
      mode,
      status,
      price,
      attendees,
      starts_at,
      ends_at,
      time_string,
      year,
      cover_image,
      registration_url,
      tags,
      gallery,
      agenda,
      speakers
      )
    VALUES
      (
        1,
        'GBU Tech Symposium 2024',
        'A state-level symposium with talks and presentations on cutting-edge technologies by students and industry experts.',
        'School of Engineering, GBU',
        'Main Auditorium, GBU Campus',
        'Seminar',
        'Offline',
        'past',
        'Free',
        300,
        '2024-07-10 09:00:00',
        '2024-07-10 17:00:00',
        '09:00 AM',
        '2024',
        'https://www.ux4g.gov.in/assets/img/awareness-workshop/gbu-19-11-24/900x18.webp',
        'https://forms.gle/gbu-tech-symposium-2024',
        '["Tech", "Symposium", "Engineering"]'
    ::jsonb,
  '["https://img1.com", "https://img2.com"]'::jsonb,
  '[{"time": "09:00 AM", "activity": "Registration"}, {"time": "10:00 AM", "activity": "Keynote"}]'::jsonb,
  '[{"name": "Dr. Rajesh", "designation": "HOD", "topic": "AI Trends"}]'::jsonb
);

    SELECT setval(
  pg_get_serial_sequence('events', 'id'),
  COALESCE((SELECT MAX(id) FROM events), 1),
  true
);

    -- =====================================
    -- PERMISSIONS FOR BACKEND APP USER
    -- =====================================
    -- Keep this role name aligned with DATABASE_URL username.
    DO $$
    BEGIN
      IF EXISTS (SELECT 1
      FROM pg_roles
      WHERE rolname = 'gbu-user') THEN
      GRANT USAGE ON SCHEMA public TO "gbu-user";
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "gbu-user";
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "gbu-user";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "gbu-user";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO "gbu-user";
    ELSE
    RAISE NOTICE 'Role "gbu-user" not found. Create it or update grant role in schema.sql.';
    END
    IF;
END $$;

    -- =====================================
    -- CHECK DATA
    -- =====================================
    SELECT *
    FROM notices;
    SELECT *
    FROM news;
    SELECT *
    FROM events;

    COMMIT;
