export enum GameError {
    GAME_NOT_FOUND = "GAME_NOT_FOUND",
    CANNOT_CHANGE_CARD = "CANNOT_CHANGE_CARD",
}

export enum GameAction {
    SET_NAME = 'set-name',
    NEW_GAME = 'new-game',
    JOIN_GAME = 'join-game',
    RESET_GAME = 'reset-game',
    SELECT_CARD = 'select-card',
    FINAL_DECISION = 'final-decision',
    REVEAL_CARDS = 'reveal-cards',
    SET_METADATA = 'set-metadata',
    SET_ESTIMATION_TYPE = 'set-estimation-type',
    NEXT_ROUND = 'next-round',
    SEND_MESSAGE = 'send-message',

    // subscribable actions
    GAME_ERROR = 'game-error',
    GAME_UPDATE = 'game-update',
  }

export const ESTIMATION_TYPE = {
    StoryPoints: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"],
    TShirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
}