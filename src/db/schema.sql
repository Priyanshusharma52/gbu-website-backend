BEGIN;

  CREATE EXTENSION
  IF NOT EXISTS pgcrypto;

CREATE TABLE
IF NOT EXISTS roles
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  code VARCHAR
(50) NOT NULL UNIQUE,
  name VARCHAR
(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS users
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  role_id UUID NOT NULL REFERENCES roles
(id),
  name VARCHAR
(150) NOT NULL,
  email VARCHAR
(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR
(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS user_profiles
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  user_id UUID NOT NULL UNIQUE REFERENCES users
(id) ON
DELETE CASCADE,
  employee_code VARCHAR(50),
  designation VARCHAR
(120),
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS schools
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  code VARCHAR
(50) NOT NULL UNIQUE,
  name VARCHAR
(200) NOT NULL UNIQUE,
  slug VARCHAR
(200) NOT NULL UNIQUE,
  overview TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users
(id),
  updated_by UUID REFERENCES users
(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS departments
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  school_id UUID NOT NULL REFERENCES schools
(id) ON
DELETE RESTRICT,
  code VARCHAR(50)
NOT NULL,
  name VARCHAR
(200) NOT NULL,
  slug VARCHAR
(200) NOT NULL UNIQUE,
  about TEXT,
  contact_email VARCHAR
(255),
  contact_phone VARCHAR
(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users
(id),
  updated_by UUID REFERENCES users
(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(school_id, code),
  UNIQUE
(school_id, name)
);

CREATE TABLE
IF NOT EXISTS programs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  department_id UUID NOT NULL REFERENCES departments
(id) ON
DELETE RESTRICT,
  code VARCHAR(50)
NOT NULL,
  name VARCHAR
(200) NOT NULL,
  level VARCHAR
(50) NOT NULL,
  duration_years INTEGER NOT NULL,
  intake_capacity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(department_id, code)
);

CREATE TABLE
IF NOT EXISTS courses
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  program_id UUID NOT NULL REFERENCES programs
(id) ON
DELETE CASCADE,
  code VARCHAR(50)
NOT NULL,
  name VARCHAR
(250) NOT NULL,
  credits NUMERIC
(4,2) NOT NULL,
  semester INTEGER,
  syllabus_version VARCHAR
(20) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(program_id, code)
);

CREATE TABLE
IF NOT EXISTS course_outcomes
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  course_id UUID NOT NULL REFERENCES courses
(id) ON
DELETE CASCADE,
  outcome_code VARCHAR(50)
NOT NULL,
  outcome_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(course_id, outcome_code)
);

CREATE TABLE
IF NOT EXISTS department_contacts
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  department_id UUID NOT NULL REFERENCES departments
(id) ON
DELETE CASCADE,
  name VARCHAR(200)
NOT NULL,
  designation VARCHAR
(150),
  email VARCHAR
(255),
  phone VARCHAR
(20),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS department_notices
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  department_id UUID NOT NULL REFERENCES departments
(id) ON
DELETE CASCADE,
  title VARCHAR(250)
NOT NULL,
  content TEXT,
  notice_type VARCHAR
(50),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS labs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  department_id UUID NOT NULL REFERENCES departments
(id) ON
DELETE CASCADE,
  name VARCHAR(200)
NOT NULL,
  description TEXT,
  location VARCHAR
(250),
  incharge_name VARCHAR
(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS boards_of_study
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  department_id UUID NOT NULL REFERENCES departments
(id) ON
DELETE CASCADE,
  title VARCHAR(200)
NOT NULL,
  member_name VARCHAR
(200) NOT NULL,
  member_role VARCHAR
(120),
  tenure_start DATE,
  tenure_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  CHECK
(tenure_start IS NULL OR tenure_end IS NULL OR tenure_start <= tenure_end)
);

CREATE TABLE
IF NOT EXISTS faculty_profiles
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  user_id UUID NOT NULL UNIQUE REFERENCES users
(id) ON
DELETE CASCADE,
  department_id UUID
REFERENCES departments
(id) ON
DELETE
SET NULL
,
  qualification TEXT,
  specialization TEXT,
  research_interests TEXT,
  office_location VARCHAR
(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS faculty_publications
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  faculty_profile_id UUID NOT NULL REFERENCES faculty_profiles
(id) ON
DELETE CASCADE,
  title TEXT
NOT NULL,
  publication_year INTEGER NOT NULL,
  doi VARCHAR
(255),
  publication_url TEXT,
  indexed_in VARCHAR
(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS admission_cycles
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name VARCHAR
(150) NOT NULL UNIQUE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  CHECK
(starts_on <= ends_on)
);

CREATE TABLE
IF NOT EXISTS admission_programs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  admission_cycle_id UUID NOT NULL REFERENCES admission_cycles
(id) ON
DELETE CASCADE,
  program_id UUID
NOT NULL REFERENCES programs
(id) ON
DELETE RESTRICT,
  seats_total INTEGER
NOT NULL,
  eligibility_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(admission_cycle_id, program_id)
);

CREATE TABLE
IF NOT EXISTS applications
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  applicant_user_id UUID NOT NULL REFERENCES users
(id) ON
DELETE RESTRICT,
  admission_program_id UUID
NOT NULL REFERENCES admission_programs
(id) ON
DELETE RESTRICT,
  status VARCHAR(50)
NOT NULL DEFAULT 'submitted',
  category VARCHAR
(50),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users
(id),
  reviewed_at TIMESTAMPTZ,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(applicant_user_id, admission_program_id)
);

CREATE TABLE
IF NOT EXISTS application_documents
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  application_id UUID NOT NULL REFERENCES applications
(id) ON
DELETE CASCADE,
  document_type VARCHAR(100)
NOT NULL,
  document_url TEXT NOT NULL,
  verification_status VARCHAR
(50) NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users
(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS application_status_history
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  application_id UUID NOT NULL REFERENCES applications
(id) ON
DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR
(50) NOT NULL,
  changed_by UUID REFERENCES users
(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  reason TEXT
);

CREATE TABLE
IF NOT EXISTS facilities
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name VARCHAR
(200) NOT NULL,
  code VARCHAR
(50) NOT NULL UNIQUE,
  location VARCHAR
(250),
  capacity INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS facility_pricing_rules
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  facility_id UUID NOT NULL REFERENCES facilities
(id) ON
DELETE CASCADE,
  requester_role_code VARCHAR(50)
NOT NULL,
  event_type VARCHAR
(100) NOT NULL,
  base_price NUMERIC
(12,2) NOT NULL,
  per_hour_price NUMERIC
(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(facility_id, requester_role_code, event_type)
);

CREATE TABLE
IF NOT EXISTS booking_requests
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  facility_id UUID NOT NULL REFERENCES facilities
(id) ON
DELETE RESTRICT,
  requester_user_id UUID
NOT NULL REFERENCES users
(id) ON
DELETE RESTRICT,
  event_name VARCHAR(250)
NOT NULL,
  event_type VARCHAR
(100) NOT NULL,
  from_at TIMESTAMPTZ NOT NULL,
  to_at TIMESTAMPTZ NOT NULL,
  status VARCHAR
(50) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users
(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  CHECK
(from_at < to_at)
);

CREATE TABLE
IF NOT EXISTS tenders
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  tender_no VARCHAR
(100) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  published_on DATE NOT NULL,
  closing_on DATE NOT NULL,
  status VARCHAR
(50) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users
(id),
  updated_by UUID REFERENCES users
(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  CHECK
(published_on <= closing_on)
);

CREATE TABLE
IF NOT EXISTS tender_documents
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  tender_id UUID NOT NULL REFERENCES tenders
(id) ON
DELETE CASCADE,
  version_no INTEGER
NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  document_type VARCHAR
(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(tender_id, version_no)
);

CREATE TABLE
IF NOT EXISTS job_posts
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  title VARCHAR
(250) NOT NULL,
  department_id UUID REFERENCES departments
(id) ON
DELETE
SET NULL
,
  employment_type VARCHAR
(100),
  experience_required VARCHAR
(150),
  application_deadline DATE,
  status VARCHAR
(50) NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES users
(id),
  updated_by UUID REFERENCES users
(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS job_applications
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  job_post_id UUID NOT NULL REFERENCES job_posts
(id) ON
DELETE CASCADE,
  applicant_user_id UUID
REFERENCES users
(id) ON
DELETE
SET NULL
,
  applicant_name VARCHAR
(200) NOT NULL,
  applicant_email VARCHAR
(255) NOT NULL,
  current_status VARCHAR
(50) NOT NULL DEFAULT 'submitted',
  resume_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS complaints
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  raised_by UUID NOT NULL REFERENCES users
(id) ON
DELETE RESTRICT,
  category VARCHAR(100)
NOT NULL,
  subject VARCHAR
(250) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR
(30) NOT NULL DEFAULT 'medium',
  status VARCHAR
(50) NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES users
(id),
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS complaint_comments
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  complaint_id UUID NOT NULL REFERENCES complaints
(id) ON
DELETE CASCADE,
  commented_by UUID
NOT NULL REFERENCES users
(id),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS contact_submissions
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name VARCHAR
(150) NOT NULL,
  email VARCHAR
(255) NOT NULL,
  phone VARCHAR
(20),
  subject VARCHAR
(250),
  message TEXT NOT NULL,
  status VARCHAR
(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS clubs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name VARCHAR
(200) NOT NULL UNIQUE,
  slug VARCHAR
(200) NOT NULL UNIQUE,
  description TEXT,
  faculty_coordinator_id UUID REFERENCES users
(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS club_memberships
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  club_id UUID NOT NULL REFERENCES clubs
(id) ON
DELETE CASCADE,
  user_id UUID
NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  membership_status VARCHAR(50)
NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(),
  UNIQUE
(club_id, user_id)
);

CREATE TABLE
IF NOT EXISTS notifications
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  user_id UUID REFERENCES users
(id) ON
DELETE CASCADE,
  title VARCHAR(250)
NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR
(50) NOT NULL DEFAULT 'in_app',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS audit_logs
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  actor_user_id UUID REFERENCES users
(id),
  action VARCHAR
(120) NOT NULL,
  resource_type VARCHAR
(120) NOT NULL,
  resource_id UUID,
  request_id VARCHAR
(120),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE INDEX
IF NOT EXISTS idx_users_role_id ON users
(role_id);
CREATE INDEX
IF NOT EXISTS idx_departments_school_id ON departments
(school_id);
CREATE INDEX
IF NOT EXISTS idx_programs_department_id ON programs
(department_id);
CREATE INDEX
IF NOT EXISTS idx_courses_program_id ON courses
(program_id);
CREATE INDEX
IF NOT EXISTS idx_course_outcomes_course_id ON course_outcomes
(course_id);
CREATE INDEX
IF NOT EXISTS idx_department_contacts_department_id ON department_contacts
(department_id);
CREATE INDEX
IF NOT EXISTS idx_department_notices_department_id ON department_notices
(department_id);
CREATE INDEX
IF NOT EXISTS idx_labs_department_id ON labs
(department_id);
CREATE INDEX
IF NOT EXISTS idx_boards_of_study_department_id ON boards_of_study
(department_id);
CREATE INDEX
IF NOT EXISTS idx_faculty_profiles_department_id ON faculty_profiles
(department_id);
CREATE INDEX
IF NOT EXISTS idx_applications_admission_program_id ON applications
(admission_program_id);
CREATE INDEX
IF NOT EXISTS idx_applications_status ON applications
(status);
CREATE INDEX
IF NOT EXISTS idx_booking_requests_facility_id ON booking_requests
(facility_id);
CREATE INDEX
IF NOT EXISTS idx_booking_requests_status ON booking_requests
(status);
CREATE INDEX
IF NOT EXISTS idx_tenders_status ON tenders
(status);
CREATE INDEX
IF NOT EXISTS idx_job_posts_status ON job_posts
(status);
CREATE INDEX
IF NOT EXISTS idx_complaints_status ON complaints
(status);
CREATE INDEX
IF NOT EXISTS idx_complaints_assigned_to ON complaints
(assigned_to);
CREATE INDEX
IF NOT EXISTS idx_notifications_user_id ON notifications
(user_id);
CREATE INDEX
IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs
(actor_user_id);

INSERT INTO roles
  (code, name, description)
VALUES
  ('super_admin', 'Super Admin', 'Platform administrator with complete access'),
  ('school', 'School', 'School-level management role'),
  ('faculty', 'Faculty', 'Faculty member role'),
  ('staff', 'Staff', 'Operational staff role')
ON CONFLICT
(code) DO NOTHING;

COMMIT;
