import { create } from 'domain';
import fs from 'fs';
import readline from 'readline';

async function processFile(filePath: string, getNumberCallback: (str: string) => number) {
    const fileStream = fs.createReadStream(filePath);
    let total = 0;

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const num = getNumberCallback(line);

        //console.log({ line, num });

        total += num;
    }

    return total;
}

function findFirstLast(input: string = "", pattern: RegExp) {
    let first: string = "";
    let last: string = "";

    for (let i = 0; i < input.length; i++) {
        const chunk = input.substring(i);
        const match = chunk.match(pattern);

        if (!match?.length) continue;

        if (first === "") {
            first = match[0];
        }

        last = match[0];
    }

    return { first, last }
}

function replaceSpelledOutDigits(str: string) {
    const digitMap: { [key: string]: string } = {
        zero: "0",
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9"
    };

    return str.replace(/(zero|one|two|three|four|five|six|seven|eight|nine)/gi, (matched) => {
        return digitMap[matched.toLowerCase()];
    });
}

function createDigitsFunction(pattern: RegExp) {
    return (str: string) => {
        const { first, last } = findFirstLast(str, pattern);
        return Number(
            replaceSpelledOutDigits(first) +
            replaceSpelledOutDigits(last)
        );
    };
}

const dayOnePuzzle = createDigitsFunction(/[0-9]/);
const dayTwoPuzzle = createDigitsFunction(/([0-9]|zero|one|two|three|four|five|six|seven|eight|nine)/gi);

Promise.all([
    processFile('./input/puzzle_one_input.txt', dayOnePuzzle),
    processFile('./input/puzzle_one_input.txt', dayTwoPuzzle)
])
    .then(([puzzleOneAnswer, puzzleTwoAnswer]) => {
        console.log({
            one: puzzleOneAnswer,
            two: puzzleTwoAnswer
        })
    });
