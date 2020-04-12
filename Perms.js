"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PermInfo_1 = require("./PermInfo");
const util = require('util');
class Perms {
    getPerms(startRow, possibleNumbers, clues) {
        let firstRecord = PermInfo_1.PermInfo.getFirstRecord(startRow);
        if (firstRecord.numbsUsed.size == firstRecord.row.length) {
            //then perm is already solved
            return [];
        }
        let currPerms = [firstRecord];
        let nextIterPerms = [];
        //goes through all permutations for the same index
        for (let i = firstRecord.nextIndex; i < startRow.length; i++) {
            for (let p = 0; p < currPerms.length; p++) {
                let currentPerm = currPerms[p];
                if (startRow[i] == -1) {
                    let possNumbs = new Set(possibleNumbers[i]);
                    currentPerm.numbsUsed.forEach(n => possNumbs.delete(n));
                    if (possNumbs.size > 0) {
                        for (let val of possNumbs.values()) {
                            let perm = this.permForNextIteration(currentPerm, val, clues, i);
                            if (perm != null) {
                                nextIterPerms.push(perm);
                            }
                        }
                    }
                }
                else {
                    //even though number already in row, still need to get a permRecord for next iteration as it keeps track
                    //of whether the row adheres to the clues.
                    let val = startRow[i];
                    let perm = this.permForNextIteration(currentPerm, val, clues, i);
                    if (perm != null) {
                        nextIterPerms.push(perm);
                    }
                }
            }
            currPerms = nextIterPerms;
            nextIterPerms = [];
        }
        return !clues.right ? currPerms : currPerms.filter(x => x.validateFromRHS(clues.right));
    }
    //checks left and right clues but for the right clue it can only filter out if it's definite that more buildings will be shown than desired.
    //this was done for performance reasons so that only 1 loop is needed to go through a permutation. Once created, the RHS is checked with a
    //call to validateToRHS on the PermInfo returned class.
    //therefore if only have 1 clue, call with the clue on LHS.
    permForNextIteration(currentPerm, val, clues, index) {
        //alter left count
        let countLeft = currentPerm.countLeft;
        let highestFromLeft = currentPerm.highestFromLeft;
        if (val > currentPerm.highestFromLeft) {
            countLeft = currentPerm.countLeft + 1;
            highestFromLeft = val;
        }
        //alter right count
        let biggestNotUsed = currentPerm.biggestNotUsed;
        let guaranteedRight = currentPerm.guaranteedFromRight;
        if (val == currentPerm.biggestNotUsed) {
            guaranteedRight++;
            biggestNotUsed = PermInfo_1.PermInfo.getNextBiggestNotUsed(val, currentPerm.seenPriorToIndex);
        }
        //guaranteed different in that it includes the final element as guaranteed to be seen
        let willBeSeenRight = guaranteedRight + (index < currentPerm.row.length - 1 ? 1 : 0);
        let moreNeededLeft = clues.left - countLeft;
        let available = currentPerm.row.length - highestFromLeft;
        if ((!clues.left || (moreNeededLeft <= available && moreNeededLeft >= 0)) && (!clues.right || willBeSeenRight <= clues.right)) {
            let newRow = currentPerm.row.slice();
            newRow[index] = val;
            let newPerm = new PermInfo_1.PermInfo(newRow, new Set(currentPerm.numbsUsed).add(val), new Set(currentPerm.seenPriorToIndex).add(val), highestFromLeft, biggestNotUsed, guaranteedRight, countLeft, currentPerm.nextIndex + 1);
            return newPerm;
        }
        else {
            return null;
        }
    }
}
exports.Perms = Perms;
// let pResults = p.getPerms([-1,-1,-1,-1,-1,-1],
//     [new Set<number>([1,2,3,4,5,6]), new Set<number>([1,2,3,4,5,6]), new Set<number>([1,2,3,4,5,6]), new Set<number>([1,2,3,4,5,6]), new Set<number>([1,2,3,4,5,6]), new Set<number>([1,2,3,4,5,6])],
//     {left: 3, right: 4});
// //
// let perPosition = [new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>(), new Set<number>()];
// //
// pResults.forEach(perm => {
//     for (let i = 0; i<perm.row.length; i++) {
//         perPosition[i].add(perm.row[i]);
//     }
// })
// console.log(pResults)
// console.log(perPosition.map(x => Array.from(x).sort()))
//# sourceMappingURL=Perms.js.map