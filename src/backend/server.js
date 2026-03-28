const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Sudoku solver helper functions
function isPerfectSquare(n) {
    return Number.isInteger(Math.sqrt(n));
}

function hasNoDuplicates(cells) {
    const seen = new Set();
    for (const value of cells) {
        if (value === 0) continue;
        if (seen.has(value)) return false;
        seen.add(value);
    }
    return true;
}

function normalizeBoard(board) {
    return board.map(row =>
        row.map(value => {
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') return 0;
                const parsed = parseInt(trimmed, 10);
                return Number.isNaN(parsed) ? NaN : parsed;
            }
            return value;
        })
    );
}

function getBoxStart(index, boxSize) {
    return Math.floor(index / boxSize) * boxSize;
}

function isBoardValid(board) {
    const n = board.length;
    if (!Array.isArray(board) || n === 0 || !board.every(row => Array.isArray(row) && row.length === n)) {
        return false;
    }
    if (!isPerfectSquare(n)) {
        return false;
    }

    for (let row = 0; row < n; row++) {
        if (!board[row].every(num => Number.isInteger(num) && num >= 0 && num <= n)) {
            return false;
        }
        if (!hasNoDuplicates(board[row])) {
            return false;
        }
    }

    for (let col = 0; col < n; col++) {
        const column = [];
        for (let row = 0; row < n; row++) {
            column.push(board[row][col]);
        }
        if (!hasNoDuplicates(column)) {
            return false;
        }
    }

    const boxSize = Math.sqrt(n);
    if (!Number.isInteger(boxSize)) {
        return false;
    }

    for (let boxRow = 0; boxRow < boxSize; boxRow++) {
        for (let boxCol = 0; boxCol < boxSize; boxCol++) {
            const startRow = boxRow * boxSize;
            const startCol = boxCol * boxSize;
            const box = [];
            for (let r = 0; r < boxSize; r++) {
                for (let c = 0; c < boxSize; c++) {
                    box.push(board[startRow + r][startCol + c]);
                }
            }
            if (!hasNoDuplicates(box)) {
                return false;
            }
        }
    }

    return true;
}

function canPlace(board, row, col, num) {
    const n = board.length;
    const boxSize = Math.sqrt(n);
    if (!Number.isInteger(boxSize)) return false;

    for (let i = 0; i < n; i++) {
        if (board[row][i] === num || board[i][col] === num) {
            return false;
        }
    }

    const startRow = getBoxStart(row, boxSize);
    const startCol = getBoxStart(col, boxSize);
    for (let r = 0; r < boxSize; r++) {
        for (let c = 0; c < boxSize; c++) {
            if (board[startRow + r][startCol + c] === num) {
                return false;
            }
        }
    }
    return true;
}

function findEmptyCell(board) {
    const n = board.length;
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            if (board[row][col] === 0) {
                return { row, col };
            }
        }
    }
    return null;
}

function solveSudoku(board) {
    const n = board.length;
    if (!isPerfectSquare(n)) return false;

    const empty = findEmptyCell(board);
    if (!empty) {
        return true;
    }

    const { row, col } = empty;
    for (let num = 1; num <= n; num++) {
        if (canPlace(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
                return true;
            }
            board[row][col] = 0;
        }
    }
    return false;
}

// API
app.post('/solve', (req, res) => {
    let board = req.body.board;
    if (!Array.isArray(board)) {
        return res.status(400).json({ solved: false, error: 'Board must be a square matrix.' });
    }

    board = normalizeBoard(board);

    if (!isBoardValid(board)) {
        return res.status(400).json({ solved: false, error: 'Invalid Sudoku grid. The board must be a non-empty perfect-square square matrix with no duplicate values in rows, columns, or boxes.' });
    }

    const boardCopy = board.map(row => [...row]);
    if (solveSudoku(boardCopy)) {
        res.json({ solved: true, board: boardCopy });
    } else {
        res.status(400).json({ solved: false, error: 'No valid solution exists for this Sudoku grid.' });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});