import { useState, useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { TriviaAPI, shuffleArray } from "../utils/api";
import type { MultiplayerGameState, ServerMessage, ClientMessage, Player, QuizConfig } from "../types";
import { TRIVIA_CATEGORIES, QUIZ_LIMITS } from "../types";

type AppPhase = "home" | "lobby" | "game" | "ended";

const PARTYKIT_HOST = import.meta.env.PUBLIC_PARTYKIT_HOST as string;

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const spin: React.CSSProperties = { width: 40, height: 40, border: "3px solid var(--color-border)", borderTopColor: "var(--color-gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" };

export default function MultiplayerApp() {
  const [appPhase, setAppPhase] = useState<AppPhase>("home");
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [myName, setMyName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({ amount: 10, category: undefined, difficulty: undefined, type: undefined });

  const socketRef = useRef<PartySocket | null>(null);

  const sendMessage = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const connect = useCallback((room: string, name: string) => {
    if (socketRef.current) socketRef.current.close();

    const socket = new PartySocket({ host: PARTYKIT_HOST, room });
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setMyId(socket.id);
      sendMessage({ type: "join", name });
      setIsConnecting(false);
      setAppPhase("lobby");
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if (msg.type === "state") {
        setGameState(msg.state);
        if (msg.state.phase === "ended") setAppPhase("ended");
        else if (msg.state.phase !== "lobby") setAppPhase("game");
      } else if (msg.type === "error") {
        setError(msg.message);
      }
    });

    socket.addEventListener("close", () => {
      setError("Connection lost. Please refresh.");
    });
  }, [sendMessage]);

  const handleCreate = () => {
    if (!nameInput.trim()) { setError("Please enter your name."); return; }
    const room = generateRoomId();
    setMyName(nameInput.trim());
    setRoomId(room);
    setIsConnecting(true);
    setError(null);
    connect(room, nameInput.trim());
  };

  const handleJoin = () => {
    if (!nameInput.trim()) { setError("Please enter your name."); return; }
    if (!codeInput.trim()) { setError("Please enter a room code."); return; }
    const room = codeInput.trim().toUpperCase();
    setMyName(nameInput.trim());
    setRoomId(room);
    setIsConnecting(true);
    setError(null);
    connect(room, nameInput.trim());
  };

  const handleStartGame = async () => {
    setIsFetchingQuestions(true);
    setError(null);
    try {
      const questions = await TriviaAPI.fetchQuestions(quizConfig);
      const shuffledOptions = questions.map((q) =>
        q.type === "boolean" ? ["True", "False"] : shuffleArray([q.correct_answer, ...q.incorrect_answers])
      );
      sendMessage({ type: "start", questions, shuffledOptions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  const handleAnswer = (answer: string) => {
    sendMessage({ type: "answer", answer });
  };

  const handleNextQuestion = () => {
    sendMessage({ type: "next_question" });
  };

  const handleLeave = () => {
    socketRef.current?.close();
    socketRef.current = null;
    setGameState(null);
    setAppPhase("home");
    setError(null);
    setNameInput("");
    setCodeInput("");
    setRoomId("");
  };

  useEffect(() => () => { socketRef.current?.close(); }, []);

  const me = gameState?.players.find((p) => p.id === myId);
  const isHost = me?.isHost ?? false;
  const sortedPlayers = gameState ? [...gameState.players].sort((a, b) => b.score - a.score) : [];

  if (appPhase === "home") {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="card" style={{ padding: "2.5rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="label" style={{ marginBottom: "0.4rem" }}>Real-Time</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", letterSpacing: "0.04em", margin: 0 }}>MULTIPLAYER</h2>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}>
            {(["create", "join"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setJoinMode(mode); setError(null); }}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: 8,
                  border: joinMode === mode ? "1px solid var(--color-gold)" : "1px solid var(--color-border)",
                  background: joinMode === mode ? "var(--color-gold-dim)" : "transparent",
                  color: joinMode === mode ? "var(--color-gold)" : "var(--color-text-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {mode === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label" style={{ display: "block", marginBottom: "0.5rem" }}>Your Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your name..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && (joinMode === "create" ? handleCreate() : handleJoin())}
              />
            </div>

            {joinMode === "join" && (
              <div>
                <label className="label" style={{ display: "block", marginBottom: "0.5rem" }}>Room Code</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="ABC123"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "1.1rem" }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
            )}

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "var(--color-red-dim)", border: "1px solid var(--color-red)", borderRadius: 8 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-red)" }}>{error}</p>
              </div>
            )}

            <button
              onClick={joinMode === "create" ? handleCreate : handleJoin}
              disabled={isConnecting}
              className="btn-primary"
              style={{ width: "100%", textAlign: "center", marginTop: "0.25rem" }}
            >
              {isConnecting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                  <span style={{ ...spin, width: 18, height: 18, borderWidth: 2 }} />
                  CONNECTING...
                </span>
              ) : joinMode === "create" ? "CREATE ROOM" : "JOIN ROOM"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appPhase === "lobby" && gameState) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div className="card" style={{ marginBottom: "1rem", textAlign: "center", padding: "2rem" }}>
          <p className="label" style={{ marginBottom: "0.75rem" }}>Room Code</p>
          <div className="room-code">{roomId}</div>
          <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem", marginTop: "0.75rem" }}>Share this code with friends to join</p>
        </div>

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p className="label">Players ({gameState.players.length})</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-green)", boxShadow: "0 0 8px var(--color-green)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-green)" }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {gameState.players.map((player) => (
              <div key={player.id} className="player-chip" style={player.id === myId ? { borderColor: "var(--color-gold)", color: "var(--color-gold)" } : {}}>
                {player.isHost && <span style={{ fontSize: "0.75rem" }}>👑</span>}
                <span>{player.name}</span>
                {player.id === myId && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--color-text-dim)" }}>(you)</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <p className="label" style={{ marginBottom: "1rem" }}>Quiz Settings</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label className="label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.65rem" }}>Questions: {quizConfig.amount}</label>
                <input
                  type="range"
                  className="slider"
                  min={QUIZ_LIMITS.MIN_QUESTIONS}
                  max={Math.min(30, QUIZ_LIMITS.MAX_QUESTIONS)}
                  value={quizConfig.amount}
                  onChange={(e) => setQuizConfig((c) => ({ ...c, amount: parseInt(e.target.value) }))}
                  style={{ width: "100%", height: 6, background: "var(--color-border)", borderRadius: 99, appearance: "none", cursor: "pointer" }}
                />
              </div>
              <div>
                <label className="label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.65rem" }}>Category</label>
                <select className="input-field" value={quizConfig.category ?? ""} onChange={(e) => setQuizConfig((c) => ({ ...c, category: e.target.value ? parseInt(e.target.value) : undefined }))}>
                  <option value="">Any Category</option>
                  {TRIVIA_CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.65rem" }}>Difficulty</label>
                  <select className="input-field" value={quizConfig.difficulty ?? ""} onChange={(e) => setQuizConfig((c) => ({ ...c, difficulty: e.target.value as QuizConfig["difficulty"] || undefined }))}>
                    <option value="">Any</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.65rem" }}>Type</label>
                  <select className="input-field" value={quizConfig.type ?? ""} onChange={(e) => setQuizConfig((c) => ({ ...c, type: e.target.value as QuizConfig["type"] || undefined }))}>
                    <option value="">Any</option>
                    <option value="multiple">Multiple Choice</option>
                    <option value="boolean">True / False</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "var(--color-red-dim)", border: "1px solid var(--color-red)", borderRadius: 8, marginBottom: "1rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-red)" }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleLeave} className="btn-secondary">Leave</button>
          {isHost && (
            <button onClick={handleStartGame} disabled={isFetchingQuestions || gameState.players.length < 1} className="btn-primary" style={{ flex: 1, textAlign: "center" }}>
              {isFetchingQuestions ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                  <span style={{ ...spin, width: 18, height: 18, borderWidth: 2 }} />
                  LOADING...
                </span>
              ) : "START GAME"}
            </button>
          )}
          {!isHost && <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>Waiting for host to start...</p>}
        </div>
      </div>
    );
  }

  if ((appPhase === "game" || appPhase === "ended") && gameState) {
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const options = gameState.shuffledOptions[gameState.currentQuestionIndex];
    const myAnswer = gameState.answers[myId];
    const hasAnswered = !!myAnswer;
    const isRevealed = gameState.phase === "answer_revealed" || gameState.phase === "ended";

    const getOptionStyle = (option: string): React.CSSProperties => {
      if (!isRevealed && !hasAnswered) return {};
      const isCorrect = option === currentQuestion.correct_answer;
      const isMyWrong = option === myAnswer && !isCorrect;
      if (isCorrect) return { background: "var(--color-green-dim)", borderColor: "var(--color-green)", color: "var(--color-green)" };
      if (isMyWrong) return { background: "var(--color-red-dim)", borderColor: "var(--color-red)", color: "var(--color-red)" };
      return { opacity: 0.4 };
    };

    const answeredCount = gameState.players.filter((p) => p.answeredCurrentQuestion).length;

    if (appPhase === "ended") {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="card" style={{ textAlign: "center", padding: "2.5rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🏆</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>GAME OVER!</h2>
            <p style={{ color: "var(--color-text-dim)" }}>Room: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-gold)" }}>{roomId}</span></p>
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <p className="label" style={{ marginBottom: "1rem" }}>Final Standings</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sortedPlayers.map((player, rank) => (
                <div key={player.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  background: rank === 0 ? "var(--color-gold-dim)" : "var(--color-surface-2)",
                  border: `1px solid ${rank === 0 ? "var(--color-gold)" : "var(--color-border)"}`,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", width: 24, color: rank === 0 ? "var(--color-gold)" : "var(--color-text-dim)" }}>
                    {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: player.id === myId ? "var(--color-gold)" : "var(--color-text)" }}>
                    {player.name} {player.id === myId && "(you)"}
                  </span>
                  <span className="score-display" style={{ fontSize: "1.1rem" }}>{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleLeave} className="btn-secondary" style={{ flex: 1 }}>Leave Room</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <p className="label">Question {gameState.currentQuestionIndex + 1}/{gameState.questions.length}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>{answeredCount}/{gameState.players.length} answered</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ textAlign: "right" }}>
                <p className="label">My Score</p>
                <p className="score-display" style={{ fontSize: "1.3rem" }}>{me?.score ?? 0}</p>
              </div>
              {!isRevealed && (
                <div style={{ position: "relative", width: 40, height: 40 }}>
                  <svg viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)", width: 40, height: 40 }}>
                    <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                    <circle
                      cx="20" cy="20" r="17"
                      fill="none"
                      stroke="var(--color-gold)"
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 17}`}
                      strokeDashoffset={`${2 * Math.PI * 17 * (1 - gameState.timeLeft / 20)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: gameState.timeLeft <= 5 ? "var(--color-red)" : "var(--color-gold)" }}>
                    {gameState.timeLeft}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
            <span className={currentQuestion.difficulty === "easy" ? "difficulty-easy" : currentQuestion.difficulty === "hard" ? "difficulty-hard" : "difficulty-medium"}
              style={{ padding: "0.25rem 0.75rem", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
              {currentQuestion.difficulty}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--color-text-dim)" }}>{currentQuestion.category}</span>
          </div>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.5, marginBottom: "1.5rem" }}>
            {currentQuestion.question}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => !hasAnswered && !isRevealed && handleAnswer(option)}
                disabled={hasAnswered || isRevealed}
                className={!isRevealed && !hasAnswered ? "answer-btn" : "answer-btn-disabled"}
                style={getOptionStyle(option)}
              >
                {option}
                {isRevealed && option === currentQuestion.correct_answer && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", marginLeft: "0.5rem" }}>✓ CORRECT</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isRevealed && (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <p className="label" style={{ marginBottom: "0.75rem" }}>Scores</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {sortedPlayers.map((player, rank) => (
                <div key={player.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: player.id === myId ? "var(--color-gold-dim)" : "transparent", border: `1px solid ${player.id === myId ? "var(--color-gold)" : "transparent"}` }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-dim)", width: 20 }}>#{rank + 1}</span>
                  <span style={{ flex: 1, fontSize: "0.9rem", color: player.id === myId ? "var(--color-gold)" : "var(--color-text)" }}>{player.name}</span>
                  <span className="score-display" style={{ fontSize: "1rem" }}>{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && isRevealed && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleNextQuestion} className="btn-primary">
              {gameState.currentQuestionIndex >= gameState.questions.length - 1 ? "SEE RESULTS" : "NEXT QUESTION →"}
            </button>
          </div>
        )}

        {!isHost && isRevealed && (
          <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-dim)", letterSpacing: "0.08em" }}>
            WAITING FOR HOST...
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "1rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={spin} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-dim)", letterSpacing: "0.1em" }}>CONNECTING...</p>
    </div>
  );
}
