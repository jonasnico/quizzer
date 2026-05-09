import type * as Party from "partykit/server";
import type {
  TriviaQuestion,
  Player,
  MultiplayerGameState,
  ClientMessage,
} from "../src/types";

const QUESTION_TIME = 20;

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default class QuizzerServer implements Party.Server {
  private state: MultiplayerGameState;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = {
      phase: "lobby",
      currentQuestionIndex: 0,
      questions: [],
      shuffledOptions: [],
      players: [],
      timeLeft: QUESTION_TIME,
      answers: {},
      hostId: "",
      roomId: room.id,
    };
  }

  private broadcast() {
    this.room.broadcast(JSON.stringify({ type: "state", state: this.state }));
  }

  private startQuestionTimer() {
    this.clearTimer();
    this.state.timeLeft = QUESTION_TIME;
    this.timer = setInterval(() => {
      this.state.timeLeft -= 1;
      if (this.state.timeLeft <= 0) {
        this.clearTimer();
        this.revealAnswer();
      } else {
        this.broadcast();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private revealAnswer() {
    this.state.phase = "answer_revealed";
    const question = this.state.questions[this.state.currentQuestionIndex];
    this.state.players = this.state.players.map((player) => {
      const answer = this.state.answers[player.id];
      const isCorrect = answer === question.correct_answer;
      return {
        ...player,
        score: player.score + (isCorrect ? 1 : 0),
      };
    });
    this.broadcast();
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "state", state: this.state }));
  }

  onClose(conn: Party.Connection) {
    this.state.players = this.state.players.filter((p) => p.id !== conn.id);
    if (this.state.hostId === conn.id && this.state.players.length > 0) {
      this.state.hostId = this.state.players[0].id;
      this.state.players[0].isHost = true;
    }
    this.broadcast();
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as ClientMessage;

    if (msg.type === "join") {
      const isFirst = this.state.players.length === 0;
      if (isFirst) this.state.hostId = sender.id;
      const player: Player = {
        id: sender.id,
        name: msg.name,
        score: 0,
        answeredCurrentQuestion: false,
        isHost: isFirst,
      };
      this.state.players = [
        ...this.state.players.filter((p) => p.id !== sender.id),
        player,
      ];
      this.broadcast();
      return;
    }

    if (msg.type === "start" && sender.id === this.state.hostId) {
      this.state.questions = msg.questions;
      this.state.shuffledOptions = msg.shuffledOptions;
      this.state.currentQuestionIndex = 0;
      this.state.phase = "question";
      this.state.answers = {};
      this.state.players = this.state.players.map((p) => ({
        ...p,
        score: 0,
        answeredCurrentQuestion: false,
      }));
      this.broadcast();
      this.startQuestionTimer();
      return;
    }

    if (msg.type === "answer" && this.state.phase === "question") {
      const player = this.state.players.find((p) => p.id === sender.id);
      if (!player || player.answeredCurrentQuestion) return;

      this.state.answers[sender.id] = msg.answer;
      this.state.players = this.state.players.map((p) =>
        p.id === sender.id ? { ...p, answeredCurrentQuestion: true } : p
      );

      const allAnswered = this.state.players.every(
        (p) => p.answeredCurrentQuestion
      );
      if (allAnswered) {
        this.clearTimer();
        this.revealAnswer();
        return;
      }

      this.broadcast();
      return;
    }

    if (msg.type === "next_question" && sender.id === this.state.hostId) {
      const isLast =
        this.state.currentQuestionIndex >= this.state.questions.length - 1;

      if (isLast) {
        this.clearTimer();
        this.state.phase = "ended";
        this.broadcast();
        return;
      }

      this.state.currentQuestionIndex += 1;
      this.state.phase = "question";
      this.state.answers = {};
      this.state.players = this.state.players.map((p) => ({
        ...p,
        answeredCurrentQuestion: false,
      }));
      this.broadcast();
      this.startQuestionTimer();
      return;
    }
  }
}
