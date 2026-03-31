import { useRouter } from "next/router";
import { PlanningPoker } from "opp/components/planning-poker";
import { GameProviders } from "opp/contexts/GameStateContext";

export default function GameRoom() {
  const router = useRouter();
  const { gameId } = router.query;

  return (
    <GameProviders>
      <PlanningPoker gameId={gameId as string} />
    </GameProviders>
  );
}
