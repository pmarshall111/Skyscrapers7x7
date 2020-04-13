import {Perms} from "./Perms";
import {Grid} from "./Grid";

export class Solver {
    private numbBuildings: number;
    startTime: number;
    rules: number[];
    permutationBuilder: Perms;
    solution: Grid;

    //for exceptionally big problems (7x7+), heap size may need to be increased.
    getBoard(clues: number[]) {
        this.startTime = new Date().getTime();
        this.rules = clues;
        this.numbBuildings = clues.length/4;

        let empty2dArray = Grid.getBlankGrid(this.numbBuildings);
        let possibleNumbers: Set<number>[][] = this.createPossibleNumbers(this.numbBuildings);
        let startGrid = new Grid(empty2dArray, possibleNumbers);

        this.addDefinites(startGrid);
        startGrid.fillInBlanks(); //fillInBlanks will check for negatives. i.e. will add a number it's the only square in it's row or col that can have that number

        let permutationBuilder = new Perms();
        let toLookThrough = [startGrid];
        let createdThisIteration = [];

        while (toLookThrough.length) {
            for (let i = 0; i<toLookThrough.length; i++) {
                let grid = toLookThrough[i];
                let indexes = grid.getBestRows(clues);
                let perms = indexes.map(x => {
                    let {row, possibleNumbs} = grid.getRow(x.index);
                    let clue = clues[x.index];
                    let oppositeClue = clues[Solver.getOppositeClueIndex(x.index, this.numbBuildings)];
                    let permutations = permutationBuilder.getPerms(row, possibleNumbs, {left: clue, right: oppositeClue});
                    return {index: x.index, perms: permutations, score: x.score}
                }).sort((a,b) => a.perms.length-b.perms.length);

                let selectedPerms = perms[0].perms;
                for (let i = 0; i<selectedPerms.length; i++) {
                    let sol = selectedPerms[i];
                    let newGrid = grid.copy();
                    newGrid.saveRow(sol.row, perms[0].index);
                    newGrid.fillInBlanks();
                    let completed = newGrid.isComplete();
                    if (completed && newGrid.matchesClues(clues) && newGrid.noDuplicateNumbers()) {
                        return [newGrid];
                    } else if (!completed) {
                        createdThisIteration.push(newGrid);
                    }
                }
            }
            toLookThrough = createdThisIteration;
            createdThisIteration = [];
        }
        return [];
    }

    //method uses recursive solution so the number of grids held in memory is far fewer.
    //for exceptionally big problems (7x7+), call stack size may need to be increased.
    getBoardHeapEfficient(clues: number[]) {
        this.startTime = new Date().getTime();
        this.rules = clues;
        this.numbBuildings = clues.length/4;
        this.permutationBuilder = new Perms();

        let empty2dArray = Grid.getBlankGrid(this.numbBuildings);
        let possibleNumbers: Set<number>[][] = this.createPossibleNumbers(this.numbBuildings);

        let startGrid = new Grid(empty2dArray, possibleNumbers);
        this.addDefinites(startGrid);
        startGrid.fillInBlanks(); //fillInBlanks will check for negatives. i.e. will add a number it's the only square in it's row or col that can have that number
        this.addRow(startGrid);
        return this.solution;
    }

    addRow(g: Grid) {
        if (this.solution) {
            return;
        }

        let indexes = g.getBestRows(this.rules);
        let perms = indexes.map(x => {
            let {row, possibleNumbs} = g.getRow(x.index);
            let clue = this.rules[x.index];
            let oppositeClue = this.rules[Solver.getOppositeClueIndex(x.index, this.numbBuildings)];
            let permutations = this.permutationBuilder.getPerms(row, possibleNumbs, {left: clue, right: oppositeClue});
            return {index: x.index, perms: permutations, score: x.score}
        }).sort((a,b) => a.perms.length-b.perms.length);

        let selectedPerms = perms[0].perms;
        for (let i = 0; i<selectedPerms.length; i++) {
            let sol = selectedPerms[i];
            let newGrid = g.copy();
            newGrid.saveRow(sol.row, perms[0].index);
            newGrid.fillInBlanks();
            let completed = newGrid.isComplete();
            if (completed && newGrid.matchesClues(this.rules) && newGrid.noDuplicateNumbers()) {
                this.solution = newGrid;
            } else if (!completed) {
                this.addRow(newGrid)
            }
        }
    }


    //squaresAway of 0 is closest square
    static getSquareXFromClue(clueIndex: number, squaresAway: number, rowLength: number) {
        let timesIntoRows = Math.floor(clueIndex/rowLength);
        let rowIdx, colIdx;

        if (timesIntoRows == 0) {
            rowIdx = 0 + squaresAway;
            colIdx = clueIndex;
        } else if (timesIntoRows == 1) {
            rowIdx = clueIndex % rowLength;
            colIdx = rowLength-1 - squaresAway;
        } else if (timesIntoRows == 2) {
            rowIdx = rowLength-1 - squaresAway;
            colIdx = rowLength-1 - clueIndex % rowLength;
        } else {
            rowIdx = rowLength-1 - clueIndex % rowLength;
            colIdx = 0 + squaresAway;
        }

        return {rowIdx, colIdx};
    }

