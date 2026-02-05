// Gestione Selezione Libera
function createGameMenu() {
    const menu = document.getElementById('game-menu');
    if (!menu) return;
    menu.innerHTML = GAMES_REPO.map((game, index) => `
        <button onclick="selectAndInitGame(${index})" id="btn-game-${game.id}" 
            class="game-btn p-3 rounded-xl font-bold text-xs uppercase tracking-tighter border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-500 transition-all bg-white dark:bg-slate-900 shadow-sm">
            ${game.name}
        </button>
    `).join('');
}

function selectAndInitGame(index) {
    const game = GAMES_REPO[index];
    window.currentGameId = game.id;
    
    // Gestione estetica bottoni
// 1. Reset: riportiamo tutti i bottoni allo stato "inattivo"
document.querySelectorAll('.game-btn').forEach(b => {
    // Rimuoviamo le classi dello stato "attivo"
    b.classList.remove('bg-indigo-600', 'bg-indigo-500', 'text-white', 'border-indigo-600', 'border-indigo-700');
    
    // AGGIUNGIAMO esplicitamente le classi dello stato "inattivo"
    b.classList.add('text-slate-500', 'bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-800');
});

// 2. Attivazione: impostiamo lo stato "attivo" sul bottone cliccato
const activeBtn = document.getElementById(`btn-game-${game.id}`);
if (activeBtn) {
    // FONDAMENTALE: Rimuoviamo le classi che mandano in conflitto il colore
    activeBtn.classList.remove('text-slate-500', 'bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-800');
    
    // Ora aggiungiamo quelle dell'evidenziazione
    activeBtn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
}

    // Aggiorna testi interfaccia
    document.getElementById('game-title').innerText = game.name;
    document.getElementById('game-instructions').innerText = game.instructions;
	const lbTitle = document.getElementById('leaderboard-title');
	if (lbTitle) {
		lbTitle.innerHTML = `Campioni della settimana: <span class="text-indigo-500">${game.name}</span>`;
	}
	const record = localStorage.getItem(`best_${game.id}`) || "--";
	const statsEl = document.getElementById('game-stats');
	if (statsEl) {
		statsEl.innerText = record === "--" ? "--" : record + " pt";
	}
    // Mostra schermata di avvio
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-[2rem] shadow-inner">
             <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                <i data-lucide="play" class="w-8 h-8 text-indigo-600 fill-current"></i>
            </div>
            <button onclick="GAMES_REPO[${index}].init()" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-95">
                AVVIA SFIDA
            </button>
        </div>`;
    
    if (window.lucide) lucide.createIcons();
    if (typeof caricaClassifica === "function") caricaClassifica();
}

function initDailyGame() {
    createGameMenu();
    selectAndInitGame(0); 
}



// --- CONFIGURAZIONE GIOCHI ---
const GAMES_REPO = [
    { id: 'memory', name: 'Memory', instructions: 'Trova le coppie. Velocità e memoria sono tutto!', init: startMemoryGame },
    { id: 'word-guess', name: 'Parola Fantasma', instructions: 'Indovina la parola. Le lettere corrette si bloccano!', init: startGhostWordGame },
    { id: 'blocks', name: 'Color Blocks', instructions: 'Completa righe o colonne per distruggerle!', init: startBlocksGame },
    { id: 'dungeon-numbers', name: 'Dungeon dei Numeri', instructions: 'Sudoku 6x6: riempi la griglia correttamente!', init: startDungeonNumbers }
];

// --- UTILITY: TIMER ---
let startTime, timerInterval;

function startGlobalTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = Date.now() - startTime;
        const display = document.getElementById('live-timer');
        if (display) display.innerText = Math.floor(delta / 1000) + "s";
    }, 1000);
}

function saveGameScore(gameId, newScore, msg) {
    alert(msg);
    const oldRecord = localStorage.getItem(`best_${gameId}`) || 0;
    if (newScore > oldRecord) {
        localStorage.setItem(`best_${gameId}`, newScore);
        const stats = document.getElementById('game-stats');
        if (stats) stats.innerText = newScore + " pt";
    }
    if (typeof salvaRecord === "function") salvaRecord(newScore, gameId);
}
// --- GIOCO: MEMORY  ---
let hasFlippedCard, lockBoard, firstCard, secondCard, matchedPairs;

function startMemoryGame() {
    const container = document.getElementById('game-canvas');
    [hasFlippedCard, lockBoard, matchedPairs] = [false, false, 0];
    container.innerHTML = `<div class="flex flex-col items-center w-full"><div id="live-timer" class="mb-4 text-2xl font-black text-indigo-600">0s</div><div id="memory-grid" class="grid grid-cols-4 gap-2 p-4 w-full max-w-md mx-auto"></div></div>`;
    
    const icons = ['zap', 'heart', 'anchor', 'coffee', 'sun', 'moon', 'star', 'cloud'];
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    
    clearInterval(timerInterval);
    startGlobalTimer();

    const grid = document.getElementById('memory-grid');
    deck.forEach(icon => {
        const card = document.createElement('div');
        card.className = "group h-20 sm:h-24 w-full cursor-pointer";
        card.innerHTML = `<div class="relative w-full h-full transition-transform duration-500 transform-style-3d card-inner" data-icon="${icon}">
            <div class="absolute w-full h-full backface-hidden bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i data-lucide="help-circle"></i></div>
            <div class="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rotate-y-180 rounded-xl border-4 border-indigo-500 flex items-center justify-center"><i data-lucide="${icon}" class="text-indigo-600"></i></div>
        </div>`;
        card.onclick = flipMemoryCard;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function flipMemoryCard() {
    const inner = this.querySelector('.card-inner');
    if (lockBoard || inner.classList.contains('rotate-y-180') || inner === firstCard) return;
    inner.classList.add('rotate-y-180');
    if (!hasFlippedCard) { hasFlippedCard = true; firstCard = inner; return; }
    secondCard = inner;
    lockBoard = true;
    if (firstCard.dataset.icon === secondCard.dataset.icon) {
        matchedPairs++;
        if (matchedPairs === 8) endMemoryGame();
        [hasFlippedCard, lockBoard] = [false, false];
    } else {
        setTimeout(() => {
            firstCard.classList.remove('rotate-y-180');
            secondCard.classList.remove('rotate-y-180');
            [hasFlippedCard, lockBoard] = [false, false];
        }, 1000);
    }
}

function endMemoryGame() {
    clearInterval(timerInterval);
    const time = Math.floor((Date.now() - startTime) / 1000);
    saveGameScore('memory', Math.max(100, 1000 - (time * 10)), `Finito in ${time}s!`);
}


// --- GIOCO: PAROLA FANTASMA ---
const WORDS_DB = [
    "STRADA", "CUCINA", "LAVORO", "COMPUTER", "PIZZA", "UFFICIO", "DOMANI", "ESTATE", "VIAGGIO", 
    "PERSONALE", "TESTING", "VERIFICARE", "PROGETTO", "SINTESI", "BATTERIA", "TELEFONO", "LIBRO",
    "ARMADIO", "TEMPERATURA", "VIALE", "PROGRESSO",
    "MONTAGNA", "FINESTRA", "TASTIERA", "SCHERMO", "MATURITA", "AZIENDA", "RIUNIONE", "VACANZA", 
    "STAMPARE", "SQUADRA", "MERCATO", "ENERGIA", "SISTEMA", "MEMORIA", "TRAFFICO", "CANCELLO", 
    "OPPORTUNO", "MESSAGGIO", "SVILUPPO", "DOCUMENTO", "GIORNATA", "INTERNET", "SOLUZIONE", 
    "SCRIVANIA", "PALESTRA", "CONCERTO", "POLTRONA", "QUALITA", "REAZIONE", "ALBERGO", 
    "ORIZZONTE", "UNIVERSO", "CITTADINO", "PIANETA", "GIUSTIZIA", "ELEGANZA", "STAZIONE", 
    "DISTANZA", "COLLEGIO", "ARCHIVIO", "STRUTTURA", "PRESENZA", "CONDIZIONE", "PUBBLICO", 
    "CONTROLLO", "AMBIENTE", "ESPERTO", "SCIENZA", "TRAMONTO", "ARTICOLO"
];
let secretWord = "";
let guessedLetters = [];
let wordAttempts = 0;

function startGhostWordGame() {
    const randomIndex = Math.floor(Math.random() * WORDS_DB.length);
    secretWord = WORDS_DB[randomIndex].toUpperCase();
    
    guessedLetters = Array(secretWord.length).fill("_");
    wordAttempts = 0;
    
    clearInterval(timerInterval);
    startGlobalTimer();

    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center w-full max-w-md p-4 gap-6">
            <div id="live-timer" class="text-xl font-bold text-indigo-500">0s</div>
            
            <div id="word-display" class="flex gap-1 sm:gap-2 justify-center w-full overflow-hidden py-4">
                ${renderGhostWord()}
            </div>
            
            <div class="w-full space-y-4">
                <input type="text" id="word-input" autocomplete="off" placeholder="Scrivi parola..." 
                    class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 outline-none focus:border-indigo-500 uppercase font-black text-center text-2xl tracking-tighter shadow-inner">
                
                <button onclick="checkGhostWord()" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">
                    TENTA LA PAROLA
                </button>
            </div>

            <div id="word-feedback" class="text-xs font-black text-slate-400 uppercase tracking-widest">
                Tentativi: 0
            </div>
        </div>`;
    
    // FIX TASTO INVIO
    const inputField = document.getElementById('word-input');
    inputField.focus();
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkGhostWord();
        }
    });
}

