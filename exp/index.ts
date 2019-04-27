import * as inquirer from 'inquirer'
import { range, flatten } from 'rambda'
import * as shuffle from 'shuffle-array'
const Table = require('cli-table2')
import * as colors from 'colors'

type ColorString = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'magenta' | 'cyan'

type PowerCard = {
  value: number
  suit: 'B' | 'F'
}

type LeaderCard = {
  faction: Faction
}

type Card = PowerCard | LeaderCard

const isPowerCard = (card: Card): card is PowerCard =>
  (<PowerCard>card).value !== undefined

type Faction = {
  hand: Card[]
  color: ColorString
  fid: number
  support: number
  bet: number
  leaders: number
}

type Position = {
  faction: Faction
}

type GameState = {
  factions: Faction[]
  positions: Position[]
  deck: Card[]
  played: Card[]
  discard: Card[]
  secrets: Card[]
  boots: number,
  fists: number,
  currentTurn: number
  roundsLeft: number
  winners: Faction[]
  isOver: boolean
  state: number
}

const FACTION_COLORS: ColorString[] = [
  'red',
  'green',
  'blue',
  'yellow',
  'white',
  'cyan',
  'magenta',
]

const powerCardsPerFaction = () => [
  ...range(1, 4).map(value => ({ value, suit: 'B'} as PowerCard)),
  ...range(1, 4).map(value => ({ value, suit: 'F'} as PowerCard)),
]

const leaderCardsForFaction = (faction: Faction) =>
  range(1, 4).map(v => ({ faction } as LeaderCard))

const cardsForFaction = (faction: Faction) => [
  ...powerCardsPerFaction(),
  ...leaderCardsForFaction(faction)
]

const initGameState = (factionCount: number): GameState => {
  const factions: Faction[] = range(1, factionCount + 1).map((fid) => ({
    hand: [],
    fid,
    color: FACTION_COLORS[fid - 1],
    support: 10,
    bet: 0,
    leaders: 0,
  }))

  const deck: Card[] = flatten([
    ...factions.map(cardsForFaction)
  ])

  shuffle(deck)

  const positions: Position[] = factions.map(faction => ({
    faction,
  }))
  shuffle(positions)

  return {
    factions,
    positions,
    deck,
    played: [],
    discard: [],
    secrets: [],
    boots: 0,
    fists: 0,
    currentTurn: 0,
    roundsLeft: 0,
    winners: [],
    isOver: false,
    state: 0,
  }
}

const playerChoose = (hand: Card[]) => inquirer.prompt<{handIndex: number}>([
  {
    type: 'list',
    name: 'handIndex',
    message: `${'red'.toUpperCase().red}: Which card do you want to play?`,
    choices: hand.map((card, value) => ({
      name: cardToString(card),
      value,
    })),
    pageSize: 10,
  }
])

const playerContinue = () => inquirer.prompt<{cont: boolean}>([
  {
    type: 'confirm',
    name: 'cont',
    message: `Continue?`,
  }  
])

const factionName = (faction: Faction) =>
  colors[faction.color](faction.color)

// const FIST = emoji.get('fist')
// const BOOT = emoji.get('boot')
// const FIST = 'F'
// const BOOT = 'B'
const FIST = ''
const BOOT = ''

const cardToString = (c: Card) => 
  isPowerCard(c) ?
    (c.suit === 'B' ? range(0,c.value).map(() => '*').join('').bgBlack.white + BOOT : range(0,c.value).map(() => '*').join('').bgWhite.black + FIST) :
    colors[c.faction.color](c.faction.color.slice(0, 2))

