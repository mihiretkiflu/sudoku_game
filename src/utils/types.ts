export type Difficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "master"
  | "extreme";

export type SudokuBoard = number[][]; // 9x9 grid, 0 for empty

export interface SudokuCell {
  value: number;
  isFixed: boolean; // Pre-filled cells can't be edited
  isConflict: boolean; // For validation highlighting
  isWrong: boolean;
  miniGrid: number[];
}
