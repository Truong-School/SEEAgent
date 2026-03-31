import React, { useEffect, useRef, useState } from "react";
import { Button } from "opp/components/ui/button";
import { Input } from "opp/components/ui/input";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import { game } from "opp/lib/game";
import { cn } from "opp/lib/utils";

const ChatBox: React.FC = () => {
  const { gameState } = useGameState();
  const { currentPlayer } = useCurrentPlayer();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, chatTurn } = gameState!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      game.sendMessage(gameState!.id, newMessage);
      setNewMessage("");
    }
  };

  const isChatDisabled = !chatTurn || chatTurn !== currentPlayer!.id;
  const shouldHighlight = !isChatDisabled && gameState!.currentRound > 1;

  return (
    <div className="w-1/3 bg-white border-l flex flex-col">
      {/* <div className="p-4 border-b font-semibold flex justify-between items-center">
        <span>Chat</span>
      </div> */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className="flex items-start space-x-2">
            {/* <Avatar className="h-8 w-8">
              <AvatarFallback>{msg.name[0]}</AvatarFallback>
            </Avatar> */}
            <div>
              <span className="text-sm font-semibold px-2 py-1 bg-gray-300 rounded">
                {msg.name}
              </span>
              <p>
                {msg.content.split("\n").map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex-col">
        <div>
          {shouldHighlight && (
            <div className="mb-4 text-sm">
              It&apos;s your turn to chat! Please give justifications on your
              estimation last round 👇
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Input
            className={cn(shouldHighlight && "ring-2 ring-yellow-500")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isChatDisabled}
          />
          <Button onClick={handleSendMessage} disabled={isChatDisabled}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
