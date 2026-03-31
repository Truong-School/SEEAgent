export interface Message {
  name: string;
  content: string;
  timestamp: number;
}

export interface GameState {
  id: string;
  hostId: string;
  currentRound: number;
  players: Player[];
  revealCards: boolean;
  selectedCards: Record<string, string>;
  finalDecision?: string;
  messages: Message[];
  metadata?: {
    title: string;
    description: string;
  };
  chatTurn?: string;
}

export interface Player {
  id: string;
  name: string;
  type: "player" | "agent" | "host";
}
