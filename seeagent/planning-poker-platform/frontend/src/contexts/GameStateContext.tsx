import { GameState, Player } from "opp/lib/types";
import React, { createContext, useState, useContext, ReactNode } from "react";

interface GameStateContextType {
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

interface CurrentPlayerContextType {
  currentPlayer: Player | null;
  setCurrentPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

const GameStateContext = createContext<GameStateContextType | undefined>(
  undefined,
);
const CurrentPlayerContext = createContext<
  CurrentPlayerContextType | undefined
>(undefined);

export const GameProviders: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  return (
    <GameStateContext.Provider value={{ gameState, setGameState }}>
      <CurrentPlayerContext.Provider
        value={{ currentPlayer, setCurrentPlayer }}
      >
        {children}
      </CurrentPlayerContext.Provider>
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameProviders");
  }
  return context;
};

export const useCurrentPlayer = () => {
  const context = useContext(CurrentPlayerContext);
  if (context === undefined) {
    throw new Error("useCurrentPlayer must be used within a GameProviders");
  }
  return context;
};
