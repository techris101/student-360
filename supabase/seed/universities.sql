-- Seed Rwandan Universities
insert into public.universities (name, short_name, city, official_url, is_verified) values
  ('University of Rwanda', 'UR', 'Kigali', 'https://ur.ac.rw', true),
  ('University of Global Health Equity', 'UGHE', 'Butaro', 'https://ughe.org', true),
  ('Adventist University of Central Africa', 'AUCA', 'Kigali', 'https://auca.ac.rw', true),
  ('Mount Kigali University', 'MKU', 'Kigali', 'https://mku.ac.rw', true),
  ('African Leadership University', 'ALU Rwanda', 'Kigali', 'https://alueducation.com', true),
  ('INES-Ruhengeri', 'INES', 'Musanze', 'https://ines.ac.rw', true),
  ('Kibogora Polytechnic', 'KP', 'Nyamasheke', 'https://kp.ac.rw', true),
  ('University of Lay Adventists of Kigali', 'UNILAK', 'Kigali', 'https://unilak.ac.rw', true),
  ('Université Libre de Kigali', 'ULK', 'Kigali', 'https://ulk.ac.rw', true),
  ('Carnegie Mellon University Africa', 'CMU Africa', 'Kigali', 'https://africa.engineering.cmu.edu', true),
  ('Kepler', 'Kepler', 'Kigali', 'https://kepler.org', true),
  ('Protestant Institute of Arts and Social Sciences', 'PIASS', 'Huye', 'https://piass.ac.rw', true),
  ('Catholic University of Rwanda', 'CUR', 'Huye', 'https://cur.ac.rw', true),
  ('University of Kigali', 'UoK', 'Kigali', 'https://uok.ac.rw', true),
  ('Rwanda Polytechnic', 'RP', 'Kigali', 'https://rp.ac.rw', true),
  ('East African University Rwanda', 'EAUR', 'Nyagatare', 'https://eaur.ac.rw', true)
on conflict (name) do update
set
  short_name = excluded.short_name,
  city = excluded.city,
  official_url = excluded.official_url,
  is_verified = excluded.is_verified;
