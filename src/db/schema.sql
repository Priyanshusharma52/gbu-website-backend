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

  CREATE TABLE newsletters
  (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_number VARCHAR(100),
    published_date DATE,
    cover_image_url TEXT,
    excerpt TEXT,
    pdf_url TEXT,
    views INT DEFAULT 0,
    category VARCHAR(100)
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

    CREATE TABLE media_gallery
    (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      year VARCHAR(10) NOT NULL,
      published_date DATE NOT NULL,
      images JSONB DEFAULT '[]'
      ::jsonb
);

      CREATE TABLE tenders
      (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reference_no VARCHAR(100) UNIQUE,
        category VARCHAR(100),
        tender_type VARCHAR(20) NOT NULL DEFAULT 'RFP',
        published_date DATE,
        closing_date DATE NOT NULL,
        document_url TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- =====================================
      -- INSERT ONLY 1 RECORD PER CORE TABLE
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

      INSERT INTO newsletters
        (
        id,
        title,
        issue_number,
        published_date,
        cover_image_url,
        excerpt,
        pdf_url,
        views,
        category
        )
      VALUES
        (
          1,
          'GBU Spring Fest 2025',
          'Vol. 15, Issue 1',
          '2025-03-15',
          'https://cdn.thedecorjournalindia.com/wp-content/uploads/2022/11/9_Modern-day-marvel-Gautam-Buddha-University-by-CP-Kukreja-architects-transpires-fresh-vibe-and-ancient-wisdom.jpg?lossy=1&resize=1920%2C1357&ssl=1&strip=all',
          'Highlights of GBU''s Spring Fest - cultural nights, competitions, and student showcases.',
          '/newsletters/spring-fest-2025.pdf',
          1245,
          'Events'
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

      -- =====================================
      -- INSERT MEDIA GALLERY DATA
      -- =====================================
      INSERT INTO media_gallery
        (id, title, category, year, published_date, images)
      VALUES
        (1, '15th Annual Convocation Ceremony', 'Convocation', '2025', '2025-05-12', '["https://www.ic3ecsbhi.com/Gallery/20231224_134240.jpg", "https://www.ic3ecsbhi.com/Events/IMG-20231224-WA0082.jpg", "https://hostels.gbu.ac.in/uploads/eventsfiles/photos/65a98a5384fb0_GBU-Convocation.jpeg"]'
      ::jsonb),
      (2, 'National Sports Meet 2025', 'Sports', '2025', '2025-02-18', '["https://www.gbu.ac.in/Content/img/sports/banner2.jpg", "https://www.gbu.ac.in/Content/img/sports/banner1.jpg"]'::jsonb),
      (3, 'Annual Cultural Fest - Rhythms 2025', 'Cultural', '2025', '2025-03-10', '["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80", "https://www.gbu.ac.in/Content/img/cc/Artboard%201abhivyanjana7.jpg"]'::jsonb),
      (4, 'International Research Symposium', 'Academic', '2025', '2025-04-08', '["https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (5, 'Campus Life - Spring Moments', 'Campus Life', '2025', '2025-03-25', '["https://cdn.thedecorjournalindia.com/wp-content/uploads/2022/11/9_Modern-day-marvel-Gautam-Buddha-University-by-CP-Kukreja-architects-transpires-fresh-vibe-and-ancient-wisdom.jpg?lossy=1&resize=1920%2C1357&ssl=1&strip=all", "https://images.lifestyleasia.com/wp-content/uploads/sites/7/2022/11/03131617/1-inside-image-816-x-576-horizontal.jpeg", "https://hawmagazine.com/wp-content/uploads/2023/11/DSF8939-croped-1.jpg"]'::jsonb),
      (6, 'Tech Symposium 2025', 'Events', '2025', '2025-01-22', '["https://www.gbu.ac.in/Content/gbudata/incubation/Incubation_Pic9.jpg", "https://www.ic3ecsbhi.com/dsf8951%20copy.jpeg"]'::jsonb),
      (7, 'Robotics Workshop & Expo', 'Academic', '2024', '2024-08-10', '["https://www.ux4g.gov.in/assets/img/awareness-workshop/gbu-19-11-24/900x1.webp", "https://static.toiimg.com/thumb/msid-104795413%2Cwidth-1280%2Cheight-720%2Cresizemode-72/104795413.jpg"]'::jsonb),
      (8, 'Faculty Development Program 2024', 'Academic', '2024', '2024-12-12', '["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"]'::jsonb);
      INSERT INTO tenders
        (
        id,
        title,
        description,
        reference_no,
        category,
        tender_type,
        published_date,
        closing_date,
        document_url,
        is_active
        )
      VALUES
        (
          1,
          'Supply of IT Equipment and Software Licenses',
          'Procurement of desktops, networking hardware, and software licenses for the academic block.',
          'GBU/TND/2026/001',
          'Information Technology',
          'RFQ',
          '2026-04-01',
          '2026-05-10',
          '/documents/tender-001.pdf',
          TRUE
        ),
        (
          2,
          'Construction of Water Treatment Facility',
          'Design, construction, and commissioning of a campus water treatment plant.',
          'GBU/TND/2026/002',
          'Infrastructure',
          'RFP',
          '2026-03-20',
          '2026-04-05',
          '/documents/tender-002.pdf',
          TRUE
        ),
        (
          3,
          'AMC for HVAC Systems',
          'Annual maintenance contract for HVAC units across hostels and teaching blocks.',
          'GBU/TND/2026/003',
          'Maintenance',
          'RFE',
          '2026-01-10',
          '2026-02-15',
          '/documents/tender-003.pdf',
          TRUE
        );

      SELECT setval(
  pg_get_serial_sequence('events', 'id'),
  COALESCE((SELECT MAX(id) FROM events), 1),
  true
);

      SELECT setval(
  pg_get_serial_sequence('media_gallery', 'id'),
  COALESCE((SELECT MAX(id) FROM media_gallery), 1),
  true
);

      SELECT setval(
  pg_get_serial_sequence('tenders', 'id'),
  COALESCE((SELECT MAX(id) FROM tenders), 1),
  true
);

      SELECT setval(
  pg_get_serial_sequence('newsletters', 'id'),
  COALESCE((SELECT MAX(id) FROM newsletters), 0) + 1,
  false
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
      SELECT COUNT(*) AS notices_count
      FROM notices;
      SELECT COUNT(*) AS news_count
      FROM news;
      SELECT COUNT(*) AS events_count
      FROM events;
      SELECT COUNT(*) AS media_gallery_count
      FROM media_gallery;
      SELECT COUNT(*) AS newsletters_count
      FROM newsletters;
      SELECT COUNT(*) AS tenders_count
      FROM tenders;

      COMMIT;
