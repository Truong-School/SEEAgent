"use client";

import React, { useEffect, useRef } from "react";
import ChatBox from "opp/components/chat-box";
import Header from "opp/components/header";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import GameTable from "opp/components/game-table";
import { EstimationOptions } from "opp/components/estimation-options";
import UserStoriesSidebar from "./user-stories-sidebar";
import { GameState } from "opp/lib/types";
import { toast } from "sonner";

export function GameBoard() {
  const { gameState } = useGameState();
  const { currentPlayer } = useCurrentPlayer();
  const prevGameState = useRef<GameState | null>(null);

  useEffect(() => {
    if (
      gameState &&
      "chatTurn" in gameState &&
      gameState["chatTurn"] === currentPlayer?.id &&
      (!prevGameState.current ||
        prevGameState.current["chatTurn"] !== currentPlayer?.id)
    ) {
      toast.info("It's your turn!", {
        description:
          "You can either chat using the bottom right box or make an estimation.",
        duration: 5000,
      });
    }

    prevGameState.current = gameState;
  }, [gameState]);

  if (!gameState || !currentPlayer) return <>Loading...</>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />

      <main className="flex flex-1 flex-row overflow-hidden">
        <UserStoriesSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col gap-8 flex-1 p-6 overflow-y-auto items-center">
            <GameTable />
          </div>
          <EstimationOptions />
        </div>

        <ChatBox />
      </main>
    </div>
  );
}