  createPossibleNumbers(numbRows: number): Set<number>[][] {
      let possibleNumbers: Set<number>[][] = [];
      let allNumbers = [];
      for (let i = 1; i<=numbRows; i++) {
          allNumbers.push(i);
      }

      for (let i = 0; i< numbRows; i++) {
          let rowArr = [];
          possibleNumbers.push(rowArr);
          for (let j = 0; j<numbRows; j++) {
              rowArr.push(new Set(allNumbers))
          }
      }
      return possibleNumbers;
  }

  addDefinites(startGrid: Grid) {
      for (let i = 0; i<this.rules.length; i++) {
          let clue = this.rules[i];
          let oppositeClue = this.rules[Solver.getOppositeClueIndex(i, this.numbBuildings)];

          this.addSpecialCases(startGrid, clue, oppositeClue, i);

          //removing numbers that would make the row impossible
          // i.e. if we want to see 3 buildings, the largest building cannot be in the first square.
          for (let c = clue; c>=2; c--) {
              let toRemove = this.numbBuildings - (clue-c);
              let squaresAway = c-2;
              while (squaresAway >= 0) {
                  let {rowIdx, colIdx} = Solver.getSquareXFromClue(i, squaresAway, this.numbBuildings);
                  startGrid.updatePossibleNumbersNumbNotAllowed(toRemove, rowIdx, colIdx);
                  squaresAway--;
              }
          }
      }
  }

  addSpecialCases(startGrid: Grid, clue: number, oppositeClue: number, clueIndex: number) {
      if (clue == 1) {
          //closest square must be largest building
          let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, 0, this.numbBuildings);
          startGrid.saveSquare(this.numbBuildings, rowIdx, colIdx);
          if (oppositeClue == 2) {
              //opposite clue must then have second largest building as closest square.
              let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, this.numbBuildings-1, this.numbBuildings);
              startGrid.saveSquare(this.numbBuildings-1, rowIdx, colIdx);
          }
      } else if (clue == 2) {
          //second square cannot be second largest number
          let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, 1, this.numbBuildings);
          startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings-1, rowIdx, colIdx);
          if (oppositeClue == 2) {
              //second largest building has to be on edge. removing from all middle elements
              for (let squaresAway = 1; squaresAway<this.numbBuildings-1; squaresAway++) {
                  let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, squaresAway, this.numbBuildings);
                  startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings-1, rowIdx, colIdx);
              }
          }
      } else if (clue == 3 && oppositeClue == 1) {
          //2 lower than tallest building cannot go in second spot
          let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, 1, this.numbBuildings);
          startGrid.updatePossibleNumbersNumbNotAllowed(this.numbBuildings-2, rowIdx, colIdx);
      } else if (clue + oppositeClue == this.numbBuildings + 1) {
          //tallest building must go clue-1 spaces away
          let {rowIdx, colIdx} = Solver.getSquareXFromClue(clueIndex, clue-1, this.numbBuildings);
          startGrid.saveSquare(this.numbBuildings, rowIdx, colIdx);
      } else if (clue == this.numbBuildings) {
          //all buildings must be shown in ascending order
          let row = new Array(this.numbBuildings).fill(-1).map((x,idx) => idx+1);
          startGrid.saveRow(row, clueIndex);
      }
  }

    static getOppositeClueIndex(index: number, numbRows: number) {
        let moduloIndex = index % numbRows;
        let timesDividesIn = Math.floor(index/numbRows);
        return numbRows*((timesDividesIn+2)%4 +1) - moduloIndex-1;
    }
}


//4x4
// let clues = [
//     0,0,1,2,
//     0,2,0,0,
//     0,2,0,0,
//     4,1,0,0
// ]

//5x5
// let clues = [ 0, 3, 0, 4, 3,
//     0, 2, 0, 1, 2,
//     0, 0, 0, 0, 0,
//     3, 2, 0, 3, 0,];


//6x6
// let clues = [ 0, 3, 0, 5, 3, 4,
//     0, 0, 0, 0, 0, 1,
//     0, 3, 0, 3, 2, 3,
//     3, 2, 0, 3, 1, 0];


//8x8
//<1s
// let clues = [3,0,3,3,2,3,0,3,
//             4,3,0,1,5,0,3,0,
//             0,0,2,0,2,3,4,0,
//             0,3,4,2,0,0,0,0];


//8x8
//2mins
// let clues = [3,2,4,3,2,1,3,3,
//     3,3,1,3,4,2,2,4,
//     3,2,4,2,3,2,5,1,
//     1,3,2,3,3,3,2,3];


//8x8
//max heap size reached.
//using stack method solves in 0.4s
// let clues = [1,3,5,3,4,3,2,2,
//             2,2,1,3,3,2,5,4,
//             3,5,2,2,3,1,2,6,
//             3,2,4,3,2,2,4,1];


// let sol = new Solver();
// sol.getBoardHeapEfficient(clues).printGrid();
// sol.getBoard(clues).forEach(x => x.printGrid());
// console.log((new Date().getTime() - sol.startTime)/1000);
