import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useMemo } from "react";
import { TENSES, TENSES_BY_SLUG, Tense, TenseCategory } from "@/data/tenses";
import { QUIZZES } from "@/data/quizzes";
import { ExerciseBlock } from "@/components/ExerciseBlock";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/formula_/$tense")({
  head: ({ params }) => {
    const t = TENSES_BY_SLUG[params.tense];
    const title = t ? `${t.name} — Tenses Around Us` : "Tense — Tenses Around Us";
    const desc = t ? `${t.overview}` : "Pelajari tense bahasa Inggris.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  loader: ({ params }) => {
    if (!TENSES_BY_SLUG[params.tense]) throw notFound();
    return {};
  },
  component: TenseDetailPage,
});

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────

function useScrollReveal<T extends HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          } else {
            el.style.opacity = "0";
            el.style.transform = "translateY(30px)";
          }
        });
      },
      { threshold: options.threshold ?? 0.1, rootMargin: options.rootMargin ?? "0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// ─── Formula Parser ───────────────────────────────────────────────────────────

interface FormulaGroup {
  pronouns: string;
  formula: string;
}

function parseFormulaToGroups(formulaStr: string): FormulaGroup[] {
  const hasV1S = formulaStr.includes("(s/es)") || formulaStr.includes("V1(s/es)");
  const hasDoDoes = /do\/does/i.test(formulaStr) || /don't\/doesn't/i.test(formulaStr);
  const hasHaveHas = /have\/has/i.test(formulaStr) || /haven't\/hasn't/i.test(formulaStr);
  const hasWasWere = /was\/were/i.test(formulaStr) || /wasn't\/weren't/i.test(formulaStr);
  const hasAmIsAre = /am\/is\/are/i.test(formulaStr) || /aren't\/isn't/i.test(formulaStr);
  const hasWouldShould = /would\/should/i.test(formulaStr);

  if (!hasV1S && !hasDoDoes && !hasHaveHas && !hasWasWere && !hasAmIsAre && !hasWouldShould) {
    return [{ pronouns: "All Subjects", formula: formulaStr }];
  }

  const groups: FormulaGroup[] = [];

  if (hasV1S) {
    groups.push({ pronouns: "I / You / We / They", formula: formulaStr.replace(/V1\s*\(s\/es\)/g, "V1") });
    groups.push({ pronouns: "He / She / It", formula: formulaStr.replace(/V1\s*\(s\/es\)/g, "V1(s/es)") });
  } else if (hasAmIsAre) {
    groups.push({ pronouns: "I", formula: formulaStr.replace(/am\/is\/are/g, "am").replace(/Am\/Is\/Are/g, "Am").replace(/aren't\/isn't/g, "am not").replace(/Aren't\/Isn't/g, "Am not") });
    groups.push({ pronouns: "He / She / It", formula: formulaStr.replace(/am\/is\/are/g, "is").replace(/Am\/Is\/Are/g, "Is").replace(/aren't\/isn't/g, "isn't").replace(/Aren't\/Isn't/g, "Isn't") });
    groups.push({ pronouns: "You / We / They", formula: formulaStr.replace(/am\/is\/are/g, "are").replace(/Am\/Is\/Are/g, "Are").replace(/aren't\/isn't/g, "aren't").replace(/Aren't\/Isn't/g, "Aren't") });
  } else if (hasDoDoes) {
    groups.push({ pronouns: "I / You / We / They", formula: formulaStr.replace(/do\/does/g, "do").replace(/Do\/Does/g, "Do").replace(/don't\/doesn't/g, "don't").replace(/Don't\/Doesn't/g, "Don't") });
    groups.push({ pronouns: "He / She / It", formula: formulaStr.replace(/do\/does/g, "does").replace(/Do\/Does/g, "Does").replace(/don't\/doesn't/g, "doesn't").replace(/Don't\/Doesn't/g, "Doesn't") });
  } else if (hasHaveHas) {
    groups.push({ pronouns: "I / You / We / They", formula: formulaStr.replace(/have\/has/g, "have").replace(/Have\/Has/g, "Have").replace(/haven't\/hasn't/g, "haven't").replace(/Haven't\/Hasn't/g, "Haven't") });
    groups.push({ pronouns: "He / She / It", formula: formulaStr.replace(/have\/has/g, "has").replace(/Have\/Has/g, "Has").replace(/haven't\/hasn't/g, "hasn't").replace(/Haven't\/Hasn't/g, "Hasn't") });
  } else if (hasWasWere) {
    groups.push({ pronouns: "I / He / She / It", formula: formulaStr.replace(/was\/were/g, "was").replace(/Was\/Were/g, "Was").replace(/wasn't\/weren't/g, "wasn't").replace(/Wasn't\/Weren't/g, "Wasn't") });
    groups.push({ pronouns: "You / We / They", formula: formulaStr.replace(/was\/were/g, "were").replace(/Was\/Were/g, "Were").replace(/wasn't\/weren't/g, "weren't").replace(/Wasn't\/Weren't/g, "Weren't") });
  } else if (hasWouldShould) {
    groups.push({ pronouns: "All Subjects", formula: formulaStr });
  }

  return groups;
}

// ─── Category Card Theme Colors (matching /tenses page) ─────────────────────

const CATEGORY_THEME: Record<TenseCategory, { bg: string; text: string; subBg: string; border: string; isDarkTheme: boolean }> = {
  present:     { bg: "#29725f", text: "#ffffff", subBg: "rgba(255, 255, 255, 0.12)", border: "rgba(255, 255, 255, 0.18)", isDarkTheme: true },
  past:        { bg: "#4b69f0", text: "#ffffff", subBg: "rgba(255, 255, 255, 0.12)", border: "rgba(255, 255, 255, 0.18)", isDarkTheme: true },
  future:      { bg: "#f5693c", text: "#111111", subBg: "rgba(0, 0, 0, 0.06)",        border: "rgba(0, 0, 0, 0.12)",        isDarkTheme: false },
  "past-future": { bg: "#a0325a", text: "#ffffff", subBg: "rgba(255, 255, 255, 0.12)", border: "rgba(255, 255, 255, 0.18)", isDarkTheme: true },
};

// ─── Main Page Component ──────────────────────────────────────────────────────

function TenseDetailPage() {
  const { tense } = Route.useParams();
  const t = TENSES_BY_SLUG[tense];
  const questions = useMemo(() => QUIZZES[tense] ?? [], [tense]);

  const currentIndex = TENSES.findIndex((item) => item.slug === tense);
  const prevTense = currentIndex > 0 ? TENSES[currentIndex - 1] : TENSES[TENSES.length - 1];
  const nextTense = currentIndex < TENSES.length - 1 ? TENSES[currentIndex + 1] : TENSES[0];

  return (
    <div style={{ background: "#F5F1EB", minHeight: "100vh" }}>
      <div className="formula-page-wrapper">
        {/* Left Side Menu (Text Only) */}
        <TenseLeftMenu currentSlug={tense} prevTense={prevTense} />

        {/* Center Single Unified Colored Box */}
        <SingleTenseBox tense={t} questions={questions} />

        {/* Right Side Menu (Text Only) */}
        <TenseRightMenu currentSlug={tense} nextTense={nextTense} />
      </div>
    </div>
  );
}

// ─── Left Side Text Menu ──────────────────────────────────────────────────────

function TenseLeftMenu({ currentSlug, prevTense }: { currentSlug: string; prevTense: Tense }) {
  const presentTenses = TENSES.filter((t) => t.category === "present");
  const pastTenses = TENSES.filter((t) => t.category === "past");

  return (
    <aside className="tense-side-menu tense-side-menu-left">
      {/* Previous Tense text button */}
      <Link
        to="/formula/$tense"
        params={{ tense: prevTense.slug }}
        className="tense-side-nav-link"
      >
        <span style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8c827a" }}>
          ← Sebelumnya
        </span>
        <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "0.9375rem", fontWeight: 800, color: "#111111" }}>
          {prevTense.name}
        </span>
      </Link>

      {/* Present Tenses Group */}
      <div className="tense-side-group">
        <span className="tense-side-group-title">Present Tenses</span>
        {presentTenses.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <Link
              key={item.slug}
              to="/formula/$tense"
              params={{ tense: item.slug }}
              className={`tense-text-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="tense-active-dot" />}
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Past Tenses Group */}
      <div className="tense-side-group">
        <span className="tense-side-group-title">Past Tenses</span>
        {pastTenses.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <Link
              key={item.slug}
              to="/formula/$tense"
              params={{ tense: item.slug }}
              className={`tense-text-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="tense-active-dot" />}
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Right Side Text Menu ─────────────────────────────────────────────────────

function TenseRightMenu({ currentSlug, nextTense }: { currentSlug: string; nextTense: Tense }) {
  const futureTenses = TENSES.filter((t) => t.category === "future");
  const pastFutureTenses = TENSES.filter((t) => t.category === "past-future");

  return (
    <aside className="tense-side-menu tense-side-menu-right">
      {/* Next Tense text button */}
      <Link
        to="/formula/$tense"
        params={{ tense: nextTense.slug }}
        className="tense-side-nav-link"
        style={{ textAlign: "right" }}
      >
        <span style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8c827a" }}>
          Berikutnya →
        </span>
        <span style={{ fontFamily: "'Epilogue', sans-serif", fontSize: "0.9375rem", fontWeight: 800, color: "#111111" }}>
          {nextTense.name}
        </span>
      </Link>

      {/* Future Tenses Group */}
      <div className="tense-side-group">
        <span className="tense-side-group-title">Future Tenses</span>
        {futureTenses.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <Link
              key={item.slug}
              to="/formula/$tense"
              params={{ tense: item.slug }}
              className={`tense-text-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="tense-active-dot" />}
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Past Future Tenses Group */}
      <div className="tense-side-group">
        <span className="tense-side-group-title">Past Future Tenses</span>
        {pastFutureTenses.map((item) => {
          const isActive = item.slug === currentSlug;
          return (
            <Link
              key={item.slug}
              to="/formula/$tense"
              params={{ tense: item.slug }}
              className={`tense-text-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="tense-active-dot" />}
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Single Unified Colored Box Component ─────────────────────────────────────

interface SingleTenseBoxProps {
  tense: Tense;
  questions: any[];
}

function SingleTenseBox({ tense, questions }: SingleTenseBoxProps) {
  const theme = CATEGORY_THEME[tense.category];
  const isDark = theme.isDarkTheme;

  const sectionLabelColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)";

  return (
    <main
      className="single-tense-box"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      {/* ── 1. Hero / Header inside the box ── */}
      <header style={{ textAlign: "center", paddingTop: "1rem" }}>
        <span
          style={{
            display: "inline-block",
            background: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)",
            color: theme.text,
            padding: "6px 16px",
            borderRadius: "999px",
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "1.25rem",
          }}
        >
          {tense.category.replace("-", " ")}
        </span>

        <h1
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: theme.text,
            margin: "0 0 0.875rem",
          }}
        >
          {tense.name}
        </h1>

        <p
          style={{
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
            fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
            color: theme.text,
            opacity: 0.8,
            margin: "0",
          }}
        >
          {tense.indonesian}
        </p>
      </header>

      {/* ── 2. Overview Section ── */}
      <section style={{ textAlign: "center" }}>
        <SectionLabel style={{ color: sectionLabelColor }}>Overview</SectionLabel>
        <p
          style={{
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
            fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
            lineHeight: 1.7,
            color: theme.text,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          "{tense.overview}"
        </p>
      </section>

      {/* ── 3. Formula Section ── */}
      <FormulaInnerSection tense={tense} theme={theme} sectionLabelColor={sectionLabelColor} />

      {/* ── 4. Examples Section ── */}
      <ExamplesInnerSection tense={tense} theme={theme} sectionLabelColor={sectionLabelColor} />

      {/* ── 5. Time Expressions Section ── */}
      <TimeExpressionsInnerSection tense={tense} theme={theme} sectionLabelColor={sectionLabelColor} />

      {/* ── 6. Usage Section ── */}
      <UsageInnerSection tense={tense} theme={theme} sectionLabelColor={sectionLabelColor} />

      {/* ── 7. Practice Exercise Section ── */}
      <ExerciseInnerSection tense={tense} questions={questions} sectionLabelColor={sectionLabelColor} />

      {/* ── 8. Quiz CTA Section ── */}
      <QuizCtaInnerSection tense={tense} sectionLabelColor={sectionLabelColor} />
    </main>
  );
}

// ─── Section Label Helper ─────────────────────────────────────────────────────

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: "block",
        fontSize: "0.6875rem",
        fontFamily: "'Epilogue', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: "1.25rem",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Formula Inner Component ──────────────────────────────────────────────────

const FORMULA_TYPES = [
  { key: "positive", label: "Positive" },
  { key: "negative", label: "Negative" },
  { key: "interrogative", label: "Interrogative" },
  { key: "negativeInterrogative", label: "Negative Interrogative" },
] as const;

function FormulaInnerSection({ tense, theme, sectionLabelColor }: { tense: Tense; theme: typeof CATEGORY_THEME["present"]; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref}>
      <SectionLabel style={{ color: sectionLabelColor }}>Sentence Formula</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {FORMULA_TYPES.map(({ key, label }) => {
          const formulaStr = tense.formula[key];
          const groups = parseFormulaToGroups(formulaStr);

          return (
            <div
              key={key}
              style={{
                background: theme.subBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "20px",
                padding: "1.5rem",
              }}
            >
              <p
                style={{
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: theme.isDarkTheme ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.55)",
                  marginBottom: "0.75rem",
                }}
              >
                {label}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: groups.length === 1 ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {groups.map((group, i) => (
                  <div
                    key={i}
                    style={{
                      background: theme.isDarkTheme ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
                      borderRadius: "14px",
                      padding: "1.125rem 1.25rem",
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontFamily: "'Epilogue', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.6875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: theme.isDarkTheme ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.55)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {group.pronouns}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Epilogue', monospace",
                        fontWeight: 900,
                        fontSize: "clamp(0.9rem, 2vw, 1.125rem)",
                        color: theme.text,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.35,
                        wordBreak: "break-word",
                      }}
                    >
                      {group.formula}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Examples Inner Component ─────────────────────────────────────────────────

const EXAMPLE_CATS = [
  { title: "Positive", key: "positive" },
  { title: "Negative", key: "negative" },
  { title: "Interrogative", key: "interrogative" },
  { title: "Negative Interrogative", key: "negativeInterrogative" },
] as const;

function ExamplesInnerSection({ tense, theme, sectionLabelColor }: { tense: Tense; theme: typeof CATEGORY_THEME["present"]; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref}>
      <SectionLabel style={{ color: sectionLabelColor }}>Sentence Examples</SectionLabel>

      {/* Contextual examples */}
      {tense.examples && tense.examples.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: theme.isDarkTheme ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.55)",
              marginBottom: "0.75rem",
            }}
          >
            Contextual
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {tense.examples.map((s, i) => (
              <div
                key={i}
                style={{
                  background: theme.subBg,
                  borderRadius: "14px",
                  padding: "1rem 1.375rem",
                  border: `1px solid ${theme.border}`,
                  fontFamily: "'Lora', serif",
                  fontStyle: "italic",
                  fontSize: "1.0625rem",
                  color: theme.text,
                  lineHeight: 1.6,
                }}
              >
                "{s}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentence form grids */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {EXAMPLE_CATS.map(({ title, key }) => (
          <div key={key}>
            <p
              style={{
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 800,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: theme.isDarkTheme ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.55)",
                marginBottom: "0.625rem",
              }}
            >
              {title}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(tense[key] as string[]).slice(0, 3).map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: theme.subBg,
                    borderRadius: "12px",
                    padding: "0.875rem 1.125rem",
                    border: `1px solid ${theme.border}`,
                    fontFamily: "'Lora', serif",
                    fontStyle: "italic",
                    fontSize: "0.9375rem",
                    color: theme.text,
                    lineHeight: 1.55,
                  }}
                >
                  "{s}"
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Time Expressions Inner Component ────────────────────────────────────────

function TimeExpressionsInnerSection({ tense, theme, sectionLabelColor }: { tense: Tense; theme: typeof CATEGORY_THEME["present"]; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} style={{ textAlign: "center" }}>
      <SectionLabel style={{ color: sectionLabelColor }}>Common Time Expressions</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", justifyContent: "center" }}>
        {tense.timeExpressions.map((e) => (
          <span
            key={e}
            style={{
              display: "inline-block",
              background: theme.subBg,
              color: theme.text,
              padding: "0.5rem 1.125rem",
              borderRadius: "999px",
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 800,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: `1px solid ${theme.border}`,
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Usage Inner Component ────────────────────────────────────────────────────

function UsageInnerSection({ tense, theme, sectionLabelColor }: { tense: Tense; theme: typeof CATEGORY_THEME["present"]; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref}>
      <SectionLabel style={{ color: sectionLabelColor }}>When to Use</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 680, margin: "0 auto" }}>
        {tense.usage.map((u, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
              background: theme.subBg,
              borderRadius: "14px",
              padding: "1.125rem 1.375rem",
              border: `1px solid ${theme.border}`,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: theme.isDarkTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
                color: theme.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Epilogue', sans-serif",
                fontWeight: 900,
                fontSize: "0.8125rem",
              }}
            >
              {i + 1}
            </span>
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontSize: "1rem",
                lineHeight: 1.65,
                color: theme.text,
                margin: 0,
                paddingTop: "0.125rem",
              }}
            >
              {u}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Exercise Inner Component ─────────────────────────────────────────────────

function ExerciseInnerSection({ questions, sectionLabelColor }: { tense: Tense; questions: any[]; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref}>
      <SectionLabel style={{ color: sectionLabelColor }}>Practice Exercise</SectionLabel>
      <div
        style={{
          background: "#ffffff",
          color: "#111111",
          borderRadius: "24px",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
            letterSpacing: "-0.03em",
            color: "#111111",
            marginBottom: "0.5rem",
          }}
        >
          Test Your Knowledge
        </h2>
        <p
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontSize: "0.9375rem",
            color: "#6b6560",
            fontWeight: 600,
            marginBottom: "2rem",
          }}
        >
          Cek pemahaman cepat. Lima soal acak setiap kali.
        </p>

        <ExerciseBlock questions={questions} />
      </div>
    </section>
  );
}

// ─── Quiz CTA Inner Component ─────────────────────────────────────────────────

function QuizCtaInnerSection({ tense, sectionLabelColor }: { tense: Tense; sectionLabelColor: string }) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} style={{ textAlign: "center" }}>
      <div
        style={{
          background: "#ffffff",
          color: "#111111",
          borderRadius: "24px",
          padding: "clamp(2.5rem, 6vw, 3.5rem)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#d00973ff",
            marginBottom: "1rem",
          }}
        >
          Ready to test?
        </span>

        <h2
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            letterSpacing: "-0.03em",
            color: "#111111",
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}
        >
          Take the Tense Quiz!
        </h2>

        <p
          style={{
            fontFamily: "'Epilogue', sans-serif",
            fontSize: "1rem",
            color: "#6b6560",
            fontWeight: 500,
            maxWidth: 440,
            margin: "0 auto 2rem",
            lineHeight: 1.65,
          }}
        >
          Siap diuji? Kerjakan 20 soal khusus tense ini untuk mengunci pencapaian dan menguji pemahamanmu.
        </p>

        <Link
          to="/quiz/$quizId"
          params={{ quizId: `tense-${tense.slug}` }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.625rem",
            background: "#111111",
            color: "#ffffff",
            padding: "0.875rem 2rem",
            borderRadius: "999px",
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 900,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textDecoration: "none",
            cursor: "url('/assets/Cursor SVG/cursor-pointer.svg') 12 12, pointer",
          }}
        >
          Mulai Quiz <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
