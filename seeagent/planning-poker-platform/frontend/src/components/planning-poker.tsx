"use client";

import { useGameState } from "opp/contexts/GameStateContext";
import JoinGame from "./join-game";
import { GameBoard } from "./game-board";
import { useEffect } from "react";
import { game } from "opp/lib/game";
import { GameState } from "opp/lib/types";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";

interface PlanningPokerProps {
  gameId?: string;
}

export function PlanningPoker({ gameId }: PlanningPokerProps) {
  const { gameState, setGameState } = useGameState();

  const handleGameStateUpdate = (updatedGameState: GameState) => {
    // console.log("handleGameStateUpdate", updatedGameState);
    setGameState(updatedGameState);
  };

  const handleGameError = (error: string) => {
    console.log("handleGameError", error);
    toast.error(error);
  };

  useEffect(() => {
    game.onGameStateUpdate(handleGameStateUpdate);
    game.onGameError(handleGameError);
  }, []);

  return (
    <>
      {!gameState ? <JoinGame gameId={gameId} /> : <GameBoard />}
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
