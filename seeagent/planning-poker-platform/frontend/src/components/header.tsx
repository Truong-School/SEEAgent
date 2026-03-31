import React from "react";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import router from "next/router";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { AddAgentDialog } from "./add-agent-dialog";

const Header: React.FC = () => {
  const { currentPlayer } = useCurrentPlayer();
  const { gameState } = useGameState();
  const url = new URL(window.location.href);
  const path = router.asPath.split("?")[0]; // Get the current path without query params
  const gameUrl = `${url.origin}${path}${gameState!.id}`;

  const isHost = gameState!.hostId === currentPlayer!.id;

  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      {currentPlayer && (
        <div className="flex items-center space-x-2">
          {/* <Avatar>
            <AvatarFallback>{currentPlayer.name[0]}</AvatarFallback>
          </Avatar> */}
          <span className="font-semibold">Online Planning Poker</span>
        </div>
      )}
      {isHost && (
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Invite 🔗</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-sm font-bold mb-2">
                Copy and share this link:
              </div>
              {gameUrl}
            </PopoverContent>
          </Popover>
          <AddAgentDialog />
        </div>
      )}
    </header>
  );
};

export default Header;
