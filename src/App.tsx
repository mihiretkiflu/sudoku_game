import React, { useState, useEffect, useCallback, useRef } from "react";
import Grid from "./components/Grid";
import type { Difficulty, SudokuBoard, SudokuCell } from "./utils/types";
import NumberPad from "./components/NumberPad";
import SudokuGenerator from "./utils/sudokuGenerator";

// Type for individual change delta
type ChangeDelta = {
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
  oldMiniGrid?: number[];
  newMiniGrid?: number[];
};

type ChangeGroup = ChangeDelta[];
const difficulties: Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
  "extreme",
];

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [originalBoard, setOriginalBoard] = useState<SudokuBoard>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null); // Allow null for no selection
  const selectedCellRef = useRef<{ row: number; col: number } | null>(null);
  const [pencilMode, setPencilMode] = useState(false);
  const [availableDigits, setAvailableDigits] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  const [undoHistory, setUndoHistory] = useState<ChangeGroup[]>([]);
  const [redoHistory, setRedoHistory] = useState<ChangeGroup[]>([]);
  const [mistake, setMistake] = useState(0);
  const togglePencilMode = () => {
    setPencilMode((prev) => !prev);
  };

  const initializeBoard = useCallback((puzzle: SudokuBoard) => {
    const cells = puzzle.map((row) =>
      row.map((value) => ({
        value,
        isFixed: value !== 0,
        isConflict: false,
        isWrong: false,
        miniGrid: [],
      }))
    );
    setBoard([...cells]);
    setOriginalBoard([...puzzle]);
    setUndoHistory([]);
    setRedoHistory([]);
  }, []);

  const generatePuzzle = useCallback((difficulty: Difficulty) => {
    const generator = new SudokuGenerator();
    const { puzzle, solution: sol } = generator.generatePuzzle(difficulty);
    return {
      puzzle2D: puzzle.map((row) => row.map((cell) => cell.value)),
      solution2D: sol,
    };
  }, []);

  useEffect(() => {
    const { puzzle2D, solution2D } = generatePuzzle(difficulty);
    initializeBoard(puzzle2D);
    setSolution([...solution2D]);
  }, [difficulty, initializeBoard, generatePuzzle]);

  const handleCellChange = (row: number, col: number, value: number) => {
    const changeGroup: ChangeGroup = [];
    let a = 0;
    a++;
    console.log("IN___");
    setBoard((prevBoard) => {
      console.log(prevBoard);
      const newBoard = prevBoard.map((r, i) =>
        r.map((cell, j) => {
          if (i === row && j === col) {
            console.log(i, j, a);

            const oldValue = cell.value;
            const oldMiniGrid = [...(cell.miniGrid || [])];
            changeGroup.push({
              row: i,
              col: j,
              oldValue,
              newValue: value,
              oldMiniGrid,
              newMiniGrid: oldMiniGrid,
            });

            if (pencilMode) {
              const updatedMiniGrid = cell.miniGrid || [];
              const newMiniGrid = updatedMiniGrid.includes(value)
                ? updatedMiniGrid.filter((n) => n !== value)
                : [...updatedMiniGrid, value];
              return { ...cell, value: 0, miniGrid: newMiniGrid };
            } else {
              const isConflict = checkConflicts(prevBoard, row, col, value);
              const correctValue = solution[row][col];
              const isWrong = value !== 0 && value !== correctValue;
              if (isWrong) {
                setMistake((prev) => prev + 1);
              }
              return { ...cell, value, isConflict, isWrong, miniGrid: [] };
            }
          }
          if (!pencilMode && value !== 0) {
            const isInSameRow = i === row;
            const isInSameCol = j === col;
            const isInSameSubgrid =
              Math.floor(i / 3) === Math.floor(row / 3) &&
              Math.floor(j / 3) === Math.floor(col / 3);
            if (isInSameRow || isInSameCol || isInSameSubgrid) {
              const oldMiniGrid = [...(cell.miniGrid || [])];
              const newMiniGrid = oldMiniGrid.filter((n) => n !== value);
              if (oldMiniGrid.length !== newMiniGrid.length) {
                changeGroup.push({
                  row: i,
                  col: j,
                  oldValue: cell.value,
                  newValue: cell.value,
                  oldMiniGrid,
                  newMiniGrid,
                });
                return {
                  ...cell,
                  miniGrid: newMiniGrid,
                };
              }
            }
          }
          return cell;
        })
      );
      return newBoard;
    });
    setUndoHistory((prev) => [...prev, changeGroup]);
    setRedoHistory([]);
  };

  const checkConflicts = (
    board: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ): boolean => {
    if (value === 0) return false;
    const subgridRow = Math.floor(row / 3) * 3;
    const subgridCol = Math.floor(col / 3) * 3;
    for (let c = 0; c < 9; c++)
      if (c !== col && board[row][c].value === value) return true;
    for (let r = 0; r < 9; r++)
      if (r !== row && board[r][col].value === value) return true;
    for (let r = subgridRow; r < subgridRow + 3; r++) {
      for (let c = subgridCol; c < subgridCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c].value === value)
          return true;
      }
    }
    return false;
  };

  const handleNumber = (num: number) => {
    if (selectedCell) {
      handleCellChange(selectedCell.row, selectedCell.col, num);
    }
  };

  const handleReset = () => {
    initializeBoard(originalBoard);
  };

  const handleNewGame = () => {
    const { puzzle2D, solution2D } = generatePuzzle(difficulty);
    initializeBoard(puzzle2D);
    setSolution(solution2D);
  };

  const handleKeyEvent = (e: KeyboardEvent) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const num = parseInt(e.key, 10);
    // console.log("input value:", e.key);

    if (e.key === "Backspace" || e.key === " " || e.key === "0") {
      handleCellChange(row, col, 0);
      e.preventDefault();
    } else if (!isNaN(num) && num >= 1 && num <= 9) {
      handleCellChange(row, col, num);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedCell((prev) =>
        prev ? { row: Math.max(0, prev.row - 1), col: prev.col } : null
      );
    } else if (e.key === "ArrowDown") {
      setSelectedCell((prev) =>
        prev ? { row: Math.min(8, prev.row + 1), col: prev.col } : null
      );
    } else if (e.key === "ArrowLeft") {
      setSelectedCell((prev) =>
        prev ? { row: prev.row, col: Math.max(0, prev.col - 1) } : null
      );
    } else if (e.key === "ArrowRight") {
      setSelectedCell((prev) =>
        prev ? { row: prev.row, col: Math.min(8, prev.col + 1) } : null
      );
    }
  };

  useEffect(() => {
    selectedCellRef.current = selectedCell;
  }, [selectedCell]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyEvent);
    return () => document.removeEventListener("keydown", handleKeyEvent);
  }, [selectedCell]);

  useEffect(() => {
    if (board.length === 0) return;
    const newAvailableDigits: number[] = [];
    for (let num = 1; num <= 9; num++) {
      let isNeeded = false;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col].value === 0 || board[row][col].value === null) {
            const isValid = !checkConflicts(board, row, col, num);
            if (isValid) {
              isNeeded = true;
              break;
            }
          }
        }
        if (isNeeded) break;
      }
      if (isNeeded) newAvailableDigits.push(num);
    }
    setAvailableDigits(newAvailableDigits);
  }, [board]);

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const lastGroup = undoHistory[undoHistory.length - 1];
    setUndoHistory((prev) => prev.slice(0, -1));
    setRedoHistory((prev) => [...prev, lastGroup]);

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r, i) =>
        r.map((cell, j) => {
          const change = lastGroup.find(
            (delta) => delta.row === i && delta.col === j
          );
          if (change) {
            const isConflict = checkConflicts(prevBoard, i, j, change.oldValue);
            const correctValue = solution[i][j];
            const isWrong =
              change.oldValue !== 0 && change.oldValue !== correctValue;
            return {
              ...cell,
              value: change.oldValue,
              miniGrid: change.oldMiniGrid || [],
              isConflict,
              isWrong,
            };
          }
          return cell;
        })
      );
      return newBoard;
    });
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const nextGroup = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));
    setUndoHistory((prev) => [...prev, nextGroup]);

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r, i) =>
        r.map((cell, j) => {
          const change = nextGroup.find(
            (delta) => delta.row === i && delta.col === j
          );
          if (change) {
            const isConflict = checkConflicts(prevBoard, i, j, change.newValue);
            const correctValue = solution[i][j];
            const isWrong =
              change.newValue !== 0 && change.newValue !== correctValue;
            return {
              ...cell,
              value: change.newValue,
              miniGrid: change.newMiniGrid || [],
              isConflict,
              isWrong,
            };
          }
          return cell;
        })
      );
      return newBoard;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 text-white p-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-wide flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2l3.09 6.26L19 10l-5 4.87L14.91 19 12 15.74 9.09 19l1.91-4.13L5 10l3.91-1.74L12 2z"
              />
            </svg>
            Sudoku Master
          </h1>
        </div>
        <div className="m-2 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-700">
              Difficulty:
            </span>
            <div className="flex space-x-2">
              {difficulties.map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    difficulty === level
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="p-6 flex flex-col md:flex-row gap-4">
          {/* Game Area */}
          <div className="w-full md:w-2/3">
            <Grid
              board={board}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              pencilMode={pencilMode}
            />
          </div>

          {/* Controls Panel */}
          <div className="w-full md:w-1/3 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flow">
                  <div className="text-lg font-semibold text-gray-600">
                    {" "}
                    Mistakes:
                    <span className="text-lg text-gray-600"> {mistake}/3</span>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-600"></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={togglePencilMode}
                  className={`w-full flex items-center justify-center px-3 py-3 border-radius rounded-full transition-all duration-200 relative pencil-button ${
                    pencilMode
                      ? "on-button bg-gray-200 text-indigo-800 hover:bg-gray-300 border-2 border-indigo-700 "
                      : "off-button bg-gray-200 text-indigo-800 hover:bg-gray-300 border-2 border-transparent"
                  }  active:scale-95 active:shadow-inner active:bg-gray-300`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 30 31"
                    stroke-width="2"
                    stroke="currentColor"
                    className="size-8 ml-0.5 mt-0.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                    />
                  </svg>
                  {/* {pencilMode ? "ON" : "OFF"} */}
                </button>
                <button
                  onClick={handleUndo}
                  className="flex items-center justify-center px-3 py-3 transition-all duration-200 bg-gray-200 text-indigo-800 rounded-full hover:bg-gray-300 border-2 border-transparent active:scale-95 active:shadow-inner active:bg-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-arrow-counterclockwise h-8 w-8"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"
                    />
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466" />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  className="w-full flex items-center justify-center px-3 py-3 transition-all duration-200  bg-gray-200 text-indigo-800 rounded-full hover:bg-gray-300 border-2 border-transparent  active:scale-95 active:shadow-inner active:bg-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-arrow-clockwise  h-8 w-8 "
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
                    />
                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                  </svg>
                </button>
              </div>
              <NumberPad
                onSelect={handleNumber}
                availableDigits={availableDigits}
              />

              <button
                onClick={handleNewGame}
                // className="flex items-center  px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Game
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
