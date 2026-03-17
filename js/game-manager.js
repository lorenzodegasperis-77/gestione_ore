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
    
document.querySelectorAll('.game-btn').forEach(b => {
    b.classList.remove('bg-indigo-600', 'bg-indigo-500', 'text-white', 'border-indigo-600', 'border-indigo-700');
    
    b.classList.add('text-slate-500', 'bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-800');
});

const activeBtn = document.getElementById(`btn-game-${game.id}`);
if (activeBtn) {
    activeBtn.classList.remove('text-slate-500', 'bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-800');
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
    { id: 'memory', name: 'Memory', instructions: 'Una sfida per la mente: scopri le tessere e trova tutte le coppie. In questa sfida la rapidità fa la differenza tra un principiante e un vero campione.', init: startMemoryGame },
    { id: 'word-guess', name: 'Parola Fantasma', instructions: 'Una sfida di intuito: digita le parole per tentare di indovinare la parola segreta. Trova la soluzione, ma attento a non sbagliare. Devi essere veloce e preciso.', init: startGhostWordGame },
    { id: 'blocks', name: 'Color Blocks', instructions: 'Trascina i blocchi colorati sulla griglia per riempire righe o colonne e farle esplodere. Pianifica le tue mosse per distruggere più linee contemporaneamente e sfruttare i bonus combo.', init: startBlocksGame },
    { id: 'dungeon-numbers', name: 'Dungeon dei Numeri', instructions: 'Entra nel dungeon della logica con questo Sudoku 6x6. Riempi ogni cella cosicché ogni riga, colonna e settore 2x3 abbia numeri da 1 a 6 senza ripetizioni nel più breve tempo possibile.', init: startDungeonNumbers },
	{ id: 'mines-easy', name: 'Schiva Meeting (Jr)', instructions: 'Trova tutti gli spazi liberi senza cliccare sui meeting. Clicca col tasto destro (o tieni premuto) per segnare un meeting.', init: () => startMinesGame('easy') },
	{ id: 'mines-medium', name: 'Schiva Meeting (Sr)', instructions: 'La giornata si complica. Più scrivanie, più meeting da evitare.', init: () => startMinesGame('medium') },
	{ id: 'mines-hard', name: 'Schiva Meeting (Mgr)', instructions: 'Livello Manager: il calendario è un campo minato. Sopravvivi alla giornata!', init: () => startMinesGame('hard') }
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
    // Arrotondiamo sempre il punteggio per pulizia
    const finalScore = Math.round(newScore);
    alert(msg);
    
    const oldRecord = localStorage.getItem(`best_${gameId}`) || 0;
    if (finalScore > oldRecord) {
        localStorage.setItem(`best_${gameId}`, finalScore);
        const stats = document.getElementById('game-stats');
        if (stats) stats.innerText = finalScore + " pt";
    }
    if (typeof salvaRecord === "function") salvaRecord(finalScore, gameId);
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
        // --- LOGICA COPPIA TROVATA ---
        matchedPairs++;
        
        // Selezioniamo il retro della carta (quello con l'icona) per entrambe
        const front1 = firstCard.querySelector('.rotate-y-180');
        const front2 = secondCard.querySelector('.rotate-y-180');
        
        // Cambiamo il bordo in verde e l'icona in verde
        [front1, front2].forEach(el => {
            el.classList.remove('border-indigo-500'); // Rimuoviamo il blu
            el.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-900/20'); // Bordo e sfondo verde
            
            const icon = el.querySelector('i');
            if (icon) {
                icon.classList.remove('text-indigo-600');
                icon.classList.add('text-emerald-600'); // Icona verde
            }
        });

        if (matchedPairs === 8) endMemoryGame();
        [hasFlippedCard, lockBoard] = [false, false];
    } else {        setTimeout(() => {
            firstCard.classList.remove('rotate-y-180');
            secondCard.classList.remove('rotate-y-180');
            [hasFlippedCard, lockBoard] = [false, false];
        }, 1000);
    }
}

