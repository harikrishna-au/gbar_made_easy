
import { Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Testimonial {
  text: string;
  author: string;
  role: string;
  stars: number;
  w: number; // px width — creates the brick-wall misalignment
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROW_1: Testimonial[] = [
  {
    text: "Harry The Blaze is really helpful, especially for candidates who are not familiar with the MNC assessment process. I genuinely appreciate the effort put into creating it.",
    author: "Aspiring Candidate",
    role: "MNC Applicant",
    stars: 5,
    w: 390,
  },
  {
    text: "Got placed at Accenture after a week of serious practice here. The cognitive drills hit different.",
    author: "Karthik S.",
    role: "Placed, Accenture",
    stars: 5,
    w: 260,
  },
  {
    text: "The cognitive games really build raw speed. I could feel a measurable difference in the actual test. Nothing else I tried came close.",
    author: "Priya R.",
    role: "Engineering Student",
    stars: 5,
    w: 420,
  },
  {
    text: "I used to freeze during assessments. Not anymore.",
    author: "Divya M.",
    role: "Campus Applicant",
    stars: 5,
    w: 215,
  },
  {
    text: "Overall, my experience was excellent. Well designed and the practice structure is really helpful — better than any YouTube playlist I tried.",
    author: "User Feedback",
    role: "Platform User",
    stars: 5,
    w: 370,
  },
  {
    text: "Practiced every day for two weeks. Cleared the cognitive round on my first attempt. Balloon Math is genuinely addictive.",
    author: "Rahul T.",
    role: "Off-Campus Applicant",
    stars: 5,
    w: 340,
  },
];

const ROW_2: Testimonial[] = [
  {
    text: "The AI interview feedback was brutally honest — and that's exactly what I needed. Real improvement, not validation.",
    author: "Sneha K.",
    role: "Final Year, CSE",
    stars: 5,
    w: 355,
  },
  {
    text: "Ha sir, no option for unselecting the bubble — excellent work either way. This helps to practice more, hope you keep it like that.",
    author: "Student",
    role: "Campus Applicant",
    stars: 5,
    w: 390,
  },
  {
    text: "Short, sharp, effective. This is what exam prep should look like.",
    author: "Vikram N.",
    role: "MNC Aspirant",
    stars: 5,
    w: 230,
  },
  {
    text: "The platform feels like it was made by someone who actually sat through these assessments. Every feature is intentional and purposeful.",
    author: "Ananya P.",
    role: "Engineering Graduate",
    stars: 5,
    w: 430,
  },
  {
    text: "Thanks for your portal buddy — really helped with cognitive assessment. Company conducted the selection yesterday for on campus.",
    author: "On-Campus Student",
    role: "Placed Candidate",
    stars: 5,
    w: 320,
  },
  {
    text: "Add the updated Communication Round pattern from Round 1 till final selection — would be extremely helpful for future candidates.",
    author: "Community Member",
    role: "Student",
    stars: 4,
    w: 360,
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

const TILTS = ["-rotate-1", "rotate-0", "rotate-1", "rotate-0", "rotate-0", "-rotate-1"];

function Sheet({ t, tilt }: { t: Testimonial; tilt: string }) {
  return (
    <figure
      className={`mb-6 break-inside-avoid bg-[var(--color-paper-3)] p-6 shadow-[var(--shadow-card)] ${tilt}`}
    >
      <div className="flex gap-0.5" role="img" aria-label={`${t.stars} out of 5`}>
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-[var(--color-ink)] text-[var(--color-ink)]" aria-hidden />
        ))}
      </div>
      <blockquote className="mt-4 text-base leading-relaxed text-[var(--color-ink)]">"{t.text}"</blockquote>
      <figcaption className="mt-5 border-t border-[var(--color-rule)] pt-4">
        <span className="block text-[15px] font-semibold text-[var(--color-ink)]">{t.author}</span>
        <span className="block text-sm text-[var(--color-muted)]">{t.role}</span>
      </figcaption>
    </figure>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const TestimonialScroller = () => {
  const all = [...ROW_1, ...ROW_2];

  return (
    <section className="w-full bg-[var(--color-paper-2)]" aria-labelledby="reviews-title">
      <div className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <h2
          id="reviews-title"
          className="max-w-[16ch] font-display text-[clamp(2.5rem,6vw,5rem)] font-normal uppercase leading-[0.95] [text-wrap:balance]"
        >
          Trusted by aspirants across campuses.
        </h2>

        <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {all.map((t, i) => (
            <Sheet key={i} t={t} tilt={TILTS[i % TILTS.length]} />
          ))}
        </div>
      </div>
    </section>
  );
};
