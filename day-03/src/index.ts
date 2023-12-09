import fs from 'fs';
import readline from 'readline';

async function getCharacterMap(filePath: string) {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const charMap: string[][] = [];

    for await (const line of rl) {
        charMap.push([...line]);
    }

    return charMap;
}

type SchematicToken = {
    token: string;
    x: number;
    y: number;
    boundingBox: {
        topLeft: { x: number, y: number },
        bottomRight: { x: number, y: number }
    }
}

type SchematicNumber = SchematicToken & {
    isPartNumber: boolean;
}

type SchematicGear = SchematicToken & {
    adjacentNumbers: SchematicNumber[]
}

function clampNum(num: number, min: number, max: number) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
}

function getBoundingBox(map: string[][], x: number, y: number, length: number) {
    return {
        topLeft: {
            x: clampNum(x - 1, 0, map[y].length - 1),
            y: clampNum(y - 1, 0, map.length - 1)
        },
        bottomRight: {
            x: clampNum(x + length, 0, map[y].length - 1),
            y: clampNum(y + 1, 0, map.length - 1)
        }
    };
}

function hasAdjacentSymbol(map: string[][], schematicToken: SchematicToken) {
    const { boundingBox: { topLeft, bottomRight } } = schematicToken;
    const symbol = /[^0-9\.]/;

    let foundSymbol = false;

    for (let y = topLeft.y; y <= bottomRight.y; y++) {
        for (let x = topLeft.x; x <= bottomRight.x; x++) {
            foundSymbol = symbol.test(map[y][x]);
            if (foundSymbol) break;
        }
        if (foundSymbol) break;
    }

    return foundSymbol;
}

function classifyNumbers(map: string[][]) {
    const digit = /[0-9]/;
    const schematicNumbers: SchematicNumber[] = [];

    for (let y = 0; y < map.length; y++) {
        const row = map[y];

        for (let x = 0; x < row.length; x++) {
            if (!digit.test(row[x])) continue;

            let number = '';
            const initialX = x;
            const initialY = y;

            while (digit.test(row[x]) && x < row.length) {
                number += row[x];
                x++;
            }

            const schematicNumber: SchematicNumber = {
                token: number,
                x: initialX,
                y: initialY,
                boundingBox: getBoundingBox(map, initialX, initialY, number.length),
                isPartNumber: false
            };

            schematicNumber.isPartNumber = hasAdjacentSymbol(map, schematicNumber);

            schematicNumbers.push(schematicNumber);
        }
    }

    return schematicNumbers;
}

function createNumberCoordinateMap(schematicNumbers: SchematicNumber[]) {
    return schematicNumbers.reduce((acc, cur) => {
        for(let x = cur.x; x < (cur.x+cur.token.length); x++){
            acc[`${x},${cur.y}`] = cur;
        }
        
        return acc;
    }, <{
        [key: string]: SchematicNumber
    }>{})
}

function getAdjacentNumbers(boundingBox: { topLeft: { x: number; y: number; }; bottomRight: { x: number; y: number; }; }, numberCoordinateMap: { [key: string]: SchematicNumber; }): SchematicNumber[] {
    const { topLeft, bottomRight } = boundingBox;
    const adjacentNumbers: SchematicNumber[] = [];

    for (let y = topLeft.y; y <= bottomRight.y; y++) {
        for (let x = topLeft.x; x <= bottomRight.x; x++) {
            const num = numberCoordinateMap[`${x},${y}`];
            if (num && adjacentNumbers.at(-1) != num) {
                adjacentNumbers.push(num);
            }
        }
    }

    return adjacentNumbers;
}

function classifyGears(map: string[][], schematicNumbers: SchematicNumber[]) {
    const gear = /\*/;
    const schematicGears: SchematicGear[] = [];
    const numberCoordinateMap = createNumberCoordinateMap(schematicNumbers);

    for (let y = 0; y < map.length; y++) {
        const row = map[y];

        for (let x = 0; x < row.length; x++) {
            if (!gear.test(row[x])) continue;

            const token = row[x];

            const schematicGear: SchematicGear = {
                token,
                x,
                y,
                boundingBox: getBoundingBox(map, x, y, token.length),
                adjacentNumbers: []
            };

            schematicGear.adjacentNumbers = getAdjacentNumbers(schematicGear.boundingBox, numberCoordinateMap);

            schematicGears.push(schematicGear);
        }
    }

    return schematicGears;
}

const parsedGames = getCharacterMap("input/aoc-2023-day-03-input.txt");

const puzzleOne = parsedGames
    .then(map => {
        const nums = classifyNumbers(map);

        return nums.reduce((acc, cur) => {
            acc += cur.isPartNumber
                ? Number(cur.token)
                : 0;

            return acc;
        }, 0);
    });

const puzzleTwo = parsedGames
    .then(map => {
        const nums = classifyNumbers(map);
        return classifyGears(map, nums);
    })
    .then(gears => {
        console.dir(gears, { depth: 5 });

        return gears.filter(g => g.adjacentNumbers.length == 2)
            .reduce((acc, cur) => {
                const [first, second] = cur.adjacentNumbers;

                console.log(`${acc} += (Number(${first.token})*Number(${second.token}));`);

                acc += (Number(first.token) * Number(second.token));
                return acc;
            }, 0)
    });

Promise.all([puzzleOne, puzzleTwo])
    .then(([answerOne, answerTwo]) => {
        console.log({ name: 'day-03-puzzle-01', answerOne });
        console.log({ name: 'day-03-puzzle-02', answerTwo });
    });