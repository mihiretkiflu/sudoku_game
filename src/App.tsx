import React, { useState, useEffect, useCallback, useRef } from "react";
import Grid from "./components/Grid";
import type { Difficulty, SudokuBoard, SudokuCell } from "./utils/types";
import NumberPad from "./components/NumberPad";
import SudokuGenerator from "./utils/sudokuGenerator";
import AdPlaceholder from "./components/AdPlaceholder";

// Type for individual change delta
type ChangeDelta = {
  row: number;
  col: number;
  oldValue: number;
  newValue: number;
  oldMiniGrid?: number[];
  newMiniGrid?: number[];
  isPencilChange?: boolean; // Track if this was a pencil change
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
  }>({ row: 0, col: 0 }); 
  const selectedCellRef = useRef<{ row: number; col: number } | null>(null);
  const [pencilMode, setPencilMode] = useState(false);
  const [availableDigits, setAvailableDigits] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  const [undoHistory, setUndoHistory] = useState<ChangeGroup[]>([]);
  const [redoHistory, setRedoHistory] = useState<ChangeGroup[]>([]);
  const [mistake, setMistake] = useState(0);
  const [isWin, setIsWin] = useState(false);
  
  const pencilModeRef = useRef(pencilMode);

  useEffect(() => {
    pencilModeRef.current = pencilMode; 
  }, [pencilMode]);

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
    setMistake(0);
    setIsWin(false);
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
    if (isWin) return;
    
    // Don't allow changing fixed cells
    if (board[row][col].isFixed) return;

    const changeGroup: ChangeGroup = [];
    setBoard((prevBoard) => {
      let error = false;
      const newBoard = prevBoard.map((r, i) =>
        r.map((cell, j) => {
          if (i === row && j === col) {
            const oldValue = cell.value;
            const oldMiniGrid = [...(cell.miniGrid || [])];
            
            // Logic for Pencil Mode
            if (pencilModeRef.current) {
              const updatedMiniGrid = cell.miniGrid || [];
              const newMiniGrid = updatedMiniGrid.includes(value)
                ? updatedMiniGrid.filter((n) => n !== value)
                : [...updatedMiniGrid, value];
              
              changeGroup.push({
                row: i,
                col: j,
                oldValue,
                newValue: oldValue, // Value doesn't change in pencil mode
                oldMiniGrid,
                newMiniGrid,
                isPencilChange: true
              });

              return { ...cell, value: 0, miniGrid: newMiniGrid };
            } else {
              // Regular Mode
              const isConflict = checkConflicts(prevBoard, row, col, value);
              const correctValue = solution[row][col];
              const isWrong = value !== 0 && value !== correctValue;
              error = isWrong;
              
              changeGroup.push({
                row: i,
                col: j,
                oldValue,
                newValue: value,
                oldMiniGrid,
                newMiniGrid: [], 
                isPencilChange: false
              });

              return { ...cell, value, isConflict, isWrong, miniGrid: [] };
            }
          }
           // Auto-remove pencil marks (miniGrid) in the same row/col/subgrid if a real number is placed
          if (!pencilModeRef.current && value !== 0) {
            const isInSameRow = i === row;
            const isInSameCol = j === col;
            const isInSameSubgrid =
              Math.floor(i / 3) === Math.floor(row / 3) &&
              Math.floor(j / 3) === Math.floor(col / 3);
            if (isInSameRow || isInSameCol || isInSameSubgrid) {
              const oldMiniGrid = [...(cell.miniGrid || [])];
              const newMiniGrid = oldMiniGrid.filter((n) => n !== value);
              if (oldMiniGrid.length !== newMiniGrid.length) {
                // We should technically track these side-effects in history too for full undo, 
                // but for simplicity keeping it local for now or adding to changeGroup if we want robust undo.
                 // For this simple implementation, we might skip detailed side-effect undoing or assume regeneration.
                 // Ideally, we'd add these to changeGroup.
                 changeGroup.push({
                   row: i, col: j, oldValue: cell.value, newValue: cell.value, oldMiniGrid, newMiniGrid, isPencilChange: true
                 })
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
      if (error) {
        setMistake((prev) => prev + 1);
      }

      const isBoardComplete = newBoard.every((row) =>
        row.every(
          (cell) =>
            cell.isFixed ||
            (cell.value !== 0 && !cell.isWrong && !cell.isConflict)
        )
      );
      if (isBoardComplete) {
        setIsWin(true);
        setSelectedCell({ row: 0, col: 0 });
      }

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

  const handleKeyEvent = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const num = parseInt(e.key, 10);

    if (e.key === "Backspace" || e.key === " " || e.key === "0") {
      handleCellChange(row, col, 0);
      e.preventDefault();
    } else if (!isNaN(num) && num >= 1 && num <= 9) {
      handleCellChange(row, col, num);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSelectedCell((prev) => ({ row: Math.max(0, prev.row - 1), col: prev.col }));
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      setSelectedCell((prev) => ({ row: Math.min(8, prev.row + 1), col: prev.col }));
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      setSelectedCell((prev) => ({ row: prev.row, col: Math.max(0, prev.col - 1) }));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setSelectedCell((prev) => ({ row: prev.row, col: Math.min(8, prev.col + 1) }));
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
       handleUndo();
       e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
       handleRedo();
       e.preventDefault();
    }
  }, [selectedCell, handleCellChange]); // Added deps but handleCellChange changes often so might be cautious

  // Better keep handleKeyEvent simple or use refs if deps are issue. 
  // Ideally handleCellChange shouldn't change, but it depends on state.
  // Re-attaching listener on every move is okay effectively.

  useEffect(() => {
    selectedCellRef.current = selectedCell;
  }, [selectedCell]);

  useEffect(() => {
    // We need to wrap handleKeyEvent to use the latest state if not using refs perfectly
    // But since we re-bind on [selectedCell], it covers navigation. 
    // For input logic relying on board, handleCellChange uses setState callback which is safe.
    document.addEventListener("keydown", handleKeyEvent);
    return () => document.removeEventListener("keydown", handleKeyEvent);
  }, [handleKeyEvent]);

  useEffect(() => {
    if (board.length === 0) return;
    const newAvailableDigits: number[] = [];
    for (let num = 1; num <= 9; num++) {
      // Simple check: if any cell is empty, check if this number can go there
      // A more robust check: does this number ALREADY exist 9 times?
      let count = 0;
      for(let r=0; r<9; r++) {
         for(let c=0; c<9; c++) {
            if (board[r][c].value === num) count++;
         }
      }
      if (count < 9) newAvailableDigits.push(num);
    }
    setAvailableDigits(newAvailableDigits);
  }, [board]);

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const lastGroup = undoHistory[undoHistory.length - 1];
    setUndoHistory((prev) => prev.slice(0, -1));
    setRedoHistory((prev) => [...prev, lastGroup]);

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => r.map((c) => ({ ...c }))); // Deep copy for safety
      
      // We need to apply changes in reverse order if they matter, but here they are grouped
      lastGroup.forEach((delta) => {
        const { row, col, oldValue, oldMiniGrid } = delta;
        newBoard[row][col].value = oldValue;
        newBoard[row][col].miniGrid = oldMiniGrid || [];
        
        // Re-calculate correctness
        if (oldValue !== 0) {
            const isConflict = checkConflicts(newBoard, row, col, oldValue); 
             // Note: checkConflicts needs the board state *during* the check. 
             // Since we are batch updating, this might be tricky if conflicts depend on other changes in same group.
             // But usually group is 1 cell change + auto-removals.
             // Auto-removals (pencil marks) don't affect conflicts.
             // So main cell change is key.
            const correctValue = solution[row][col];
            newBoard[row][col].isWrong = oldValue !== correctValue;
            newBoard[row][col].isConflict = isConflict; 
        } else {
             newBoard[row][col].isWrong = false;
             newBoard[row][col].isConflict = false;
        }
      });
      return newBoard;
    });
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const nextGroup = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));
    setUndoHistory((prev) => [...prev, nextGroup]);

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => r.map((c) => ({ ...c })));
      nextGroup.forEach((delta) => {
         const { row, col, newValue, newMiniGrid } = delta;
         newBoard[row][col].value = newValue;
         newBoard[row][col].miniGrid = newMiniGrid || [];

         if (newValue !== 0) {
            const isConflict = checkConflicts(newBoard, row, col, newValue);
            const correctValue = solution[row][col];
            newBoard[row][col].isWrong = newValue !== correctValue;
            newBoard[row][col].isConflict = isConflict;
         } else {
            newBoard[row][col].isWrong = false;
            newBoard[row][col].isConflict = false;
         }
      });
      return newBoard;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Banner Ad */}
      <div className="w-full bg-white border-b border-gray-200 p-2 flex justify-center sticky top-0 z-40">
        <AdPlaceholder width={728} height={90} label="Top Banner Ad (728x90)" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner Ad (320x50)" className="flex md:hidden" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row justify-center items-start gap-6 p-4 max-w-7xl mx-auto w-full">
        {/* Left Side Ad (Desktop) */}
        <div className="hidden xl:flex flex-col gap-4 w-[160px]">
           <AdPlaceholder width={160} height={600} label="Skyscraper Ad" />
        </div>

        {/* Main Game Container */}
        <div className="flex-1 max-w-4xl flex flex-col gap-6">
           {/* Header */}
           <div className="flex flex-col gap-4">
             {/* Title Row */}
             <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                 <span className="text-emerald-600">Sudoku</span> Master
               </h1>
               <div className="flex items-center gap-2 mt-2 sm:mt-0 overflow-x-auto max-w-full pb-1 sm:pb-0">
                 {difficulties.map((level) => (
                   <button
                     key={level}
                     onClick={() => setDifficulty(level)}
                     className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                       difficulty === level
                         ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                         : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                     }`}
                   >
                     {level.charAt(0).toUpperCase() + level.slice(1)}
                   </button>
                 ))}
               </div>
             </div>

             {/* Mobile Action Bar (Above Board) */}
             <div className="flex lg:hidden justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="text-gray-600 font-semibold text-sm">
                   Mistakes: <span className={`${mistake >= 3 ? "text-red-500" : "text-emerald-600"}`}>{mistake}/3</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={togglePencilMode} className={`p-2 rounded-lg border ${pencilMode ? "bg-emerald-100 border-emerald-500 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={handleUndo} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                    <button onClick={handleRedo} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
                </div>
             </div>
           </div>

           {/* Game Board & Controls */}
           <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Grid Section */}
              <div className="flex-1 w-full flex flex-col items-center gap-4">
                 <div className="w-full flex justify-center lg:justify-end">
                    <Grid
                        board={board}
                        selectedCell={selectedCell}
                        setSelectedCell={setSelectedCell}
                        isWin={isWin}
                    />
                 </div>
                 
                 {/* Mobile Number Pad (Below Grid) */}
                 <div className="w-full lg:hidden bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <NumberPad onSelect={handleNumber} availableDigits={availableDigits} />
                 </div>
              </div>

              {/* Desktop Controls Section */}
              <div className="w-full lg:w-80 flex flex-col gap-6">
                 
                 {/* Desktop Status & Actions (Hidden on Mobile) */}
                 <div className="hidden lg:flex flex-col gap-6">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="text-gray-600 font-semibold">Mistakes</div>
                        <div className={`text-xl font-bold ${mistake >= 3 ? "text-red-500" : "text-emerald-600"}`}>{mistake}/3</div>
                     </div>

                     <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={togglePencilMode}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${
                            pencilMode
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span className="text-xs font-bold w-full text-center">{pencilMode ? "ON" : "Note"}</span>
                        </button>
                        <button
                          onClick={handleUndo}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span className="text-xs font-bold">Undo</span>
                        </button>
                        <button
                          onClick={handleRedo}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                          </svg>
                          <span className="text-xs font-bold">Redo</span>
                        </button>
                     </div>
                 </div>

                 {/* Desktop Number Pad (Hidden on Mobile) */}
                 <div className="hidden lg:block bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <NumberPad onSelect={handleNumber} availableDigits={availableDigits} />
                 </div>

                 {/* Game Controls (New Game / Reset) - Always Visible but styled differently if needed */}
                 <div className="flex gap-3 mt-4 lg:mt-0">
                    <button
                      onClick={handleNewGame}
                      className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       New Game
                    </button>
                    <button
                      onClick={handleReset}
                       className="px-4 py-3 bg-white text-red-500 border-2 border-red-100 rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-all"
                    >
                       Reset
                    </button>
                 </div>
              </div>
           </div>
        </div>
        
        {/* Right Side Ad (Desktop) */}
        <div className="hidden xl:flex flex-col gap-4 w-[160px]">
           <AdPlaceholder width={160} height={600} label="Skyscraper Ad" />
        </div>
      </div>
      
      {/* Bottom Ad for Mobile */}
      <div className="p-4 flex md:hidden justify-center pb-8">
         <AdPlaceholder width={300} height={250} label="Rectangle Ad" />
      </div>
    </div>
  );
};

export default App;
