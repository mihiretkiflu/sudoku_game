import React from "react";
import type { SudokuCell } from "../utils/types";

interface CellProps {
  cell: SudokuCell;
  onClick: (row: number, col: number) => void;
  rowIdx: number;
  colIdx: number;
  isSelected: boolean;
  selectedCellValue: number | null;
}

const Cell: React.FC<CellProps> = ({
  cell,
  onClick,
  rowIdx,
  colIdx,
  isSelected,
  selectedCellValue,
}) => {
  const baseStyles =
    "w-full h-full flex items-center justify-center text-3xl focus:outline-none border-0 z-10 font-extralight";
  const textColor =
    (cell.isConflict || cell.isWrong) && !cell.isFixed
      ? "text-red-600"
      : cell.isFixed
      ? "text-black"
      : selectedCellValue
      ? "text-emerald-900"
      : "text-emerald-600";
  const cellStyles = `${baseStyles} ${textColor} ${
    cell.isFixed ? "font-bold" : ""
  } ${isSelected ? "bg-emerald-300" : ""}`;

  return (
    <div
      className={`w-full h-full flex items-center justify-center relative ${
        cell.isFixed ? "text-emerald-800 font-bold" : "text-gray-900"
      } ${cellStyles}`}
      onClick={() => onClick(rowIdx, colIdx)}
    >
      {!cell.isFixed && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5 sm:p-1">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`text-[8px] sm:text-xs flex items-center justify-center ${
                num === selectedCellValue ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {cell.miniGrid?.includes(num) ? num : ""}
            </div>
          ))}
        </div>
      )}
      <span className="text-lg sm:text-2xl">
        {cell.value === 0 ? "" : cell.value}
      </span>
    </div>
  );
};

export default Cell;
