export class PermInfo {
    row: number[];
    numbsUsed: Set<number>;
    seenPriorToIndex: Set<number>;
    highestFromLeft: number;
    biggestNotUsed: number;
    guaranteedFromRight: number;
    countLeft: number;
    nextIndex: number;

    constructor(row: number[], numbsUsed: Set<number>, seenPriorToIndex: Set<number>, highestFromLeft: number, biggestNotUsed: number, guaranteedFromRight: number, countLeft: number, nextIndex: number) {
        this.row = row;
        this.numbsUsed = numbsUsed;
        this.seenPriorToIndex = seenPriorToIndex;
        this.highestFromLeft = highestFromLeft;
        this.biggestNotUsed = biggestNotUsed;
        this.guaranteedFromRight = guaranteedFromRight;
        this.countLeft = countLeft;
        this.nextIndex = nextIndex;
    }

    validateFromRHS(clue): boolean {
        let count = 0;
        let highestSoFar = 0;
        for (let i = this.row.length; i >= 0; i--) {
            if (this.row[i] > highestSoFar) {
                count++;
                highestSoFar = this.row[i];
            }
        }
        return count == clue;
    }

    static getFirstRecord(row: number[]) {
        let numbsAlreadyUsed = new Set<number>();
        let numbsSeenFromLeft = new Set<number>();
        let highestLeft = -1;
        let countLeft = 0;
        let biggestNotUsed = row.length;
        let guaranteedFromRight = 0;
        let firstBlankIdx = 0;

        let passedFirstBlank = false;
        for (let idx = 0; idx < row.length; idx++) {
            let n = row[idx];
            if (n == -1) {
                passedFirstBlank = true;
            }
            if (n != -1) {
                numbsAlreadyUsed.add(row[idx]);
            }
            if (!passedFirstBlank) {
                numbsSeenFromLeft.add(n);
                firstBlankIdx = idx + 1;
                if (n > highestLeft) {
                    highestLeft = n;
                    countLeft++;
                }
                if (n == biggestNotUsed) {
                    guaranteedFromRight++;
                    PermInfo.getNextBiggestNotUsed(n, numbsSeenFromLeft);
                }
            }
        }
        return new PermInfo(row, numbsAlreadyUsed, numbsSeenFromLeft, highestLeft, biggestNotUsed, guaranteedFromRight, countLeft, firstBlankIdx);
    }

    static getNextBiggestNotUsed(currBiggest: number, numbsToLeft: Set<number>): number {
        for (let i = currBiggest - 1; i > 0; i--) {
            if (!numbsToLeft.has(i)) {
                return i;
            }
        }
        return 0;
    }
}
