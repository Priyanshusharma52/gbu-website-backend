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
      (8, 'Faculty Development Program 2024', 'Academic', '2024', '2024-12-12', '["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (9, 'Science & Innovation Fair', 'Academic', '2024', '2024-10-18', '["https://gburif.org/images/intro-carousel/gautam-buddha-university-3.jpg", "https://www.hindustantimes.com/ht-img/img/2024/09/05/1600x900/The-12-hour-Hackathon-was-held-at-the-Central-Comp_1725563537794.jpg"]'::jsonb),
      (10, 'Inter-College Football League', 'Sports', '2024', '2024-09-20', '["https://www.gbu.ac.in/Content/img/sports/banner1.jpg"]'::jsonb),
      (11, 'Winter Cultural Gala', 'Cultural', '2024', '2024-12-22', '["https://i.ytimg.com/vi/Aicd7XpY9eI/sd2.jpg?rs=AOn4CLCprID9Bk-ruT1eZpLbeLjahWmBSg&sqp=-oaymwEoCIAFEOAD8quKqQMcGADwAQH4AYwCgALgA4oCDAgAEAEYVCAgKH8wDw%3D%3D"]'::jsonb),
      (12, 'Open Stage Night', 'Cultural', '2024', '2024-11-15', '["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (13, 'Yoga & Wellness Retreat', 'Campus Life', '2024', '2024-07-05', '["https://www.gbu.ac.in/Content/gbudata/meditation/img/buddha28.jpg", "https://www.gbu.ac.in/Content/gbudata/meditation/img/buddha31.jpg"]'::jsonb),
      (14, 'GBU Literary Festival', 'Cultural', '2024', '2024-09-15', '["https://sameer.mygbu.in/home/uploads/4.jpg"]'::jsonb),
      (15, 'GBU Half Marathon 2025', 'Sports', '2025', '2025-01-28', '["https://www.gbu.ac.in/Content/img/sports/banner1.jpg"]'::jsonb),
      (16, 'Inter-University Debate Championship', 'Academic', '2025', '2025-02-20', '["https://d8it4huxumps7.cloudfront.net/lambda-pdfs/opportunity-bannerImages/1743929131.png"]'::jsonb),
      (17, 'Startup Expo & Innovation Fair', 'Events', '2025', '2025-03-18', '["https://images.unsplash.com/photo-1564866657310-2630c1f1df9f?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (18, 'Women Empowerment Seminar', 'Academic', '2025', '2025-03-25', '["https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (19, 'Spring Tree Plantation Drive', 'Campus Life', '2025', '2025-04-05', '["https://images.unsplash.com/photo-1575202335306-5c8c54b6db1c?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (20, 'GBU Alumni Meet & Reunion', 'Events', '2025', '2025-04-20', '["https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (21, 'Environmental Awareness Drive', 'Campus Life', '2025', '2025-05-02', '["https://images.unsplash.com/photo-1575202335306-5c8c54b6db1c?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (22, 'Inter-College Hackathon', 'Academic', '2025', '2025-05-15', '["https://images.unsplash.com/photo-1537432376769-00aabc1ca45c?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (23, 'Cultural Evening - Folk Fusion', 'Cultural', '2025', '2025-06-10', '["https://images.unsplash.com/photo-1587049352849-35263f2e96f5?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (24, 'Photography Exhibition', 'Cultural', '2025', '2025-06-20', '["https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80"]'::jsonb),
      (25, 'Summer Internship Orientation', 'Academic', '2025', '2025-07-01', '["https://biotechworldindia.in/wp-content/uploads/2023/11/IMG-20200620-WA0002-1024x705.jpg"]'::jsonb);

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

      COMMIT;
