import React from "react";
import Cell from "./Cell";
import type { SudokuCell } from "../utils/types";

interface GridProps {
  board: SudokuCell[][];
  selectedCell: { row: number; col: number };
  setSelectedCell: React.Dispatch<
    React.SetStateAction<{ row: number; col: number }>
  >;
}

const Grid: React.FC<GridProps> = ({
  board,
  selectedCell,
  setSelectedCell,
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
    <div className="relative w-[432px] h-[432px] border-3 m-2">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 z-10 pointer-events-none">
        <div className="border-r-3 border-b-3 border-gray-500"></div>
        <div className="border-r-3 border-b-3 border-gray-500"></div>
        <div className="border-b-3 border-gray-500"></div>
        <div className="border-r-3 border-b-3 border-gray-500"></div>
        <div className="border-r-3 border-b-3 border-gray-500"></div>
        <div className="border-b-3 border-gray-500"></div>
        <div className="border-r-3 border-gray-500"></div>
        <div className="border-r-3 border-gray-500"></div>
        <div></div>
      </div>
      <div className="absolute inset-0 grid grid-cols-9 grid-rows-9 gap-0 z-10 pointer-events-none">
        {[...Array(9)].map((_, rowIdx) =>
          [...Array(9)].map((_, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`
                ${
                  rowIdx % 3 !== 2 && colIdx % 3 !== 2
                    ? "border-b border-r border-gray-300"
                    : ""
                }
                ${
                  rowIdx % 3 === 2 && colIdx % 3 !== 2
                    ? "border-r border-gray-300"
                    : ""
                }
                ${
                  rowIdx % 3 !== 2 && colIdx % 3 === 2
                    ? "border-b border-gray-300"
                    : ""
                }
              `}
            ></div>
          ))
        )}
      </div>
      <div className="absolute inset-0 grid grid-cols-9 grid-rows-9 gap-px">
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
              cell.value === board[selectedCell.row][selectedCell.col].value &&
              cell.value !== 0 &&
              !isInRow &&
              !isInCol &&
              !isInSubgrid;
            const isConflicting =
              selectedCell &&
              cell.value !== 0 &&
              cell.value === board[selectedCell.row][selectedCell.col].value &&
              (isInRow || isInCol || isInSubgrid) &&
              checkConflicts(rowIdx, colIdx, cell.value);

            const cellClass = `
              ${isInSubgrid || isInRow || isInCol ? "bg-emerald-100" : ""}
              ${hasSameValue ? "bg-teal-100" : ""}
              ${isSelected ? "bg-emerald-200" : ""}
              ${isConflicting && !isSelected ? "bg-red-200" : ""}
            `;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={cellClass}
                onClick={() => handleCellClick(rowIdx, colIdx)}
              >
                <Cell
                  cell={cell}
                  onClick={handleCellClick}
                  rowIdx={rowIdx}
                  colIdx={colIdx}
                  isSelected={isSelected ? isSelected : false}
                  selectedCellValue={
                    board[selectedCell.row][selectedCell.col]?.value
                  }
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Grid;