function endMemoryGame() {
    clearInterval(timerInterval);
	const time = Math.floor((Date.now() - startTime) / 1000);
    // Formula: 2000 base - 25 punti per ogni secondo.
    // Esempio: 40s = 1000pt | 60s = 500pt
    const score = Math.max(100, 2000 - (time * 25));
    saveGameScore('memory', score, `Ottima memoria! Finito in ${time}s.`);
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
let hintCount = 0; // Contatore indizi
let historyWords = []; // Cronologia parole inserite

function startGhostWordGame() {
    const randomIndex = Math.floor(Math.random() * WORDS_DB.length);
    secretWord = WORDS_DB[randomIndex].toUpperCase();
    
    guessedLetters = Array(secretWord.length).fill("_");
    wordAttempts = 0;
	hintCount = 0;
	historyWords =[];
    
    clearInterval(timerInterval);
    startGlobalTimer();

const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center w-full max-w-md p-4 gap-4">
            <div id="live-timer" class="text-xl font-bold text-indigo-500">0s</div>
            
            <div id="word-display" class="flex gap-1 sm:gap-2 justify-center w-full overflow-hidden py-4">
                ${renderGhostWord()}
            </div>
            
            <div class="w-full space-y-3">
                <input type="text" id="word-input" autocomplete="off" placeholder="Scrivi parola..." 
                    class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 outline-none focus:border-indigo-500 uppercase font-black text-center text-2xl tracking-tighter shadow-inner">
                
                <div class="flex gap-2">
                    <button onclick="checkGhostWord()" class="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">
                        TENTA
                    </button>
                    <button onclick="getGhostHint()" class="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 text-xs">
                        INDIZIO
                    </button>
                </div>
            </div>

            <div class="w-full flex justify-between items-center px-2">
                <div id="word-feedback" class="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Errori: 0
                </div>
                <div class="text-[10px] font-bold text-amber-600 uppercase">Indizi: <span id="hint-display">0</span></div>
            </div>

            <div id="word-history" class="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 min-h-[60px] flex flex-wrap gap-2 items-start content-start border border-dashed border-slate-200 dark:border-slate-700">
                <span class="text-[10px] text-slate-400 w-full uppercase font-bold mb-1">Cronologia:</span>
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
    
    // Aggiungi alla cronologia visiva
    updateHistory(attempt);

    let foundSomething = false;
    for (let i = 0; i < secretWord.length; i++) {
        // Se la lettera inserita è corretta nella posizione esatta
        if (attempt[i] === secretWord[i] && guessedLetters[i] === "_") {
            guessedLetters[i] = secretWord[i];
            foundSomething = true;
        }
    }

    // NUOVA LOGICA ERRORE: 
    // Conta come errore (tentativo speso) solo se non è stata indovinata NEMMENO UNA lettera
    if (!foundSomething) {
        wordAttempts++;
        document.getElementById('word-feedback').innerText = `Errori: ${wordAttempts}`;
        input.classList.add('animate-pulse', 'border-red-400');
        setTimeout(() => input.classList.remove('animate-pulse', 'border-red-400'), 500);
    }

    document.getElementById('word-display').innerHTML = renderGhostWord();
    input.value = "";

    if (!guessedLetters.includes("_")) endGameGhost();
}

function getGhostHint() {
    // Trova gli indici delle lettere ancora nascoste
    let hiddenIndices = [];
    guessedLetters.forEach((l, i) => { if (l === "_") hiddenIndices.push(i); });

    if (hiddenIndices.length > 0) {
        hintCount++;
        document.getElementById('hint-display').innerText = hintCount;
        
        const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        guessedLetters[randomIndex] = secretWord[randomIndex];
        
        document.getElementById('word-display').innerHTML = renderGhostWord();
        
        if (!guessedLetters.includes("_")) endGameGhost();
    }
}

function updateHistory(word) {
    const historyContainer = document.getElementById('word-history');
    const badge = document.createElement('span');
    badge.className = "px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-500 uppercase animate-in fade-in zoom-in duration-300";
    badge.innerText = word;
    historyContainer.appendChild(badge);
}

function endGameGhost() {
    clearInterval(timerInterval);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // CALCOLO PUNTEGGIO:
    // 2000 base
    // -10pt per ogni secondo
    // -50pt per ogni ERRORE (parola senza lettere azzeccate)
    // -250pt per ogni INDIZIO usato
    const timeMalus = timeTaken * 10;
    const errorMalus = wordAttempts * 50;
    const hintMalus = hintCount * 250;
    
    const score = Math.max(100, 2000 - timeMalus - errorMalus - hintMalus);
    
    saveGameScore('word-guess', score, `Parola: "${secretWord}"\nErrori: ${wordAttempts} | Indizi: ${hintCount} | Tempo: ${timeTaken}s`);
}

// GIOCO BLOCCHI

let grid = [];
let gameTimer;
let timeLeft = 120;
let currentScore = 0;
let selectedPieceData = null;


const PIECES_TYPES = [
    { id: 0, shape: [[1,1],[1,1]], color: 'block-type-0', weight: 1}, // cubo
    { id: 1, shape: [[1,1,1]],     color: 'block-type-1', weight: 1.2}, // barra
    { id: 2, shape: [[1],[1],[1]], color: 'block-type-2', weight: 1.2}, // barra verticale
    { id: 3, shape: [[1,0],[1,1]], color: 'block-type-3', weight: 1}, // L
    { id: 4, shape: [[1]],          color: 'block-type-4', weight: 1.1}, // punto
    { id: 5, shape: [[1,1,0],[0,1,1]],          color: 'block-type-5', weight: 1}, // Z
    { id: 6, shape: [[0,1,1],[1,1,0]],          color: 'block-type-6', weight: 1}, // S (N)
    { id: 7, shape: [[1,1,1],[0,1,0]],          color: 'block-type-7', weight: 1}, // T
    { id: 8, shape: [[1,0],[1,1],[1,0]],          color: 'block-type-7', weight: 1}, // I-
    { id: 9, shape: [[0,1,0],[1,1,1]],          color: 'block-type-7', weight: 1}, // _|_
    { id: 10, shape: [[1,1,1],[0,1,0]],          color: 'block-type-7', weight: 1}, // T
    { id: 11, shape: [[1,1],[0,1]], color: 'block-type-3', weight: 1}, // -|
    { id: 12, shape: [[1,1],[1,0]], color: 'block-type-3', weight: 1}, // |-
    { id: 13, shape: [[0,1],[1,1]], color: 'block-type-3', weight: 1} // _|

];

function startBlocksGame() {
    timeLeft = 120;
    currentScore = 0;
    selectedPieceData = null;
    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center gap-4 w-full">
            <div class="flex justify-between w-full max-w-md px-2">
                <div id="blocks-timer" class="text-2xl font-black text-red-500">2:00</div>
                <div id="blocks-score" class="text-2xl font-black text-indigo-600">0</div>
            </div>
            <div id="grid-container" class="grid grid-cols-8 gap-1 p-2 bg-slate-200 dark:bg-slate-800 rounded-xl shadow-inner border-4 border-slate-300 dark:border-slate-700"></div>
            <div id="pieces-container" class="flex gap-4 h-32 items-center justify-center mt-4"></div>
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
        const display = document.getElementById('blocks-timer');
        if (display) display.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            endGame("TEMPO SCADUTO!");
        }
    }, 1000);
}

