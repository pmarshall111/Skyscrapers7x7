import {solver} from "./Solver";

export class grid {
    private grid: number[][];
    private rows: number;
    private possibleNumbers: Set<number>[][];

    static getBlankGrid(rows: number) {
        return new Array(rows).fill([]).map(x => new Array(rows).fill(-1));
    }

    constructor(grid: number[][], possibleNumbers: Set<number>[][]) {
        this.grid = grid;
        this.rows = grid.length;
        this.possibleNumbers = possibleNumbers;
    }

    getSquare(row: number, col: number) {
        return this.grid[row][col];
    }

    getRow(clueNumb: number): { row: number[], possibleNumbs: Set<number>[] } {
        let buildings = [];
        let possibleNumbs = [];

        if (clueNumb < this.rows) {
            //looking down
            for (let row = 0; row < this.rows; row++) {
                buildings.push(this.grid[row][clueNumb]);
                possibleNumbs.push(this.possibleNumbers[row][clueNumb]);
            }
        } else if (clueNumb < this.rows * 2) {
            //looking left
            let row = clueNumb % this.rows;
            for (let col = this.rows - 1; col >= 0; col--) {
                buildings.push(this.grid[row][col])
                possibleNumbs.push(this.possibleNumbers[row][col]);
            }
        } else if (clueNumb < this.rows * 3) {
            //looking up
            let col = this.mirrorClueIndex(clueNumb % this.rows);
            for (let row = this.rows - 1; row >= 0; row--) {
                buildings.push(this.grid[row][col]);
                possibleNumbs.push(this.possibleNumbers[row][col]);
            }
        } else {
            //looking right
            let row = this.mirrorClueIndex(clueNumb % this.rows);
            for (let col = 0; col < this.rows; col++) {
                buildings.push(this.grid[row][col]);
                possibleNumbs.push(this.possibleNumbers[row][col]);
            }
        }
        return {row: buildings, possibleNumbs};
    }

    saveSquare(n: number, row: number, col: number) {
        if (this.grid[row][col] == -1) {
            this.grid[row][col] = n;
            this.updatePossibleNumbersNewNumbAdded(n, row, col);
        }
    }

    saveRow(buildings: number[], clueNumb: number) {
        if (clueNumb < this.rows) {
            //looking down
            for (let row = 0; row < this.rows; row++) {
                this.saveSquare(buildings[row], row, clueNumb);
            }
        } else if (clueNumb < this.rows * 2) {
            //looking left
            let row = clueNumb % this.rows;
            for (let revCol = this.rows - 1, col = 0; revCol >= 0; revCol--, col++) {
                this.saveSquare(buildings[revCol], row, col);
            }
        } else if (clueNumb < this.rows * 3) {
            //looking up
            let col = clueNumb % this.rows;
            col = this.mirrorClueIndex(col);
            for (let revRow = this.rows - 1, row = 0; revRow >= 0; revRow--, row++) {
                this.saveSquare(buildings[revRow], row, col)
            }
        } else {
            //looking right
            let row = clueNumb % this.rows;
            row = this.mirrorClueIndex(row);
            for (let col = 0; col < this.rows; col++) {
                this.saveSquare(buildings[col], row, col)
            }
        }
    }

    //used for when looking up or right
    private mirrorClueIndex(modulusIndex: number) {
        let maxIdx = this.rows - 1;
        let midPoint = maxIdx / 2;
        let diff = modulusIndex - midPoint;
        return midPoint - diff;
    }

    fillInBlanks() {
        let hasChanged = true;
        while (!this.isComplete() && hasChanged) {
            //adds number if it's the only square
            hasChanged = this.hasAddedDefinites();
            if (!hasChanged) {
                //tries to add negatives only if there are no more definites to add
                hasChanged = this.hasAddedNegatives();
            }
        }
    }

