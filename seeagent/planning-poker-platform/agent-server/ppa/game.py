import socketio
import os
import time

class Game:
    def __init__(self):
        self.socket = socketio.Client()
        connected = False
        
        url = os.environ.get('WEBSOCKET_SERVER_URL', 'http://localhost:4001')
        # print(f"Connecting to {url}")
        while not connected:
            try:
                self.socket.connect(url)
                # print(f"Connected to {url}")
                connected = True
            except socketio.exceptions.ConnectionError:
                # print("Connection failed. Retrying in 5 seconds...")
                time.sleep(5)

    def set_name(self, name):
        self.socket.emit('set-name', (name, 'agent'))

        return {
            'id': self.socket.sid,
            'name': name,
            'type': 'agent'
        }

    def new_game(self):
        self.socket.emit('new-game')

    def join_game(self, game_id):
        self.socket.emit('join-game', game_id)

    def reset_game(self, game_id):
        self.socket.emit('reset-game', game_id)

    def select_card(self, game_id, value):
        self.socket.emit('select-card', (game_id, value))

    def final_decision(self, game_id, value):
        self.socket.emit('final-decision', (game_id, value))

    def reveal_cards(self, game_id):
        self.socket.emit('reveal-cards', game_id)

    def set_metadata(self, game_id, title, description):
        self.socket.emit('set-metadata', (game_id, title, description))

    def next_round(self, game_id):
        self.socket.emit('next-round', game_id)

    def send_message(self, game_id, content):
        self.socket.emit('send-message', (game_id, content))

    def on_game_state_update(self, callback):
        # print("subscribing to game-update")
        self.socket.on('game-update', callback)

    def disconnect(self):
        self.socket.disconnect()
        
    # method for server to call
    def on_add_agent(self, callback):
        # print('on_add_agent')
        self.socket.on('add-agent', callback)
