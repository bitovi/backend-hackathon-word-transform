const fs = require('fs')
const readline = require('readline')
const { start } = require('repl')

const inputWords = process.argv.slice(2)
if (inputWords.length !== 2) {
    console.error(`must provide exactly 2 input words (${inputWords.length} detected)`)
    process.exit()
}
console.log('input words', inputWords)

execute()

async function execute() {
    // validate input words
    console.log('validating ...')
    for (const iw of inputWords) {
        if ( await inputWordIsInvalid(iw)) {
            console.error(`input word '${iw}' is not a valid word`)
            process.exit()
        }
    }
    console.log('validation complete')

    const [start, finish] = inputWords
    console.log(`initial difference: ${calcDiff(start, finish)}`)

    const trail = [start]
    // const blacklist = []

    while(calcDiff(trail.at(-1), finish) > 0) {
        const scanResult = await findNext(trail.at(-1), finish, trail)

        // if (scanResult === trail.at(-1)){
        //     const deadEnd = trail.pop()
        //     blacklist.push(deadEnd)
        //     console.log(`popping '${deadEnd}'`, trail)
        //     continue
        // }

        trail.push(scanResult)
        console.log(`pushing '${scanResult}'`, trail)
    }

    console.log('final result', trail)

}

async function inputWordIsInvalid(inputWord) {
    const fileStream = fs.createReadStream('words.txt')
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    
    for await (const line of rl) {
        if (line === inputWord) {
            fileStream.destroy()
            return false
        }
    }

    fileStream.destroy()
    return true
}

async function findNext(start, finish, currentTrail, targetDiff) {
    const fileStream = fs.createReadStream('words.txt')
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    const currentDiff = calcDiff(start, finish)
    if (targetDiff === undefined) {
        targetDiff = currentDiff - 1
    }

    let bestSoFar = start
    let diffOfBestSoFar = currentDiff
    
    for await (const line of rl) {

        if (
            (calcDiff(start, line) === 1) // can only change one thing at a time
            && (!currentTrail.includes(line)) // don't regress to previous trail steps
        ) {
            const newDiff = calcDiff(line, finish)
            if (newDiff === targetDiff)
            {
                bestSoFar = line
                diffOfBestSoFar = newDiff
            }
        }
    }

    fileStream.destroy()
    if (bestSoFar === start) {
        bestSoFar = await findNext(start, finish, currentTrail, targetDiff + 1)
    }

    return bestSoFar
}

function calcDiff(wordA, wordB) {
    let diff = 0;
    maxCharLen = Math.max(wordA.length, wordB.length)
    for(let charIdx = 0; charIdx < maxCharLen; charIdx++ ) {
        if (wordA[charIdx] !== wordB[charIdx]) {
            diff++
        }
    }
    return diff
}

