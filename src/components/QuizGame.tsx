import { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import {
  shuffleArray,
  formatQuestionNumber,
  calculatePercentage,
} from "../utils/api";
import type { TriviaQuestion, QuizState } from "../types";
import { STORAGE_KEYS, SCORE_THRESHOLDS } from "../types";
import { BUTTON_STYLES, RESULT_ICONS } from "../utils/styles";

interface Toast {
  id: number;
  isCorrect: boolean;
  question: TriviaQuestion;
  selectedAnswer: string;
}

export default function QuizGame() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = () => {
    try {
      const questionsData = sessionStorage.getItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
      if (!questionsData) { setHasError(true); return; }

      const parsedQuestions = JSON.parse(questionsData);
      if (parsedQuestions.length === 0) { setHasError(true); return; }

      const reviewData = sessionStorage.getItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
      if (reviewData) {
        const parsed = JSON.parse(reviewData);
        setQuizState(parsed.quizState);
        setQuestions(parsed.questions);
        setShuffledOptions(parsed.shuffledOptions);
        setShowResults(true);
        setIsLoading(false);
        return;
      }

      const initialQuizState: QuizState = {
        questions: parsedQuestions,
        currentQuestionIndex: 0,
        score: 0,
        userAnswers: new Array(parsedQuestions.length).fill(""),
      };

      const initialShuffledOptions = parsedQuestions.map((q: TriviaQuestion) =>
        q.type === "boolean" ? ["True", "False"] : shuffleArray([q.correct_answer, ...q.incorrect_answers])
      );

      setQuizState(initialQuizState);
      setQuestions(parsedQuestions);
      setShuffledOptions(initialShuffledOptions);
      setIsLoading(false);
    } catch {
      setHasError(true);
    }
  };

  const selectAnswer = (selectedAnswer: string) => {
    if (!quizState) return;
    if (quizState.userAnswers[quizState.currentQuestionIndex] !== "") return;
    const question = questions[quizState.currentQuestionIndex];
    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = selectedAnswer;
    const newScore = quizState.score + (selectedAnswer === question.correct_answer ? 1 : 0);
    setQuizState({ ...quizState, score: newScore, userAnswers: newUserAnswers });
    const isCorrect = selectedAnswer === question.correct_answer;
    const newToast: Toast = { id: Date.now(), isCorrect, question, selectedAnswer };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== newToast.id)), 3000);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const goToPreviousQuestion = () => {
    if (!quizState || quizState.currentQuestionIndex === 0) return;
    setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex - 1 });
  };

  const goToNextQuestion = () => {
    if (!quizState) return;
    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState({ ...quizState, currentQuestionIndex: quizState.currentQuestionIndex + 1 });
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!quizState) return;
    const percentage = calculatePercentage(quizState.score, questions.length);
    sessionStorage.setItem(STORAGE_KEYS.QUIZ_REVIEW_DATA, JSON.stringify({ questions, quizState, shuffledOptions }));
    setShowResults(true);
    if (percentage >= SCORE_THRESHOLDS.GOOD) setShowConfetti(true);
  };

  const redirectToHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.TRIVIA_QUESTIONS);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_CONFIG);
    sessionStorage.removeItem(STORAGE_KEYS.QUIZ_REVIEW_DATA);
    window.location.href = import.meta.env.BASE_URL;
  };

  const getButtonStyle = (option: string, question: TriviaQuestion, hasAnswered: boolean) => {
    if (!quizState) return BUTTON_STYLES.DEFAULT;
    const userAnswer = quizState.userAnswers[quizState.currentQuestionIndex];
    if (userAnswer === option) return option === question.correct_answer ? BUTTON_STYLES.CORRECT : BUTTON_STYLES.INCORRECT;
    if (hasAnswered && option === question.correct_answer) return BUTTON_STYLES.CORRECT;
    if (hasAnswered) return BUTTON_STYLES.DISABLED;
    return BUTTON_STYLES.DEFAULT;
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
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>LOADING QUIZ...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>QUIZ NOT FOUND</h3>
        <p style={{ color: "var(--color-text-dim)", marginBottom: "2rem" }}>No quiz data found. Please start a new quiz.</p>
        <button onClick={redirectToHome} className="btn-primary">START NEW QUIZ</button>
      </div>
    );
  }

  if (!quizState) return null;

  if (showResults) {
    const percentage = calculatePercentage(quizState.score, questions.length);
    const resultIcon = percentage >= SCORE_THRESHOLDS.EXCELLENT ? RESULT_ICONS.EXCELLENT : percentage >= SCORE_THRESHOLDS.GOOD ? RESULT_ICONS.GOOD : RESULT_ICONS.NEEDS_IMPROVEMENT;

    return (
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
        {showConfetti && (
          <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 50 }}>
            <ConfettiExplosion force={percentage >= SCORE_THRESHOLDS.EXCELLENT ? 1.0 : 0.8} duration={percentage >= SCORE_THRESHOLDS.EXCELLENT ? 4000 : 3000} particleCount={percentage >= SCORE_THRESHOLDS.EXCELLENT ? 350 : 250} width={1600} onComplete={() => setShowConfetti(false)} />
          </div>
        )}
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <p className="label">Quiz Complete</p>
              <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>{questions.length} questions</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="label">Final Score</p>
              <p className="score-display" style={{ fontSize: "1.5rem", fontWeight: 700 }}>{quizState.score}/{questions.length}</p>
            </div>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: "100%" }} /></div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{resultIcon}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", letterSpacing: "0.04em", marginBottom: "1rem" }}>QUIZ COMPLETE!</h2>
          <p style={{ color: "var(--color-text-dim)", marginBottom: "0.5rem" }}>You scored {quizState.score} out of {questions.length}</p>
          <p className="score-display" style={{ fontSize: "3rem", fontWeight: 700 }}>{percentage}%</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            <a href={`${import.meta.env.BASE_URL}/review`} className="btn-secondary">Review Answers</a>
            <button onClick={redirectToHome} className="btn-primary">PLAY AGAIN</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100;
  const hasAnswered = quizState.userAnswers[quizState.currentQuestionIndex] !== "";
  const isLastQuestion = quizState.currentQuestionIndex === questions.length - 1;
  const options = shuffledOptions[quizState.currentQuestionIndex];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <p className="label">{formatQuestionNumber(quizState.currentQuestionIndex, totalQuestions)}</p>
            <p style={{ color: "var(--color-text-dim)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{currentQuestion.category}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="label">Score</p>
            <p className="score-display" style={{ fontSize: "1.4rem" }}>{quizState.score}<span style={{ color: "var(--color-text-dim)", fontSize: "0.9rem" }}>/{quizState.currentQuestionIndex}</span></p>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercentage}%` }} /></div>
      </div>

      <div style={{ position: "absolute", top: 100, right: 0, zIndex: 50, display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 280 }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ padding: "0.75rem 1rem", borderRadius: 10, borderLeft: `3px solid ${toast.isCorrect ? "var(--color-green)" : "var(--color-red)"}`, background: toast.isCorrect ? "var(--color-green-dim)" : "var(--color-red-dim)", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: toast.isCorrect ? "var(--color-green)" : "var(--color-red)", flexShrink: 0 }}>{toast.isCorrect ? "✓" : "✗"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: "0.85rem", color: toast.isCorrect ? "var(--color-green)" : "var(--color-red)" }}>{toast.isCorrect ? "Correct!" : "Incorrect"}</p>
              {!toast.isCorrect && <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>Answer: {toast.question.correct_answer}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-dim)", fontSize: "1rem", flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span className={getDifficultyClass(currentQuestion.difficulty)} style={{ padding: "0.25rem 0.75rem", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
            {currentQuestion.difficulty}
          </span>
        </div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 600, lineHeight: 1.5, marginBottom: "1.5rem" }}>
          {currentQuestion.question}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {options.map((option) => (
            <button key={option} onClick={() => selectAnswer(option)} disabled={hasAnswered} className={getButtonStyle(option, currentQuestion, hasAnswered)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={goToPreviousQuestion} disabled={quizState.currentQuestionIndex === 0} className="btn-secondary">← Previous</button>
        <button onClick={goToNextQuestion} disabled={!hasAnswered} className="btn-primary">{isLastQuestion ? "FINISH QUIZ" : "NEXT →"}</button>
      </div>
    </div>
  );
}
