// --- CONFIGURAZIONE GIOCHI ---
const GAMES_REPO = [
    { 
        id: 'memory', 
        name: 'Memory', 
        instructions: 'Trova le coppie. Velocità e memoria sono tutto!',
        init: startMemoryGame 
    },
    { 
        id: 'word-guess', 
        name: 'Parola Fantasma', 
        instructions: 'Indovina la parola. Le lettere corrette si bloccano in posizione!',
        init: startGhostWordGame 
    },
	{ 
    id: 'blocks', 
    name: 'Color Blocks', 
    instructions: 'Trascina i pezzi sulla griglia. Completa righe o colonne per distruggerle!',
    init: startBlocksGame 
	},
	{ 
    id: 'dungeon-numbers', 
    name: 'Dungeon dei Numeri', 
    instructions: 'Riempi la griglia 4x4. Ogni riga, colonna e quadrato 2x2 deve contenere i numeri da 1 a 4 senza ripetizioni!',
    init: startDungeonNumbers 
}
];

function initDailyGame() {
    const today = new Date();
  //  const dayIndex = today.getDate() % GAMES_REPO.length;
    const dayIndex = 3; // Per test
    const currentGame = GAMES_REPO[dayIndex];

    document.getElementById('game-title').innerText = currentGame.name;
    document.getElementById('game-instructions').innerText = currentGame.instructions;
    
    const record = localStorage.getItem(`best_${currentGame.id}`) || "--";
    document.getElementById('game-stats').innerText = record === "--" ? "--" : record + " pt";

    // Invece di far partire il gioco, mostriamo il pulsante di Start
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/50">
            <div class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <i data-lucide="play" class="w-10 h-10 text-indigo-600 fill-current"></i>
            </div>
            <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Sei pronto?</h2>
            <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-[250px]">Il timer partirà non appena clicchi il tasto qui sotto.</p>
            
            <button onclick="GAMES_REPO[${dayIndex}].init()" class="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 overflow-hidden">
                <span class="relative z-10 flex items-center gap-3 text-lg">
                    INIZIA A GIOCARE <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
        </div>`;
    
    lucide.createIcons();
}
// --- UTILITY: TIMER ---
let startTime;
let timerInterval;

function startGlobalTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = Date.now() - startTime;
        const seconds = Math.floor(delta / 1000);
        const display = document.getElementById('live-timer');
        if (display) display.innerText = seconds + "s";
    }, 1000);
}

// --- LOGICA GIOCO: MEMORY (Semplificata UI) ---
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;

function startMemoryGame() {
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center w-full">
            <div id="live-timer" class="mb-4 text-2xl font-black text-indigo-600 dark:text-indigo-400">0s</div>
            <div id="memory-grid" class="grid grid-cols-4 gap-2 sm:gap-4 p-4 w-full max-w-md mx-auto"></div>
        </div>`;
    
    const icons = ['zap', 'heart', 'anchor', 'coffee', 'sun', 'moon', 'star', 'cloud'];
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);

    matchedPairs = 0;
    clearInterval(timerInterval);
    startGlobalTimer();

    const grid = document.getElementById('memory-grid');
    deck.forEach((icon) => {
        const card = document.createElement('div');
        card.className = "group h-20 sm:h-24 w-full perspective-1000 cursor-pointer";
        card.innerHTML = `
            <div class="relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-xl card-inner" data-icon="${icon}">
                <div class="absolute w-full h-full backface-hidden bg-indigo-600 rounded-xl border-2 border-white/20 flex items-center justify-center text-white">
                    <i data-lucide="help-circle"></i>
                </div>
                <div class="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rotate-y-180 rounded-xl border-4 border-indigo-500 flex items-center justify-center">
                    <i data-lucide="${icon}" class="text-indigo-600"></i>
                </div>
            </div>`;
        card.addEventListener('click', flipMemoryCard);
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function flipMemoryCard() {
    const innerCard = this.querySelector('.card-inner');
    if (lockBoard || innerCard.classList.contains('rotate-y-180') || innerCard === firstCard) return;
    innerCard.classList.add('rotate-y-180');
    if (!hasFlippedCard) { hasFlippedCard = true; firstCard = innerCard; return; }
    secondCard = innerCard;
    checkMemoryMatch();
}

function checkMemoryMatch() {
    const isMatch = firstCard.dataset.icon === secondCard.dataset.icon;
    if (isMatch) {
        matchedPairs++;
        [firstCard, secondCard].forEach(c => c.querySelector('.bg-white').classList.add('bg-emerald-50', 'border-emerald-500'));
        if (matchedPairs === 8) endMemoryGame();
        resetBoard();
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('rotate-y-180');
            secondCard.classList.remove('rotate-y-180');
            resetBoard();
        }, 1000);
    }
}

function resetBoard() { [hasFlippedCard, lockBoard] = [false, false]; [firstCard, secondCard] = [null, null]; }

function endMemoryGame() {
    clearInterval(timerInterval);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(100, 1000 - (timeTaken * 10)); // Formula punti Memory
    saveGameScore('memory', score, `Completato in ${timeTaken}s!`);
}