    private hasAddedDefinites(): boolean {
        let changes = false;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.getSquare(i, j) == -1 && this.possibleNumbers[i][j].size == 1) {
                    let onlyNumber = this.possibleNumbers[i][j].values().next().value;
                    this.saveSquare(onlyNumber, i, j);
                    changes = true;
                }
            }
        }
        return changes;
    }

    //returns true as soon as a negative found
    private hasAddedNegatives(): boolean {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.rows; col++) {
                if (this.getSquare(row, col) == -1) {
                    let squareValsRow = new Set(this.possibleNumbers[row][col]);
                    let squareValsCol = new Set(this.possibleNumbers[row][col]);
                    //removing values from neighbouring squares
                    for (let idx = 0; idx < this.rows; idx++) {
                        if (squareValsRow.size == 0 && squareValsCol.size == 0) {
                            break;
                        }
                        let squareOfRow = this.possibleNumbers[row][idx];
                        let squareOfCol = this.possibleNumbers[idx][col];
                        if (idx != col) {
                            squareOfRow.forEach(n => squareValsRow.delete(n));
                        }
                        if (idx != row) {
                            squareOfCol.forEach(n => squareValsCol.delete(n));
                        }
                    }
                    //looking if any values were only available in current square
                    if (squareValsCol.size == 1) {
                        let n = squareValsCol.values().next().value;
                        this.saveSquare(n, row, col);
                        return true;
                    } else if (squareValsRow.size == 1) {
                        let n = squareValsRow.values().next().value;
                        this.saveSquare(n, row, col);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    //for when a new number is added to the grid only
    updatePossibleNumbersNewNumbAdded(n: number, row: number, col: number) {
        for (let i = 0; i < this.possibleNumbers.length; i++) {
            this.possibleNumbers[row][i].delete(n);
            this.possibleNumbers[i][col].delete(n);
        }
        this.possibleNumbers[row][col].clear();
    }

    updatePossibleNumbersNumbNotAllowed(n: number, row: number, col: number) {
        this.possibleNumbers[row][col].delete(n);
    }

    getBestRows(clues: number[]) {
        let best = [{index: -1, score: 99}];
        for (let i = 0; i < clues.length/2; i++) {
                let clue = clues[i];
                let oppClueIdx = solver.getOppositeClueIndex(i, this.rows);
                let oppositeClue = clues[oppClueIdx];
                let possNumbsForRow = this.getRow(i).possibleNumbs;
                let spaces = possNumbsForRow.reduce((t,c) => c.size > 0 ? t+1 : t, 0);
                if (spaces > 0) {
                    let avgPerSpace = this.getRow(i).possibleNumbs.reduce((t,c) => t+=c.size, 0)/spaces;
                    for (let j = 0; j<best.length; j++) {
                        if (avgPerSpace < best[j].score) {
                            best.splice(j, 0, {index: oppositeClue > clue ? oppClueIdx : i, score: avgPerSpace});
                            best.splice(3, 1); //ensure length is always 3
                            break;
                        }
                    }
                }
        }
        return best;
    }

    isComplete() {
        for (let row = 0; row<this.rows; row++) {
            for (let col = 0; col<this.rows; col++) {
                if (this.grid[row][col] == -1) {
                    return false;
                }
            }
        }
        return true;
    }

    matchesClues(clues: number[]): boolean {
        for (let clueIdx = 0; clueIdx < clues.length; clueIdx++) {
            let clue = clues[clueIdx];
            if (clue > 0) {
                let row = this.getRow(clueIdx).row;
                let numbSeen = 0;
                let currHighest = -1;
                for (let buildingIdx = 0; buildingIdx < row.length; buildingIdx++) {
                    if (row[buildingIdx] > currHighest) {
                        numbSeen++;
                        currHighest = row[buildingIdx];
                    }
                }
                if (numbSeen != clue) {
                    return false;
                }
            }
        }
        return true;
    }

    noDuplicateNumbers(): boolean {
        for (let row = 0; row < this.rows; row++) {
            let rowNumbs = {};
            let colNumbs = {};
            for (let col = 0; col < this.rows; col++) {
                //go through rows
                let rowN = this.grid[row][col];
                if (!rowNumbs[rowN]) {
                    rowNumbs[rowN] = 1;
                } else if (rowN != -1) { //we don't care about counting how many -1s
                    return false;
                }
                //go through cols
                let colN = this.grid[col][row];
                if (!colNumbs[colN]) {
                    colNumbs[colN] = 1;
                } else if (colN != -1) {
                    return false;
                }
            }
        }
        return true;
    }

    copy(): grid {
        let numbs = this.grid.slice();
        numbs = numbs.map(x => x.slice());
        let possibleNumbers = this.copyPossibleNumbers();
        let newGrid = new grid(numbs, possibleNumbers);
        return newGrid;
    }

    private copyPossibleNumbers() {
        let newNumbs = [];
        for (let i = 0; i < this.possibleNumbers.length; i++) {
            let newArr = [];
            newNumbs.push(newArr);
            for (let j = 0; j < this.possibleNumbers[0].length; j++) {
                newArr.push(new Set(this.possibleNumbers[i][j]))
            }
        }
        return newNumbs;
    }

    printGrid() {
        console.log(this.grid);
    }
}
