import React from "react";
import { Player } from "opp/lib/types";
import { useGameState } from "opp/contexts/GameStateContext";
import { cn } from "opp/lib/utils";

interface PlayerProps {
  player: Player;
  selectedCard: string | undefined;
  revealCards: boolean;
}

const PlayerCard: React.FC<PlayerProps> = ({
  player,
  selectedCard,
  revealCards,
}) => {
  const shouldRevealCard = revealCards; // (revealCards || currentPlayer?.id == player.id)

  const { gameState } = useGameState();

  const isHost = player.id == gameState!.hostId;
  const isChatTurn = gameState?.chatTurn == player.id;

  return (
    <div className="flex flex-col items-center space-y-2">
      {selectedCard ? (
        <div className="w-12 h-16 flex items-center justify-center bg-white shadow-md rounded-md text-xl font-bold">
          {shouldRevealCard ? selectedCard : "✅"}
        </div>
      ) : (
        <div
          className={cn(
            "w-12 h-16 flex items-center justify-center bg-white shadow-md rounded-md text-xl font-bold relative",
            isChatTurn && "ring-2 ring-black",
          )}
        >
          {/* {isChatTurn && <BorderBeam size={40} duration={5} />} */}
          ...
        </div>
      )}
      <div className="text-center">
        <div className="font-bold">{player.name}</div>
        {isHost && <div className="text-sm text-gray-400">host</div>}
        {player.type == "agent" && (
          <div className="text-sm text-gray-400">🤖</div>
        )}
        {player.type == "player" && (
          <div className="text-sm text-gray-400">👤</div>
        )}
        {/* {isChatTurn && (
          <div className="text-sm">chat 👆</div>
        )} */}
      </div>
    </div>
  );
};

export default PlayerCard;
