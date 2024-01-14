// autogenerated

/**

@typedef Msg
 @property {string} _mt

@typedef ShowWaiting
 @property {string} pc
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

@typedef ClaimLot
 @property {number} e
 @property {number} n
 @property {string} _mt

@typedef LotGranted
 @property {string} pc
 @property {string} k
 @property {string} _mt

@typedef LotDenied
 @property {string} _mt

@typedef PlayerEvent
 @property {string} pc
 @property {number} money
 @property {string} shortMsg
 @property {string?} lotKey
 @property {boolean?} addLot
 @property {string} _mt

@typedef PlayerEventText
 @property {string} fullMsg
 @property {boolean} isGood
 @property {string} _mt

@typedef ColonyEvent
 @property {string} fullMsg
 @property {number} eventType
 @property {string?} lotKey
 @property {boolean} beforeProd
 @property {string} _mt

@typedef Production
 @property {string[]} lotKeys
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
 @property {number} resOutfit
 @property {string} _mt

@typedef TurnedOnMuleLight
 @property {string} pc
 @property {number} lightColor
 @property {string} _mt

@typedef InstallMule
 @property {number} e
 @property {number} n
 @property {string} _mt

@typedef MuleInstalled
 @property {string} pc
 @property {number} resType
 @property {number} e
 @property {number} n
 @property {number} existingResType
 @property {string} _mt

@typedef UninstallMule
 @property {number} e
 @property {number} n
 @property {string} _mt

@typedef MuleRemoved
 @property {string} pc
 @property {number} e
 @property {number} n
 @property {number} existingResType
 @property {string} _mt

@typedef SellMule
 @property {string} _mt

@typedef MuleSold
 @property {number} newNumMules
 @property {string} pc
 @property {number} newMoney
 @property {string} _mt

@typedef MuleRemovedFromScene
 @property {string} pc
 @property {string} _mt

@typedef Cantina
 @property {string} _mt

@typedef CantinaResult
 @property {string} pc
 @property {number} winnings
 @property {number} newMoney
 @property {string} _mt

@typedef Assay
 @property {number} e
 @property {number} n
 @property {string} _mt

@typedef AssayResult
 @property {number} e
 @property {number} n
 @property {number} val
 @property {string} _mt

@typedef AuctionLot
 @property {number} e
 @property {number} n
 @property {string} _mt

@typedef PreAuctionStat
 @property {string} pc
 @property {number} start
 @property {number} used
 @property {number} spoiled
 @property {number} produced
 @property {number} current
 @property {number} surplus
 @property {string} _mt

@typedef CurrentAuction
 @property {number} auctionType
 @property {number} month
 @property {string} _mt

@typedef ConfirmTrade
 @property {number} tradeID
 @property {string} _mt

@typedef BuyerReset
 @property {string} msg
 @property {string} pc
 @property {number} target
 @property {number} bid
 @property {string} _mt

@typedef SellerReset
 @property {string} msg
 @property {string} pc
 @property {number} target
 @property {number} bid
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
 @property {string} fromColorStr
 @property {string} toColorStr
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
 @property {number} rank

@typedef LandLot
 @property {string?} owner
 @property {number} mNum
 @property {number[]} mg
 @property {number} res

@typedef ?
 @property {LandLotDict} landlots
 @property {number} month
 @property {string} name
 @property {Player[]} players
 @property {Player} colony
 @property {GameState} state
 @property {number} mules
 @property {number} mulePrice
 @property {number[]} resPrice
 @property {string} _mt

@typedef {(
 'WAITINGFORALLJOIN'|
 'SCORE'|
 'LANDGRANT'|
 'WAITINGFORLANDAUCTION'|
 'LANDAUCTION'|
 'PLAYEREVENT'|
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
 LANDGRANT: "LANDGRANT",
 WAITINGFORLANDAUCTION: "WAITINGFORLANDAUCTION",
 LANDAUCTION: "LANDAUCTION",
 PLAYEREVENT: "PLAYEREVENT",
 IMPROVE: "IMPROVE",
 PROD: "PROD",
 AUCTIONPREP: "AUCTIONPREP",
 AUCTION: "AUCTION",
 UNKNOWN: "?"
}
/**@returns {Continue}*/ export function Continue(
) { return { _mt: 'Continue'};}

/**@returns {ClaimLot}*/ export function ClaimLot(
 /**@type {number}*/ e,
 /**@type {number}*/ n,
) { return { _mt: 'ClaimLot' , e: e
 , n: n
};}

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

/**@returns {TurnedOnMuleLight}*/ export function TurnedOnMuleLight(
 /**@type {string}*/ pc,
 /**@type {number}*/ lightColor,
) { return { _mt: 'TurnedOnMuleLight' , pc: pc
 , lightColor: lightColor
};}

/**@returns {InstallMule}*/ export function InstallMule(
 /**@type {number}*/ e,
 /**@type {number}*/ n,
) { return { _mt: 'InstallMule' , e: e
 , n: n
};}

/**@returns {UninstallMule}*/ export function UninstallMule(
 /**@type {number}*/ e,
 /**@type {number}*/ n,
) { return { _mt: 'UninstallMule' , e: e
 , n: n
};}

/**@returns {SellMule}*/ export function SellMule(
) { return { _mt: 'SellMule'};}

/**@returns {MuleRemovedFromScene}*/ export function MuleRemovedFromScene(
 /**@type {string}*/ pc,
) { return { _mt: 'MuleRemovedFromScene' , pc: pc
};}

/**@returns {Cantina}*/ export function Cantina(
) { return { _mt: 'Cantina'};}

/**@returns {Assay}*/ export function Assay(
 /**@type {number}*/ e,
 /**@type {number}*/ n,
) { return { _mt: 'Assay' , e: e
 , n: n
};}

/**@returns {AuctionLot}*/ export function AuctionLot(
 /**@type {number}*/ e,
 /**@type {number}*/ n,
) { return { _mt: 'AuctionLot' , e: e
 , n: n
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
 /**@type {string}*/ fromColorStr,
 /**@type {string}*/ toColorStr,
) { return { _mt: 'SetColor' , fromColorStr: fromColorStr
 , toColorStr: toColorStr
};}

/**@returns {Kick}*/ export function Kick(
 /**@type {string}*/ colorStr,
) { return { _mt: 'Kick' , colorStr: colorStr
};}

/**@returns {StartGame}*/ export function StartGame(
) { return { _mt: 'StartGame'};}

