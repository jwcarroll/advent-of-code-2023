import fs from 'fs';
import readline from 'readline';
import { parseArgs } from 'util';

type ScratchCard = {
    cardNumber: number,
    winningNumbers: number[],
    scratchedNumbers: number[],
    matches: number,
    score: number
};

function parseScratchCard(input: string): ScratchCard {
    const cardParts = /Card[^\d]+(?<CardNum>\d+)\:(?<WinningNumbers>.+)\|(?<ScratchedNumbers>.+)/;
    const result = cardParts.exec(input);

    const cardNumber = Number(result?.groups?.CardNum);

    const winningNumbers = result?.groups?.WinningNumbers
        .split(/\s+/)
        .filter(n => !!n)
        .map(Number) ?? [];

    const scratchedNumbers = result?.groups?.ScratchedNumbers
        .split(/\s+/)
        .filter(n => !!n)
        .map(Number) ?? [];

    const { matches, score } = calculateScore(winningNumbers, scratchedNumbers);

    return {
        cardNumber,
        winningNumbers,
        scratchedNumbers,
        matches,
        score,
    };
}

function calculateScore(winningNumbers: number[], scratchedNumbers: number[]) {
    return scratchedNumbers.reduce((acc, cur) => {
        const isMatch = winningNumbers.includes(cur);

        if (!isMatch) return acc;

        acc.matches += 1;

        if (acc.score === 0) {
            acc.score = 1;
        }
        else {
            acc.score *= 2;
        }

        return acc;
    }, { matches: 0, score: 0 })
}

function getCardCounts(allCards: ScratchCard[], startingIndex = 0): number {
    const card = allCards[startingIndex];

    if (!card) return 0;

    let cardCount = 1;

    for (let i = (startingIndex + 1); i < (startingIndex + 1 + card.matches); i++) {
        cardCount += getCardCounts(allCards, i);
    }

    return cardCount;
}

async function getScratchCards(filePath: string): Promise<ScratchCard[]> {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const cards: ScratchCard[] = [];

    for await (const line of rl) {
        cards.push(parseScratchCard(line));
    }

    return cards;
}

const scratchCards = getScratchCards("input/aoc-2023-day-04-input.txt");

const puzzleOne = scratchCards
    .then(cards => cards.reduce((acc, cur) => acc + cur.score, 0));

const puzzleTwo = scratchCards
    .then(cards => cards.reduce((acc, cur, i) => acc + getCardCounts(cards, i), 0));

Promise.all([puzzleOne, puzzleTwo])
    .then(([answerOne, answerTwo]) => {
        console.log({ name: 'day-04-puzzle-01', answerOne });
        console.log({ name: 'day-04-puzzle-02', answerTwo });
    });