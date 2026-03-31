class Action:
    def __init__(self, name, description, func):
        self.name = name
        self.description = description
        self.func = func

    def call(self, **kwargs):
        return self.func(**kwargs)

class ActionModule:
    def __init__(self, agent, valid_estimations):
        self.agent = agent
        self.valid_estimations = valid_estimations
        self.actions = self._initialize_actions()

    def _initialize_actions(self):
        return [
            Action(
                name="make_estimation",
                description=f"Make an estimation in story points using one of these Fibonacci values: {self.valid_estimations}.",
                func=self._action_make_estimation
            ),
            Action(
                name="chat",
                description="Chat with other teammates. Use this when you need to communicate with other teammates.",
                func=self._action_chat
            ),
        ]

    def get_actions_description(self):
        return "\n".join([
            f"{action.name}{str(self._get_signature(action.func))}: {action.description}" for action in self.actions
        ])

    def _get_signature(self, func):
        import inspect
        return inspect.signature(func)

    def execute_action(self, action_name, action_input):
        for action in self.actions:
            if action.name == action_name:
                try:
                    observation = action.call(**action_input)
                    has_take_action = action_name in ["make_estimation", "chat"]
                    return observation, has_take_action
                except Exception as e:
                    return f"Error executing action {action_name}: {str(e)}", False
        return f"Action {action_name} not found. Available actions: {', '.join([a.name for a in self.actions])}", False

    def _action_chat(self, message):
        self.agent.game.send_message(self.agent.game_id, message)
        return f"Message '{message}' has been sent to the chat."

    def _action_make_estimation(self, points):
        try:
            self.agent.estimations.append(int(points))
            self.agent.game.select_card(self.agent.game_id, self.agent.estimations[-1])
            return f"Estimated story points: {points}"
        except (ValueError, TypeError) as e:
            return f"Error making estimation: {str(e)}" 