import {Perms} from "./Perms";
import {Solver} from "./Solver";
import {Grid} from "./Grid";
import {PermInfo} from "./PermInfo";

class BruteForce {
    startTime: number;
    allPerms: number[][];

    getBoard(clues: number[]): Grid[] {
        this.startTime = new Date().getTime();
        let rows = clues.length/4;
        let permBuilder = new Perms();

        let startRow = this.getStartRow(rows);
        let startPossibles = new Solver().createPossibleNumbers(rows);
        this.allPerms = permBuilder.getPerms(startRow, startPossibles[0], {left: 0, right: 0}).map(x => x.row);

        let startSolution = new Array(rows).fill(this.allPerms[0]);
        let counts = this.getFirstCounts(rows);
        let numbTested = 0;
        let solution = [];

        let totalTests = this.allPerms.length**rows;
        console.log(totalTests);

        while (numbTested < totalTests) {
            for (let i = 0; i<rows; i++) {
                let changesEvery = this.allPerms.length**(i);
                let idx = Math.floor(numbTested/changesEvery) % this.allPerms.length;
                // let index = (numbTested % changesEvery) % this.allPerms.length;
                solution[i] = this.allPerms[idx];
            }
            let g = new Grid(solution, startPossibles);
            if (g.noDuplicateNumbers() && g.matchesClues(clues)) {
                return [g];
            }
            numbTested++;
            // console.log(numbTested)
        }

        // while (counts[0] < this.allPerms.length) {
        //     for (let i = 0; i<rows; i++) {
        //         solution[i] = this.allPerms[counts[i]++];
        //     }
        //     let g = new Grid(solution, startPossibles);
        //     if (g.noDuplicateNumbers() && g.matchesClues(clues)) {
        //         return [g];
        //     }
        // }
        return [];
    }

    addDifferentPerm(i: number, counts) {

    }

    getStartRow(numbRows: number) {
        return new Array(numbRows).fill(-1);
    }

    getFirstCounts(numbRows: number) {
        return new Array(numbRows).fill(0);
    }
}

// let clues = [ 0, 3, 0, 5, 3, 4,
//     0, 0, 0, 0, 0, 1,
//     0, 3, 0, 3, 2, 3,
//     3, 2, 0, 3, 1, 0];

// let clues = [
//     0,0,1,2,
//     0,2,0,0,
//     0,2,0,0,
//     4,1,0,0
// ]

// let clues = [ 0, 3, 0, 4, 3,
//     0, 2, 0, 1, 2,
//     0, 0, 0, 0, 0,
//     3, 2, 0, 3, 0,];
//
// let bf = new BruteForce();
// let boards = bf.getBoard(clues);
// boards.forEach(g => g.printGrid());
// console.log((new Date().getTime() - bf.startTime)/1000);
