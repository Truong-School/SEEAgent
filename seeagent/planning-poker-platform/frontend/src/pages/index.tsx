import { PlanningPoker } from "opp/components/planning-poker";
import { GameProviders } from "opp/contexts/GameStateContext";
import { useEffect } from "react";



export default function Home() {
  return (
    <GameProviders>
      <PlanningPoker />
    </GameProviders>
  );
}
