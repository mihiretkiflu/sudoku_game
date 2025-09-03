import React from "react";
import type { SudokuCell } from "../utils/types";

interface CellProps {
  cell: SudokuCell;
  onClick: (row: number, col: number) => void;
  rowIdx: number;
  colIdx: number;
  isSelected: boolean;
  pencilMode: boolean;
}

const Cell: React.FC<CellProps> = ({
  cell,
  onClick,
  rowIdx,
  colIdx,
  isSelected,
  pencilMode,
}) => {
  const baseStyles =
    "w-12 h-12 flex items-center justify-center text-3xl focus:outline-none border-0 z-10 font-extralight";
  const textColor =
    (cell.isConflict || cell.isWrong) && !cell.isFixed
      ? "text-red-600"
      : cell.isFixed
      ? "text-black"
      : "text-indigo-600";
  const cellStyles = `${baseStyles} ${textColor} ${
    cell.isFixed ? "font-bold" : ""
  } ${isSelected ? "bg-indigo-200" : ""}`;

  return (
    <div
      className={`w-full h-full flex items-center justify-center relative ${cellStyles}`}
      onClick={() => onClick(rowIdx, colIdx)}
    >
      {!cell.isFixed && pencilMode && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-1">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`text-xs flex items-center justify-center text-gray-400 font-extralight ${
                cell.miniGrid?.includes(num) ? "text-black" : ""
              }`}
            >
              {cell.miniGrid?.includes(num) ? num : ""}
            </div>
          ))}
        </div>
      )}
      <span>{cell.value === 0 ? "" : cell.value}</span>
    </div>
  );
};

export default Cell;
