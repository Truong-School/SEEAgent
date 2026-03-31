import { io, Socket } from "socket.io-client";
import { GameState, Player } from "./types";

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket;

  private constructor() {
    console.log("connecting: ", process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL!);
    this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL!);
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public getSocket(): Socket {
    return this.socket;
  }
}

const socketManager = SocketManager.getInstance();
const socket = socketManager.getSocket();

export const game = {
  setName: (name: string): Player => {
    socket.emit("set-name", name, "player");

    return {
      id: socket.id!,
      name: name,
      type: "player",
    };
  },

  newGame: (): void => {
    socket.emit("new-game");
  },

  joinGame: (gameId: string): void => {
    socket.emit("join-game", gameId);
  },

  resetGame: (gameId: string): void => {
    socket.emit("reset-game", gameId);
  },

  selectCard: (gameId: string, value: string): void => {
    socket.emit("select-card", gameId, value);
  },

  finalDecision: (gameId: string, value: string): void => {
    socket.emit("final-decision", gameId, value);
  },

  revealCards: (gameId: string): void => {
    socket.emit("reveal-cards", gameId);
  },

  setMetadata: (gameId: string, title: string, description: string): void => {
    socket.emit("set-metadata", gameId, title, description);
  },

  nextRound: (gameId: string): void => {
    socket.emit("next-round", gameId);
  },

  sendMessage: (gameId: string, content: string): void => {
    socket.emit("send-message", gameId, content);
  },

  addAgent: (
    gameId: string,
    role: string,
    systemPrompt: string,
    llmArgs: string,
  ): void => {
    socket.emit("add-agent", gameId, role, systemPrompt, llmArgs);
  },

  setEstimationType: (gameId: string, estimationType: string): void => {
    socket.emit("set-estimation-type", gameId, estimationType);
  },

  onGameStateUpdate: (callback: (gameState: GameState) => void) => {
    socket.on("game-update", callback);
    console.log("game-update");
  },

  onGameError: (callback: (error: string) => void) => {
    socket.on("game-error", callback);
  },

  disconnect: () => {
    socket.disconnect();
  },
};
