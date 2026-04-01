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
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

-- =====================================
-- TABLES
-- =====================================
CREATE TABLE notices (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  date DATE,
  type VARCHAR(50),
  priority VARCHAR(20),
  views INT DEFAULT 0,
  is_new BOOLEAN,
  pdf_url VARCHAR(255)
);

CREATE TABLE news (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  excerpt TEXT,
  content TEXT,
  date DATE,
  author VARCHAR(100),
  department VARCHAR(100),
  tags TEXT,
  category VARCHAR(100),
  priority VARCHAR(20),
  views INT,
  likes INT,
  image_url TEXT,
  featured BOOLEAN,
  status VARCHAR(50)
);

CREATE TABLE events (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  organizer VARCHAR(255),
  date DATE,
  time VARCHAR(20),
  location VARCHAR(255),
  type VARCHAR(50),
  description TEXT,
  image TEXT,
  attendees INT,
  status VARCHAR(20),
  price VARCHAR(20),
  tags TEXT,
  year VARCHAR(10)
);

-- =====================================
-- INSERT NOTICES (15)
-- =====================================
INSERT INTO notices VALUES
(1,'End Semester Examination Schedule - June 2025','The final schedule for End Semester Examinations (June 2025) is now available.','2025-05-25','Exam','high',1245,true,'https://gbu.ac.in/notices/exam-schedule-june-2025.pdf'),
(2,'Extension of Fee Payment Deadline - Summer Semester','Fee payment extended to 5 June 2025.','2025-05-20','Fee','medium',892,false,'https://gbu.ac.in/notices/fee-extension-summer-2025.pdf'),
(3,'Annual Convocation 2025 Notification','Convocation will be held on 30 July.','2025-05-15','Event','high',2156,true,'https://gbu.ac.in/notices/convocation-2025-guidelines.pdf'),
(4,'Academic Calendar 2025-26 Released','Academic Calendar published.','2025-05-10','Academic','medium',1678,false,'https://gbu.ac.in/notices/academic-calendar-2025-26.pdf'),
(5,'Notice Regarding Monsoon Break','Monsoon Break notice.','2025-05-12','General','low',743,false,''),
(6,'Mid-Term Examination Guidelines','Mid term guidelines.','2025-06-01','Exam','high',1834,true,'https://gbu.ac.in/notices/midterm-guidelines-july-2025.pdf'),
(7,'Scholarship Renewal Notice','Scholarship renewal notice.','2025-06-05','General','medium',567,false,'https://gbu.ac.in/notices/scholarship-renewal-2025.pdf'),
(8,'Workshop on Cybersecurity','Cybersecurity workshop.','2025-06-10','Event','medium',1289,true,'https://gbu.ac.in/notices/cybersecurity-workshop-2025.pdf'),
(9,'Hostel Allotment Notice','Hostel allotment notice.','2025-06-15','General','high',2341,true,'https://gbu.ac.in/notices/hostel-allotment-2025.pdf'),
(10,'Holiday Notice Raksha Bandhan','Holiday notice.','2025-06-18','General','low',456,false,''),
(11,'Research Paper Guidelines','Research guidelines.','2025-06-20','Academic','medium',789,true,'https://gbu.ac.in/notices/research-guidelines-2025.pdf'),
(12,'Sports Complex Maintenance','Maintenance notice.','2025-06-22','General','low',234,false,''),
(13,'Library Extended Hours','Library notice.','2025-06-25','Academic','medium',1567,true,'https://gbu.ac.in/notices/library-extended-hours.pdf'),
(14,'Career Fair 2025','Career fair notice.','2025-06-28','Event','high',3456,true,'https://gbu.ac.in/notices/career-fair-2025.pdf'),
(15,'New Course Offerings','New courses notice.','2025-06-30','Academic','medium',987,true,'https://gbu.ac.in/notices/new-courses-winter-2025.pdf');

