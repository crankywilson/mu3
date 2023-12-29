// autogenerated

/**

@typedef Msg
 @property {string} _mt

@typedef Continue
 @property {string} _mt

@typedef UpdateGameState
 @property {GameState} gs
 @property {string} _mt

@typedef CurrentGameState
 @property {Game} g
 @property {string} _mt

@typedef PlayerRejoined
 @property {Player} p
 @property {string} _mt

@typedef MuleRequest
 @property {string} _mt

@typedef MuleObtained
 @property {string} pc
 @property {number} newMoney
 @property {number} numMules
 @property {string} _mt

@typedef MuleDenied
 @property {string} reason
 @property {string} _mt

@typedef DestReached
 @property {string} pc
 @property {number} x
 @property {number} z
 @property {string} _mt

@typedef MuleDestReached
 @property {string} pc
 @property {number} x
 @property {number} z
 @property {string} _mt

@typedef NewDest
 @property {string} pc
 @property {number} x
 @property {number} z
 @property {number} destx
 @property {number} destz
 @property {number} destspd
 @property {string} _mt

@typedef NewMuleDest
 @property {string} pc
 @property {number} x
 @property {number} z
 @property {number} destx
 @property {number} destz
 @property {number} destspd
 @property {string} _mt

@typedef RequestMuleOutfit
 @property {string} res
 @property {string} _mt

@typedef MuleOutfitDenied
 @property {string} reason
 @property {string} _mt

@typedef MuleOutfitAccepted
 @property {string} pc
 @property {number} newMoney
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

@typedef Dest
 @property {number} x
 @property {number} z
 @property {number} spd

@typedef MuleData
 @property {number} resOutfit
 @property {number} x
 @property {number} z
 @property {Dest?} dest

@typedef Player
 @property {string} name
 @property {string} ip
 @property {number} money
 @property {number[]} res
 @property {string} color
 @property {boolean} isBot
 @property {string} colrReq
 @property {number} score
 @property {number} x
 @property {number} z
 @property {Dest?} dest
 @property {MuleData?} mule

@typedef LandLot
 @property {Player?} owner
 @property {number} mNum
 @property {number[]} mg
 @property {number} res

@typedef Game
 @property {LandLotDict} landlots
 @property {number} month
 @property {string} name
 @property {Player[]} players
 @property {Player} colony
 @property {GameState} state
 @property {number} mules
 @property {number} mulePrice

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
/**@returns {Continue}*/ export function Continue(
) { return { _mt: 'Continue'};}

/**@returns {MuleRequest}*/ export function MuleRequest(
) { return { _mt: 'MuleRequest'};}

/**@returns {DestReached}*/ export function DestReached(
 /**@type {string}*/ pc,
 /**@type {number}*/ x,
 /**@type {number}*/ z,
) { return { _mt: 'DestReached' , pc: pc
 , x: x
 , z: z
};}

/**@returns {MuleDestReached}*/ export function MuleDestReached(
 /**@type {string}*/ pc,
 /**@type {number}*/ x,
 /**@type {number}*/ z,
) { return { _mt: 'MuleDestReached' , pc: pc
 , x: x
 , z: z
};}

/**@returns {NewDest}*/ export function NewDest(
 /**@type {string}*/ pc,
 /**@type {number}*/ x,
 /**@type {number}*/ z,
 /**@type {number}*/ destx,
 /**@type {number}*/ destz,
 /**@type {number}*/ destspd,
) { return { _mt: 'NewDest' , pc: pc
 , x: x
 , z: z
 , destx: destx
 , destz: destz
 , destspd: destspd
};}

/**@returns {NewMuleDest}*/ export function NewMuleDest(
 /**@type {string}*/ pc,
 /**@type {number}*/ x,
 /**@type {number}*/ z,
 /**@type {number}*/ destx,
 /**@type {number}*/ destz,
 /**@type {number}*/ destspd,
) { return { _mt: 'NewMuleDest' , pc: pc
 , x: x
 , z: z
 , destx: destx
 , destz: destz
 , destspd: destspd
};}

/**@returns {RequestMuleOutfit}*/ export function RequestMuleOutfit(
 /**@type {string}*/ res,
) { return { _mt: 'RequestMuleOutfit' , res: res
};}

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

