import React, { useState } from "react";
import { Button } from "opp/components/ui/button";
import PlayerCard from "opp/components/player-card";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import { game } from "opp/lib/game";
import Markdown from "react-markdown";
import { ESTIMATION_TYPE } from "opp/lib/constants";
import { userStories, UserStory } from "opp/lib/stories";

const GameTable: React.FC = () => {
  const getDescriptionWithAcceptanceCriteria = (story: UserStory) => {
    return `${story.description}\n\nAcceptance Criteria:\n${story.acceptanceCriteria.map((criteria) => `- ${criteria}`).join("\n")}`;
  };

  const backlogUserStories = userStories.filter((story) => story.isBacklog);

  const { gameState } = useGameState();
  const { currentPlayer } = useCurrentPlayer();
  const [title, setTitle] = useState(backlogUserStories[0].specificTitle);
  const [description, setDescription] = useState(
    getDescriptionWithAcceptanceCriteria(backlogUserStories[0]),
  );
  const [selectedStoryId, setSelectedStoryId] = useState(
    backlogUserStories[0].id,
  );
  const [selectedEstimationSystem, setSelectedEstimationSystem] =
    useState("StoryPoints");

  if (!gameState) return <>Loading...</>;

  const startNewRound = () => {
    game.nextRound(gameState.id);
  };

  const revealCards = () => {
    game.revealCards(gameState.id);
  };

  const setMetadata = () => {
    game.setMetadata(gameState.id, title, description);
  };

  const resetGame = () => {
    game.resetGame(gameState.id);
  };

  const finalDecision = (value: string) => {
    game.finalDecision(gameState.id, value);
  };

  const setEstimationType = () => {
    game.setEstimationType(gameState.id, selectedEstimationSystem);
  };

  const handleStart = () => {
    setEstimationType();

    setTimeout(() => {
      setMetadata();
    }, 500);
  };

  const handleUserStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    const selectedStory = userStories.find((story) => story.id === storyId);
    if (selectedStory) {
      setTitle(selectedStory.specificTitle);
      setDescription(getDescriptionWithAcceptanceCriteria(selectedStory));
    }
  };

  const isHost = currentPlayer!.id == gameState.hostId;
  // const generateInstruction = () => {
  //   if (gameState.finalDecision) {
  //     return "The final decision has been made"
  //   }
  //   if (gameState.currentRound == 0) {
  //     if (isHost) {
  //       return "Set the issue for the game"
  //     }
  //     return "Waiting for the host to set the issue"
  //   } else {
  //     if (gameState.chatTurn == currentPlayer!.id) {
  //       return "It's your turn to chat/select a card"
  //     } else {
  //       return "Waiting for other players to chat/select a card"
  //     }
  //   }
  // }

  const shouldDisableSetIssue =
    !title || !description || gameState.players.length === 1;

  return (
    <>
      <Card className="w-[600px]">
        <CardHeader className="border-b flex-row justify-between">
          <CardTitle className="flex items-center">
            {gameState.finalDecision
              ? "Game Over"
              : gameState.currentRound == 0
                ? "Preparation Round"
                : `Round ${gameState.currentRound}`}
          </CardTitle>
          {/* <CardDescription>
              {generateInstruction()}
            </CardDescription> */}
          {gameState.finalDecision && (
            <span className="font-bold">{gameState.finalDecision} points</span>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {!gameState.metadata &&
            (isHost ? (
              <form>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="user-story">User Story</Label>
                    <Select
                      value={selectedStoryId}
                      onValueChange={handleUserStoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user story" />
                      </SelectTrigger>
                      <SelectContent>
                        {backlogUserStories.map((story) => (
                          <SelectItem key={story.id} value={story.id}>
                            {story.id === "sample"
                              ? "Sample Story"
                              : `Story ${story.id}: ${story.specificTitle}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      type="text"
                      id="title"
                      placeholder="Type the ticket title here."
                      value={title}
                      required
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="framework">Description</Label>
                    <Textarea
                      placeholder="Type the ticket description here."
                      value={description}
                      required
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="framework">Estimation system</Label>
                    <Select
                      value={selectedEstimationSystem}
                      onValueChange={setSelectedEstimationSystem}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select one" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(ESTIMATION_TYPE).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                        {/*<SelectItem value="dark">Dark</SelectItem>*/}
                        {/*<SelectItem value="system">System</SelectItem>*/}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-sm text-center italic">
                Waiting for the host to start the game...
              </div>
            ))}
          {gameState.currentRound != 0 && (
            <div className="grid w-full items-center gap-2">
              <div className="flex flex-col space-y-1.5">
                <span className="font-bold text-lg">
                  {gameState.metadata?.title}
                </span>
              </div>
              <div className="flex flex-col space-y-1.5 markdown">
                {/* <span className="text-base">{gameState.metadata?.description}</span> */}
                <Markdown>{gameState.metadata?.description}</Markdown>
              </div>
            </div>
          )}
        </CardContent>
        {isHost && (
          <CardFooter className="flex justify-between">
            <Button variant="destructive" onClick={resetGame}>
              Reset
            </Button>
            <div></div>
            <div className="space-x-4">
              {gameState.currentRound == 0 ? (
                <Button disabled={shouldDisableSetIssue} onClick={handleStart}>
                  Start
                </Button>
              ) : (
                <>
                  {gameState.revealCards ? (
                    <>
                      {!gameState.finalDecision && (
                        <>
                          <Button onClick={startNewRound}>
                            Start New Round
                          </Button>
                          <Button
                            onClick={() =>
                              finalDecision(
                                gameState.selectedCards[currentPlayer!.id],
                              )
                            }
                          >
                            Final Decision
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <Button
                      // disabled={Object.keys(gameState.selectedCards).length != gameState.players.length}
                      onClick={revealCards}
                    >
                      Reveal Cards
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
      <div className="grid grid-cols-4 gap-x-4 gap-y-8 items-center">
        {gameState.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            selectedCard={gameState.selectedCards[player.id]}
            revealCards={gameState.revealCards}
          />
        ))}
      </div>
    </>
  );
};

export default GameTable;
