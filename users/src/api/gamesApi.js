import api from "./axios"

// Spin the Wheel API
export const spinWheel = () => api.post("/games/spin")

export const getSpinStatus = () => api.get("/games/spin/status")

// Tic-Tac-Toe API
export const playTicTacToe = (board) => api.post("/games/tictactoe", { board })

export const getTicTacToeStatus = () => api.get("/games/tictactoe/status")
