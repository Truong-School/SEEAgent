import React from "react";
import { Button } from "opp/components/ui/button";
import { Coffee } from "lucide-react";

interface PointCardProps {
  value: string;
  selected: boolean;
  onSelect: () => void;
}

const PointCard: React.FC<PointCardProps> = ({ value, selected, onSelect }) => {
  // const { gameState } = useGameState()
  // const { currentPlayer } = useCurrentPlayer()

  // no need to disable card, for now
  const shouldDisableCard = false; // !!gameState?.selectedCards[currentPlayer!.id]

  return (
    <Button
      variant={selected ? "default" : "outline"}
      className="w-12 h-16"
      onClick={onSelect}
      disabled={shouldDisableCard}
    >
      {value === "☕" ? <Coffee className="h-6 w-6" /> : value}
    </Button>
  );
};

export default PointCard;