// Funzione per scegliere un pezzo con pesi (probabilità)
function getWeightedRandomPiece() {
    const totalWeight = PIECES_TYPES.reduce((acc, p) => acc + p.weight, 0);
    let random = Math.random() * totalWeight;
    for (const piece of PIECES_TYPES) {
        if (random < piece.weight) return piece;
        random -= piece.weight;
    }
    return PIECES_TYPES[0];
}

function initBlocksGrid() {
    const gridEl = document.getElementById('grid-container');
    grid = Array(8).fill().map(() => Array(8).fill(0));
    gridEl.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            // Aggiungiamo ID univoco per rintracciarla facilmente
            cell.id = `cell-${r}-${c}`;
            cell.className = "w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 rounded-sm cursor-pointer transition-colors";
            
            cell.onclick = () => {
                if (selectedPieceData) {
                    attemptPlacePiece(r, c);
                }
            };
            gridEl.appendChild(cell);
        }
    }
}

function generatePieces() {
    const container = document.getElementById('pieces-container');
    container.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
		const piece = getWeightedRandomPiece();

        const pieceWrapper = document.createElement('div');
        pieceWrapper.id = `piece-wrapper-${i}`;
		pieceWrapper.dataset.pieceJson = JSON.stringify(piece);
        pieceWrapper.className = "p-2 bg-white dark:bg-slate-700 rounded-lg cursor-pointer border-2 border-transparent shadow-sm hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all";
        
        // Creazione anteprima visiva
        const preview = document.createElement('div');
        preview.className = "grid gap-1";
        preview.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, minmax(0, 1fr))`;
        
        piece.shape.forEach(row => {
            row.forEach(cellValue => {
                const block = document.createElement('div');
                block.className = `w-4 h-4 ${cellValue ? piece.color : 'bg-transparent'} rounded-sm`;
                preview.appendChild(block);
            });
        });

        pieceWrapper.onclick = () => {
            document.querySelectorAll('[id^="piece-wrapper-"]').forEach(el => el.classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-500'));
            pieceWrapper.classList.add('border-indigo-500', 'ring-2', 'ring-indigo-500');
            selectedPieceData = { id: i, shape: piece.shape, color: piece.color };
        };

        pieceWrapper.appendChild(preview);
        container.appendChild(pieceWrapper);
    }
	checkGameOver();
}

function checkGameOver() {
    const availableWrappers = [...document.querySelectorAll('[id^="piece-wrapper-"]')].filter(el => el.style.visibility !== 'hidden');
    
    if (availableWrappers.length === 0) return; // Se non ci sono pezzi, non è game over (devono essere generati)

    const hasPossibleMove = availableWrappers.some(wrapper => {
        const piece = JSON.parse(wrapper.dataset.pieceJson);
        return canPieceFit(piece.shape);
    });

    if (!hasPossibleMove) {
        endGame("NESSUNA MOSSA POSSIBILE!");
    }
}

function canPieceFit(shape) {
    for (let r = 0; r <= 8 - shape.length; r++) {
        for (let c = 0; c <= 8 - shape[0].length; c++) {
            let canPlace = true;
            for (let i = 0; i < shape.length; i++) {
                for (let j = 0; j < shape[i].length; j++) {
                    if (shape[i][j] && grid[r + i][c + j] === 1) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }
            if (canPlace) return true;
        }
    }
    return false;
}

function attemptPlacePiece(r, c) {
    const shape = selectedPieceData.shape;

    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                if (r + i >= 8 || c + j >= 8 || grid[r + i][c + j] === 1) {
                    return; // Non si può posizionare
                }
            }
        }
    }

    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                grid[r + i][c + j] = 1;
                const cell = document.getElementById(`cell-${r + i}-${c + j}`);
                cell.className = `w-8 h-8 sm:w-10 sm:h-10 rounded-sm ${selectedPieceData.color} shadow-inner`;
            }
        }
    }

    const usedWrapper = document.getElementById(`piece-wrapper-${selectedPieceData.id}`);
    usedWrapper.style.visibility = 'hidden';
    usedWrapper.onclick = null; // Disabilita click
    
    selectedPieceData = null;

    checkLines();

    const visiblePieces = [...document.querySelectorAll('[id^="piece-wrapper-"]')].filter(el => el.style.visibility !== 'hidden');
    if (visiblePieces.length === 0) {
        generatePieces();
    } else {
		checkGameOver();
	}
}

function endGame(reason) {
    clearInterval(gameTimer);
    saveGameScore('blocks', currentScore, `${reason}\nPunteggio finale: ${currentScore}`);
}

function checkLines() {
    let rToRemove = [];
    let cToRemove = [];

    // Trova righe piene
    for (let r = 0; r < 8; r++) {
        if (grid[r].every(cell => cell === 1)) rToRemove.push(r);
    }
    // Trova colonne piene
    for (let c = 0; c < 8; c++) {
        if (grid.map(row => row[c]).every(cell => cell === 1)) cToRemove.push(c);
    }

    const totalLines = rToRemove.length + cToRemove.length;

    if (totalLines > 0) {
        // Calcolo punteggio con combo
        let multiplier = 1;
        if (totalLines === 2) multiplier = 1.5;
        if (totalLines >= 3) multiplier = 2.5;
        
        currentScore += Math.floor((totalLines * 150) * multiplier);
        document.getElementById('blocks-score').innerText = currentScore;

        // Raccolta celle da svuotare (per evitare conflitti riga/colonna)
        let cellsToClear = new Set();
        rToRemove.forEach(r => {
            for(let c=0; c<8; c++) cellsToClear.add(`${r}-${c}`);
        });
        cToRemove.forEach(c => {
            for(let r=0; r<8; r++) cellsToClear.add(`${r}-${c}`);
        });

        // Esecuzione svuotamento e animazione
        cellsToClear.forEach(coord => {
            const [r, c] = coord.split('-').map(Number);
            const cell = document.getElementById(`cell-${r}-${c}`);
            
            createBubbles(cell); // Effetto particelle
            
            grid[r][c] = 0;
            cell.className = "w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-900 rounded-sm transition-colors";
        });
    }
}

// Funzione Bubbles (rimane invariata, assicurati che sia nel file)
function createBubbles(el) {
    const rect = el.getBoundingClientRect();
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < 6; i++) {
        const bubble = document.createElement('span');
        bubble.className = 'bubble';
        const dx = (Math.random() - 0.5) * 80 + 'px';
        const dy = (Math.random() - 0.5) * 80 + 'px';
        bubble.style.setProperty('--dx', dx);
        bubble.style.setProperty('--dy', dy);
        bubble.style.backgroundColor = randomColor;
        bubble.style.left = (rect.left + rect.width / 2) + 'px';
        bubble.style.top = (rect.top + rect.height / 2) + 'px';
        document.body.appendChild(bubble);
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
        
        // Essendo un Sudoku 6x6, richiede più tempo del memory.
        // Formula: 2000 base - 8 punti per secondo.
        // Esempio: 2 minuti (120s) = 1040pt | 3 minuti (180s) = 560pt
        const score = Math.max(100, 2000 - (timeTaken * 8));
        saveGameScore('dungeon-numbers', score, `Dungeon superato! Tempo: ${timeTaken}s`);
    } else {
        alert("Ci sono errori nella griglia. Le celle errate sono evidenziate.");
    }
}




const MINES_CONFIGS = {
    easy: { id: 'mines-easy', rows: 8, cols: 8, mines: 10, scoreMult: 4 },
    medium: { id: 'mines-medium', rows: 12, cols: 12, mines: 25, scoreMult: 8 },
    hard: { id: 'mines-hard', rows: 14, cols: 14, mines: 40, scoreMult: 15 }
};

let minesState = {
    grid: [],
    revealed: new Set(),
    flags: new Set(),
    gameOver: false,
    config: null
};

function startMinesGame(difficulty) {
    minesState.config = MINES_CONFIGS[difficulty];
    minesState.gameOver = false;
    minesState.revealed.clear();
    minesState.flags.clear();
    minesState.grid = [];

    const container = document.getElementById('game-canvas');
    container.innerHTML = `
        <div class="flex flex-col items-center gap-4 w-full">
            <div class="flex justify-between w-full max-w-md px-4 font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                <div id="mines-count">Meeting: ${minesState.config.mines}</div>
                <div id="live-timer">0s</div>
            </div>
            <div id="mines-grid" class="grid bg-slate-200 dark:bg-slate-800 p-2 rounded-xl shadow-inner border-4 border-slate-300 dark:border-slate-700 mx-auto overflow-auto max-w-full"></div>
        </div>
    `;

    const gridEl = document.getElementById('mines-grid');
    gridEl.style.gridTemplateColumns = `repeat(${minesState.config.cols}, minmax(30px, 1fr))`;

    // Inizializza Griglia Vuota
    for (let r = 0; r < minesState.config.rows; r++) {
        minesState.grid[r] = [];
        for (let c = 0; c < minesState.config.cols; c++) {
            minesState.grid[r][c] = { r, c, isMine: false, neighborCount: 0 };
            const cell = document.createElement('div');
            cell.id = `mine-${r}-${c}`;
            cell.className = "w-8 h-8 sm:w-10 sm:h-10 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-500 font-bold transition-all text-sm";
            
            // Gestione Click Sinistro
            cell.onclick = () => revealCell(r, c);
            
            // Gestione Click Destro (Bandierina)
            cell.oncontextmenu = (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            };

            gridEl.appendChild(cell);
        }
    }

    // Posiziona Meeting casuali
    let placed = 0;
    while (placed < minesState.config.mines) {
        let r = Math.floor(Math.random() * minesState.config.rows);
        let c = Math.floor(Math.random() * minesState.config.cols);
        if (!minesState.grid[r][c].isMine) {
            minesState.grid[r][c].isMine = true;
            placed++;
        }
    }

    // Calcola numeri adiacenti
    for (let r = 0; r < minesState.config.rows; r++) {
        for (let c = 0; c < minesState.config.cols; c++) {
            if (minesState.grid[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (minesState.grid[r + dr]?.[c + dc]?.isMine) count++;
                }
            }
            minesState.grid[r][c].neighborCount = count;
        }
    }

    clearInterval(timerInterval);
    startGlobalTimer();
}

function revealCell(r, c) {
    if (minesState.gameOver || minesState.revealed.has(`${r}-${c}`) || minesState.flags.has(`${r}-${c}`)) return;

    const cell = minesState.grid[r][c];
    const el = document.getElementById(`mine-${r}-${c}`);
    minesState.revealed.add(`${r}-${c}`);

    if (cell.isMine) {
        endMinesGame(false);
        return;
    }

    el.className = "w-8 h-8 sm:w-10 sm:h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black shadow-inner";
    
    if (cell.neighborCount > 0) {
        el.innerText = cell.neighborCount;
        const colors = ['', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 'text-amber-600', 'text-cyan-500', 'text-black', 'text-gray-500'];
        el.classList.add(colors[cell.neighborCount]);
    } else {
        // Espansione automatica se cella vuota
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (minesState.grid[r + dr]?.[c + dc]) revealCell(r + dr, c + dc);
            }
        }
    }

    checkWin();
}

function toggleFlag(r, c) {
    if (minesState.gameOver || minesState.revealed.has(`${r}-${c}`)) return;
    const key = `${r}-${c}`;
    const el = document.getElementById(`mine-${r}-${c}`);

    if (minesState.flags.has(key)) {
        minesState.flags.delete(key);
        el.innerText = "";
    } else {
        minesState.flags.add(key);
        el.innerText = "🚫";
    }
    document.getElementById('mines-count').innerText = `Meeting: ${minesState.config.mines - minesState.flags.size}`;
}

function checkWin() {
    const totalCells = minesState.config.rows * minesState.config.cols;
    if (minesState.revealed.size === totalCells - minesState.config.mines) {
        endMinesGame(true);
    }
}

function endMinesGame(win) {
    minesState.gameOver = true;
    clearInterval(timerInterval);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Rivela tutti i meeting
    for (let r = 0; r < minesState.config.rows; r++) {
        for (let c = 0; c < minesState.config.cols; c++) {
            if (minesState.grid[r][c].isMine) {
                document.getElementById(`mine-${r}-${c}`).innerText = "📅";
                if (!win) document.getElementById(`mine-${r}-${c}`).classList.add('bg-red-200', 'dark:bg-red-900');
            }
        }
    }

    if (win) {
        // Punteggio: (Celle rivelate / Tempo) * Moltiplicatore Difficoltà
        const score = Math.round((5000 / (timeTaken + 1)) * minesState.config.scoreMult);
        saveGameScore(minesState.config.id, score, `GRANDE! Hai schivato tutti i meeting in ${timeTaken}s.\nPunteggio: ${score}`);
    } else {
        alert("Meeting a tradimento! Ti hanno incastrato in una call di 2 ore.");
    }
}