function renderGhostWord() {
    // Calcoliamo una larghezza dinamica per non farle andare a capo
    const boxSize = secretWord.length > 8 ? 'w-8 h-10 sm:w-10 sm:h-14' : 'w-10 h-14 sm:w-12 sm:h-16';
    const fontSize = secretWord.length > 8 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl';

    return guessedLetters.map(letter => `
        <div class="${boxSize} flex items-center justify-center bg-white dark:bg-slate-800 border-2 ${letter !== '_' ? 'border-emerald-500 text-emerald-600 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-400'} rounded-lg ${fontSize} font-black transition-all duration-300">
            ${letter !== '_' ? letter : ''}
        </div>`).join('');
}

function checkGhostWord() {
    const input = document.getElementById('word-input');
    const attempt = input.value.trim().toUpperCase();
    if (!attempt) return;
    
    wordAttempts++;
    document.getElementById('word-feedback').innerText = `Tentativi: ${wordAttempts}`;

    let foundSomething = false;
    for (let i = 0; i < secretWord.length; i++) {
        if (attempt[i] === secretWord[i] && guessedLetters[i] === "_") {
            guessedLetters[i] = secretWord[i];
            foundSomething = true;
        }
    }

    document.getElementById('word-display').innerHTML = renderGhostWord();
    input.value = "";

    // Feedback visivo se non si trova nulla
    if (!foundSomething) {
        input.classList.add('animate-pulse', 'border-red-400');
        setTimeout(() => input.classList.remove('animate-pulse', 'border-red-400'), 500);
    }

    if (!guessedLetters.includes("_")) {
        clearInterval(timerInterval);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        // Calcolo Punteggio: 1000 base, -2 per secondo, -20 per tentativo
        const score = Math.max(50, (1000 - (timeTaken * 2)) - (wordAttempts * 20));
        saveGameScore('word-guess', score, `Indovinata! "${secretWord}"\nIn ${wordAttempts} tentativi e ${timeTaken} secondi.`);
    }
}


