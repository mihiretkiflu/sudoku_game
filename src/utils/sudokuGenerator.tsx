import type { Difficulty } from "./types";

type SudokuBoard = number[][];
type SudokuCell = { value: number; isFixed: boolean; isConflict: boolean };

class SudokuGenerator {
  private grid: number[][];
  private candidates: number[][][];

  constructor() {
    this.grid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));
    this.candidates = Array(9)
      .fill(null)
      .map(() =>
        Array(9)
          .fill([])
          .map(() => [1, 2, 3, 4, 5, 6, 7, 8, 9])
      );
  }

  // Phase 1: Create a Solved Sudoku Grid
  private getCandidates(row: number, col: number): number[] {
    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Remove numbers in the same row
    for (let c = 0; c < 9; c++) {
      const index = candidates.indexOf(this.grid[row][c]);
      if (index !== -1) candidates.splice(index, 1);
    }
    // Remove numbers in the same column
    for (let r = 0; r < 9; r++) {
      const index = candidates.indexOf(this.grid[r][col]);
      if (index !== -1) candidates.splice(index, 1);
    }
    // Remove numbers in the same 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        const index = candidates.indexOf(this.grid[r][c]);
        if (index !== -1) candidates.splice(index, 1);
      }
    }
    return candidates;
  }

  private solveStep(): boolean {
    let minCandidates = 10;
    let minRow = -1;
    let minCol = -1;

    // Find cell with fewest candidates
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.grid[r][c] === 0) {
          const cand = this.getCandidates(r, c);
          if (cand.length < minCandidates) {
            minCandidates = cand.length;
            minRow = r;
            minCol = c;
          }
        }
      }
    }

    if (minRow === -1) return true; // Grid is full

    const candidates = this.getCandidates(minRow, minCol);
    for (const num of candidates.sort(() => Math.random() - 0.5)) {
      this.grid[minRow][minCol] = num;
      if (this.solveStep()) return true;
      this.grid[minRow][minCol] = 0; // Backtrack
    }
    return false;
  }

  public generateSolution(): number[][] {
    // Seed initial numbers
    const initialCells: number[][] = [];
    while (initialCells.length < 9) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (!initialCells.some(([r, c]) => r === row && c === col)) {
        initialCells.push([row, col]);
      }
    }
    initialCells.forEach(([row, col], idx) => {
      this.grid[row][col] = (idx % 9) + 1;
    });

    // Solve with backtracking
    this.solveStep();
    return this.grid.map((row) => [...row]);
  }

  // Phase 2: Create the Puzzle by Subtracting Numbers
  private countClues(board: number[][]): number {
    return board.reduce(
      (sum, row) => sum + row.filter((v) => v !== 0).length,
      0
    );
  }

  private hasSingleSolution(board: number[][]): boolean {
    // Simplified brute-force to check for single solution
    const temp = board.map((row) => [...row]);
    const stack: number[][][] = [temp];
    const seen = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop()!;
      const empty = this.findEmpty(current);
      if (!empty) {
        if (!seen.has(current.toString())) {
          seen.add(current.toString());
          if (seen.size > 1) return false; // Multiple solutions
        }
        continue;
      }
      const [row, col] = empty;
      for (let num = 1; num <= 9; num++) {
        if (this.isSafe(current, row, col, num)) {
          current[row][col] = num;
          stack.push([...current.map((r) => [...r])]);
          current[row][col] = 0;
        }
      }
    }
    return seen.size === 1;
  }

  private findEmpty(board: number[][]): [number, number] | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  private isSafe(
    board: number[][],
    row: number,
    col: number,
    num: number
  ): boolean {
    // Check row
    for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
    // Check column
    for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  public generatePuzzle(difficulty?: Difficulty): {
    puzzle: SudokuCell[][];
    solution: number[][];
  } {
    const solution = this.generateSolution();
    let puzzle = solution.map((row) => [...row]);

    const difficultyMap: Record<Difficulty, number> = {
      easy: 0.4, // 40% clues (approx 36 clues)
      medium: 0.5, // 50% clues (approx 32 clues)
      hard: 0.6, // 60% clues (approx 28 clues)
      expert: 0.7, // 70% clues (approx 24 clues)
      master: 0.8, // 80% clues (approx 20 clues)
      extreme: 0.9, // 90% clues (approx 16 clues, but ensure >= 17)
    };

    const targetClues = Math.max(
      17,
      Math.floor(81 * (1 - (difficultyMap[difficulty || "easy"] || 0.5)))
    );
    let cluesRemoved = 0;
    const positions = Array.from({ length: 81 }, (_, i) => [
      Math.floor(i / 9),
      i % 9,
    ]);
    positions.sort(() => Math.random() - 0.5);

    while (
      this.countClues(puzzle) > targetClues &&
      cluesRemoved < 64 &&
      positions.length > 0
    ) {
      const idx = Math.floor(Math.random() * positions.length);
      // console.log(
      //   "Positions:",
      //   positions,
      //   "Idx:",
      //   idx,
      //   "Length:",
      //   positions.length
      // );
      if (idx >= positions.length) {
        console.warn("Idx out of bounds, skipping iteration");
        continue;
      }
      const [row, col] = positions[idx];
      positions.splice(idx, 1);

      if (puzzle[row][col] !== 0) {
        const original = puzzle[row][col];
        puzzle[row][col] = 0;
        cluesRemoved++;

        if (!this.hasSingleSolution(puzzle)) {
          puzzle[row][col] = original;
          cluesRemoved--;
        }
      }
    }

    // Ensure target clues are met with adjustment and prevent infinite loop
    const maxIterations = 100; // Limit to prevent infinite loop
    let iterations = 0;
    let currentClues = this.countClues(puzzle);
    // console.log("Initial clues:", currentClues, "Target:", targetClues);

    while (
      (currentClues > targetClues || currentClues < 17) &&
      iterations < maxIterations
    ) {
      console.log("Adjusting clues:", currentClues, "Iteration:", iterations);
      const idx = Math.floor(Math.random() * 81);
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      const original = puzzle[row][col];
      let newValue = original;

      if (currentClues > targetClues && original !== 0) {
        newValue = 0; // Try to remove a clue
      } else if (currentClues < 17 && original === 0) {
        newValue = solution[row][col]; // Try to add a clue
      }

      if (newValue !== original) {
        puzzle[row][col] = newValue;
        if (!this.hasSingleSolution(puzzle)) {
          puzzle[row][col] = original; // Revert if invalid
        } else {
          currentClues = this.countClues(puzzle); // Update clue count
          console.log("New clues after change:", currentClues);
        }
      }
      iterations++;
    }

    if (iterations >= maxIterations) {
      console.warn("Max iterations reached, using current puzzle state");
    }

    // Convert to SudokuCell format
    const puzzleCells = puzzle.map((row, r) =>
      row.map((val, c) => ({
        value: val,
        isFixed: val !== 0,
        isConflict: false,
      }))
    );

    return { puzzle: puzzleCells, solution };
  }
}

export default SudokuGenerator;
