import React from "react";
import Cell from "./Cell";
import type { SudokuCell } from "../utils/types";

interface GridProps {
  board: SudokuCell[][];
  selectedCell: { row: number; col: number };
  setSelectedCell: React.Dispatch<
    React.SetStateAction<{ row: number; col: number }>
  >;
  isWin: boolean;
}

const Grid: React.FC<GridProps> = ({
  board,
  selectedCell,
  setSelectedCell,
  isWin,
}) => {
  const checkConflicts = (row: number, col: number, value: number) => {
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

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-0">
      <div
        className={`relative w-full max-w-[500px] aspect-square bg-white border-2 sm:border-4 overflow-hidden transition-all duration-500 ${
          isWin ? "border-green-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "border-gray-800 shadow-xl"
        }`}
      >
        {isWin && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/40 backdrop-blur-sm z-30 animate-fade-in">
            <div className="bg-white/90 p-6 rounded-2xl shadow-xl transform animate-bounce-contained text-center">
              <h2 className="text-emerald-600 text-3xl font-extrabold mb-2">
                Solved!
              </h2>
              <p className="text-gray-600 font-medium">Great job!</p>
            </div>
          </div>
        )}

        {/* Thick grid lines layer - restored to use borders/divs logic visually similar to before but cleaner implementation */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 z-10 pointer-events-none">
           {/* Subgrid Borders - using internal borders on the 3x3 grid items */}
           {[...Array(9)].map((_, i) => (
             <div 
               key={i} 
               className={`
                 ${i % 3 !== 2 ? 'border-r-2 sm:border-r-4 border-gray-800' : ''}
                 ${Math.floor(i / 3) !== 2 ? 'border-b-2 sm:border-b-4 border-gray-800' : ''}
               `}
             />
           ))}
        </div>

        {/* Cells Grid */}
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-9 gap-0">
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isSelected =
                selectedCell &&
                selectedCell.row === rowIdx &&
                selectedCell.col === colIdx;
              
              const isInSubgrid =
                selectedCell &&
                Math.floor(rowIdx / 3) === Math.floor(selectedCell.row / 3) &&
                Math.floor(colIdx / 3) === Math.floor(selectedCell.col / 3);
              const isInRow = selectedCell && selectedCell.row === rowIdx;
              const isInCol = selectedCell && selectedCell.col === colIdx;
              
              const hasSameValue =
                selectedCell &&
                !isSelected &&
                cell.value === board[selectedCell.row][selectedCell.col]?.value &&
                cell.value !== 0;

              const isConflicting =
                cell.value !== 0 &&
                (isInRow || isInCol || isInSubgrid) &&
                checkConflicts(rowIdx, colIdx, cell.value);

              // Determine background color using original palette
              let bgColor = "bg-white"; 
              if (isInSubgrid || isInRow || isInCol) bgColor = "bg-emerald-100";
              if (hasSameValue) bgColor = "bg-teal-200";
              if (isSelected) bgColor = "bg-emerald-800 !text-white";
              if (isConflicting && !isSelected) bgColor = "bg-red-200";
              if (cell.isWrong && !isSelected) bgColor = "bg-red-200";

              // Thin gray borders for individual cells
              const borderClasses = `
                ${colIdx % 3 !== 2 ? "border-r border-gray-300" : ""}
                ${rowIdx % 3 !== 2 ? "border-b border-gray-300" : ""}
              `;

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`
                    relative flex items-center justify-center cursor-pointer select-none transition-colors duration-100
                    ${bgColor}
                    ${borderClasses}
                  `}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                >
                  <Cell
                    cell={cell}
                    onClick={handleCellClick}
                    rowIdx={rowIdx}
                    colIdx={colIdx}
                    isSelected={isSelected}
                    selectedCellValue={
                      board[selectedCell?.row || 0][selectedCell?.col || 0]?.value
                    }
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Grid;