// GIOCO BLOCCHI

let grid = [];
let pieces = [];
let gameTimer;
let timeLeft = 60;
let currentScore = 0;

const PIECES_TYPES = [
    { shape: [[1,1],[1,1]], color: 'block-type-0' },
    { shape: [[1,1,1]],     color: 'block-type-1' },
    { shape: [[1],[1],[1]], color: 'block-type-2' },
    { shape: [[1,0],[1,1]], color: 'block-type-3' },
    { shape: [[1]],          color: 'block-type-4' }
];

function startBlocksGame() {
    timeLeft = 60;
    currentScore = 0;
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center gap-4 w-full">
            <div class="flex justify-between w-full max-w-md px-2">
                <div id="blocks-timer" class="text-2xl font-black text-red-500">1:00</div>
                <div id="blocks-score" class="text-2xl font-black text-indigo-600">0</div>
            </div>
            <div id="grid-container" class="grid grid-cols-8 gap-1 p-2 bg-slate-200 dark:bg-slate-800 rounded-xl shadow-inner border-4 border-slate-300 dark:border-slate-700"></div>
            <div id="pieces-container" class="flex gap-4 h-24 items-center justify-center mt-4"></div>
        </div>
    `;

    initBlocksGrid();
    generatePieces();
    startCountdown();
}

function startCountdown() {
    clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById('blocks-timer').innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            saveGameScore('blocks', currentScore, `TEMPO SCADUTO!\nPunteggio finale: ${currentScore}`);
        }
    }, 1000);
}

function initBlocksGrid() {
    const gridEl = document.getElementById('grid-container');
    grid = Array(8).fill().map(() => Array(8).fill(0));
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = "w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 rounded-sm";
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // Eventi Drop
            cell.ondragover = (e) => e.preventDefault();
            cell.ondrop = (e) => {
                e.preventDefault();
                const pieceData = JSON.parse(e.dataTransfer.getData("pieceData"));
                placePiece(parseInt(cell.dataset.r), parseInt(cell.dataset.c), pieceData);
            };
            
            gridEl.appendChild(cell);
        }
    }
}

function generatePieces() {
    const container = document.getElementById('pieces-container');
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const pieceIndex = Math.floor(Math.random() * PIECES_TYPES.length);
        const piece = PIECES_TYPES[pieceIndex];
        
        const pieceEl = document.createElement('div');
        pieceEl.className = "p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg cursor-grab active:cursor-grabbing border-2 border-slate-200 dark:border-slate-700 shadow-sm";
        pieceEl.draggable = true;
        
		pieceEl.ondragstart = (e) => {
		e.dataTransfer.setData("pieceData", JSON.stringify({ index: pieceIndex, elId: i }));
			setTimeout(() => pieceEl.classList.add('opacity-50'), 0); // Piccolo delay per il ghost image
		};
		
		pieceEl.ondragend = () => pieceEl.classList.remove('opacity-50');

        const preview = document.createElement('div');
        preview.className = "grid gap-1";
        preview.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, minmax(0, 1fr))`;
        
        piece.shape.forEach(row => {
            row.forEach(cell => {
                const block = document.createElement('div');
                block.className = `w-4 h-4 ${cell ? piece.color : 'bg-transparent'} rounded-sm`;
                preview.appendChild(block);
            });
        });

        pieceEl.appendChild(preview);
        pieceEl.id = `piece-candidate-${i}`;
        container.appendChild(pieceEl);
    }
}

