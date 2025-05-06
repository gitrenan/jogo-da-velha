const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = [];
let board = ['', '', '', '', '', '', '', '', ''];
let turn = 'X';

io.on('connection', (socket) => {
  if (players.length >= 2) {
    socket.emit('message', 'Sala cheia. Espere alguém sair.');
    return;
  }

  const symbol = players.length === 0 ? 'X' : 'O';
  const player = { id: socket.id, symbol };
  players.push(player);

  socket.emit('init', { symbol, isMyTurn: symbol === turn });
  io.emit('update', { board, turn });

  socket.on('jogada', (index) => {
    if (board[index] === '' && player.symbol === turn) {
      board[index] = turn;
      const winner = verificarVencedor();

      io.emit('update', { board, turn });

      if (winner) {
        io.emit('message', `Jogador ${turn} venceu!`);
      } else if (board.every(cell => cell !== '')) {
        io.emit('message', 'Empate!');
      } else {
        turn = turn === 'X' ? 'O' : 'X';
        atualizarTurnos();
      }
    }
  });

  socket.on('reset', () => {
    board = ['', '', '', '', '', '', '', '', ''];
    turn = 'X';
    io.emit('update', { board, turn });
    atualizarTurnos();
    io.emit('message', 'Novo jogo iniciado!');
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    board = ['', '', '', '', '', '', '', '', ''];
    turn = 'X';
    io.emit('message', 'Jogador desconectado. Jogo reiniciado.');
    io.emit('update', { board, turn });
  });
});

function atualizarTurnos() {
  players.forEach(p => {
    io.to(p.id).emit('turno', p.symbol === turn);
  });
}

function verificarVencedor() {
  const combinacoes = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  return combinacoes.find(([a, b, c]) =>
    board[a] && board[a] === board[b] && board[a] === board[c]
  );
}

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
