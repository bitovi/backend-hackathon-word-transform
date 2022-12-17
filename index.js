const fs = require('fs')
const readline = require('readline')

const inputWords = process.argv.slice(2)
if (inputWords.length !== 2) {
    console.error(`must provide exactly 2 input words (${inputWords.length} detected)`)
    process.exit()
}
console.log('input words', inputWords)
const [firstWord, finalWord] = inputWords
const deadEnds = []
let deadEndsSkipped = 0
let nodesProcessed = 0

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

    const graph = createNode(firstWord, null)
    processNode(graph)
}


async function processNode(node) {
    nodesProcessed++
    printUpdate(node)
    if (node.word === finalWord) {
        console.log('SUCCESS!')
        printPath(node)
        process.exit()
    }

    if (deadEnds.includes(node.word)) {
        deadEndsSkipped++
        return
    }

    if(node.children === null) {
        await addChildren(node)
    }

    for(let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        await processNode(child)
    }

    deadEnds.push(node.word)
}

async function addChildren(node) {
    const fileStream = fs.createReadStream('words.txt')
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    node.children = []
    for await (const line of rl) {
        if (calcDiff(node.word, line) === 1) {
            if (!getPath(node).map(n => n.word).includes(line)) {
                node.children.push(createNode(line, node))
            }
        }
    }
    fileStream.destroy()

    // sort ascending, by finalWordDiff
    node.children.sort((a, b) => {
        return a.finalWordDiff - b.finalWordDiff
    })
}

function createNode(word, parent) {
    const node = {
        word,
        children: null,
        finalWordDiff: calcDiff(word, finalWord),
        parent
    }
    // console.log('created new node:')
    // printPath(node)
    return node
}

function getPath(node) {
    if (node === null) {
        return []
    }
    const path = getPath(node.parent)
    path.push(node)
    return path
}

function printPath(node, abridged = false) {
    const path = getPath(node)
    console.log(`Printing Path (${path.length} steps)`)
    formatStep = (step) => console.log(`\t${step.word} - ${step.finalWordDiff}`)

    if (abridged && path.length > 10) {
        path.slice(0,5).forEach(step => { // first 5
            formatStep(step)
        })
        console.log(`\t...`) // elipsis
        path.slice(-5).forEach(step => { // last 5
            formatStep(step)
        })
    } else {
        path.forEach(step => {
            console.log(`\t${step.word} - ${step.finalWordDiff}`)
        })
    }
}

function printUpdate(currentNode) {
    console.log('-----------------------------------')
    console.log(`Nodes Processed: ${nodesProcessed}`)
    console.log(`Dead Ends: ${deadEnds.length}`)
    console.log(`Dead Ends Skipped: ${deadEndsSkipped}`)
    printPath(currentNode, true)
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