function placePiece(r, c, data) {
    const piece = PIECES_TYPES[data.index];
    const shape = piece.shape;

    // Validazione
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                if (r + i >= 8 || c + j >= 8 || grid[r + i][c + j]) return;
            }
        }
    }

    // Posizionamento
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                grid[r + i][c + j] = 1;
                const cell = document.querySelector(`[data-r="${r+i}"][data-c="${c+j}"]`);
                cell.className = `w-8 h-8 sm:w-10 sm:h-10 rounded-sm ${piece.color}`;
            }
        }
    }

    // Rimuovi pezzo usato
    const usedEl = document.getElementById(`piece-candidate-${data.elId}`);
    if (usedEl) usedEl.remove();

    checkLines();

    if (document.getElementById('pieces-container').children.length === 0) {
        generatePieces();
    }
}

function checkLines() {
    let rToRemove = [];
    let cToRemove = [];

    for (let i = 0; i < 8; i++) {
        if (grid[i].every(v => v === 1)) rToRemove.push(i);
        if (grid.map(row => row[i]).every(v => v === 1)) cToRemove.push(i);
    }

    // Effetto bolle per le righe
    rToRemove.forEach(r => {
        grid[r] = Array(8).fill(0);
        document.querySelectorAll(`[data-r="${r}"]`).forEach(el => {
            if (!el.className.includes('bg-white')) { // Solo se la cella era piena
                createBubbles(el);
            }
            el.className = "w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 rounded-sm";
        });
    });

    // Effetto bolle per le colonne
    cToRemove.forEach(c => {
        for(let r=0; r<8; r++) {
            grid[r][c] = 0;
            const el = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
            if (!el.className.includes('bg-white')) {
                createBubbles(el);
            }
            el.className = "w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 rounded-sm";
        }
    });

    if (rToRemove.length || cToRemove.length) {
        currentScore += (rToRemove.length + cToRemove.length) * 100;
        document.getElementById('blocks-score').innerText = currentScore;
    }
}
function createBubbles(el) {
    const rect = el.getBoundingClientRect();
    const container = document.body;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 8; i++) {
        const bubble = document.createElement('span');
        bubble.className = 'bubble';
        
        // Direzioni casuali per l'esplosione
        const dx = (Math.random() - 0.5) * 100 + 'px';
        const dy = (Math.random() - 0.5) * 100 + 'px';
        
        bubble.style.setProperty('--dx', dx);
        bubble.style.setProperty('--dy', dy);
        bubble.style.backgroundColor = randomColor;
        
        // Posiziona la bolla al centro della cella
        bubble.style.left = (rect.left + rect.width / 2) + 'px';
        bubble.style.top = (rect.top + rect.height / 2) + 'px';
        
        container.appendChild(bubble);
        
        // Rimuovi l'elemento dopo l'animazione
        setTimeout(() => bubble.remove(), 600);
    }
}

