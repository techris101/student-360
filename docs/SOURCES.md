# Student 360 — Source Seed List

**Every entry is a starting point, not a fact.** In P2, verify each: the domain is the organisation's real official site, the page loads, robots.txt allows it, and there is a listing page or feed to crawl. Record the working listing URL and `crawl_hint` in `supabase/seed/sources.sql`. Drop or fix anything that fails and note it in `PROGRESS.md`. Add strong sources you discover. Target at launch: at least 40 active opportunity sources and 8 news sources.

`official` = the organisation offering the opportunity. `aggregator` = discovery only; its URLs are never published as the official link.

## Rwanda: government and national bodies (official)
- Higher Education Council (HEC) — hec.gov.rw
- Ministry of Education (MINEDUC) — mineduc.gov.rw
- Rwanda Development Board (RDB) — rdb.rw (internship and youth programmes)
- Development Bank of Rwanda (BRD) — brd.rw (student loans and bursaries)
- National Council of Nurses and Midwives (NCNM) — find official domain (nursing events, symposiums)
- Rwanda Biomedical Centre (RBC) — rbc.gov.rw (health events and programmes)
- Ministry of ICT and Innovation — minict.gov.rw

## Rwanda: foundations, hubs, employers (official)
- Imbuto Foundation — imbutofoundation.org (iAccelerator and others)
- Mastercard Foundation — mastercardfdn.org (Scholars Program partners)
- kLab — find official domain
- Norrsken East Africa — find official domain
- Kigali International Financial Centre / Rwanda Finance — find official domain
- African Leadership Group / ALX — find official domain
- Rwanda ICT Chamber — find official domain

## Rwandan universities (official news/opportunities pages)
University of Rwanda (ur.ac.rw), UGHE (ughe.org), AUCA, Mount Kigali University, ALU Rwanda, INES-Ruhengeri, Kibogora Polytechnic, UNILAK, ULK, Carnegie Mellon University Africa, Kepler, PIASS, Catholic University of Rwanda, University of Kigali, Rwanda Polytechnic.
Find each official domain, then its news or announcements page. Also seed the `universities` table from this list with `official_url`.

## International scholarships and programmes (official)
- Chevening (UK) — chevening.org
- Commonwealth Scholarships (UK) — cscuk.fcdo.gov.uk
- DAAD (Germany) — daad.de
- Erasmus Mundus Joint Masters (EU) — official EU catalogue page
- Fulbright Foreign Student Program — via the U.S. Embassy in Rwanda site
- Mandela Washington Fellowship (YALI) — find official domain
- MEXT (Japan) — studyinjapan.go.jp and the Japanese Embassy in Rwanda
- Chinese Government Scholarship — campuschina.org
- Stipendium Hungaricum — stipendiumhungaricum.hu
- Swedish Institute scholarships — si.se
- Rhodes Scholarship (East Africa) — rhodeshouse.ox.ac.uk
- Gates Cambridge — gatescambridge.org
- Mandela Rhodes Foundation — mandelarhodes.org
- Mastercard Foundation Scholars at partner universities — each partner's own page
- Türkiye Scholarships — find official domain
- Korean Government Scholarship (GKS) — find official domain
- Australia Awards Africa — find official domain
- Global Health Corps — find official domain
- Tony Elumelu Foundation Entrepreneurship Programme — find official domain
- Google, Microsoft, and other tech company student programmes open to Africa — official career pages only

## Aggregators (discovery only)
- Opportunity Desk — opportunitydesk.org
- Opportunities for Africans — opportunitiesforafricans.com
- After School Africa — afterschoolafrica.com
Use them to find opportunities, then resolve and publish the official page only.

## News sources
- The New Times — newtimes.co.rw
- KT Press — ktpress.rw
- IGIHE (English edition if available) — igihe.com
- Rwanda Broadcasting Agency — rba.co.rw
- University World News (Africa section) — universityworldnews.com
- HEC and MINEDUC announcements (above)
- University of Rwanda news (above)
Headline, our own summary, and link only. Never republish article bodies.
