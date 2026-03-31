import re
import json

from ppa.constants import PAST_USER_STORIES, REACT_SYSTEM_PROMPT
from ppa.game import Game
from ppa.communication_manager import CommunicationManager
from ppa.action_module import ActionModule
from ppa.short_term_memory import ShortTermMemory
from ppa.long_term_memory import LongTermMemory


class Agent:
    def __init__(
        self,
        name,
        system_prompt,
        game_id=None,
        llm_args={},
        valid_estimations=[1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    ):
        self.name = name
        self.system_prompt = system_prompt
        self.model = llm_args.pop("model")
        self.chat_history = []
        self.estimations = []
        self.llm_args = llm_args
        self.valid_estimations = valid_estimations

        # game setup
        if game_id is not None:
            self.first_chat_of_round = True

            self.game_state = None
            self.game_id = game_id

            self.game = Game()
            self.game.on_game_state_update(self.__handle_update)
            self.game.set_name(self.name)
            self.game.join_game(game_id=self.game_id)

        self.short_term_memory = ShortTermMemory()
        self.long_term_memory = LongTermMemory(
            system_prompt=self.system_prompt, model=self.model
        )
        self.communication_manager = CommunicationManager(self.name)
        self.action_module = ActionModule(self, valid_estimations)

    def __handle_update(self, new_game_state, trigger_action):
        # print(f"Received update: {new_game_state}")

        if self.game_state is None:
            # self.updates.append(new_game_state)
            self.game_state = new_game_state
            self.player_info = [
                p for p in new_game_state["players"] if p["name"] == self.name
            ][0]
            return

        match trigger_action:
            case "set-metadata":  # game start
                self.first_chat_of_round = True

                task_description = (
                    f'Title: {new_game_state["metadata"]["title"]}.\n'
                    + f'Description: {new_game_state["metadata"]["description"]}.'
                )

                actions_description = self.action_module.get_actions_description()
                full_system_prompt = REACT_SYSTEM_PROMPT.format(
                    role_play_prompt=self.system_prompt,
                    actions_description=actions_description,
                    past_user_stories=PAST_USER_STORIES,
                    task_description=task_description,
                )
                self.short_term_memory.setup(full_system_prompt)

            case "next-round":
                # save last round's decisions
                self.first_chat_of_round = True
                self.selected_cards = self.game_state["selectedCards"]
                # print("Selected cards: ", self.selected_cards)
                # pass
            case _:
                pass

        current_player_id = [
            p["id"] for p in new_game_state["players"] if p["name"] == self.name
        ][0]

        if (
            "chatTurn" in new_game_state
            and new_game_state["chatTurn"] == current_player_id
        ):
            if new_game_state["currentRound"] == 1:
                if self.first_chat_of_round:
                    self.first_chat_of_round = False

                    players = [p["name"] for p in new_game_state["players"]]
                    prompt = "Game started. Round: 1. Players: {players}.".format(
                        players=players
                    )

                    new_messages = self.communication_manager.extract_new_messages(
                        new_game_state, len(self.chat_history)
                    )
                    if new_messages:
                        prompt += "\nHere are the messages so far:\n" + "\n".join(
                            new_messages
                        )

                    self.react(prompt)
                else:
                    prompt = "Here are the new chat messages:\n"

                    new_messages = self.communication_manager.extract_new_messages(
                        new_game_state, len(self.chat_history)
                    )
                    if new_messages:
                        prompt += "\n".join(new_messages)

                    estimated_players = self.extract_estimated_players(new_game_state)
                    if estimated_players:
                        # agent should not know the exact points at this stage
                        prompt += "\nThese players have made estimates: " + ",".join(
                            p["name"] for p in estimated_players
                        )

                    self.react(prompt)
                    self.chat_history = new_game_state["messages"]
            else:
                if self.first_chat_of_round:
                    self.first_chat_of_round = False

                    other_considerations = []
                    for p in new_game_state["players"]:
                        if p["name"] == self.name:
                            continue

                        player_selected_card = self.selected_cards.get(p["id"], None)

                        if player_selected_card is None:
                            continue

                        other_considerations.append(
                            {
                                "name": p["name"],
                                "points": player_selected_card,
                            }
                        )
                    prompt = "Round {round} started. Here are the estimation from previous round:\n".format(
                        round=new_game_state["currentRound"]
                    )
                    prompt += "\n".join(
                        [
                            f"{c['name']} estimated {c['points']} points.\n\n"
                            for c in other_considerations
                        ]
                    )

                    self.react(prompt)
                else:
                    new_messages = self.communication_manager.extract_new_messages(
                        new_game_state, len(self.chat_history)
                    )
                    if new_messages:
                        prompt = "Here are the new chat messages:\n" + "\n".join(
                            new_messages
                        )
                    else:
                        prompt = "There are no new chat messages."

                    estimated_players = self.extract_estimated_players(new_game_state)
                    if estimated_players:
                        # agent should not know the exact points at this stage
                        prompt += "\nThese players have made estimates: " + ",".join(
                            p["name"] for p in estimated_players
                        )

                    self.react(prompt)
                    self.chat_history = new_game_state["messages"]

        self.game_state = new_game_state

    def extract_estimated_players(self, game_state):
        # print("Game state: ", game_state)
        estimated_players = []
        for player in game_state["players"]:
            if player["id"] in game_state["selectedCards"]:
                estimated_players.append(
                    {
                        "name": player["name"],
                        "points": game_state["selectedCards"][player["id"]],
                    }
                )
        return estimated_players

    def react(self, prompt):
        self.short_term_memory.append("user", prompt)

        has_take_action = False

        while not has_take_action:
            messages, _ = self.long_term_memory.process(
                chat_history=self.short_term_memory.get_memory(), **self.llm_args
            )
            self.short_term_memory.set_memory(messages)

            response = self.short_term_memory.get_last_message()
            # print(f"Agent response: {response}")

            action_match = re.search(r"Action: (\w+)", response)
            action_input_match = re.search(r"Action Input: ({.*})", response, re.DOTALL)

            if action_match and action_input_match:
                action = action_match.group(1)
                try:
                    action_input = json.loads(action_input_match.group(1))
                except json.JSONDecodeError:
                    action_input = {"error": "Could not parse JSON input"}

                observation, has_take_action = self.action_module.execute_action(
                    action, action_input
                )

                if not has_take_action:
                    self.short_term_memory.append("user", f"Observation: {observation}")
            else:
                # If no valid action found, prompt the agent to provide a valid action
                self.short_term_memory.append(
                    "user",
                    "Observation: No valid action found. Please provide a valid action in the format 'Action: tool_name' followed by 'Action Input: {\"param\": \"value\"}'.",
                )

        return None
