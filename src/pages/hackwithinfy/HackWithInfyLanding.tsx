import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { CODING_TOPICS, TOTAL_PROBLEMS, FREE_COUNT } from "@/pages/coding-questions/data";

// ─── Content ──────────────────────────────────────────────────────────────────

// "Round 1 prep" video, opened at 0:15 as requested; the interview-experience video follows it.
const PREP_VIDEO = "https://www.youtube.com/embed/CUORoppFNGM?start=15";
const EXPERIENCE_VIDEO = "https://www.youtube.com/embed/50mbEzZHekQ";

const ROLES = [
  { label: "DSE", lpa: "₹7 LPA", sub: "6.25L + ₹75K joining" },
  { label: "SP L1", lpa: "₹11 LPA", sub: "10L + ₹1L joining, campus offers vary", hero: true },
  { label: "SP L2", lpa: "₹16 LPA", sub: "After probation (6 months)" },
  { label: "SP L3", lpa: "₹21 LPA", sub: "After probation (6 months)" },
];

const ROUNDS = [
  {
    num: "01",
    title: "Online coding test",
    badge: "3 Qs · 3 hrs · Virtual",
    desc: "Three questions in three hours, easy to hard. Shortlists for DSE and SP roles. Languages: C, C++, Java, Python, JavaScript.",
  },
  {
    num: "02",
    title: "Advanced coding test",
    badge: "4 Qs, pick 3 · 3 hrs · On-site",
    desc: "Four questions (easy, medium, hard, complex). Choose any three to solve in three hours. Shortlists for SP roles.",
  },
  {
    num: "03",
    title: "Interview",
    badge: "About 1 hr · Technical + HR",
    desc: "Technical and behavioral. CS/IT: DSA, automata, compilers, OS, networks, OOP. Other streams: DSA, digital electronics, math, control systems.",
  },
];

const SECTIONS = [
  { title: "Infosys coding questions", path: "/coding-questions", tag: `${FREE_COUNT} free · ${TOTAL_PROBLEMS} in the full set`, desc: `Collected from people who got the SP and DSE roles, across ${CODING_TOPICS.length} topics, with a progress checklist.`, free: true },
  { title: "Role-wise syllabus", path: "/hackwithinfy/syllabus", tag: "DSE · SP L1 · SP L2/L3", desc: "Exact topics for DSE and SP, for CS/IT and other streams. Know what to study." },
  { title: "Previous year questions", path: "/hackwithinfy/previous-years", tag: "2019 to 2025 · Solutions", desc: "Real HackWithInfy questions with solutions and a topic breakdown." },
  { title: "Strategy and tips", path: "/hackwithinfy/tips", tag: "Round 1 · Round 2 · Interview", desc: "Time management, scoring, how to choose a role, and the common mistakes." },
  { title: "Study resources", path: "/hackwithinfy/resources", tag: "PDFs · Notes · Guides", desc: "Curated PDFs: DSA notes, CS fundamentals, the SP interview guide, last-mile prep." },
  { title: "Resume builder", path: "/forge", tag: "ATS-ready · LaTeX · Free", desc: "Build an ATS-friendly resume in minutes, tailored for Infosys DSE and SP roles." },
];

const WHY = [
  ["Real, not recycled", "Harry went through every round. These resources reflect what actually worked."],
  ["Last-minute friendly", "Built for quick revision. 48 hours before the test? Start here."],
  ["Every round covered", "Online test, advanced round and interview, role by role and stream by stream."],
];

// ─── Shared bits ──────────────────────────────────────────────────────────────

const DISPLAY = "font-display font-normal uppercase leading-[0.95] tracking-[0.005em] [text-wrap:balance]";
const WRAP = "mx-auto w-full max-w-[1180px] px-4 sm:px-8";
const SHEET = "bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]";
const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] " +
  "shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px " +
  "hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]";

// Falls back to an initial tile if the photo file is missing or broken.
const AuthorPhoto = () => {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      aria-label="Nalla Harikrishna"
      className="mx-auto mt-4 flex h-28 w-28 items-center justify-center bg-[var(--color-accent)] font-display text-6xl shadow-[var(--shadow-offset)]"
    >
      N
    </div>
  ) : (
    <img
      src="/harry.png"
      alt="Nalla Harikrishna"
      onError={() => setFailed(true)}
      className="mx-auto mt-4 h-28 w-28 object-cover shadow-[var(--shadow-offset)]"
    />
  );
};

