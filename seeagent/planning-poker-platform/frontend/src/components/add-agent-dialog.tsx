import { Button } from "opp/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "opp/components/ui/dialog";
import { Input } from "opp/components/ui/input";
import { Label } from "opp/components/ui/label";
import { Textarea } from "./ui/textarea";
import { useEffect, useState } from "react";
import { game } from "opp/lib/game";
import { useCurrentPlayer, useGameState } from "opp/contexts/GameStateContext";
import { toast } from "sonner";
import { isValidName } from "opp/lib/utils";

const DEFAULT_SYSTEM_PROMPT = `You are a Frontend developer agent.`;

export function AddAgentDialog() {
  const { gameState } = useGameState();
  const { currentPlayer } = useCurrentPlayer();
  const [role, setRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [llmArgs, setLlmArgs] = useState('{ "model": "openai/gpt-4o-mini" }');
  const [open, setOpen] = useState(false);

  const isDisabled = gameState!.currentRound > 0;

  const handleAddAgent = () => {
    const cleanName = role.trim()

    if (cleanName.length === 0) {
      toast.error("Role can't be empty!")
      return;
    }

    if (!isValidName(cleanName)) {
      toast.error("The role is invalid. It should looks like: backend-agent")
      return;
    }

    game.addAgent(
      gameState!.id,
      role,
      systemPrompt,
      llmArgs.replaceAll("\n", ""),
    );
  };

  useEffect(() => {
    if (!open) return;
  }, [open]);

  if (gameState === null || gameState.hostId !== currentPlayer?.id) return;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled} variant="outline">
          Add agent 🤖
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAddAgent();
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Add agent 🤖</DialogTitle>
            <DialogDescription>
              Add autonomous agent to your game. Click &quot;add&quot; when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="system-prompt" className="text-right mt-2">
                System prompt
              </Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="col-span-3"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="llm-args" className="text-right mt-2">
                LLM Args
              </Label>
              <Textarea
                id="llm-args"
                value={llmArgs.toString()}
                onChange={(e) => setLlmArgs(e.target.value)}
                className="col-span-3"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
