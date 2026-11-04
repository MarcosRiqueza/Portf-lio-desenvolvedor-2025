// --- VARIÁVEIS GLOBAIS ---
const boardElement = document.getElementById('chess-board');
const turnElement = document.getElementById('turn');
const statusElement = document.getElementById('status');
const historyListElement = document.getElementById('history-list');

// Inicializa a biblioteca chess.js
let game = new Chess(); 
let selectedSquare = null;
let gameMode = 'pvp'; // 'pvp' (2 Jogadores) ou 'pve' (Vs Máquina)
let stats = { whiteWins: 0, blackWins: 0 };
let gameTimer = null; // Para o cronômetro
let totalSeconds = 0;
let machineIsThinking = false; // Flag para evitar jogadas duplicadas da máquina

// Mapeamento de peças (usando Unicode)
const pieceMap = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚', // Negras
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'  // Brancas
};

// --- FUNÇÕES DE UTILIDADE ---

function updateDateTime() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('datetime').textContent = now.toLocaleDateString('pt-BR', options);
}
setInterval(updateDateTime, 1000); 
updateDateTime();

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    totalSeconds = 0;
    document.getElementById('timer').textContent = formatTime(totalSeconds);
    
    gameTimer = setInterval(() => {
        if (!game.game_over()) {
            totalSeconds++;
            document.getElementById('timer').textContent = formatTime(totalSeconds);
        } else {
            clearInterval(gameTimer);
        }
    }, 1000);
}


// --- LÓGICA DE RENDERIZAÇÃO E INTERAÇÃO ---

// 4. Cria e Desenha o Tabuleiro
function drawBoard() {
    boardElement.innerHTML = '';
    
    const lastMove = game.history({ verbose: true }).pop();
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const chessSquare = String.fromCharCode('a'.charCodeAt(0) + c) + (8 - r);
            const piece = game.get(chessSquare);

            const isLight = (r + c) % 2 === 0;
            square.classList.add('casa', isLight ? 'branca' : 'preta');
            square.dataset.square = chessSquare;

            // Adiciona a peça
            if (piece) {
                const pieceChar = pieceMap[piece.type];
                const colorClass = piece.color === 'w' ? 'white' : 'black';
                square.innerHTML = `<span class="peca ${colorClass}">${pieceChar}</span>`;
            }

            // Destaca a última jogada
            if (lastMove && (lastMove.from === chessSquare || lastMove.to === chessSquare)) {
                square.classList.add('last-move');
            }

            square.addEventListener('click', handleSquareClick);
            boardElement.appendChild(square);
        }
    }
    updateGameInfo();
}

// 5. Lida com o clique na Casa
function handleSquareClick(event) {
    // Bloqueia cliques se o jogo acabou ou se a máquina estiver jogando
    if (game.game_over() || machineIsThinking) return; 
    
    const squareElement = event.currentTarget;
    const squareName = squareElement.dataset.square;
    const piece = game.get(squareName);

    clearHighlights();

    if (selectedSquare) {
        // --- SEGUNDO CLIQUE: Tenta Mover ---
        tryMove(squareName);
    } 
    
    // Se o movimento não aconteceu ou se é o primeiro clique válido
    if (!selectedSquare) {
        if (piece && piece.color === game.turn()) {
            // --- PRIMEIRO CLIQUE: Seleciona a Peça ---
            selectedSquare = squareName;
            squareElement.classList.add('highlight-select');
            highlightPossibleMoves(squareName);
        }
    }
}

// 6. Tenta realizar o movimento (FUNÇÃO OTIMIZADA PARA PVEM)
function tryMove(targetSquare) {
    const move = {
        from: selectedSquare,
        to: targetSquare,
        promotion: 'q' 
    };

    const result = game.move(move);

    if (result) {
        // Movimento legal!
        selectedSquare = null;
        drawBoard(); 
        updateMoveHistory(result);

        // Verifica o estado do jogo
        if (game.game_over()) {
            updateGameInfo(); 
            clearInterval(gameTimer);
            return;
        }

        // --- CHAMADA DA MÁQUINA CORRIGIDA ---
        if (gameMode === 'pve' && game.turn() === 'b') {
            machineIsThinking = true;
            statusElement.textContent = "Vez: Negras (Máquina pensando...)";
            // Atraso para simular o "pensamento"
            setTimeout(() => {
                makeMachineMove();
                machineIsThinking = false;
            }, 800); 
        }
        // ------------------------------------
    } else {
        // Movimento Ilegal ou Tentativa de Re-seleção
        
        // Limpa o destaque da peça anterior, se houver
        if(selectedSquare) {
             const prevSelected = document.querySelector(`[data-square="${selectedSquare}"]`);
             if(prevSelected) prevSelected.classList.remove('highlight-select');
        }
        selectedSquare = null;
        
        // Tenta selecionar o novo alvo, se for uma peça da cor correta
        const piece = game.get(targetSquare);
        if (piece && piece.color === game.turn()) {
             // Simula o clique para re-selecionar
            const newTarget = document.querySelector(`[data-square="${targetSquare}"]`);
            if(newTarget) newTarget.click();
        }
    }
}

