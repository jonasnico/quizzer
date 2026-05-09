import { useState, useEffect } from "react";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS } from "../types";

interface QuizReviewData {
  questions: TriviaQuestion[];
  quizState: QuizState;
  shuffledOptions: string[][];
}

export default function QuizReview() {
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
      if (!raw) { setHasError(true); setIsLoading(false); return; }
      const parsed = JSON.parse(raw);
      if (!parsed.questions || !parsed.quizState || parsed.questions.length === 0) {
        setHasError(true); setIsLoading(false); return;
      }
      setReviewData(parsed);
      setIsLoading(false);
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  const redirectToHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
    window.location.href = import.meta.env.BASE_URL;
  };

  const getDifficultyClass = (difficulty: string) => {
    if (difficulty === "easy") return "difficulty-easy";
    if (difficulty === "hard") return "difficulty-hard";
    return "difficulty-medium";
  };

  const spinStyle = { width: 44, height: 44, border: "3px solid var(--color-border)", borderTopColor: "var(--color-gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "1rem" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={spinStyle} />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>LOADING REVIEW...</p>
      </div>
    );
  }

  if (hasError || !reviewData) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>NO QUIZ DATA</h3>
        <p style={{ color: "var(--color-text-dim)", marginBottom: "2rem" }}>Complete a quiz first to see the review.</p>
        <button onClick={redirectToHome} className="btn-primary">START NEW QUIZ</button>
      </div>
    );
  }

  const { questions, quizState, shuffledOptions } = reviewData;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <p className="label" style={{ marginBottom: "0.4rem" }}>Review</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.04em", margin: 0 }}>QUIZ ANSWERS</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="label">Final Score</p>
            <p className="score-display" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{quizState.score}/{quizState.userAnswers.length}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
          <a href={`${import.meta.env.BASE_URL}/quiz`} className="btn-secondary">← Back to Results</a>
          <button onClick={redirectToHome} className="btn-primary">PLAY AGAIN</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((question, index) => {
          const userAnswer = quizState.userAnswers[index];
          const isCorrect = userAnswer === question.correct_answer;
          const options = shuffledOptions[index];

          return (
            <div key={index} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-dim)" }}>Q{index + 1}</span>
                    <span className={getDifficultyClass(question.difficulty)} style={{ padding: "0.2rem 0.6rem", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                      {question.difficulty}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--color-text-dim)" }}>{question.category}</span>
                  </div>
                  <p style={{ fontWeight: 600, lineHeight: 1.5 }}>{question.question}</p>
                </div>
                <div style={{ marginLeft: "1rem", flexShrink: 0 }}>
                  {isCorrect ? (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-green)" }}>✓</span>
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-red)" }}>✗</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {options.map((option) => {
                  const isCorrectOption = option === question.correct_answer;
                  const isUserWrongAnswer = option === userAnswer && !isCorrect;

                  let style: React.CSSProperties = {
                    padding: "0.75rem 1rem",
                    borderRadius: 8,
                    fontSize: "0.9rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                    color: "var(--color-text-dim)",
                  };

                  if (isCorrectOption) {
                    style = { ...style, background: "var(--color-green-dim)", border: "1px solid var(--color-green)", color: "var(--color-green)" };
                  } else if (isUserWrongAnswer) {
                    style = { ...style, background: "var(--color-red-dim)", border: "1px solid var(--color-red)", color: "var(--color-red)" };
                  }

                  return (
                    <div key={option} style={style}>
                      <span>{option}</span>
                      {isCorrectOption && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>CORRECT</span>}
                      {isUserWrongAnswer && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>YOUR ANSWER</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <button onClick={redirectToHome} className="btn-primary">START NEW QUIZ</button>
      </div>
    </div>
  );
}
