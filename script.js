class Minesweeper {
    constructor() {
        this.difficulties = {
            beginning: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };

        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.questioned = [];
        this.gameOver = false;
        this.won = false;
        this.explodedMine = null; // Track which mine caused the loss
        this.timerStarted = false;
        this.timerInterval = null;
        this.elapsedTime = 0;
        this.scores = { beginning: [], intermediate: [], expert: [] };

        this.currentDifficulty = 'intermediate';
        this.loadScores();
        this.initGame();
    }

    initGame() {
        const difficulty = this.difficulties[this.currentDifficulty];
        this.rows = difficulty.rows;
        this.cols = difficulty.cols;
        this.totalMines = difficulty.mines;
        this.flaggedCount = 0;
        this.gameOver = false;
        this.won = false;
        this.explodedMine = null; // Reset exploded mine
        this.timerStarted = false;
        this.elapsedTime = 0;
        this.stopTimer();
        this.updateTimerDisplay();
        document.getElementById('bob').classList.remove('show');
        document.getElementById('audrey').classList.remove('show');
        
        // Reset character positions
        document.getElementById('bob').style.left = '';
        document.getElementById('bob').style.top = '';
        document.getElementById('audrey').style.left = '';
        document.getElementById('audrey').style.top = '';

        // Initialize empty board
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.questioned = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));

        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (this.board[row][col] !== 'M') {
                this.board[row][col] = 'M';
                minesPlaced++;
            }
        }

        // Calculate numbers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] !== 'M') {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === 'M') {
                                count++;
                            }
                        }
                    }
                    this.board[r][c] = count;
                }
            }
        }

        this.updateStats();
        this.render();
    }

    reveal(row, col) {
        if (this.gameOver || this.revealed[row][col] || this.flagged[row][col]) return;

        if (!this.timerStarted) {
            this.startTimer();
        }

        this.revealed[row][col] = true;

        if (this.board[row][col] === 'M') {
            this.explodedMine = { row, col }; // Mark this as the exploded mine
            this.endGame(false);
            return;
        }

        if (this.board[row][col] === 0) {
            // Reveal adjacent cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        this.reveal(nr, nc);
                    }
                }
            }
        }

        this.checkWin();
        this.render();
    }

    toggleFlag(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;

        if (this.flagged[row][col]) {
            this.flagged[row][col] = false;
            this.questioned[row][col] = true;
            this.flaggedCount--;
        } else if (this.questioned[row][col]) {
            this.questioned[row][col] = false;
        } else {
            this.flagged[row][col] = true;
            this.flaggedCount++;
        }

        this.updateStats();
        this.render();
    }

    revealAdjacent(row, col) {
        if (this.gameOver || !this.revealed[row][col]) return;

        let flagCount = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.flagged[nr][nc]) {
                    flagCount++;
                }
            }
        }

        if (flagCount === this.board[row][col]) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        this.reveal(nr, nc);
                    }
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.revealed[r][c]) revealedCount++;
            }
        }

        if (revealedCount === this.rows * this.cols - this.totalMines) {
            this.endGame(true);
        }
    }

    flagRemainingMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.flagged[r][c] && this.board[r][c] === 'M') {
                    // Flag mines
                    this.flagged[r][c] = true;
                    this.flaggedCount++;
                }
            }
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.revealed[r][c] && this.board[r][c] === 'M') {
                    // Reveal all unrevealed mines
                    this.revealed[r][c] = true;
                }
            }
        }
    }

    endGame(won) {
        this.gameOver = true;
        this.won = won;
        this.stopTimer();

        if (won) {
            // Flag remaining mines
            this.flagRemainingMines();
            const isNewRecord = this.recordScore();
            
            // Position Audrey over the board center
            this.positionCharacterOverBoard('audrey');
            document.getElementById('audrey').classList.add('show');
            this.triggerFireworks();
            
            if (isNewRecord) {
                this.showNewRecordPopup();
            }
        } else {
            // Reveal all mines and incorrect flags when losing
            this.revealAllMines();
            
            // Position Bob over the board center
            this.positionCharacterOverBoard('bob');
            document.getElementById('bob').classList.add('show');
        }

        this.updateStats();
        this.render();
    }

    triggerFireworks() {
        const container = document.getElementById('fireworks');
        const boardEl = document.getElementById('board');
        const boardRect = boardEl.getBoundingClientRect();
        const centerX = boardRect.left + boardRect.width / 2;
        const centerY = boardRect.top + boardRect.height / 2;
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

        // Create multiple bursts
        for (let burst = 0; burst < 12; burst++) {
            setTimeout(() => {
                for (let i = 0; i < 50; i++) {
                    const angle = (i / 50) * Math.PI * 2;
                    const velocity = 5 + Math.random() * 10;
                    const tx = Math.cos(angle) * velocity * 70;
                    const ty = Math.sin(angle) * velocity * 70;

                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = centerX + 'px';
                    particle.style.top = centerY + 'px';
                    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.setProperty('--tx', tx + 'px');
                    particle.style.setProperty('--ty', ty + 'px');
                    particle.style.animation = `burst ${0.6 + Math.random() * 0.4}s ease-out forwards`;

                    container.appendChild(particle);

                    // Clean up after animation
                    setTimeout(() => particle.remove(), 1000);
                }
            }, burst * 150);
        }
    }

    showNewRecordPopup() {
        const modal = document.getElementById('newRecordModal');
        const messageEl = document.getElementById('newRecordMessage');
        messageEl.textContent = `🎉 New Record! ${this.elapsedTime} seconds! 🎉`;
        modal.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            modal.classList.remove('show');
        }, 5000);
        
        // Also allow clicking to close
        modal.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }

    positionCharacterOverBoard(characterId) {
        const boardEl = document.getElementById('board');
        const characterEl = document.getElementById(characterId);
        
        const boardRect = boardEl.getBoundingClientRect();
        const boardCenterX = boardRect.left + boardRect.width / 2;
        const boardCenterY = boardRect.top + boardRect.height / 2;
        
        characterEl.style.left = boardCenterX + 'px';
        characterEl.style.top = boardCenterY + 'px';
        characterEl.style.transform = 'translate(-50%, -50%)';
    }

    startTimer() {
        this.timerStarted = true;
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        document.getElementById('timer').textContent = this.elapsedTime + 's';
    }

    recordScore() {
        const score = this.elapsedTime;
        const currentBest = this.scores[this.currentDifficulty][0];
        const isNewRecord = !currentBest || score < currentBest;
        
        this.scores[this.currentDifficulty].push(score);
        this.scores[this.currentDifficulty].sort((a, b) => a - b);
        // Keep only top 10
        this.scores[this.currentDifficulty] = this.scores[this.currentDifficulty].slice(0, 10);
        this.saveScores();
        
        return isNewRecord;
    }

    clearRecords() {
        if (confirm('Are you sure you want to clear all records? This cannot be undone.')) {
            this.scores = { beginning: [], intermediate: [], expert: [] };
            this.saveScores();
            this.updateBestScores();
        }
    }

    loadScores() {
        const saved = localStorage.getItem('minesweeperScores');
        if (saved) {
            this.scores = JSON.parse(saved);
        }
    }

    saveScores() {
        localStorage.setItem('minesweeperScores', JSON.stringify(this.scores));
    }

    updateStats() {
        document.getElementById('mineCount').textContent = this.totalMines - this.flaggedCount;
        document.getElementById('flagCount').textContent = this.flaggedCount;
        this.updateBestScores();
    }

    updateBestScores() {
        const scoresEl = document.getElementById('bestScores');
        const bestBeginning = this.scores.beginning[0] ? this.scores.beginning[0] + 's' : '-';
        const bestIntermediate = this.scores.intermediate[0] ? this.scores.intermediate[0] + 's' : '-';
        const bestExpert = this.scores.expert[0] ? this.scores.expert[0] + 's' : '-';

        scoresEl.innerHTML = `B: ${bestBeginning} &nbsp; I: ${bestIntermediate} &nbsp; E: ${bestExpert}<button id="clearRecords" title="Clear all records">🗑️</button>`;
        
        // Re-attach the event listener since we replaced the HTML
        document.getElementById('clearRecords').addEventListener('click', () => {
            this.clearRecords();
        });
    }

    render() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (this.revealed[r][c]) {
                    cell.classList.add('revealed');
                    const value = this.board[r][c];
                    if (value === 'M') {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                        // Check if this is the exploded mine
                        if (this.explodedMine && this.explodedMine.row === r && this.explodedMine.col === c) {
                            cell.classList.add('exploded');
                        }
                    } else if (value > 0) {
                        cell.textContent = value;
                        cell.dataset.mines = value;
                    }
                } else if (this.flagged[r][c]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                } else if (this.questioned[r][c]) {
                    cell.classList.add('questioned');
                    cell.textContent = '?';
                }

                cell.addEventListener('click', (e) => this.handleLeftClick(r, c, e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e, r, c));
                cell.addEventListener('dblclick', (e) => this.handleDoubleClick(r, c, e));

                boardEl.appendChild(cell);
            }
        }
    }

    handleLeftClick(row, col, e) {
        e.preventDefault();
        this.reveal(row, col);
    }

    handleRightClick(e, row, col) {
        e.preventDefault();
        this.toggleFlag(row, col);
    }

    handleDoubleClick(row, col, e) {
        e.preventDefault();
        this.revealAdjacent(row, col);
    }

    changeDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.cleanupFireworks();
        this.initGame();
    }

    cleanupFireworks() {
        const container = document.getElementById('fireworks');
        container.innerHTML = '';
    }
}

// Initialize game
let game = new Minesweeper();

// Track mouse button states for dual-click detection
let leftButtonPressed = false;
let rightButtonPressed = false;

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) leftButtonPressed = true;  // Left button
    if (e.button === 2) rightButtonPressed = true; // Right button

    // Check if both buttons are pressed
    if (leftButtonPressed && rightButtonPressed) {
        const cell = e.target.closest('.cell');
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            game.revealAdjacent(row, col);
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) leftButtonPressed = false;
    if (e.button === 2) rightButtonPressed = false;
});

// Event listeners
document.getElementById('difficulty').addEventListener('change', (e) => {
    game.changeDifficulty(e.target.value);
});

document.getElementById('newGame').addEventListener('click', () => {
    game.cleanupFireworks();
    game.initGame();
});
