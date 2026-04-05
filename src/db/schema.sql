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
INSERT INTO notices (id, title, content, date, type, priority, views, is_new, pdf_url) VALUES
(
  1, 
  'End Semester Examination Schedule - June 2025', 
  'The final schedule for End Semester Examinations (June 2025) is now available. Students are advised to download the PDF and prepare accordingly. This includes all undergraduate and postgraduate programs across all schools.', 
  '2025-05-25', 
  'Exam', 
  'high', 
  1245, 
  TRUE, 
  'https://gbu.ac.in/notices/exam-schedule-june-2025.pdf'
),
(
  2, 
  'Extension of Fee Payment Deadline - Summer Semester', 
  'The last date for fee payment for the Summer Semester has been extended to 5th June 2025. Late fee will be applicable after this date. Students can pay online or visit the finance office during working hours.', 
  '2025-05-20', 
  'Fee', 
  'medium', 
  892, 
  FALSE, 
  'https://gbu.ac.in/notices/fee-extension-summer-2025.pdf'
),
(
  3, 
  'Annual Convocation 2025 Notification', 
  'The Annual Convocation for the graduating batch of 2025 will be held on 30th July. Graduates are required to register online through the university portal. Dress code and venue details are attached.', 
  '2025-05-15', 
  'Event', 
  'high', 
  2156, 
  TRUE, 
  'https://gbu.ac.in/notices/convocation-2025-guidelines.pdf'
),
(
  4, 
  'Academic Calendar 2025-26 Released', 
  'The detailed Academic Calendar for the session 2025-26 has been published. Download for semester-wise schedules, holidays, and important academic dates. All departments should follow this calendar strictly.', 
  '2025-05-10', 
  'Academic', 
  'medium', 
  1678, 
  FALSE, 
  'https://gbu.ac.in/notices/academic-calendar-2025-26.pdf'
),
(
  5, 
  'Notice Regarding Monsoon Break', 
  'All students are informed that the Monsoon Break will be observed from 20th July to 5th August 2025. During this period, all academic activities will remain suspended except for essential administrative work.', 
  '2025-05-12', 
  'General', 
  'low', 
  743, 
  FALSE, 
  ''
),
(
  6, 
  'Mid-Term Examination Guidelines - July 2025', 
  'Please refer to the attached guidelines for the upcoming Mid-Term Examinations for all undergraduate and postgraduate programs. Seating arrangements and exam rules are specified in detail.', 
  '2025-06-01', 
  'Exam', 
  'high', 
  1834, 
  TRUE, 
  'https://gbu.ac.in/notices/midterm-guidelines-july-2025.pdf'
),
(
  7, 
  'Scholarship Renewal Notice - 2025', 
  'Students availing scholarships are advised to submit renewal applications before 10th August 2025 to the Scholarship Cell. Required documents list and application form are available on the website.', 
  '2025-06-05', 
  'General', 
  'medium', 
  567, 
  FALSE, 
  'https://gbu.ac.in/notices/scholarship-renewal-2025.pdf'
),
(
  8, 
  'Workshop on Cybersecurity and Data Privacy', 
  'A National Workshop on Cybersecurity and Data Privacy will be organized by the School of ICT on 22nd August. Limited seats available. Registration is mandatory for all participants.', 
  '2025-06-10', 
  'Event', 
  'medium', 
  1289, 
  TRUE, 
  'https://gbu.ac.in/notices/cybersecurity-workshop-2025.pdf'
),
(
  9, 
  'Notice for Hostel Allotment - New Session', 
  'Online applications for hostel allotment for the academic session 2025-26 are now open. Download the notice for detailed procedure, eligibility criteria, and required documents.', 
  '2025-06-15', 
  'General', 
  'high', 
  2341, 
  TRUE, 
  'https://gbu.ac.in/notices/hostel-allotment-2025.pdf'
),
(
  10, 
  'Holiday Notice: Raksha Bandhan', 
  'The university will remain closed on 18th August 2025 on account of Raksha Bandhan. All administrative offices and academic activities will resume on 19th August 2025.', 
  '2025-06-18', 
  'General', 
  'low', 
  456, 
  FALSE, 
  ''
),
(
  11, 
  'Research Paper Submission Guidelines - 2025', 
  'Updated guidelines for research paper submissions are now available. All research scholars must follow the new format and submission process as outlined in the attached document.', 
  '2025-06-20', 
  'Academic', 
  'medium', 
  789, 
  TRUE, 
  'https://gbu.ac.in/notices/research-guidelines-2025.pdf'
),
(
  12, 
  'Sports Complex Maintenance Notice', 
  'The Sports Complex will undergo maintenance from 25th July to 30th July 2025. All sports activities will be suspended during this period. Alternative arrangements will be made for urgent requirements.', 
  '2025-06-22', 
  'General', 
  'low', 
  234, 
  FALSE, 
  ''
),
(
  13, 
  'Library Extended Hours During Exams', 
  'The Central Library will remain open 24/7 during the examination period from 1st July to 31st July 2025. Special study spaces and additional resources will be made available for students.', 
  '2025-06-25', 
  'Academic', 
  'medium', 
  1567, 
  TRUE, 
  'https://gbu.ac.in/notices/library-extended-hours.pdf'
),
(
  14, 
  'Career Fair 2025 - Industry Partnership', 
  'The Annual Career Fair 2025 will be held from 15th to 17th September. Over 50 companies will participate. Students are advised to register early and prepare their resumes according to industry standards.', 
  '2025-06-28', 
  'Event', 
  'high', 
  3456, 
  TRUE, 
  'https://gbu.ac.in/notices/career-fair-2025.pdf'
),
(
  15, 
  'New Course Offerings - Winter Semester 2025', 
  'Several new elective courses are being offered in the Winter Semester 2025. Course details, prerequisites, and registration information are provided in the attached document.', 
  '2025-06-30', 
  'Academic', 
  'medium', 
  987, 
  TRUE, 
  'https://gbu.ac.in/notices/new-courses-winter-2025.pdf'
);
-- =====================================
-- INSERT NEWS (15)
-- =====================================
INSERT INTO news (id, title, excerpt, content, date, author, department, tags, category, priority, views, likes, image_url, featured, status) VALUES
(
  1, 
  'GBU Inaugurates Centre for Artificial Intelligence and Machine Learning', 
  'Gautam Buddha University launched a state-of-the-art Centre for AI and ML research to boost interdisciplinary innovation and develop smart technologies for societal impact.', 
  'The new centre will focus on cutting-edge research in machine learning, natural language processing, computer vision, and robotics. It aims to foster collaboration between academia and industry.', 
  '2024-06-20', 
  'Dr. Rajesh Kumar', 
  'Research Cell', 
  'AI, Research, Innovation, Technology', 
  'Research', 
  'high', 
  2847, 
  156, 
  'https://gburif.org/images/intro-carousel/gautam-buddha-university-3.jpg', 
  TRUE, 
  'published'
),
(
  2, 
  'Annual Convocation Ceremony 2024: Excellence Recognized', 
  'Over 3,000 degrees were awarded to graduating students across multiple disciplines in the presence of distinguished guests, faculty, and proud families.', 
  'The ceremony celebrated academic achievements and honored students for their dedication. Special awards were given for outstanding research and community service.', 
  '2024-05-30', 
  'Prof. Meera Sharma', 
  'Academic Affairs', 
  'Convocation, Graduation, Awards, Achievement', 
  'Academic', 
  'high', 
  1923, 
  89, 
  'https://tennews.in/wp-content/uploads/2016/04/14-3.jpg', 
  TRUE, 
  'published'
),
(
  3, 
  'GBU Students Excel at National Innovation Hackathon 2024', 
  'A multidisciplinary team of engineering and design students developed a smart traffic management system using IoT and AI, winning the grand prize.', 
  'The winning solution demonstrates real-time traffic optimization and emergency vehicle prioritization, showcasing practical application of academic knowledge.', 
  '2024-05-15', 
  'Dr. Amit Singh', 
  'Innovation Cell', 
  'Hackathon, Technology, Innovation, Students, Awards', 
  'Student Achievement', 
  'medium', 
  1567, 
  134, 
  'https://tennews.in/wp-content/uploads/2022/11/WhatsApp-Image-2022-11-22-at-8.24.01-PM-e1669129715871.jpeg', 
  FALSE, 
  'published'
),
(
  4, 
  'Digital Library Transformation: 50,000+ Resources Now Available', 
  'The university library has been upgraded with extensive digital resources including e-books, research journals, and multimedia archives accessible 24/7.', 
  'Students and faculty now have access to global databases, interactive learning materials, and collaborative study spaces with advanced technology integration.', 
  '2024-04-28', 
  'Ms. Priya Gupta', 
  'Library Services', 
  'Library, Digital Resources, Technology, Education', 
  'Infrastructure', 
  'medium', 
  987, 
  67, 
  'https://makesaral.com/wp-content/uploads/2025/06/Screenshot_2025-06-03-11-45-15-673_com.google.android.apps_.maps-edit.jpg', 
  FALSE, 
  'published'
),
(
  5, 
  'Inter-University Sports Championship: GBU Dominates with 15 Gold Medals', 
  'University athletes showcased exceptional performance across multiple sports disciplines, securing top positions in athletics, swimming, and team sports.', 
  'The sports meet featured over 2,000 participants from 50+ universities. GBU athletes set new records in several events and demonstrated outstanding sportsmanship.', 
  '2024-04-10', 
  'Coach Vikram Singh', 
  'Sports Department', 
  'Sports, Athletics, Championship, Achievement', 
  'Sports', 
  'medium', 
  1432, 
  98, 
  'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 
  FALSE, 
  'published'
),
(
  6, 
  'Green Campus Initiative: 1000+ Trees Planted in Sustainability Drive', 
  'Environmental awareness week concluded with a massive plantation drive involving students, faculty, and local community members promoting ecological responsibility.', 
  'The initiative is part of GBUs commitment to carbon neutrality by 2030. Native species were selected to enhance local biodiversity and create a sustainable ecosystem.', 
  '2024-04-05', 
  'Dr. Sunita Verma', 
  'Environmental Sciences', 
  'Environment, Sustainability, Green Campus, Community', 
  'Environment', 
  'low', 
  756, 
  145, 
  'https://scalemag.online/wp-content/uploads/2019/03/Gautam_Buddha_University.jpg', 
  FALSE, 
  'published'
),
(
  7, 
  'Abhivyakti 2024: Cultural Extravaganza Celebrates Diversity and Talent', 
  'Three days of vibrant cultural performances, art exhibitions, literary competitions, and celebrity guest appearances brought the campus to life.', 
  'The festival featured over 200 events across music, dance, drama, literature, and visual arts, providing a platform for student creativity and cultural exchange.', 
  '2024-03-20', 
  'Prof. Kavita Mishra', 
  'Cultural Affairs', 
  'Cultural, Festival, Arts, Music, Dance', 
  'Cultural', 
  'medium', 
  2156, 
  203, 
  'https://images.openai.com/thumbnails/url/VUAonnicu1mUUVJSUGylr5-al1xUWVCSmqJbkpRnoJdeXJJYkpmsl5yfq5-Zm5ieWmxfaAuUsXL0S7F0Tw4pdXePdE1PTTRzDypwLPYzijAtjjAIzSpJLfbzKgur8o3y1E3XTdWNqNBNzwyvisoxzcgLcHNLSYtXKwYAxKYpTA', 
  FALSE, 
  'published'
),
(
  8, 
  'Blood Donation Drive: Community Service Saves 300+ Lives', 
  'NSS volunteers organized a mega blood donation camp in collaboration with local hospitals, collecting over 300 units of blood for emergency medical needs.', 
  'The drive involved health checkups, awareness sessions about blood donation, and recognition for regular donors. Medical professionals ensured safe donation procedures.', 
  '2024-03-15', 
  'Dr. Ravi Kumar', 
  'NSS Unit', 
  'Social Service, Health, Community, Blood Donation', 
  'Social Service', 
  'medium', 
  1089, 
  87, 
  'https://nss.gbu.ac.in/uploads/imagesfiles/666c5a020f5b4_WhatsApp%20Image%202024-03-09%20at%204.29.32%20PM.jpeg', 
  FALSE, 
  'published'
),
(
  9, 
  'CodeMasters 2024: Programming Competition Showcases Technical Excellence', 
  'Over 500 participants competed in algorithmic challenges, web development, and mobile app creation, with winners receiving internship opportunities at leading tech companies.', 
  'The competition featured multiple tracks including competitive programming, hackathon challenges, and innovation presentations judged by industry experts.', 
  '2024-02-25', 
  'Prof. Ankit Sharma', 
  'Computer Science', 
  'Programming, Competition, Technology, Internships', 
  'Technology', 
  'medium', 
  1678, 
  156, 
  'https://www.ic3ecsbhi.com/Events/20231006_133039.jpg', 
  FALSE, 
  'published'
),
(
  10, 
  'International Collaboration: MoU Signed with University of Munich', 
  'Strategic partnership established for student exchange programs, joint research initiatives, and collaborative degree programs in engineering and management.', 
  'The agreement facilitates semester exchanges, dual degree options, and joint research projects in renewable energy, artificial intelligence, and sustainable development.', 
  '2024-02-10', 
  'Dr. Neha Agarwal', 
  'International Relations', 
  'International, Partnership, Exchange Program, Research', 
  'International', 
  'high', 
  934, 
  76, 
  'https://ik.imagekit.io/edtechdigit/usaii/content/images/usaii-and-gautam-buddha-university-sign-mou-to-elevate-ai-education-in-india.png', 
  FALSE, 
  'published'
),
(
  11, 
  'Wellness Week: Promoting Mental Health and Physical Fitness', 
  'Comprehensive wellness program included yoga sessions, mental health workshops, fitness challenges, and nutritional guidance for holistic student development.', 
  'Professional counselors, fitness trainers, and nutrition experts conducted interactive sessions. Over 1,500 students participated in various wellness activities.', 
  '2024-01-25', 
  'Dr. Seema Yadav', 
  'Student Welfare', 
  'Wellness, Mental Health, Fitness, Yoga', 
  'Wellness', 
  'low', 
  1234, 
  112, 
  'https://images.openai.com/thumbnails/url/-F4ohXicu1mSUVJSUGylr5-al1xUWVCSmqJbkpRnoJdeXJJYkpmsl5yfq5-Zm5ieWmxfaAuUsXL0S7F0Tw6yNHIy1zUsTgtKys-qMC0v9g41dorK8M8qSM7KDixODy8NdfTNzi9OLK6IKvc0cjKuiM8pLjVwz_RMcVQrBgAhZyqH', 
  FALSE, 
  'published'
),
(
  12, 
  'Industry Expert Series: Future of Work and Emerging Technologies', 
  'Distinguished industry leaders shared insights on career development, emerging technology trends, and skills required for future job markets.', 
  'Sessions covered artificial intelligence, blockchain, sustainable technologies, and entrepreneurship opportunities with interactive Q&A and networking sessions.', 
  '2024-01-15', 
  'Ms. Ritika Jain', 
  'Career Development', 
  'Career, Industry, Technology, Professional Development', 
  'Career', 
  'medium', 
  1456, 
  89, 
  'https://www.ux4g.gov.in/assets/img/awareness-workshop/gbu-19-11-24/900x16.webp', 
  FALSE, 
  'published'
),
(
  13, 
  'Placement Success: Record-Breaking Offers for Class of 2024', 
  'Outstanding placement results with 95% placement rate, highest package of ₹45 LPA, and recruitment by 150+ leading companies across diverse sectors.', 
  'Companies from IT, finance, consulting, manufacturing, and startups participated. Students received offers in roles spanning software engineering, data science, consulting, and management.', 
  '2023-12-30', 
  'Dr. Manish Gupta', 
  'Placement Cell', 
  'Placements, Career, Jobs, Industry', 
  'Placements', 
  'high', 
  3421, 
  267, 
  'https://images.openai.com/thumbnails/url/vLSln3icu1mUUVJSUGylr5-al1xUWVCSmqJbkpRnoJdeXJJYkpmsl5yfq5-Zm5ieWmxfaAuUsXL0S7F0Tw5MDgsycfcx94zMcrQ0dXS1SHP1Kg70twj0CneKL0gucS7MjChwjfcwCdaNLAv2LA9IMrMszA8yS65QKwYAl74oRw', 
  TRUE, 
  'published'
),
(
  14, 
  'Creative Arts Workshop: Photography and Digital Art Masterclass', 
  'Professional artists and photographers conducted intensive workshops on digital photography, photo editing, painting techniques, and creative expression.', 
  'Participants learned advanced techniques in portrait photography, landscape composition, digital art creation, and exhibition planning with hands-on practice sessions.', 
  '2023-12-15', 
  'Mr. Rohit Verma', 
  'Fine Arts', 
  'Arts, Photography, Workshop, Creative', 
  'Arts', 
  'low', 
  678, 
  54, 
  'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', 
  FALSE, 
  'published'
),
(
  15, 
  'Educational Tour: Political Science Students Experience Democracy', 
  'Students observed live parliamentary sessions, interacted with lawmakers, and gained practical insights into democratic processes and governance structures.', 
  'The educational tour included visits to Parliament House, Supreme Court, and meetings with political leaders, providing real-world understanding of political systems.', 
  '2023-12-05', 
  'Prof. Manoj Tiwari', 
  'Political Science', 
  'Education, Politics, Democracy, Learning', 
  'Education', 
  'low', 
  543, 
  42, 
  'https://niu.edu.in/wp-content/uploads/2025/06/image5-1.webp', 
  FALSE, 
  'published'
);
-- =====================================
-- INSERT EVENTS (18)
-- =====================================
INSERT INTO events (id, title, organizer, date, time, location, type, description, image, attendees, status, price, tags, year) VALUES
(
  1, 
  'Annual Research Conference 2025', 
  'Computer Science Department', 
  '2025-08-15', 
  '09:00', 
  'Main Auditorium', 
  'Conference', 
  'Join us for the most comprehensive research conference featuring cutting-edge innovations in AI, ML, and Data Science.', 
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop', 
  250, 
  'upcoming', 
  'Free', 
  'Research, AI, Conference', 
  '2025'
),
(
  2, 
  'Web Development Workshop', 
  'IT Department', 
  '2025-07-25', 
  '14:00', 
  'Computer Lab 1', 
  'Workshop', 
  'Learn modern web development with React, Node.js, and MongoDB. Hands-on experience with real projects.', 
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop', 
  50, 
  'upcoming', 
  '₹500', 
  'Web Dev, React, Workshop', 
  '2025'
),
(
  3, 
  'AI & Machine Learning Symposium', 
  'Research Center', 
  '2025-09-10', 
  '10:00', 
  'Science Block', 
  'Symposium', 
  'Explore the latest advancements in artificial intelligence and machine learning with industry experts.', 
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop', 
  200, 
  'upcoming', 
  '₹1000', 
  'AI, ML, Symposium', 
  '2025'
),
(
  4, 
  'Student Innovation Fair', 
  'Innovation Cell', 
  '2025-08-05', 
  '11:00', 
  'Campus Ground', 
  'Fair', 
  'Showcase your innovative projects and connect with industry leaders and investors.', 
  'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=400&h=250&fit=crop', 
  300, 
  'upcoming', 
  'Free', 
  'Innovation, Projects, Fair', 
  '2025'
),
(
  5, 
  'Cybersecurity Workshop', 
  'Security Team', 
  '2025-07-30', 
  '13:00', 
  'Tech Center', 
  'Workshop', 
  'Learn about cybersecurity best practices, ethical hacking, and network security fundamentals.', 
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop', 
  75, 
  'upcoming', 
  '₹750', 
  'Security, Hacking, Workshop', 
  '2025'
),
(
  6, 
  'Data Science Bootcamp', 
  'Analytics Department', 
  '2025-08-20', 
  '09:30', 
  'Data Lab', 
  'Bootcamp', 
  'Intensive 3-day bootcamp covering Python, R, data visualization, and statistical analysis.', 
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop', 
  40, 
  'upcoming', 
  '₹2000', 
  'Data Science, Python, Bootcamp', 
  '2025'
),
(
  7, 
  'Blockchain Technology Seminar', 
  'Fintech Club', 
  '2025-09-15', 
  '15:00', 
  'Seminar Hall', 
  'Seminar', 
  'Understand blockchain technology, cryptocurrencies, and their real-world applications.', 
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop', 
  120, 
  'upcoming', 
  '₹300', 
  'Blockchain, Crypto, Seminar', 
  '2025'
),
(
  8, 
  'Mobile App Development Workshop', 
  'Mobile Dev Team', 
  '2025-08-12', 
  '10:30', 
  'Mobile Lab', 
  'Workshop', 
  'Build native mobile apps using React Native and Flutter. Perfect for beginners and intermediates.', 
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop', 
  60, 
  'upcoming', 
  '₹800', 
  'Mobile, React Native, Flutter', 
  '2025'
),
(
  9, 
  'Cloud Computing Conference', 
  'Cloud Architecture Team', 
  '2025-09-25', 
  '09:00', 
  'Convention Center', 
  'Conference', 
  'Explore AWS, Azure, and Google Cloud platforms with hands-on demonstrations and case studies.', 
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop', 
  180, 
  'upcoming', 
  '₹1200', 
  'Cloud, AWS, Azure', 
  '2025'
),
(
  10, 
  'UI/UX Design Masterclass', 
  'Design Studio', 
  '2025-07-28', 
  '14:30', 
  'Design Lab', 
  'Masterclass', 
  'Master the art of user interface and user experience design with industry-standard tools and techniques.', 
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop', 
  35, 
  'upcoming', 
  '₹1500', 
  'UI, UX, Design', 
  '2025'
),
(
  11, 
  'DevOps and Automation Summit', 
  'Operations Team', 
  '2025-08-18', 
  '11:30', 
  'Tech Hub', 
  'Summit', 
  'Learn about CI/CD, containerization, Kubernetes, and modern DevOps practices.', 
  'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop', 
  90, 
  'upcoming', 
  '₹900', 
  'DevOps, CI/CD, Kubernetes', 
  '2025'
),
(
  12, 
  'Digital Marketing Workshop', 
  'Marketing Department', 
  '2025-09-05', 
  '16:00', 
  'Media Center', 
  'Workshop', 
  'Master SEO, social media marketing, Google Ads, and content marketing strategies.', 
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop', 
  65, 
  'upcoming', 
  '₹600', 
  'Marketing, SEO, Social Media', 
  '2025'
),
(
  13, 
  'React Development Conference 2024', 
  'Frontend Guild', 
  '2024-12-15', 
  '10:00', 
  'Tech Auditorium', 
  'Conference', 
  'A comprehensive conference on React best practices, new features, and modern development patterns.', 
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop', 
  300, 
  'past', 
  '₹800', 
  'React, Frontend, Conference', 
  '2024'
),
(
  14, 
  'Python Programming Bootcamp', 
  'Programming Club', 
  '2025-01-20', 
  '09:00', 
  'Computer Center', 
  'Bootcamp', 
  'Intensive Python programming bootcamp covering basics to advanced concepts including Django and Flask.', 
  'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=400&h=250&fit=crop', 
  80, 
  'past', 
  '₹1200', 
  'Python, Django, Programming', 
  '2025'
),
(
  15, 
  'Startup Pitch Competition', 
  'Entrepreneurship Cell', 
  '2025-02-28', 
  '14:00', 
  'Main Hall', 
  'Competition', 
  'Annual startup pitch competition where students present their innovative business ideas to industry experts.', 
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=250&fit=crop', 
  150, 
  'past', 
  'Free', 
  'Startup, Pitch, Competition', 
  '2025'
),
(
  16, 
  'Machine Learning Workshop', 
  'AI Research Lab', 
  '2025-03-10', 
  '11:00', 
  'Research Center', 
  'Workshop', 
  'Hands-on machine learning workshop covering supervised learning, neural networks, and practical applications.', 
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop', 
  60, 
  'past', 
  '₹1000', 
  'Machine Learning, AI, Neural Networks', 
  '2025'
),
(
  17, 
  'Database Design Seminar', 
  'Database Team', 
  '2025-04-15', 
  '15:30', 
  'Lecture Hall 3', 
  'Seminar', 
  'Learn advanced database design principles, normalization, and optimization techniques for modern applications.', 
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop', 
  90, 
  'past', 
  '₹400', 
  'Database, SQL, Design', 
  '2025'
),
(
  18, 
  'Agile Development Workshop', 
  'Project Management Office', 
  '2025-05-20', 
  '09:30', 
  'Training Room 2', 
  'Workshop', 
  'Learn agile methodologies, scrum framework, and project management best practices for software development.', 
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop', 
  45, 
  'past', 
  '₹650', 
  'Agile, Scrum, Project Management', 
  '2025'
);
-- =====================================
-- PERMISSIONS FOR BACKEND APP USER
-- =====================================
-- Keep this role name aligned with DATABASE_URL username.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gbu-user') THEN
    GRANT USAGE ON SCHEMA public TO "gbu-user";
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "gbu-user";
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "gbu-user";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "gbu-user";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT USAGE, SELECT ON SEQUENCES TO "gbu-user";
  ELSE
    RAISE NOTICE 'Role "gbu-user" not found. Create it or update grant role in schema.sql.';
  END IF;
END $$;

-- =====================================
-- CHECK DATA
-- =====================================
SELECT * FROM notices;
SELECT * FROM news;
SELECT * FROM events;

COMMIT;