// SUDOKU 6x6
let sudokuSolution = [];
let sudokuInitial = [];

function startDungeonNumbers() {
    const container = document.getElementById('game-canvas');
    // Aumentiamo la max-width per far stare la griglia 6x6
    container.innerHTML = `
        <div class="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <div id="live-timer" class="text-2xl font-black text-indigo-600 dark:text-indigo-400">0s</div>
            <div id="sudoku-grid" class="grid grid-cols-6 gap-1 p-2 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-inner border-4 border-slate-300 dark:border-slate-700">
            </div>
            <div class="flex gap-2 w-full">
                <button onclick="checkSudoku()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95">
                    VERIFICA SOLUZIONE
                </button>
            </div>
        </div>
    `;

    generateSudoku6x6();
    renderSudoku6x6();
    clearInterval(timerInterval);
    startGlobalTimer();
}

function generateSudoku6x6() {
    // Schema base per un 6x6 con blocchi 2x3
    // Spostamento riga per riga: 0, 3, 1, 4, 2, 5 (per mantenere l'unicità nei blocchi)
    const base = [
        [1, 2, 3, 4, 5, 6],
        [4, 5, 6, 1, 2, 3],
        [2, 3, 1, 5, 6, 4],
        [5, 6, 4, 2, 3, 1],
        [3, 1, 2, 6, 4, 5],
        [6, 4, 5, 3, 1, 2]
    ];
    
    // Rimescoliamo i numeri per rendere ogni partita diversa
    const mapping = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    sudokuSolution = base.map(row => row.map(val => mapping[val - 1]));
    
    // Creiamo il puzzle nascondendo i numeri (circa il 50% delle celle)
    sudokuInitial = sudokuSolution.map(row => [...row]);
    let hidden = 0;
    while (hidden < 18) { 
        let r = Math.floor(Math.random() * 6);
        let c = Math.floor(Math.random() * 6);
        if (sudokuInitial[r][c] !== null) {
            sudokuInitial[r][c] = null;
            hidden++;
        }
    }
}

