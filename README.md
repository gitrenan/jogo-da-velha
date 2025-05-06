# jogo-da-velha
Jogo da velha da A1 Renan Hillesheim Montibeller/152410662

Código dos jogo da velha
server.js
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



CÓDIGO DO STYLE.CSS
body {
  font-family: Arial, sans-serif;
  background-color: #f2f2f2;
  text-align: center;
  padding: 20px;
}

h1 {
  color: #333;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 10px;
  justify-content: center;
  margin: 20px auto;
}

.cell {
  width: 100px;
  height: 100px;
  font-size: 2.5em;
  background-color: #fff;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
}

.cell:hover {
  background-color: #f0f0f0;
}

#status {
  margin-bottom: 10px;
  font-size: 1.2em;
}

#reset {
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
}

@media (max-width: 500px) {
  .board {
    grid-template-columns: repeat(3, 70px);
  }

  .cell {
    width: 70px;
    height: 70px;
    font-size: 2em;
  }
}




CODIGO DO SCRIPT.JS
const socket = io();

let jogador = '';
let minhaVez = false;

const status = document.getElementById('status');
const botoes = document.querySelectorAll('.cell');
const reiniciarBtn = document.getElementById('reiniciar');

botoes.forEach((botao, index) => {
  botao.addEventListener('click', () => {
    if (minhaVez && botao.textContent === '') {
      socket.emit('jogada', index);
    }
  });
});

reiniciarBtn.addEventListener('click', () => {
  socket.emit('reset');
});

socket.on('init', ({ symbol, isMyTurn }) => {
  jogador = symbol;
  minhaVez = isMyTurn;
  status.textContent = minhaVez
    ? `Você é o jogador ${jogador}. Sua vez!`
    : `Você é o jogador ${jogador}. Espere o outro jogador.`;
});

socket.on('update', ({ board, turn }) => {
  board.forEach((valor, i) => {
    botoes[i].textContent = valor;
  });

  minhaVez = turn === jogador;
  status.textContent = minhaVez
    ? `Você é o jogador ${jogador}. Sua vez!`
    : `Você é o jogador ${jogador}. Espere o outro jogador.`;
});

socket.on('message', (mensagem) => {
  status.textContent = mensagem;
});

socket.on('turno', (ehMinhaVez) => {
  minhaVez = ehMinhaVez;
});






CODIGO DO INDEX.HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jogo da Velha</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Jogo da Velha</h1>

  <div id="status">Aguardando outro jogador...</div>

  <div class="board">
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
    <button class="cell"></button>
  </div>

  <button id="reiniciar">Reiniciar</button>

  <script src="/socket.io/socket.io.js"></script>
  <script src="script.js"></script>
</body>
</html>

