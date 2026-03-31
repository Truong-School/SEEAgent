from typing import List, Dict, Any

class CommunicationManager:
    def __init__(self, agent_name):
        self.agent_name = agent_name

    def extract_new_messages(self, game_state, last_message_index):
        new_messages = []
        for message in game_state.get('messages', [])[last_message_index:]:
            if message.get('name') == self.agent_name:
                continue
            new_messages.append(f"{message.get('name')}: {message.get('content')}")
        return new_messages 