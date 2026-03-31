import json
import os

from dotenv import load_dotenv

load_dotenv()

from ppa import agent
from ppa import game
from flask import Flask, request, jsonify


def handle_add_agent(game_id, role, system_prompt, llm_args):
  global agents_list
  print(f"Adding agent: {role}")
  
  if llm_args is not None:
    llm_args = json.loads(llm_args)
    
  new_agent = agent.Agent(
    role, 
    system_prompt=system_prompt, 
    game_id=game_id,
    llm_args=llm_args
    )
  agents_list.append(new_agent)

agents_list = []
app = Flask(__name__)

# health check
@app.route('/', methods=['GET'])
def health_check():
  return jsonify({"status": "ok"}), 200

app.add_url_rule('/', 'health_check', health_check)

def main():
    g = game.Game()
    g.on_add_agent(handle_add_agent)

    app.run(host='0.0.0.0', port=5001)

if __name__ == "__main__":
    main()