const printGameState = (game: GameState) => {
  const t1 = new Table({
    head: ['COMMIES!', 'Plot', 'Round', 'Plays Left', 'MENSH'.bgWhite.black, 'WINNING', 'BOLSH', 'State'],
    colWidths: [ 10, 10, 10, 20, 10, 20, 10, 10 ]
  })
  t1.push(
    [
      '',
      game.currentTurn,
      6 - game.roundsLeft,
      range(0, game.roundsLeft).map(() => '*').join(' '),
      game.fists,
      ('+' + Math.abs(game.fists - game.boots).toString() + (game.fists > game.boots ? ' MENSHEVIKS' : ' BOLSHEVIKS')),
      game.boots,
      game.state,
    ]
  )
  console.log(t1.toString())
  const t = new Table({
    head: ["", "M1".bgWhite.black, "M2".bgWhite.black, "M3".bgWhite.black, "N".gray, "B1", "B2", "B3"],
    style: { head: ['white'] },
    colWidths: [30, 10, 10, 10, 10, 10, 10, 10]
  })
  t.push(
    {'Faction': game.positions.map(({faction}) => factionName(faction))},
    {'Support': game.positions.map(p => p.faction.support)},
    {'Leaders': game.positions.map(p => p.faction.leaders)},
    {'Bet': game.positions.map(p => p.faction.bet)},
    {'Hand': game.positions.map(p => p.faction.hand.map(cardToString).join('\n'))}
  )
  console.log(t.toString())
}

const printTurnEnd = (game: GameState) => {
  const t0 = new Table({
    head: ['SECRETS PLAYED'],
    colWidths: [107]
  })
  t0.push([ game.secrets.map(cardToString).join(' ')])
  console.log(t0.toString())

  const t1 = new Table({
    head: ["END OF TURN", (FIST + ' MENSH').bgWhite.black, 'WINS', BOOT + ' BOLSH'],
    colWidths: [60, 10, 20, 10]
  })
  t1.push(
    [
      '',
      game.fists,
      ('+' + Math.abs(game.fists - game.boots).toString() + (game.fists > game.boots ? ' MENSHEVIKS' : ' BOLSHEVIKS')),
      game.boots,
    ]
  )
  console.log(t1.toString())

  const t2 = new Table({
    head: ['WINNER', 'AMOUNT', 'LOSER']
  })
  if (game.fists > game.boots) {
    t2.push(
      [game.positions[0].faction.color, game.positions[4].faction.bet, game.positions[4].faction.color],
      [game.positions[1].faction.color, game.positions[5].faction.bet, game.positions[5].faction.color],
      [game.positions[2].faction.color, game.positions[6].faction.bet, game.positions[6].faction.color]
    )
  } else {
    t2.push(
      [game.positions[4].faction.color, game.positions[0].faction.bet, game.positions[0].faction.color],
      [game.positions[5].faction.color, game.positions[1].faction.bet, game.positions[1].faction.color],
      [game.positions[6].faction.color, game.positions[2].faction.bet, game.positions[2].faction.color]
    )
  }
  console.log(t2.toString())
}
const fromDeckTo = (f: Card[], t: Card[]) => {
  while (f.length > 0) { t.push(f.pop())}
  shuffle(t)
}

const printRoundEnd = (game: GameState) => {
  const t = new Table({
    head: ['END OF ROUND', 'Secrets', 'Played']
  })
  t.push(
    [6 - game.roundsLeft, game.secrets.length, game.played.map(cardToString).join(' ')]
  )
  console.log(t.toString())
}

const printGameEnd = (game: GameState) => {
  console.log('END OF GAME')
  const t = new Table({
    head: ['PLAYER', 'TOTAL']
  })
  game.winners.forEach(faction => t.push([factionName(faction), faction.support]))
  console.log(t.toString())
}

