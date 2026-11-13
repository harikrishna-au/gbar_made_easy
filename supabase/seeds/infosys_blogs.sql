-- Infosys hiring blogs. Run once in the Supabase SQL Editor.
-- Safe to re-run: existing slugs are skipped.

INSERT INTO blogs (title, slug, content, excerpt, type, tags, cover_emoji, author_id, author_name, status, read_time, published_at)
VALUES (
  $t$Infosys interview experience: DP-heavy OA, a heap question and system design on paper$t$, $s$infosys-interview-experience-dp-oa-heap-system-design$s$,
  $c$This is a first-hand account shared by a student who went through Infosys's hiring process. It is one person's experience, so your own rounds may differ.

## The online assessment

- I solved one question completely. It was a **Two Pointers** problem where I had to find a target.
- On the 3rd question, a **Partition DP** problem, I passed 7 of 12 test cases.
- I don't remember the 4th question exactly. I wrote code from what the test cases showed, and it passed 1 hidden test case.

## Interview, part 1: coding on the interviewer's laptop

The interviewer handed me his laptop. There were 2 questions and both were **DP**: one on **Digit DP** and one on **Partition DP**. I could pass only 1 sample test case and none of the hidden ones.

He said, "Don't worry, you have another chance."

## Interview, part 2: the second chance

He gave me one DSA question: find the **Top K elements using a Heap**. He was interviewing another candidate at the time, so I worked on it alone for around 20 minutes. When he called me back, he checked my heap solution first.

## Technical and project discussion

- He asked me to introduce myself and explain my projects.
- **REST APIs**, including **PATCH**, then **Redis** and **Load Balancers**.
- A deeper look at my second project, which used **WebSocket and WebRTC**. He asked which protocols they run on and whether the communication stays smooth.
- **SOLID principles**, the **Observer design pattern**, and **Microservices**.
- An oral design question: **design a cache**. I suggested using a **TTL**.

## System design on paper

My resume mentioned HLD and LLD, so he asked, "So, you are good at HLD, right?" I said yes. He then gave me a paper question: **design a Thumbnail Extractor from a video file**. After reviewing my design, he felt it was about 70% correct.

## Closing questions

He ended by asking **why Infosys** and what my **long-term goals** were.

## What I would tell my past self

- Practice DP properly, especially partition DP and digit DP. They came up in both the OA and the interview.
- Be able to defend every line of your resume. If you write HLD or LLD, expect a design question on paper.
- Know the protocols behind the tech in your projects, not only how you used it.
- A weak first coding round is not the end. Stay calm and use the second chance.

*Want a prep checklist built from this? Read our guide to the technical topics candidates report being asked at Infosys.*
$c$,
  $e$An online assessment with two-pointers and partition DP, a laptop round of DP questions, then a technical interview covering REST, Redis, WebRTC, SOLID and a paper system design.$e$, 'interview_experience',
  ARRAY['infosys', 'interview experience', 'dsa', 'dynamic programming', 'system design'], '🎯',
  'community-anonymous', 'Anonymous student', 'published', 2, now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs (title, slug, content, excerpt, type, tags, cover_emoji, author_id, author_name, status, read_time, published_at)
VALUES (
  $t$Infosys fresher roles in 2026: System Engineer, DSE and Specialist Programmer explained$t$, $s$infosys-fresher-roles-2026-se-dse-specialist-programmer$s$,
  $c$Infosys hires freshers into more than one track, and the track you land in decides your pay and the kind of work you do. This guide sums up what is publicly reported. **Third-party prep sites disagree on several details, so confirm everything on the official Infosys careers page before you rely on it.**

## The main tracks

- **System Engineer (SE):** the largest fresher intake and the standard entry role.
- **Digital Specialist Engineer (DSE):** a higher track with a coding component in the assessment.
- **Specialist Programmer (SP):** the top coding-focused track. Some older guides call it **Power Programmer**; several newer sources say it has been renamed Specialist Programmer.

## What pay figures are being reported

Treat these as indicative, not official.

- **Specialist Programmer: up to ₹21 LPA.** Infosys's CHRO said the company expanded the Specialist Programmer track with packages up to ₹21 lakh a year, as reported by [Business Standard](https://www.business-standard.com/companies/news/infosys-entry-level-salary-21-lakh-freshers-ai-roles-fy26-125122600155_1.html) and [Free Press Journal](https://www.freepressjournal.in/tech/good-news-for-it-techies-infosys-boosts-fresher-salaries-with-packages-up-to-21-lakh). That announcement was about 2025 graduates.
- **Levels inside SP:** one 2026 off-campus listing gives L3 at ₹21 LPA, L2 at ₹16 LPA and L1 at ₹10 LPA with a joining bonus. Other sites give different numbers.
- **System Engineer:** one guide puts the standard SE role at about ₹3.6 LPA.
- **DSE:** listings show figures in the ₹6 to ₹9 LPA range, and they vary by source.

## How people usually get into each track

- **SE:** through the regular campus or off-campus drive, with an online assessment followed by technical and HR interviews.
- **DSE and SP:** these usually need a stronger coding performance, either in the drive's coding section or through competitions such as HackWithInfy and InfyTQ. Some sites mention a CGPA expectation of around 7.5 or higher for the top tracks, but this is not consistently stated.

## Eligibility basics reported for 2026 drives

- BE, B.Tech, ME, M.Tech, MCA and MSc (CS, IT, Maths, Statistics) are commonly listed.
- Drives are usually for a specific graduating batch, so check which batch the notification names.

## Practical advice

1. Check the official [Infosys careers site](https://www.infosys.com/careers/) for the current drive and eligibility.
2. If you want DSE or SP, invest in DSA and DP now. Candidates who shared their experiences report DP-heavy coding rounds.
3. Don't trust a single prep blog for a salary number. Compare at least two sources and the official page.

*Sources used for the pay figures: [Business Standard](https://www.business-standard.com/companies/news/infosys-entry-level-salary-21-lakh-freshers-ai-roles-fy26-125122600155_1.html), [Free Press Journal](https://www.freepressjournal.in/tech/good-news-for-it-techies-infosys-boosts-fresher-salaries-with-packages-up-to-21-lakh), and third-party fresher job listings.*
$c$,
  $e$What the main Infosys fresher tracks are, how they differ, and what pay figures are being reported, with the caveat that sources disagree.$e$, 'company_profile',
  ARRAY['infosys', 'off campus', 'specialist programmer', 'dse', 'salary'], '🏢',
  'harry-the-blaze-team', 'Harry The Blaze Team', 'published', 2, now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs (title, slug, content, excerpt, type, tags, cover_emoji, author_id, author_name, status, read_time, published_at)
VALUES (
  $t$HackWithInfy 2026: what it is, how the rounds work and how to prepare$t$, $s$hackwithinfy-2026-what-it-is-and-how-to-prepare$s$,
  $c$HackWithInfy is a coding competition run by Infosys for students. A strong result can lead to interviews for Infosys's higher-paying coding tracks. The details below come from prep sites and Infosys's published terms. **The official terms say Infosys can change the format, number of rounds, judging criteria and timelines at its discretion, so always check the current announcement.**

## Who can take part

Prep sites describe it as open to B.E., B.Tech, M.E., M.Tech, dual degree, MCA and MSc students of a specified graduating batch, with a 60% minimum score through 10th, 12th and the current course often mentioned. Infosys's [terms and conditions for 2026](https://www.infosys.com/careers/hackwithinfy/2026/hwi-terms-conditions.pdf) say it may verify eligibility at any stage. Read that document before you register.

## Reported format

- **Round 1:** a roughly 3-hour individual online coding test with 3 problems of rising difficulty. Candidates and prep sites describe them as easy (basic algorithms and data structures), medium (often greedy), and hard (often dynamic programming).
- **Round 2:** an advanced coding round for top performers from Round 1. Sources disagree on whether it is online or in person.
- **Finale:** some sources mention a multi-day finale for the top performers. Treat this as unconfirmed.

## Why DP deserves your time

The third problem is where most candidates lose marks. A student who shared their Infosys interview with us hit partition DP and digit DP in both the assessment and the interview. You can read it here: [Infosys interview experience](/blog/infosys-interview-experience-dp-oa-heap-system-design).

## A four-week plan

1. **Week 1: foundations.** Arrays, strings, two pointers, sliding window, sorting and binary search.
2. **Week 2: structures.** Heaps and top-K problems, stacks, hash maps, graphs (BFS and DFS).
3. **Week 3: greedy and DP basics.** Knapsack, LIS, grid DP, then partition DP.
4. **Week 4: timed practice.** Do full 3-problem, 3-hour mocks. Aim to finish the easy one in about 20 minutes so the hard one gets real time.

## Test-day habits

- Read all three problems first, solve the easiest one, then pick the next.
- A partially passing solution still scores. Submit working brute force before optimizing.
- Write down the constraints. They tell you which complexity will pass.

*Check the official [HackWithInfy 2026 terms](https://www.infosys.com/careers/hackwithinfy/2026/hwi-terms-conditions.pdf) and the Infosys careers site for current dates and rules.*
$c$,
  $e$HackWithInfy is Infosys's coding competition and a route into its top fresher tracks. Here is the reported format, eligibility and a practical prep plan.$e$, 'aptitude_strategy',
  ARRAY['hackwithinfy', 'infosys', 'coding test', 'specialist programmer', 'dsa'], '🧠',
  'harry-the-blaze-team', 'Harry The Blaze Team', 'published', 2, now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO blogs (title, slug, content, excerpt, type, tags, cover_emoji, author_id, author_name, status, read_time, published_at)
VALUES (
  $t$Infosys technical interview checklist: the topics candidates report being asked$t$, $s$infosys-technical-interview-prep-checklist-topics-asked$s$,
  $c$This checklist is built from one candidate's detailed account of their Infosys interview ([read it here](/blog/infosys-interview-experience-dp-oa-heap-system-design)). Your interview may cover different ground, but these are the areas worth being ready for, with a one-line way to think about each.

## Coding

- **Two pointers:** know how to find a pair or target in a sorted array in O(n).
- **Top K using a heap:** keep a min-heap of size K. Push each element, pop when the size goes over K. Time is O(n log K).
- **Partition DP:** define `dp[i]` as the best answer for the first i items, and try every split point j before i.
- **Digit DP:** count numbers up to N with a property by walking digits with a state like (position, tight, current property).

## Backend and web basics

- **REST and PATCH:** PUT replaces a whole resource, PATCH changes only the fields you send. Know which is idempotent in practice and why.
- **Redis:** an in-memory key-value store. Be ready to say where you would use it, for example caching, rate limiting or sessions, and what happens when it restarts.
- **Load balancers:** they spread requests across servers. Know round robin vs least connections and what a health check does.
- **WebSocket and WebRTC:** WebSocket gives a persistent two-way channel over TCP after an HTTP upgrade. WebRTC is built for peer-to-peer audio, video and data and typically uses UDP, with a signalling server to set up the connection. If your project used them, explain why that choice fits.

## Design principles

- **SOLID:** be able to give one real example for each letter from code you wrote.
- **Observer pattern:** a subject notifies subscribed observers when its state changes. Think of event listeners or a notification system.
- **Microservices:** small independently deployable services. Be ready to discuss the tradeoffs, such as network failures and data consistency, not only the benefits.

## Design questions

- **Design a cache:** start with a key-value map, then add eviction (LRU) and a **TTL** for expiry. Mention thread safety and what happens on a miss.
- **Design a thumbnail extractor from a video file:** a sensible outline is upload the video to object storage, put a job on a queue, have workers decode the video and grab frames at chosen timestamps (or scene changes), resize and store the images, then serve them through a CDN. Discuss failures, retries and large files.

## The HR close

Prepare an honest answer to **why Infosys** and your **long-term goals**. Keep it specific to what you want to learn.

## How to use this list

1. Tick off each item by explaining it out loud in two minutes.
2. For every project on your resume, prepare to defend the technology choices.
3. Practise one paper design a day so it feels normal when you are handed a pen.
$c$,
  $e$A topic-by-topic prep list built from a real candidate's Infosys interview: DP, heaps, REST, Redis, load balancers, WebRTC, SOLID, Observer, caching and system design.$e$, 'interview_experience',
  ARRAY['infosys', 'technical interview', 'system design', 'dsa', 'prep'], '🎯',
  'harry-the-blaze-team', 'Harry The Blaze Team', 'published', 2, now()
)
ON CONFLICT (slug) DO NOTHING;