const Video = ({ src, title }: { src: string; title: string }) => (
  <div className="relative bg-[var(--color-ink)] p-1.5 shadow-[var(--shadow-offset)]">
    <div className="aspect-video w-full">
      <iframe
        className="block h-full w-full"
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const HackWithInfyLanding = () => {
  const page = useRef<HTMLDivElement>(null);
  useGsapReveal(page);

  return (
    <div ref={page} className="min-h-screen bg-[var(--color-paper)] font-sans text-[var(--color-ink)]">
      <SEO
        title="Infosys HackWithInfy Prep: SP and DSE | Harry The Blaze"
        description="How to prepare for the Infosys coding round, from someone who got the SP role. Free questions, syllabus, previous-year questions and strategy."
      />
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className={`${WRAP} grid items-start gap-10 pb-16 pt-28 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-32`}>
          <div className="lg:col-span-8">
            <p data-intro className="text-base font-medium text-[var(--color-muted)]">All about Infosys</p>
            <h1 data-intro className={`${DISPLAY} mt-3 text-[clamp(3.25rem,9vw,7.5rem)] leading-[0.92]`}>
              Crack HackWithInfy.
              <span className="mt-2 block text-[0.6em] text-[var(--color-muted)]">Made by someone who did.</span>
            </h1>
            <p data-intro className="mt-6 max-w-[52ch] text-lg leading-snug">
              These resources were curated by <b className="font-semibold">Nalla Harikrishna</b>, selected for the SP role
              at Infosys at ₹11 LPA. Not generic prep: the strategy from someone who went through every round.
            </p>
            <div data-intro className="mt-8 flex flex-col gap-5 sm:flex-row">
              <Link to="/coding-questions" className={`${BTN} bg-[var(--color-accent)]`}>
                Open {FREE_COUNT} free questions
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href="#watch" className={`${BTN} bg-[var(--color-paper-3)]`}>
                Watch the prep video
              </a>
            </div>
          </div>

          {/* Author sheet */}
          <aside data-drop="2" className={`${SHEET} mx-auto w-full max-w-[20rem] p-6 text-center lg:col-span-4 lg:max-w-none`}>
            <p className="inline-block bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold">Selected</p>
            <AuthorPhoto />
            <p className="mt-5 font-display text-3xl uppercase leading-none">Nalla Harikrishna</p>
            <p className="mt-2 text-[15px] font-semibold">SP role · ₹11 LPA</p>
            <p className="text-sm text-[var(--color-muted)]">Infosys Specialist Programmer</p>
            <a
              href="https://www.linkedin.com/in/hari-krishna-nallana-33949b277/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
            >
              LinkedIn <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </aside>
        </section>

        {/* ── Video ── */}
        <section id="watch" className="scroll-mt-24 bg-[var(--color-paper-2)]">
          <div className={`${WRAP} py-16 sm:py-24`}>
            <p data-reveal className="text-base font-medium text-[var(--color-muted)]">Watch first</p>
            <h2 data-reveal className={`${DISPLAY} mt-2 max-w-[18ch] text-[clamp(2.5rem,6vw,4.75rem)]`}>
              How to prepare for the Infosys coding round
            </h2>
            <div data-reveal className="mt-10 max-w-[900px]">
              <Video src={PREP_VIDEO} title="How to prepare for the Infosys coding round" />
            </div>

            <div data-reveal className="mt-16 grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h3 className={`${DISPLAY} text-[clamp(1.75rem,3.5vw,2.75rem)]`}>Harry's Infosys SP interview experience</h3>
                <p className="mt-3 max-w-[40ch] text-base leading-relaxed">
                  The exact interview he faced: the questions, the pressure, and how he handled it.
                </p>
              </div>
              <div className="lg:col-span-7">
                <Video src={EXPERIENCE_VIDEO} title="Harry's Infosys SP interview experience" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Why ── */}
        <section className={`${WRAP} py-16 sm:py-24`}>
          <ul data-reveal-group className="grid gap-6 md:grid-cols-3">
            {WHY.map(([t, d]) => (
              <li key={t} className={`${SHEET} p-6`}>
                <h3 className="font-display text-3xl font-normal uppercase leading-none">{t}</h3>
                <p className="mt-3 text-base leading-relaxed">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Competition structure ── */}
        <section className="bg-[var(--color-ink)] text-[var(--color-paper)]">
          <div className={`${WRAP} py-16 sm:py-24`}>
            <h2 data-reveal className={`${DISPLAY} text-[clamp(2.5rem,6vw,4.75rem)]`}>Three rounds. Here is each one.</h2>
            <ol data-reveal-group className="mt-12 grid gap-6 md:grid-cols-3">
              {ROUNDS.map((r) => (
                <li key={r.num} className="bg-[var(--color-paper)] p-6 text-[var(--color-ink)]">
                  <p className="font-display text-6xl leading-none">{r.num}</p>
                  <h3 className="mt-4 text-xl font-semibold">{r.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{r.desc}</p>
                  <p className="mt-4 inline-block bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold">{r.badge}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Roles ── */}
        <section className={`${WRAP} py-16 sm:py-24`}>
          <h2 data-reveal className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>Roles and packages</h2>
          <ul data-reveal-group className={`${SHEET} mt-8 divide-y divide-[var(--color-rule)]`}>
            {ROLES.map((r) => (
              <li key={r.label} className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-5 sm:px-8 ${r.hero ? "bg-[var(--color-accent)]" : ""}`}>
                <span className="font-display text-3xl uppercase leading-none">{r.label}</span>
                <span className="order-3 w-full text-sm sm:order-2 sm:w-auto sm:flex-1 sm:text-base">{r.sub}</span>
                <span className="order-2 font-display text-4xl leading-none tabular-nums sm:order-3">{r.lpa}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Prep sections ── */}
        <section className="bg-[var(--color-paper-2)]">
          <div className={`${WRAP} py-16 sm:py-24`}>
            <h2 data-reveal className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>Everything for the round</h2>
            <ul data-reveal-group className="mt-8 grid gap-6 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.path}>
                  <Link
                    to={s.path}
                    className={`group flex h-full flex-col gap-2 p-6 shadow-[var(--shadow-sheet)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)] ${
                      s.free ? "bg-[var(--color-paper-3)] ring-2 ring-[var(--color-ink)]" : "bg-[var(--color-paper-3)]"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display text-3xl uppercase leading-none">{s.title}</span>
                      <ArrowUpRight className="mt-1 h-5 w-5 flex-shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </span>
                    <span className="text-[15px] leading-relaxed">{s.desc}</span>
                    <span className={`mt-auto inline-block self-start px-2.5 py-1 text-xs font-semibold ${s.free ? "bg-[var(--color-accent)]" : "bg-[var(--color-paper-2)]"}`}>
                      {s.tag}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Mock interview + close ── */}
        <section className="bg-[var(--color-ink)] text-[var(--color-paper)]">
          <div className={`${WRAP} grid items-center gap-8 py-16 sm:py-24 lg:grid-cols-12`}>
            <div className="lg:col-span-8">
              <h2 data-reveal className={`${DISPLAY} text-[clamp(2.5rem,6vw,4.75rem)]`}>Practice the interview out loud.</h2>
              <p data-reveal className="mt-5 max-w-[52ch] text-lg leading-snug opacity-85">
                AI mock interview, Infosys mode: live coding, DSA, OOPs, OS, DBMS and HR, with real-time feedback.
              </p>
            </div>
            <div data-reveal className="flex flex-col gap-5 lg:col-span-4">
              <Link to="/ai-interview" className={`${BTN} bg-[var(--color-accent)] !shadow-[4px_4px_0_var(--color-paper)] active:!shadow-none`}>
                Start a mock
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/connect" className="text-base underline decoration-[var(--color-paper)]/40 underline-offset-4 hover:decoration-[var(--color-paper)]">
                Or book 20 minutes with a senior placed at Infosys
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HackWithInfyLanding;