// --- GIOCO: PAROLA FANTASMA (UI Compatta) ---
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
	const today = new Date(); // <--- MANCAVA QUESTA RIGA
	// Calcola il giorno dell'anno (0-364)
	const start = new Date(today.getFullYear(), 0, 0);
	const diff = today - start;
	const oneDay = 1000 * 60 * 60 * 24;
	const dayOfYear = Math.floor(diff / oneDay);

	// Usa il giorno dell'anno per scegliere la parola
	secretWord = WORDS_DB[dayOfYear % WORDS_DB.length].toUpperCase();    guessedLetters = Array(secretWord.length).fill("_");
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

// --- UTILITY: SALVATAGGIO ---
function saveGameScore(gameId, newScore, msg) {
    const best = localStorage.getItem(`best_${gameId}`) || 0;
    let finalMsg = `${msg}\nPunteggio: ${newScore}`;
    
    if (newScore > best) {
        localStorage.setItem(`best_${gameId}`, newScore);
        finalMsg += "\nNUOVO RECORD PERSONALE! 🏆";
    }
    
    setTimeout(() => {
        alert(finalMsg);
        initDailyGame();
    }, 500);
}

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
            pieceEl.classList.add('opacity-50');
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

let sudokuSolution = [];
let sudokuInitial = [];

function startDungeonNumbers() {
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
            <div id="live-timer" class="text-2xl font-black text-indigo-600 dark:text-indigo-400">0s</div>
            <div id="sudoku-grid" class="grid grid-cols-4 gap-2 p-2 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-inner border-4 border-slate-300 dark:border-slate-700">
            </div>
            <div class="flex gap-2 w-full">
                <button onclick="checkSudoku()" class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95">
                    VERIFICA SOLUZIONE
                </button>
            </div>
        </div>
    `;

    generateSudoku();
    renderSudoku();
    clearInterval(timerInterval);
    startGlobalTimer();
}

function generateSudoku() {
    // Usiamo una generazione deterministica sicura per il 4x4
    // Uno schema base che funziona sempre:
    const base = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1]
    ];
    
    // Per variare, rimescoliamo i numeri (es. tutti gli 1 diventano 3, etc.)
    const mapping = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    sudokuSolution = base.map(row => row.map(val => mapping[val - 1]));
    
    // Creiamo il puzzle nascondendo i numeri
    sudokuInitial = sudokuSolution.map(row => [...row]);
    let hidden = 0;
    while (hidden < 10) { // Nascondiamo 10 numeri per una sfida media
        let r = Math.floor(Math.random() * 4);
        let c = Math.floor(Math.random() * 4);
        if (sudokuInitial[r][c] !== null) {
            sudokuInitial[r][c] = null;
            hidden++;
        }
    }
}

function renderSudoku() {
    const gridEl = document.getElementById('sudoku-grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = sudokuInitial[r][c];
            const cell = document.createElement('div');
            
            // Stile per i bordi dei quadranti 2x2
            const borderClasses = `${c === 1 ? 'border-r-4 border-slate-400' : ''} ${r === 1 ? 'border-b-4 border-slate-400' : ''}`;
            
            if (val !== null) {
                // Cella precompilata (fissa)
                cell.className = `w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-400 font-black text-2xl rounded-lg ${borderClasses}`;
                cell.innerText = val;
            } else {
                // Cella input per l'utente
                cell.className = `w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-2xl rounded-lg shadow-sm ${borderClasses}`;
                const input = document.createElement('input');
                input.type = 'number';
                input.min = 1;
                input.max = 4;
                input.className = 'w-full h-full bg-transparent text-center outline-none focus:ring-2 ring-indigo-500 rounded-lg';
                input.dataset.r = r;
                input.dataset.c = c;
                // Impedisce l'inserimento di più di un numero o numeri errati
                input.oninput = (e) => {
                    if (e.target.value > 4) e.target.value = 4;
                    if (e.target.value < 1) e.target.value = '';
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

    // 1. Popoliamo la griglia corrente con i valori inseriti
    inputs.forEach(input => {
        const r = parseInt(input.dataset.r);
        const c = parseInt(input.dataset.c);
        const val = parseInt(input.value);
        if (!val) isComplete = false;
        currentGrid[r][c] = val || 0;
        // Reset classi errore
        input.parentElement.classList.remove('bg-red-100', 'dark:bg-red-900/30');
    });

    if (!isComplete) {
        alert("Ops! Hai lasciato qualche cella vuota.");
        return;
    }

    // 2. Validazione Logica Reale (non solo confronto con la soluzione)
    let hasErrors = false;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const val = currentGrid[i][j];
            let error = false;

            // Controlla riga
            if (currentGrid[i].filter(v => v === val).length > 1) error = true;
            // Controlla colonna
            if (currentGrid.map(row => row[j]).filter(v => v === val).length > 1) error = true;
            // Controlla quadrante 2x2
            const startR = Math.floor(i / 2) * 2;
            const startC = Math.floor(j / 2) * 2;
            let countInBox = 0;
            for (let r = startR; r < startR + 2; r++) {
                for (let c = startC; c < startC + 2; c++) {
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
        const score = Math.max(100, 2000 - (timeTaken * 15));
        saveGameScore('dungeon-numbers', score, `PERFETTO!\nGriglia risolta correttamente in ${timeTaken}s.`);
    } else {
        alert("C'è un errore di logica! Controlla le celle evidenziate in rosso.");
    }
}