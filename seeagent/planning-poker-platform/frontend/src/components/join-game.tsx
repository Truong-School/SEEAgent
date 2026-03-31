import { useState } from "react";
import { Input } from "opp/components/ui/input";
import { Button } from "opp/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "opp/components/ui/card";
import { useCurrentPlayer } from "opp/contexts/GameStateContext";
import { game } from "opp/lib/game";
import { toast } from "sonner";
import { isValidName } from "opp/lib/utils";

interface JoinGameProps {
  gameId?: string;
}

export default function JoinGame({ gameId }: JoinGameProps) {
  const [name, setName] = useState("");
  const { setCurrentPlayer } = useCurrentPlayer();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim()

    if (cleanName.length === 0) {
      toast.error("Name can't be empty!")
      return;
    }

    if (!isValidName(cleanName)) {
      toast.error("The name is invalid. It should looks like: frontend-dev-1")
      return;
    }

    const newPlayer = game.setName(name);
    setCurrentPlayer(newPlayer);

    if (gameId) {
      game.joinGame(gameId);
    } else {
      game.newGame();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Join Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Name
              </label>

              <Input
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
