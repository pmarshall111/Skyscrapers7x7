"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Perms_1 = require("./Perms");
const Grid_1 = require("./Grid");
class solver {
    getBoard(clues) {
        this.startTime = new Date().getTime();
        this.rules = clues;
        this.numbBuildings = clues.length / 4;
        let empty2dArray = Grid_1.grid.getBlankGrid(this.numbBuildings);
        let possibleNumbers = this.createPossibleNumbers();
        let startGrid = new Grid_1.grid(empty2dArray, possibleNumbers);
        this.addDefinites(startGrid);
        startGrid.fillInBlanks(); //fillInBlanks will check for negatives. i.e. will add a number it's the only square in it's row or col that can have that number
        let permutationBuilder = new Perms_1.Perms();
        let toLookThrough = [startGrid];
        let createdThisIteration = [];
        while (toLookThrough.length) {
            for (let i = 0; i < toLookThrough.length; i++) {
                let grid = toLookThrough[i];
                let indexes = grid.getBestRows(clues);
                let perms = indexes.map(x => {
                    let { row, possibleNumbs } = grid.getRow(x.index);
                    let clue = clues[x.index];
                    let oppositeClue = clues[solver.getOppositeClueIndex(x.index, this.numbBuildings)];
                    let permutations = permutationBuilder.getPerms(row, possibleNumbs, { left: clue, right: oppositeClue });
                    return { index: x.index, perms: permutations, score: x.score };
                }).sort((a, b) => a.perms.length - b.perms.length);
                let selectedPerms = perms[0].perms;
                for (let i = 0; i < selectedPerms.length; i++) {
                    let sol = selectedPerms[i];
                    let newGrid = grid.copy();
                    newGrid.saveRow(sol.row, perms[0].index);
                    newGrid.fillInBlanks();
                    let completed = newGrid.isComplete();
                    if (completed && newGrid.matchesClues(clues) && newGrid.noDuplicateNumbers()) {
                        return [newGrid];
                    }
                    else if (!completed) {
                        createdThisIteration.push(newGrid);
                    }
                }
            }
            toLookThrough = createdThisIteration;
            createdThisIteration = [];
        }
        return [];
    }
    //squaresAway of 0 is closest square
    static getSquareXFromClue(clueIndex, squaresAway, rowLength) {
        let timesIntoRows = Math.floor(clueIndex / rowLength);
        let rowIdx, colIdx;
        if (timesIntoRows == 0) {
            rowIdx = 0 + squaresAway;
            colIdx = clueIndex;
        }
        else if (timesIntoRows == 1) {
            rowIdx = clueIndex % rowLength;
            colIdx = rowLength - 1 - squaresAway;
        }
        else if (timesIntoRows == 2) {
            rowIdx = rowLength - 1 - squaresAway;
            colIdx = rowLength - 1 - clueIndex % rowLength;
        }
        else {
            rowIdx = rowLength - 1 - clueIndex % rowLength;
            colIdx = 0 + squaresAway;
        }
        return { rowIdx, colIdx };
    }
    createPossibleNumbers() {
        let possibleNumbers = [];
        let allNumbers = [];
        for (let i = 1; i <= this.numbBuildings; i++) {
            allNumbers.push(i);
        }
        for (let i = 0; i < this.numbBuildings; i++) {
            let rowArr = [];
            possibleNumbers.push(rowArr);
            for (let j = 0; j < this.numbBuildings; j++) {
                rowArr.push(new Set(allNumbers));
            }
        }
        return possibleNumbers;
    }
    addDefinites(startGrid) {
        for (let i = 0; i < this.rules.length; i++) {
            let clue = this.rules[i];
            let oppositeClue = this.rules[solver.getOppositeClueIndex(i, this.numbBuildings)];
            this.addSpecialCases(startGrid, clue, oppositeClue, i);
            //removing numbers that would make the row impossible
            // i.e. if we want to see 3 buildings, the largest building cannot be in the first square.
            for (let c = clue; c >= 2; c--) {
                let toRemove = this.numbBuildings - (clue - c);
                let squaresAway = c - 2;
                while (squaresAway >= 0) {
                    let { rowIdx, colIdx } = solver.getSquareXFromClue(i, squaresAway, this.numbBuildings);
                    startGrid.updatePossibleNumbersNumbNotAllowed(toRemove, rowIdx, colIdx);
                    squaresAway--;
                }
            }
        }
    }
    addSpecialCases(startGrid, clue, oppositeClue, clueIndex) {
        if (clue == 1) {
            //closest square must be largest building
            let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, 0, this.numbBuildings);
            startGrid.saveSquare(this.numbBuildings, rowIdx, colIdx);
            if (oppositeClue == 2) {
                //opposite clue must then have second largest building as closest square.
                let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, this.numbBuildings - 1, this.numbBuildings);
                startGrid.saveSquare(this.numbBuildings - 1, rowIdx, colIdx);
            }
        }
        else if (clue == 2) {
            //second square cannot be second largest number
            let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, 1, this.numbBuildings);
            startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings - 1, rowIdx, colIdx);
            if (oppositeClue == 2) {
                //second largest building has to be on edge. removing from all middle elements
                for (let squaresAway = 1; squaresAway < this.numbBuildings - 1; squaresAway++) {
                    let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, squaresAway, this.numbBuildings);
                    startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings - 1, rowIdx, colIdx);
                }
            }
        }
        else if (clue == 3 && oppositeClue == 1) {
            //2 lower than tallest building cannot go in second spot
            let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, 1, this.numbBuildings);
            startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings - 2, rowIdx, colIdx);
        }
        else if (clue + oppositeClue == this.numbBuildings + 1) {
            //tallest building must go clue-1 spaces away
            let { rowIdx, colIdx } = solver.getSquareXFromClue(clueIndex, clue - 1, this.numbBuildings);
            startGrid.saveSquare(this.numbBuildings, rowIdx, colIdx);
        }
        else if (clue == this.numbBuildings) {
            //all buildings must be shown in ascending order
            let row = new Array(this.numbBuildings).fill(-1).map((x, idx) => idx + 1);
            startGrid.saveRow(row, clueIndex);
        }
    }
    static getOppositeClueIndex(index, numbRows) {
        let moduloIndex = index % numbRows;
        let timesDividesIn = Math.floor(index / numbRows);
        return numbRows * ((timesDividesIn + 2) % 4 + 1) - moduloIndex - 1;
    }
}
exports.solver = solver;
// let clues = [ 3, 2, 2, 3, 2, 1,
//     1, 2, 3, 3, 2, 2,
//     5, 1, 2, 2, 4, 3,
//     3, 2, 1, 2, 2, 4];
let clues = [0, 3, 0, 5, 3, 4,
    0, 0, 0, 0, 0, 1,
    0, 3, 0, 3, 2, 3,
    3, 2, 0, 3, 1, 0];
let sol = new solver();
sol.getBoard(clues).forEach(x => x.printGrid());
console.log((new Date().getTime() - sol.startTime) / 1000);
//# sourceMappingURL=Solver.js.map