const resolveCard = (game: GameState, card: Card) => {
  // console.log(`someone played ${cardToString(card)}`)
  if (isPowerCard(card)) {
    if (card.suit === 'B') {
      game.boots += card.value
    } else {
      game.fists += card.value
    }
  } else {
    // promote
    // console.log('promoting', card.faction.color)
    card.faction.leaders += 1
    const curIdx = game.positions.findIndex(p => p.faction === card.faction)
    let toIdx = curIdx
    // console.log('found faction at idx', curIdx)
    while ((toIdx < 6) && (game.positions[curIdx].faction.leaders > game.positions[toIdx+1].faction.leaders)) {
      // console.log('bigger than idx', toIdx)
      toIdx += 1
    }
    // console.log('should move to', toIdx)
    const movePos = game.positions.splice(curIdx, 1)
    game.positions.splice(toIdx, 0, ...movePos)
    // console.log('new positions', game.positions.map(p => p.faction.color).join(' '))
    if (card.faction.support > 0) {
      card.faction.support -= 1
      card.faction.bet += 1
    }
  }
}

const main = async () => {
  const game: GameState = initGameState(7)

  while(!game.isOver) {
    // new turn
    game.currentTurn += 1
    // deal cards
    game.factions.forEach(faction => {
      while (faction.hand.length < 9) {
        if (!(game.deck.length > 0)) { throw new Error('deck is empty, why!?!?!') }
        faction.hand.push(game.deck.pop())
      }
      faction.support -= 2
      game.state += 1
      faction.bet += 1
    })
    // set & play rounds
    game.roundsLeft = 5
    while (game.roundsLeft > 0) {
      printGameState(game)
      // player pick
      const { handIndex } = await playerChoose(game.factions[0].hand)
      const cardPlayed = game.factions[0].hand[handIndex]
      game.factions[0].hand.splice(handIndex, 1)
      game.played.push(cardPlayed)
      // console.log('you played', cardToString(cardPlayed))
      // AI picks
      game.factions.slice(1, 7).forEach(faction => {
        const aiPlay = faction.hand.pop()
        game.played.push(aiPlay)
        // console.log(`${factionName(faction)} played ${cardToString(aiPlay)}`)
      })
      // pull secret
      shuffle(game.played)
      const secret = game.played.pop()
      game.secrets.push(secret)
      // console.log(`Pulled secret ${cardToString(secret)}`)

      printRoundEnd(game)
      
      // reveal & resolve plays
      game.played.forEach(card => resolveCard(game, card))
      fromDeckTo(game.played, game.discard)
      // rounds -= 1
      game.roundsLeft -= 1
      const { cont } = await playerContinue()
      if (!cont) { process.exit() }
    }
    // reveal secrets
    shuffle(game.secrets)
    // console.log('PLAYING SECRETS', game.secrets.map(cardToString).join(' '))
    game.secrets.forEach(card => resolveCard(game, card))
    // show gamestate
    printTurnEnd(game)
    fromDeckTo(game.secrets, game.discard)

    if (game.fists > game.boots) {
      game.positions[0].faction.support += game.positions[4].faction.bet
      game.positions[1].faction.support += game.positions[5].faction.bet
      game.positions[2].faction.support += game.positions[6].faction.bet
    } else {
      game.positions[4].faction.support += game.positions[0].faction.bet
      game.positions[5].faction.support += game.positions[1].faction.bet
      game.positions[6].faction.support += game.positions[2].faction.bet
    }
    game.positions[3].faction.support += game.positions[3].faction.bet
    game.positions.forEach(p => p.faction.bet = 0)
  
    // resolve winners & losers
    // check for game winner
    game.isOver = game.factions.find(f => f.support === 0) ? true : false
    if (game.isOver) {
      game.winners = game.factions.sort((a, b) => a.support > b.support ? 1 : (a.support < b.support ? -1 : 0))
      printGameEnd(game)
    } else {
      const { cont } = await playerContinue()
      if (!cont) { process.exit() }
    }
    // clean up decks, leader count
    game.boots = game.fists = 0
    game.factions.forEach(faction => faction.leaders = 0)
    fromDeckTo(game.discard, game.deck)
    shuffle(game.deck)
  }
  return true
}

main().then(() => process.exit())