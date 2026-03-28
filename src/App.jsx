import { useState } from "react";
import "./App.css";

const createGrid = (n) => Array.from({ length: n }, () => Array(n).fill(""));

const isPerfectSquare = (n) => Number.isInteger(Math.sqrt(n));

function App() {
  const [size, setSize] = useState(9);
  const [sizeInput, setSizeInput] = useState("9");
  const [grid, setGrid] = useState(() => createGrid(9));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Enter a perfect-square Sudoku size and fill the grid.");

  const handleSizeChange = (event) => {
    const value = event.target.value;
    setSizeInput(value);
    const newSize = parseInt(value, 10);

    if (!Number.isInteger(newSize) || newSize <= 0) {
      setError("Grid size must be a positive integer.");
      setStatus("");
      return;
    }

    if (!isPerfectSquare(newSize)) {
      setError("Grid size must be a perfect square like 4, 9, 16, 25, etc.");
      setStatus("");
      return;
    }

    setSize(newSize);
    setGrid(createGrid(newSize));
    setError("");
    setStatus(`Ready to solve ${newSize} × ${newSize}.`);
  };

  const handleChange = (row, col, value) => {
    const numericValue = parseInt(value, 10);
    const validNumber = /^[0-9]+$/.test(value) && numericValue >= 1 && numericValue <= size;
    if (value === "" || validNumber) {
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = value;
      setGrid(newGrid);
    }
  };

  const blockSize = Math.sqrt(size);

  const cellBorderStyle = (row, col) => {
    const style = {};
    if ((col + 1) % blockSize === 0 && col !== size - 1) {
      style.borderRightWidth = "2px";
    }
    if ((row + 1) % blockSize === 0 && row !== size - 1) {
      style.borderBottomWidth = "2px";
    }
    if (col === 0) {
      style.borderLeftWidth = "2px";
    }
    if (row === 0) {
      style.borderTopWidth = "2px";
    }
    if (col === size - 1) {
      style.borderRightWidth = "2px";
    }
    if (row === size - 1) {
      style.borderBottomWidth = "2px";
    }
    return style;
  };

  const resetGrid = () => {
    setGrid(createGrid(size));
    setError("");
    setStatus(`Grid reset for ${size} × ${size}.`);
  };

  const solveSudoku = async () => {
    if (!isPerfectSquare(size)) {
      setError("Grid size must be a perfect square.");
      setStatus("");
      return;
    }

    setError("");
    setStatus("Solving...");
    const board = grid.map(row => row.map(cell => cell === "" ? 0 : parseInt(cell)));

    const res = await fetch("http://localhost:5000/solve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ board })
    });

    const data = await res.json();

    if (res.ok && data.solved) {
      setGrid(data.board.map(row => row.map(num => num.toString())));
      setStatus("Solved successfully.");
    } else {
      setError(data.error || "No solution found.");
      setStatus("");
    }
  };

  return (
    <div className="app-shell">
      <div className="solver-card">
        <div className="solver-header">
          <div>
            <p className="solver-tag">Sudoku Solver</p>
            <h1 className="solver-title">Better Sudoku UI</h1>
            <p className="solver-description">
              Fill a perfect-square board and solve with responsive styling, clearer controls, and useful status feedback.
            </p>
          </div>
          <div className="size-panel">
            <label className="field-label" htmlFor="size-input">
              Grid size
            </label>
            <input
              id="size-input"
              className="size-input"
              type="number"
              min="1"
              value={sizeInput}
              onChange={handleSizeChange}
              inputMode="numeric"
            />
            <div className="size-note">Current: {size} × {size}</div>
            <button type="button" className="secondary-button" onClick={resetGrid}>
              Reset grid
            </button>
          </div>
        </div>

        <div className="action-row">
          <button type="button" className="primary-button" onClick={solveSudoku}>
            Solve Sudoku
          </button>
          <div className="status-text">{status}</div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="grid-wrapper">
          <div className="sudoku-grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <input
                  key={`${i}-${j}`}
                  className="grid-cell"
                  value={cell}
                  onChange={(e) => handleChange(i, j, e.target.value)}
                  inputMode="numeric"
                  style={cellBorderStyle(i, j)}
                />
              ))
            )}
          </div>
        </div>

        <div className="instructions">
          Use blank cells for unknown values. Supported sizes are perfect squares: 4, 9, 16, 25, etc.
        </div>
      </div>
    </div>
  );
}

export default App;