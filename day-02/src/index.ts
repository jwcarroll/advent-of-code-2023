import fs from 'fs';
import readline from 'readline';

type Colors = 'green' | 'red' | 'blue';

type ControlTotals = {
    [K in Colors]: number;
}

type GameRound = {
    color: Colors;
    count: number;
}[];

type ScoredRound = {
    totalPicked: number,
    isPossible: boolean,
    reasons: string[]
}

type Game = {
    gameId: number,
    rounds: GameRound[]
}

type ScoredGame = {
    gameId: number,
    isPossible: boolean,
    reasons: string[]
}

type GameWithCounts = {
    gameId: number;
    maxCounts: {
        [K in Colors]: number
    };
}

function parseGame(input: string): Game {

    const [game, output] = input.split(":");

    //console.log({ game, output })

    const gameIdRaw = game.replace(/[^0-9]/gi, "");
    const gameId = Number(gameIdRaw);

    //console.log({ gameIdRaw, gameId });

    const roundsRaw = output.split(";");

    //console.log({ rounds });

    const roundWithPicksRaw = roundsRaw.map(round => round.split(","));

    //console.log(roundWithPicksRaw);

    const rounds = roundWithPicksRaw.map(round => round.map(pick => {
        const { count, color } = /(?<count>[0-9]+).(?<color>red|green|blue)/
            .exec(pick)
            ?.groups ?? {};

        return { color: color as Colors, count: Number(count) };
    }));

    return { gameId, rounds };
}

function scoreRound(controlTotals: ControlTotals, round: GameRound) {
    const totalPossibleCubes = Object.values(controlTotals)
        .reduce((acc, cur) => acc += cur, 0);

    const scoredCounts = round.map(p => ({
        ...p,
        isPossible: p.count <= controlTotals[p.color]
    }))

    const scoredRound = scoredCounts.reduce((acc, cur) => {
        acc.totalPicked += cur.count;
        acc.isPossible &&= cur.isPossible;
        acc.isPossible &&= acc.totalPicked < totalPossibleCubes;

        if (!cur.isPossible) {
            acc.reasons.push(`${cur.count} ${cur.color} exceeds ${controlTotals[cur.color]} in bag`);
        }

        return acc;
    }, <ScoredRound>{
        totalPicked: 0,
        isPossible: true,
        reasons: []
    });

    if (scoredRound.totalPicked > totalPossibleCubes) {
        scoredRound.reasons.push(`Total round count: ${scoredRound.totalPicked} exceeds total possible cubes in bag: ${totalPossibleCubes}`);
    }

    return scoredRound;
}

function scoreGame(controlTotals: ControlTotals, game: Game) {
    const scoredRounds = game.rounds.map(p => scoreRound(controlTotals, p));

    return scoredRounds.reduce((acc, cur, index) => {
        acc.isPossible &&= cur.isPossible;

        if (!cur.isPossible) {
            acc.reasons.push(`Round: ${index} Reasons: ${cur.reasons.join(', ')}`);
        }

        return acc;
    }, <ScoredGame>{
        gameId: game.gameId,
        isPossible: true,
        reasons: []
    });
}

function getMinCubeSetsPerGame({ gameId, rounds }: Game): GameWithCounts {
    const maxCounts = rounds.flat().reduce((acc, cur) => {
        acc[cur.color] = cur.count > acc[cur.color]
            ? cur.count
            : acc[cur.color];

        return acc;
    }, {
        'red': 0,
        'green': 0,
        'blue': 0
    });

    return { gameId, maxCounts };
}

async function getParsedGamesFromFile(filePath: string) {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const games: Game[] = [];

    for await (const line of rl) {
        games.push(parseGame(line));
    }

    return games;
}

const parsedGames = getParsedGamesFromFile("input/aoc-2023-day-02-input.txt");

const puzzleOne = parsedGames
    .then(games => games.map(g => scoreGame(
        { red: 12, green: 13, blue: 14 },
        g
    )))
    .then(scoredGames => scoredGames.reduce((acc, cur) => {
        return acc += cur.isPossible
            ? cur.gameId
            : 0;
    }, 0));

const puzzleTwo = parsedGames
    .then(games => games.map(getMinCubeSetsPerGame))
    .then(games => games.reduce((acc, cur) => {
        return acc += (cur.maxCounts.blue * cur.maxCounts.green * cur.maxCounts.red);
    }, 0)
    );

Promise.all([puzzleOne, puzzleTwo])
    .then(([totalOne, totalTwo]) => {
        console.log({ puzzle: 'puzzle-01', totalOne });
        console.log({ puzzle: 'puzzle-02', totalTwo });
    });