// 7. Destaca os movimentos possíveis
function highlightPossibleMoves(square) {
    const moves = game.moves({ square: square, verbose: true });
    
    moves.forEach(move => {
        const targetSquareElement = document.querySelector(`[data-square="${move.to}"]`);
        if (targetSquareElement) {
            targetSquareElement.classList.add('highlight-move');
        }
    });
}

// 8. Limpa destaques
function clearHighlights() {
    document.querySelectorAll('.casa').forEach(casa => {
        casa.classList.remove('highlight-select', 'highlight-move', 'last-move');
    });
}


// --- LÓGICA DA MÁQUINA (IA) ---

// 9. Movimento da máquina (IA Simples)
function makeMachineMove() {
    const possibleMoves = game.moves();

    if (game.game_over() || possibleMoves.length === 0) return;

    // Escolhe um movimento aleatório (Dificuldade "Fácil")
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const result = game.move(randomMove);
    
    if(result) {
        selectedSquare = null;
        drawBoard();
        updateMoveHistory(result);
        updateGameInfo();
    }
}


// --- ATUALIZAÇÃO DO PAINEL DE INFORMAÇÕES ---

// 10. Atualiza o painel
function updateGameInfo() {
    const turn = game.turn() === 'w' ? 'Brancas' : 'Negras';
    turnElement.textContent = `Vez: ${turn}`;
    
    let statusText = 'Em andamento';
    
    if (game.in_checkmate()) {
        const winner = turn === 'Brancas' ? 'Negras' : 'Brancas';
        statusText = `FIM: ${winner} Venceu por Xeque-Mate!`;
        if (game.turn() === 'w') {
            stats.blackWins++;
        } else {
            stats.whiteWins++;
        }
    } else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
        statusText = 'FIM: Empate por regras do xadrez.';
    } else if (game.in_check()) {
        statusText = 'Em Xeque!';
    }
    
    statusElement.textContent = statusText;
    document.getElementById('score').textContent = `Brancas ${stats.whiteWins} - ${stats.blackWins} Negras`;
}

// 11. Atualiza o histórico
function updateMoveHistory(move) {
    const moveNumber = Math.ceil(game.history().length / 2);
    
    if (game.turn() === 'w') {
        // Se for o lance das Brancas, cria um novo item na lista (a vez já mudou)
        const p = document.createElement('p');
        p.textContent = `${moveNumber}. ${move.san}`;
        historyListElement.appendChild(p);
    } else {
        // Se for o lance das Negras, adiciona à jogada das Brancas
        // Garantimos que haja um elemento para editar
        if (historyListElement.lastElementChild) {
            historyListElement.lastElementChild.textContent += ` ${move.san}`;
        }
    }
    historyListElement.scrollTop = historyListElement.scrollHeight;
}

// --- CONTROLES DO USUÁRIO (EVENTOS) ---

document.getElementById('new-game').addEventListener('click', () => {
    game.reset(); 
    selectedSquare = null;
    historyListElement.innerHTML = '';
    machineIsThinking = false;
    drawBoard();
    startTimer(); 
});

document.getElementById('btn-pvp').addEventListener('click', () => {
    gameMode = 'pvp';
    statusElement.textContent = 'Modo: 2 Jogadores (PvP)';
    document.getElementById('new-game').click();
});

document.getElementById('btn-pve').addEventListener('click', () => {
    gameMode = 'pve';
    statusElement.textContent = 'Modo: Contra Máquina (PvE)';
    document.getElementById('new-game').click();
});

document.getElementById('reset-stats').addEventListener('click', () => {
    stats = { whiteWins: 0, blackWins: 0 };
    updateGameInfo();
});

// --- INICIALIZAÇÃO ---
document.getElementById('new-game').click();