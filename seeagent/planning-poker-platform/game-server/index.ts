require('dotenv').config();

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState, Message, Player } from './types';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import {ESTIMATION_TYPE, GameError} from './constants';
import { GameAction } from './constants';

// Enable CORS for all routes
const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});
const port = process.env.PORT || 4001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server.
http.listen(port, () => console.log(`Listening on port ${port}`));

// Global variables.
let clients: Socket[] = [];
let games: Record<string, GameState> = {};
let players: Record<string, Player> = {};

io.on("connection", (socket: Socket) => {
  console.log("New client connected: ", socket.id);

  registerNewClient(socket);

  socket.on(GameAction.SET_NAME, (value: string, type='player') => {
    console.log(GameAction.SET_NAME, socket.id, value);

    players[socket.id] = {
      id: socket.id,
      name: value,
      type: type,
    };
  });

  socket.on(GameAction.NEW_GAME, () => {
    console.log(GameAction.NEW_GAME, socket.id);

    const gameId = uuidv4();

    games[gameId] = {
      id: gameId,
      hostId: socket.id,
      players: [{
        ...players[socket.id],
        "type": "host",
      }],
      currentRound: 0,
      revealCards: false,
      selectedCards: {},
      estimationType: "StoryPoints",
      messages: [],
      finalDecision: undefined,
      metadata: undefined,
    };

    broadcastGame(gameId, GameAction.NEW_GAME, socket.id);
  });

  socket.on(GameAction.JOIN_GAME, (gameId: string) => {
    console.log(GameAction.JOIN_GAME, socket.id, gameId);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].players.push(players[socket.id]);

    broadcastGame(gameId, GameAction.JOIN_GAME, socket.id);
  });

  socket.on(GameAction.RESET_GAME, (gameId: string) => {
    console.log(GameAction.RESET_GAME, socket.id);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId] = {
      ...games[gameId],
      revealCards: false,
      currentRound: 0,
      selectedCards: {},
      messages: [],
      finalDecision: undefined,
      metadata: undefined,
      chatTurn: undefined
    }

    broadcastGame(gameId, GameAction.RESET_GAME, socket.id);
  });

  socket.on(GameAction.SELECT_CARD, (gameId: string, value: string) => {
    console.log(GameAction.SELECT_CARD, socket.id, gameId, value);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    // Prevent changing card after reveal
    if (games[gameId].revealCards) return emitError(socket, GameError.CANNOT_CHANGE_CARD);

    games[gameId].selectedCards[socket.id] = value

    const player = games[gameId].players.find(p => p.id === socket.id)
    if (games[gameId].chatTurn === player?.id) {
      pickNextPlayer(gameId)
    }

    broadcastGame(gameId, GameAction.SELECT_CARD, socket.id);
  });

  socket.on(GameAction.FINAL_DECISION, (gameId: string, value: string) => {
    console.log(GameAction.FINAL_DECISION, socket.id, gameId, value);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].selectedCards[socket.id] = value

    if (games[gameId].hostId === socket.id) {
      games[gameId].finalDecision = value
    }

    broadcastGame(gameId, GameAction.FINAL_DECISION, socket.id);
  });

  socket.on(GameAction.REVEAL_CARDS, (gameId: string) => {
    console.log(GameAction.REVEAL_CARDS, socket.id, gameId);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].revealCards = true;

    broadcastGame(gameId, GameAction.REVEAL_CARDS, socket.id);
  });

  socket.on(GameAction.SET_ESTIMATION_TYPE, (gameId: string, estimationType: string) => {
    console.log(GameAction.SET_ESTIMATION_TYPE, socket.id, gameId, estimationType);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].estimationType = estimationType

    broadcastGame(gameId, GameAction.SET_ESTIMATION_TYPE, socket.id);
  });

  socket.on(GameAction.SET_METADATA, (gameId: string, title: string, description: string) => {
    console.log(GameAction.SET_METADATA, socket.id, gameId, title, description);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].metadata = {
      title: title,
      description: description
    }
    games[gameId].currentRound = 1
    pickNextPlayer(gameId)

    broadcastGame(gameId, GameAction.SET_METADATA, socket.id);
  });

  socket.on(GameAction.NEXT_ROUND, (gameId: string) => {
    console.log(GameAction.NEXT_ROUND, socket.id, gameId);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    games[gameId].currentRound += 1
    games[gameId].selectedCards = {}
    games[gameId].revealCards = false
    pickNextPlayer(gameId)

    broadcastGame(gameId, GameAction.NEXT_ROUND, socket.id);
  });

  socket.on(GameAction.SEND_MESSAGE, (gameId: string, content: string) => {
    console.log(GameAction.SEND_MESSAGE, socket.id, gameId, content);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    const message: Message = {
      name: players[socket.id].name,
      content: content,
      timestamp: Math.floor(Date.now() / 1000)
    }

    games[gameId].messages.push(message)
    pickNextPlayer(gameId)

    broadcastGame(gameId, GameAction.SEND_MESSAGE, socket.id);
  });

  socket.on("add-agent", (gameId: string, role: string, system_prompt: string, llg_args) => {
    console.log("add-agent", socket.id, gameId, role, system_prompt, llg_args);
    if (!games[gameId]) return emitError(socket, GameError.GAME_NOT_FOUND);

    broadcastAddAgent(gameId, role, system_prompt, llg_args);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);

    const disconnectedPlayerId = socket.id;

    clients = clients.filter(client => client.id !== disconnectedPlayerId);

    const gameId = findGameWithPlayer(disconnectedPlayerId);
    if (gameId) {
      games[gameId].players = games[gameId].players.filter(p => p.id != disconnectedPlayerId)

      broadcastGame(gameId, "disconnect", socket.id);
    }

    delete players[socket.id];
  });
});

const findGameWithPlayer = (playerId: string) => {
  for (const [gameId, game] of Object.entries(games)) {
    if (game.players.map(p => p.id).includes(playerId)) {
      return gameId;
    }
  }
}

const pickNextPlayer = (gameId: string) => {
  const game = games[gameId]

  if (game.chatTurn === undefined) {
    game.chatTurn = game.players[0].id
    return 
  }

  if (Object.keys(game.selectedCards).length === game.players.length) {
    game.chatTurn = undefined
    return
  }

  const currentPlayerIndex = game.players.findIndex(player => player.id === game.chatTurn)
  let nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length

  while (game.selectedCards[game.players[nextPlayerIndex].id] !== undefined) {
    nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length
  }

  game.chatTurn = game.players[nextPlayerIndex].id
}

const emitError = (socket: Socket, message: string) => {
  socket.emit(GameAction.GAME_ERROR, message);
}

const registerNewClient = (socket: Socket) => {
  clients.push(socket);
}

const broadcastGame = (gameId: string, triggerAction?: string, socketId?: string) => {
  const playerIds = games[gameId].players.map(player => player.id)

  clients.filter(client => playerIds.includes(client.id)).forEach(client => {
    client.emit(GameAction.GAME_UPDATE, games[gameId], triggerAction);
    console.log(GameAction.GAME_UPDATE, games[gameId], triggerAction)
  });
}

// TODO: scope this down to only the python-server clients
const broadcastAddAgent = (gameId: string, role: string, system_prompt: string, llg_args: string) => {
  clients.forEach(client => {
    client.emit('add-agent', gameId, role, system_prompt, llg_args);
  });
}
