class ShortTermMemory:
    def __init__(self):
        self.memory = []

    def setup(self, system_prompt):
        self.memory = [{"role": "system", "content": system_prompt}]

    def append(self, role, content):
        self.memory.append({"role": role, "content": content})

    def get_memory(self):
        return self.memory

    def set_memory(self, memory):
        self.memory = memory

    def get_last_message(self):
        return self.memory[-1]["content"]