-- =====================================
-- INSERT NEWS (15)
-- =====================================
INSERT INTO news VALUES
(1,'GBU AI Center','AI research center launched','AI ML research center','2024-06-20','Dr. Rajesh Kumar','Research Cell','AI,Research','Research','high',2847,156,'img1.jpg',true,'published'),
(2,'Convocation 2024','Degrees awarded','Convocation ceremony','2024-05-30','Prof. Meera Sharma','Academic Affairs','Convocation','Academic','high',1923,89,'img2.jpg',true,'published'),
(3,'Innovation Hackathon','Students won hackathon','Smart traffic system','2024-05-15','Dr. Amit Singh','Innovation Cell','Hackathon','Student Achievement','medium',1567,134,'img3.jpg',false,'published'),
(4,'Digital Library','Library upgraded','Digital resources added','2024-04-28','Priya Gupta','Library','Library','Infrastructure','medium',987,67,'img4.jpg',false,'published'),
(5,'Sports Championship','GBU won medals','Sports championship','2024-04-10','Vikram Singh','Sports','Sports','Sports','medium',1432,98,'img5.jpg',false,'published'),
(6,'Green Campus','Tree plantation','Green campus drive','2024-04-05','Sunita Verma','Environment','Green','Environment','low',756,145,'img6.jpg',false,'published'),
(7,'Cultural Fest','Abhivyakti fest','Cultural fest','2024-03-20','Kavita Mishra','Cultural','Fest','Cultural','medium',2156,203,'img7.jpg',false,'published'),
(8,'Blood Donation Drive','NSS event','Blood donation','2024-03-15','Ravi Kumar','NSS','Social','Social','medium',1089,87,'img8.jpg',false,'published'),
(9,'Programming Competition','Coding event','Competition','2024-02-25','Ankit Sharma','CSE','Coding','Technology','medium',1678,156,'img9.jpg',false,'published'),
(10,'International Collaboration','University collaboration','Exchange program','2024-02-10','Neha Agarwal','International','Collaboration','International','high',934,76,'img10.jpg',false,'published'),
(11,'Wellness Week','Fitness event','Mental health week','2024-01-25','Seema Yadav','Student Welfare','Wellness','Wellness','low',1234,112,'img11.jpg',false,'published'),
(12,'Industry Expert Series','Career talk','Industry session','2024-01-15','Ritika Jain','Career','Career','Career','medium',1456,89,'img12.jpg',false,'published'),
(13,'Placement Success','Placement record','Placement drive','2023-12-30','Manish Gupta','Placement','Jobs','Placements','high',3421,267,'img13.jpg',true,'published'),
(14,'Creative Arts Workshop','Arts workshop','Photography','2023-12-15','Rohit Verma','Fine Arts','Arts','Arts','low',678,54,'img14.jpg',false,'published'),
(15,'Educational Tour','Political science tour','Parliament visit','2023-12-05','Manoj Tiwari','Political Science','Tour','Education','low',543,42,'img15.jpg',false,'published');

-- =====================================
-- INSERT EVENTS (18)
-- =====================================
INSERT INTO events VALUES
(1,'Annual Research Conference 2025','Computer Science Department','2025-08-15','09:00','Main Auditorium','Conference','Research conference','img1.jpg',250,'upcoming','Free','Research','2025'),
(2,'Web Development Workshop','IT Department','2025-07-25','14:00','Computer Lab 1','Workshop','Web development','img2.jpg',50,'upcoming','500','Web','2025'),
(3,'AI Symposium','Research Center','2025-09-10','10:00','Science Block','Symposium','AI symposium','img3.jpg',200,'upcoming','1000','AI','2025'),
(4,'Innovation Fair','Innovation Cell','2025-08-05','11:00','Campus Ground','Fair','Innovation fair','img4.jpg',300,'upcoming','Free','Innovation','2025'),
(5,'Cybersecurity Workshop','Security Team','2025-07-30','13:00','Tech Center','Workshop','Security workshop','img5.jpg',75,'upcoming','750','Security','2025'),
(6,'Data Science Bootcamp','Analytics Department','2025-08-20','09:30','Data Lab','Bootcamp','Data science','img6.jpg',40,'upcoming','2000','Data','2025'),
(7,'Blockchain Seminar','Fintech Club','2025-09-15','15:00','Seminar Hall','Seminar','Blockchain seminar','img7.jpg',120,'upcoming','300','Blockchain','2025'),
(8,'Mobile App Workshop','Mobile Dev Team','2025-08-12','10:30','Mobile Lab','Workshop','Mobile apps','img8.jpg',60,'upcoming','800','Mobile','2025'),
(9,'Cloud Conference','Cloud Team','2025-09-25','09:00','Convention Center','Conference','Cloud conference','img9.jpg',180,'upcoming','1200','Cloud','2025'),
(10,'UI UX Masterclass','Design Studio','2025-07-28','14:30','Design Lab','Masterclass','UI UX','img10.jpg',35,'upcoming','1500','Design','2025'),
(11,'DevOps Summit','Operations Team','2025-08-18','11:30','Tech Hub','Summit','DevOps','img11.jpg',90,'upcoming','900','DevOps','2025'),
(12,'Digital Marketing Workshop','Marketing Department','2025-09-05','16:00','Media Center','Workshop','Marketing','img12.jpg',65,'upcoming','600','Marketing','2025'),
(13,'React Conference 2024','Frontend Guild','2024-12-15','10:00','Tech Auditorium','Conference','React conference','img13.jpg',300,'past','800','React','2024'),
(14,'Python Bootcamp','Programming Club','2025-01-20','09:00','Computer Center','Bootcamp','Python','img14.jpg',80,'past','1200','Python','2025'),
(15,'Startup Pitch','Entrepreneurship Cell','2025-02-28','14:00','Main Hall','Competition','Startup pitch','img15.jpg',150,'past','Free','Startup','2025'),
(16,'Machine Learning Workshop','AI Lab','2025-03-10','11:00','Research Center','Workshop','ML workshop','img16.jpg',60,'past','1000','ML','2025'),
(17,'Database Seminar','Database Team','2025-04-15','15:30','Lecture Hall 3','Seminar','Database','img17.jpg',90,'past','400','Database','2025'),
(18,'Agile Workshop','PM Office','2025-05-20','09:30','Training Room 2','Workshop','Agile','img18.jpg',45,'past','650','Agile','2025');

-- =====================================
-- CHECK DATA
-- =====================================
SELECT * FROM notices;
SELECT * FROM news;
SELECT * FROM events;

COMMIT;