function renderSudoku6x6() {
    const gridEl = document.getElementById('sudoku-grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
            const val = sudokuInitial[r][c];
            const cell = document.createElement('div');
            
            // LOGICA BORDI 2x3: 
            // - Bordo destro ogni 3 colonne (c=2)
            // - Bordo inferiore ogni 2 righe (r=1, r=3)
            const hasRightBorder = (c === 2);
            const hasBottomBorder = (r === 1 || r === 3);
            
            const borderClasses = `
                ${hasRightBorder ? 'border-r-4 border-slate-400 dark:border-slate-600' : 'border-r border-slate-300 dark:border-slate-700'} 
                ${hasBottomBorder ? 'border-b-4 border-slate-400 dark:border-slate-600' : 'border-b border-slate-300 dark:border-slate-700'}
            `;
            
            if (val !== null) {
                cell.className = `w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 font-black text-xl ${borderClasses}`;
                cell.innerText = val;
            } else {
                cell.className = `w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-sm ${borderClasses}`;
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'w-full h-full bg-transparent text-center outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/20 transition-colors';
                input.dataset.r = r;
                input.dataset.c = c;
                
                input.oninput = (e) => {
                    let v = e.target.value;
                    if (v > 6) e.target.value = 6;
                    if (v < 1) e.target.value = '';
                };
                cell.appendChild(input);
            }
            gridEl.appendChild(cell);
        }
    }
}

function checkSudoku() {
    const inputs = document.querySelectorAll('#sudoku-grid input');
    const currentGrid = sudokuInitial.map(row => [...row]);
    let isComplete = true;

    inputs.forEach(input => {
        const r = parseInt(input.dataset.r);
        const c = parseInt(input.dataset.c);
        const val = parseInt(input.value);
        if (!val) isComplete = false;
        currentGrid[r][c] = val || 0;
        input.parentElement.classList.remove('bg-red-100', 'dark:bg-red-900/30');
    });

    if (!isComplete) {
        alert("La griglia non è completa!");
        return;
    }

    let hasErrors = false;

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            const val = currentGrid[i][j];
            let error = false;

            // Righe e Colonne
            if (currentGrid[i].filter(v => v === val).length > 1) error = true;
            if (currentGrid.map(row => row[j]).filter(v => v === val).length > 1) error = true;

            // Quadrante 2x3 (2 righe, 3 colonne)
            const startR = Math.floor(i / 2) * 2;
            const startC = Math.floor(j / 3) * 3;
            let countInBox = 0;
            for (let r = startR; r < startR + 2; r++) {
                for (let c = startC; c < startC + 3; c++) {
                    if (currentGrid[r][c] === val) countInBox++;
                }
            }
            if (countInBox > 1) error = true;

            if (error) {
                const input = document.querySelector(`input[data-r="${i}"][data-c="${j}"]`);
                if (input) input.parentElement.classList.add('bg-red-100', 'dark:bg-red-900/30');
                hasErrors = true;
            }
        }
    }

    if (!hasErrors) {
        clearInterval(timerInterval);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const score = Math.max(100, 3000 - (timeTaken * 10));
        saveGameScore('dungeon-numbers', score, `SUDOKU COMPLETATO!\nTempo: ${timeTaken}s`);
    } else {
        alert("Ci sono errori nella griglia. Le celle errate sono evidenziate.");
    }
}