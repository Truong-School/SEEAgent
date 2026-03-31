import React from "react";
import { game } from "opp/lib/game";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import PointCard from "opp/components/point-card";
import { ESTIMATION_TYPE } from "opp/lib/constants";

export function EstimationOptions() {
  const { gameState } = useGameState();
  const { currentPlayer } = useCurrentPlayer();

  const cards = ESTIMATION_TYPE.StoryPoints;

  const handleCardSelect = (value: string) => {
    game.selectCard(gameState!.id, value);
  };

  const selectedCardValue = gameState!.selectedCards[currentPlayer!.id];

  return (
    <>
      {gameState!.currentRound != 0 && (
        <footer className="bg-white border-t p-4">
          <div>
            <div className="text-sm flex items-start justify-center pb-2">
              <span>Choose your card 👇</span>
            </div>
            <div className="flex justify-center space-x-2">
              {cards.map((card) => (
                <PointCard
                  key={card}
                  selected={selectedCardValue === card}
                  value={card}
                  onSelect={() => handleCardSelect(card)}
                />
              ))}
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
