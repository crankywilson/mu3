// autogenerated

/**

@typedef Msg
 @property {string} _mt

@typedef CurrentGameState
 @property {Game} g
 @property {string} _mt

@typedef PlayerRejoined
 @property {Player} p
 @property {string} _mt

@typedef AvailableGames
 @property {string[]} games
 @property {string} _mt

@typedef CreateGame
 @property {string} name
 @property {string} preferredColor
 @property {string} _mt

@typedef JoinGameRequest
 @property {string} name
 @property {string} _mt

@typedef JoinGameDenial
 @property {string} reason
 @property {string} _mt

@typedef GameNameExists
 @property {string} _mt

@typedef JoinedGameStats
 @property {string} gameName
 @property {string} ownerName
 @property {Player[]} players
 @property {boolean} youAreOwner
 @property {string} currentColor
 @property {string} _mt

@typedef NameChange
 @property {string} name
 @property {string} _mt

@typedef ColorReq
 @property {string} colorStr
 @property {string} _mt

@typedef SetColor
 @property {string} colorStr
 @property {string} _mt

@typedef Kick
 @property {string} colorStr
 @property {string} _mt

@typedef StartGame
 @property {string} _mt

@typedef Player
 @property {string} name
 @property {string} ip
 @property {number} money
 @property {number[]} res
 @property {string} color
 @property {boolean} isBot
 @property {string} colrReq
 @property {number} score

@typedef LandLot
 @property {Player} owner
 @property {number} mts
 @property {number} crys
 @property {number} res
 @property {number} resprod

@typedef Game
 @property {LandLotDict} landlots
 @property {number} month
 @property {string} name
 @property {Player[]} players
 @property {Player} colony
 @property {GameState} state

@typedef {(
 'WAITINGFORALLJOIN'|
 'SCORE'|
 'WAITFORLANDGRANT'|
 'LANDGRANT'|
 'WAITINGFORLANDAUCTION'|
 'LANDAUCTION'|
 'WAITINGTOSTARTIMPROVE'|
 'IMPROVE'|
 'PROD'|
 'AUCTIONPREP'|
 'AUCTION'|
 '?')} GameState

@typedef {Object.<string, LandLot>} LandLotDict
*/

export let GAMESTATE = {
 WAITINGFORALLJOIN: "WAITINGFORALLJOIN",
 SCORE: "SCORE",
 WAITFORLANDGRANT: "WAITFORLANDGRANT",
 LANDGRANT: "LANDGRANT",
 WAITINGFORLANDAUCTION: "WAITINGFORLANDAUCTION",
 LANDAUCTION: "LANDAUCTION",
 WAITINGTOSTARTIMPROVE: "WAITINGTOSTARTIMPROVE",
 IMPROVE: "IMPROVE",
 PROD: "PROD",
 AUCTIONPREP: "AUCTIONPREP",
 AUCTION: "AUCTION",
 UNKNOWN: "?"
}
/**@returns {CreateGame}*/ export function CreateGame(
 /**@type {string}*/ name,
 /**@type {string}*/ preferredColor,
) { return { _mt: 'CreateGame' , name: name
 , preferredColor: preferredColor
};}

/**@returns {JoinGameRequest}*/ export function JoinGameRequest(
 /**@type {string}*/ name,
) { return { _mt: 'JoinGameRequest' , name: name
};}

/**@returns {NameChange}*/ export function NameChange(
 /**@type {string}*/ name,
) { return { _mt: 'NameChange' , name: name
};}

/**@returns {ColorReq}*/ export function ColorReq(
 /**@type {string}*/ colorStr,
) { return { _mt: 'ColorReq' , colorStr: colorStr
};}

/**@returns {SetColor}*/ export function SetColor(
 /**@type {string}*/ colorStr,
) { return { _mt: 'SetColor' , colorStr: colorStr
};}

/**@returns {Kick}*/ export function Kick(
 /**@type {string}*/ colorStr,
) { return { _mt: 'Kick' , colorStr: colorStr
};}

/**@returns {StartGame}*/ export function StartGame(
) { return { _mt: 'StartGame'};}

