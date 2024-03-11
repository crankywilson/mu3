export * from './msgs_pregame.js';
import * as t from "./types.js";
import * as r from "./ren3d.js";
import { g, ui, send, fakeMouseMove, LandLotStr } from "./game.js";

function show(/**@type {HTMLElement}*/e)
{
  if (e.style.display == 'none')
    e.style.display = 'inherit';

  if (e.style.visibility == 'hidden')
    e.style.visibility = 'inherit';
}

function hide(/**@type {HTMLElement}*/e)
{
  e.style.visibility = 'hidden';
  if (e instanceof HTMLInputElement)
  {
    if (e.labels != null)
    {
      for (let l of e.labels) l.style.visibility = 'hidden';
    }
  }
}

const NAMESPAN=0;
const MONEYSPAN=1;
const BOTTOMSPAN=2;

function setPlboxSpanText(/**@type {string}*/ clr, /**@type {number}*/ i, /**@type {string|number}*/ str)
{
  let spans = ui.plbox(clr).getElementsByTagName('span');
  if (typeof str=="number") str=str.toString();
  spans[i].innerText = str;
  if (i == NAMESPAN && clr == g.myColor)
    spans[NAMESPAN].style.textDecoration = "underline";
}

function showScores(/**@type {t.Player[]}*/ players, /**@type {number}*/ month)
{
  const leftPositions = [[],[42.5],[30,55],[10,42.5,75],[5,30,55,80]];
  let lastScore = 0;
  let lastRank = 0;
  let i = 0;
  let numPlayers = players.length;
  const xdist = .4;
  const zdist = .3
  let setMinZ =  ((numPlayers-1)/2) * -xdist;
  let setMinX =  ((numPlayers-1)/2) * -zdist;
  
  for (let p of players)
  {
    let lp = leftPositions[numPlayers][i];
    ui.plbox(p.color).style.left = lp + '%';

    let rank = (p.score == lastScore) ? lastRank : p.rank;
    if (g.state == "SCORE")
      setPlboxSpanText(p.color, BOTTOMSPAN, "Score: " + p.score + 
        "  (#" + rank + ")");

    if (p.color == g.myColor)
      g.mySettlementZ = zdist * i + setMinZ; 
    
    if (g.state == "SCORE" || true)
    {
      AddModelIfNeeded(p.color, zdist * i + setMinX, xdist * i + setMinZ);
    }

    i++;
    lastScore = p.score;
    lastRank = rank;
  }

  if (g.state != "SCORE") return;
  
  if (month == 1)
    ui.msg.innerText = 'All planeteers have arrived to Irata.  You have 12 months to colonize this area.';
  else
    ui.msg.innerText = 'Beginning of month ' + month + '. ';  /* colony msg will have to come in separate msg */

  ui.msgblink.innerText = 'Click anywhere to continue.';

  g.landlotOverlay.visible = false;
  g.prepSound.play();
}

async function AddModelIfNeeded(/**@type {string}*/ color, /**@type {number?}*/ x=null, /**@type {number?}*/ z=null)
{
  await g.init3DComplete;
  let playerModel = g.models.player[color];
  if (playerModel.parent == null)
    g.scene.add(playerModel);

  if (x != null) playerModel.position.x = x;
  if (z != null) playerModel.position.z = z;
}

let month = 1;
let showScoresCalled = false;

export async function CurrentGameState(/**@type {t.CurrentGameState}*/ msg)
{
  show(ui.boardview);
  hide(ui.pendinggame);
  hide(ui.availgamesdiv);
  
  document.cookie = "?g=" + encodeURIComponent(msg.g.name) + 
                    "&c=" + g.myColor + "; max-age=3600";

  for (let p of msg.g.players) 
  {
    g.players[p.color] = p;
    setPlboxSpanText(p.color, NAMESPAN, p.name);
    setPlboxSpanText(p.color, MONEYSPAN, p.money);
    show(ui.plbox(p.color));
    AddModelIfNeeded(p.color);
  }

  g.landlots = msg.g.landlots;
  g.state = msg.g.state;
  
  if (!g.mgPlaced)
    r.SetupMounds();
  r.SyncLandGeom();

  if (g.state.indexOf("AUCTION") > -1)
    r.stopAnimating();
  else
    r.startAnimating();
  
  await g.init3DComplete;
  
  UpdateGameState({gs:g.state, _mt:""});
  month = msg.g.month;
  showScores(msg.g.players, month);

  // hack for page reload during auction
  if (!showScoresCalled && g.state.indexOf("AUCTION") > -1)
    UpdateAuctionUIElems();

  showScoresCalled = true;
}

export function PlayerRejoined(/**@type {t.PlayerRejoined}*/ msg)
{
}

export function StartTimer(/**@type {t.StartTimer}*/ msg)
{
  let now = Date.now();
  g.developStopTime = now + ((msg.pct / 100) * msg.fullTimeMilliSecs);
  g.developStartTime = g.developStopTime - msg.fullTimeMilliSecs;
}

export function UpdateGameState(/**@type {t.UpdateGameState}*/ msg)
{
  for (let p in g.players)  // this include non-playing players, but it doesn't matter
  {
    let spans = ui.plbox(p).getElementsByTagName('span');
    spans[NAMESPAN].style.color = 'white';
  }

  TradeEnd();
  hide(ui.time(g.myColor));
  g.prodGroup.clear();

  ui.msg.innerText = "";
  if (!ui.msgblink.innerText.startsWith("You won") && 
      !ui.msgblink.innerText.includes("time"))
    ui.msgblink.innerText = "";
  g.waitingForServerResponse = false;
  g.state = msg.gs;

  for (let pi in g.players)
  {
    if (g.players[pi] == null) continue;
    setPlboxSpanText(pi, BOTTOMSPAN, "");
  }

  if (g.state == "LANDGRANT")
  {
    ui.msg.innerText = "Land Grant for month #" + month +
      ". Click on a land lot to claim.";
    fakeMouseMove();
  }

  if (g.state == "IMPROVE")
  {
    g.doAssayMark = false;
    g.doLandMark = false;
    let my = g.me();
    if (my.x > -2 && my.x < 2 && my.z > -2 && my.z < 2)
      r.switchCamView(true);
  }

  if (g.state == "PLAYEREVENT" || g.state == "PROD")
  {
    g.markers.clear();
    if (g.state == "PROD")
      g.didProd = false;
  }

  if (g.state == "PLAYEREVENT")
  {
    ui.msg.innerText = "Development for month #" + month + " to begin...";
    ui.msgblink.innerText = 'Click anywhere to continue.';
  }

  if (g.state.indexOf("AUCTION") >= 0)
  {
    r.stopAnimating();
    ui.aucbg.style.left = "0px";
    ui.boardview.style.left = "100%";
    if (g.state == "AUCTIONPREP")
    {
      hide(ui.ablock);
      show(ui.preblock);
    }
    else
    {
      show(ui.ablock);
      hide(ui.preblock);
    }
    UpdateAuctionUIElems();
  }
  else
  {
    r.startAnimating();
    ui.aucbg.style.left = "-100%";
    ui.boardview.style.left = "0px";
  }
}

export function MuleObtained(/**@type {t.MuleObtained}*/ msg)
{
  g.doLandMark = false;
  g.doAssayMark = false;

  setPlboxSpanText(msg.pc, MONEYSPAN, msg.newMoney);
  ui.mulecount.innerText = msg.numMules.toString();
  if (g.myColor != msg.pc) 
  {
    g.muleLight[msg.pc].visible = false;
    return;
  }

  r.buymule();  
}

export function MuleSold(/**@type {t.MuleSold}*/ msg)
{
  setPlboxSpanText(msg.pc, MONEYSPAN, msg.newMoney);
  ui.mulecount.innerText = msg.newNumMules.toString();
  if (g.myColor != msg.pc) return;
  
  r.sellMuleConfirmed();  
}

export function NewDest(/**@type {t.NewDest}*/msg)
{
  if (msg.pc != g.myColor)
  {
    let p = g.players[msg.pc];
    if (p == null) return;
    p.x = msg.x;
    p.z = msg.z;
    p.dest = {x:msg.destx, z:msg.destz, spd:msg.destspd};
    let m = g.models.player[msg.pc];
    m.position.x = msg.x;
    m.position.z = msg.z;
  }
}

export function DestReached(/**@type {t.DestReached}*/msg)
{
  if (msg.pc != g.myColor)
  {
    let p = g.players[msg.pc];
    if (p == null) return;
    p.x = msg.x;
    p.z = msg.z;
    p.dest = null;
    let m = g.models.player[msg.pc];
    m.position.x = msg.x;
    m.position.z = msg.z;
    m.rotation.y = 0;
    g.mixer[msg.pc].setTime(.55);
  }
}

export function NewMuleDest(/**@type {t.NewMuleDest}*/msg)
{
  if (msg.pc != g.myColor)
  {
    let p = g.players[msg.pc];
    if (p == null) return;
    let r = -1;
    if (p.mule != null) r = p.mule.resOutfit;
    let mm = g.models.playerMule[msg.pc];
    if (mm.parent == null)
      g.scene.add(mm);
    mm.position.x = msg.x;
    mm.position.z = msg.z;
    p.mule = {x: msg.x, z: msg.z, resOutfit:r, dest:
       {x:msg.destx, z:msg.destz, spd:msg.destspd}};
  }
}

export function MuleDestReached(/**@type {t.MuleDestReached}*/msg)
{
  if (msg.pc != g.myColor)
  {
    let p = g.players[msg.pc];
    if (p == null) return;
    let m = p.mule;
    if (m == null) return;
    m.x = msg.x;
    m.z = msg.z;
    m.dest = null;
    let mm = g.models.playerMule[msg.pc];
    if (mm.parent == null)
      g.scene.add(mm);
    mm.position.x = msg.x;
    mm.position.z = msg.z;
  }
}

export function MuleDenied(/**@type {t.MuleDenied}*/msg)
{
  r.settlementClearOperation();
  r.tempBlink(msg.reason);
}

export function MuleOutfitDenied(/**@type {t.MuleOutfitDenied}*/msg)
{
  r.settlementClearOperation();
  r.tempBlink(msg.reason);
}

export function MuleOutfitAccepted(/**@type {t.MuleOutfitAccepted}*/msg)
{
  setPlboxSpanText(msg.pc, MONEYSPAN, msg.newMoney); 
  let p = g.players[msg.pc];
  if (p != null && p.mule != null)
      p.mule.resOutfit = msg.resOutfit;

  if (g.myColor == msg.pc)
    r.outfitmule();  
}

export function TurnedOnMuleLight(/**@type {t.TurnedOnMuleLight}*/msg)
{
  if (msg.pc != g.myColor)
    r.TurnOnMuleLight(msg.pc, msg.lightColor);
}

export function MuleInstalled(/**@type {t.MuleInstalled}*/msg)
{
  r.MuleInstalled(msg);
}

export function MuleRemovedFromScene(/**@type {t.MuleRemovedFromScene}*/msg)
{
  if (msg.pc != g.myColor)
    r.RemoveMuleFromScene(msg.pc);
}

export function MuleRemoved(/**@type {t.MuleRemoved}*/msg)
{
  r.UninstallMule(msg);
}

export function CantinaResult(/**@type {t.CantinaResult}*/msg)
{
  r.CantinaWinnings(msg);
  let spans = ui.plbox(msg.pc).getElementsByTagName('span');
  spans[MONEYSPAN].innerText = msg.newMoney.toString();
  ShowWaiting(msg);
}

export function TimeUp(/**@type {t.TimeUp}*/msg)
{
  r.removePlayerAndMule(msg.pc);
}

export function ShowWaiting(/**@type {t.ShowWaiting}*/msg)
{
  let spans = ui.plbox(msg.pc).getElementsByTagName('span');
  spans[NAMESPAN].style.color = 'black';
}

export function LotDenied(/**@type {t.LotDenied}*/msg)
{ // msg only sent to player requesting...
  g.waitingForServerResponse = false;
  g.lloMaterial.color.set(0xffffff);
}

export function LotGranted(/**@type {t.LotGranted}*/msg)
{ 
  if (msg.pc == g.myColor)
  {
    g.waitingForServerResponse = false;
    g.lloMaterial.color.set(0xffffff);
    g.landlotOverlay.visible = false;
  }

  r.ClaimLot(msg.pc, msg.k);  // handles setting g.landlots
}

export function AssayResult(/**@type {t.AssayResult}*/msg)
{
  r.AssayResult(msg);
}

let charge = new Audio("/sound/charge.mp3");
let volga = new Audio("/sound/volga.mp3")
export function PlayerEventText(/**@type {t.PlayerEventText}*/msg)
{
  ui.msg.innerText = msg.fullMsg;
  if (msg.isGood) charge.play();
  else volga.play();
}

export function PlayerEvent(/**@type {t.PlayerEvent}*/msg)
{
  let spans = ui.plbox(msg.pc).getElementsByTagName('span');
  spans[BOTTOMSPAN].innerText = msg.shortMsg;
  spans[MONEYSPAN].innerText = msg.money.toString();
  if (msg.lotKey != null)
  {
    if (msg.addLot)
      r.ClaimLot(msg.pc, msg.lotKey);
    else
      r.UnclaimLot(msg.lotKey);
  }
}

// this probably should be moved to Production msg, but oh well, we'll straddle
/**@type {t.ColonyEvent}*/
let colonyEvent = {fullMsg:"",eventType:-1,lotKey:null,beforeProd:false,_mt:""};
export function ColonyEvent(/**@type {t.ColonyEvent}*/msg)
{
  colonyEvent = msg;
}

export function Production(/**@type {t.Production}*/msg)
{
  r.Production(msg, colonyEvent);
}

function UpdateAuctionUIElems()
{
  let myLeftPct = 0;
  for (let pc in g.players)
  {
    if (g.players[pc] == null)
    {
      hide(ui.cb(pc));
      hide(ui.cbl(pc));
      continue;
    }

    show(ui.pab(pc));
    show(ui.pabbs(pc));
    let plboxleftPct =  Number(ui.plbox(pc).style.left.replace('%',''))
    ui.pab(pc).style.left = plboxleftPct + '%';
    ui.cb(pc).style.left = (plboxleftPct + 3.5) + '%';
    ui.cbl(pc).style.left = (plboxleftPct + 3.5) + '%';

    if (g.myColor == pc) myLeftPct = plboxleftPct;
    if (g.myColor != pc)
    {
      hide(ui.bsb(pc));
      hide(ui.bss(pc));
      hide(ui.btnbuysell(pc))
    }
  }

  ui.aucbuy.style.left = (myLeftPct + 4.5) + "%";
  ui.aucsell.style.left = (myLeftPct + 4.5) + "%";
  ui.aucdone.style.left = (myLeftPct + 14.5) + "%";
  ui.targetline.style.left = (myLeftPct + 15) + "%";
  ui.target.style.left = (myLeftPct + 14.5) + "%";
  ui.targetval.style.left = (myLeftPct + 11.25) + "%";

  /** @type {Object.<string, string>} */
  let colorStr = {R:'#ff0000',Y:'#ffff00',G:'#00ff00',B:'#0000ff'};
  ui.target.style.backgroundColor = colorStr[g.myColor];
}

export function PreAuctionStat(/**@type {t.PreAuctionStat}*/ msg)
{
  ui.start(msg.pc).innerText = msg.start.toString();
  ui.used(msg.pc).innerText = msg.used.toString();
  ui.spoiled(msg.pc).innerText = msg.spoiled.toString();
  ui.prod(msg.pc).innerText = msg.produced.toString();
  ui.curr(msg.pc).innerText = msg.current.toString();
  
  if (msg.surplus >= 0)
  {
    ui.sl(msg.pc).innerText = "SURPLUS:";
    ui.surplus(msg.pc).innerHTML = "&nbsp;&nbsp + " + msg.surplus + " &nbsp;&nbsp; ";
    ui.surplus(msg.pc).style.backgroundColor = "green";
  }
  else
  {
    ui.sl(msg.pc).innerText = "SHORTAGE:";
    ui.surplus(msg.pc).innerHTML = "&nbsp;&nbsp " + msg.surplus + " &nbsp;&nbsp; ";
    ui.surplus(msg.pc).style.backgroundColor = "red";
  }

  if (msg.surplus > 0) ui.bss(msg.pc).checked = true;
  else ui.bsb(msg.pc).checked = true;
}

export function CurrentAuction(/**@type {t.CurrentAuction}*/ msg)
{
  if (msg.auctionType == 0) ui.aname.innerText = "FOOD Auction";
  if (msg.auctionType == 1) ui.aname.innerText = "ENERGY Auction";
  if (msg.auctionType == 2) ui.aname.innerText = "SMITHORE Auction";
  if (msg.auctionType == 3) ui.aname.innerText = "CRYSTITE Auction";
  if (msg.auctionType == 4) 
  {
    ui.aname.innerText = "LAND Auction";
    hide(ui.aucsell);
    hide(ui.aucbuy);
    hide(ui.storebuy);
    hide(ui.storebuy1);
  }

  ui.mnum.innerText = msg.month.toString();


  if (msg.auctionType == 4)
    ui.msg.innerHTML = "(Bidding starts at \u20BF <span>" + msg.resPrice + "</span>)";
  else
    ui.msg.innerHTML = "(Store has <span>" + msg.avail + "</span> units.  Store buys for \u20BF <span>" + msg.resPrice + "</span>)";

  ui.msg.style.backgroundColor = "";
  ui.storeunits.innerText = msg.avail.toString();
  ui.storesell.style.visibility =  (msg.avail < 1) ? "hidden" : "inherit";
  ui.storesell1.style.visibility =  (msg.avail < 1) ? "hidden" : "inherit";
  ui.storesell2.style.visibility =  (msg.avail < 1) ? "hidden" : "inherit";
  ui.sellline.style.visibility =  (msg.avail < 1) ? "hidden" : "inherit";
  ui.sellline.style.bottom = "81%";
  ui.storebuy.style.visibility = "inherit";
  ui.storebuy1.style.visibility = "inherit";
  ui.buyline.style.bottom = "11%";
  ui.buyline.style.visibility = "inherit";
  ui.pab(g.myColor).style.visibility = "inherit";

  ui.aucdone.style.visibility = "inherit";
  ui.targetline.style.visibility = "inherit";
  ui.target.style.visibility = "inherit";
  ui.targetval.style.visibility = "inherit";

  g.minBid = msg.resPrice;
  ui.storebuyprice.innerText = g.minBid.toString();
  g.maxBid = g.minBid + 35;
  g.bidIncr = msg.auctionType > 2 ? 4 : 1;
  if (msg.avail < 1)
    g.maxBid = -1; 
  else
    ui.storesellprice.innerText = g.maxBid.toString();

  g.passVal = g.minBid - (3 * g.bidIncr);
  g.passThresh = g.passVal + g.bidIncr;
  g.outVal = g.maxBid + (5 * g.bidIncr);
  g.outThresh = g.outVal - g.bidIncr;
  ui.rcbl.style.visibility = "hidden";
  ui.ycbl.style.visibility = "hidden";
  ui.gcbl.style.visibility = "hidden";
  ui.bcbl.style.visibility = "hidden";
}

export function BuySell(/**@type {t.BuySell}*/msg)
{
  let img = ui.cb(msg.pc);
  let letter = msg.pc.toLowerCase();
  if (msg.buy)
  {
    if (img instanceof HTMLImageElement) img.src = "img/" + letter + "buy.png";
    if (g.state == "AUCTIONPREP") setPlboxSpanText(msg.pc, BOTTOMSPAN, "(Buying)");
    img.style.bottom = "0%";
    if (msg.pc == g.myColor)
    {
      ui.target.style.bottom = "5%";
      ui.aucbuy.style.visibility = "hidden";
      ui.aucsell.style.visibility = g.auctionRes.length ? "inherit" : "hidden";
      g.buying = true;
      ui.targetval.innerText = "(Drag)";
    }
  }
  else
  {
    if (img instanceof HTMLImageElement) img.src = "img/" + letter + "sell.png";
    if (g.state == "AUCTIONPREP") setPlboxSpanText(msg.pc, BOTTOMSPAN, "(Selling)");
    if (msg.pc == g.myColor)
    {
      img.style.bottom = "86%";
      ui.target.style.bottom = "91%";
      ui.aucbuy.style.visibility = "inherit";
      ui.aucsell.style.visibility = "hidden";
      g.buying = false;
      ui.targetval.innerText = "(Drag)";
    }
  }
}

let ssa = [
  new Audio("/sound/step.mp3"),
  new Audio("/sound/step.mp3"),
  new Audio("/sound/step.mp3")];
 let ssi = 0;
 async function stepSound()
 {
   ssa[ssi%ssa.length].play();
   ssi++;
 }

export function Bids(/**@type {t.Bids}*/m)
{
  let anyRealBids = false;

  g.minBid = m.minBid;
  g.maxBid = m.minBid + (35 * g.bidIncr);
  g.passVal = m.minBid - (3 * g.bidIncr);
  g.passThresh = g.passVal + g.bidIncr;
  g.outVal = g.maxBid + (5 * g.bidIncr);
  g.outThresh = g.outVal - g.bidIncr;

  for (let bid of m.current)
  {
    let img = ui.cb(bid.pc);
    let lbl = ui.cbl(bid.pc);
    let newBid = bid.amt;

    if (newBid == 0)
    { 
      img.style.bottom = "0%";
      lbl.style.visibility = "hidden";
    }
    else if (newBid == 9999)
    {
      img.style.bottom = "86%";
      lbl.style.visibility = "hidden";
    }
    else
    {
      anyRealBids = true;
      img.style.bottom = ((newBid - g.minBid) * 2 / g.bidIncr + 11) + '%';
      ui.cbv(bid.pc).innerText = newBid.toString();
      let r = img.getBoundingClientRect();
      let p = r;
      if (img.parentElement != null)
        p = img.parentElement.getBoundingClientRect();

      //lbl.style.left = r.left + 5 + "px";
      lbl.style.top = r.bottom - p.top + "px";
      lbl.style.visibility = "visible";
      lbl.innerText = (bid.buying ? "Bid: " : "Ask: ");
      lbl.appendChild(ui.cbv(bid.pc));  // some hackery to avoid creating separate span for lbl innerText
    }
  
    if (bid.pc == g.myColor)
      g.curbid = newBid;

    //if (img instanceof HTMLImageElement) 
    //  img.src = "img/" + imgprefix[char] + (m.buying[char] ? "buy.png" : "sell.png");
  }

  if (m.highestBuyPrice > 0 && m.highestBuyPrice < 9999)
  {
    ui.buyline.style.bottom = ((m.highestBuyPrice - g.minBid) * 2 / g.bidIncr + 11) + '%'; 
    ui.buyline.style.visibility = "inherit";
  }
  else
    ui.buyline.style.visibility = "hidden";

  if (m.lowestSellPrice > 0 && m.lowestSellPrice < 9999)
  {
    ui.sellline.style.bottom = ((m.lowestSellPrice - g.minBid) * 2 / g.bidIncr + 11) + '%'; 
    ui.sellline.style.visibility = "inherit";
    g.selloffers = true;
  }
  else
  {
    ui.sellline.style.visibility = "hidden";
    g.selloffers = false;
  }

  ui.storebuy.style.visibility = (m.storeBuy) ? "inherit" : "hidden";
  ui.storebuy1.style.visibility = (m.storeBuy) ? "inherit" : "hidden";

  if (anyRealBids)
    stepSound();
}

export function HighlightTrade(/**@type {t.HighlightTrade}*/m)
{
  TradeEnd();
  if (m.buyer.length == 1)
    ui.cb(m.buyer).className = 'trading';
  else
    ui.storebuy.className = 'trading';

  if (m.seller.length == 1)
    ui.cb(m.seller).className = 'trading';
  else
    ui.storesell.className = 'trading';
}


export function TradeEnd(/**@type {t.TradeEnd}*/m)
{
  ui.rcb.className = '';
  ui.gcb.className = '';
  ui.ycb.className = '';
  ui.bcb.className = '';

  ui.storebuy.className = '';
  ui.storesell.className = '';
}

 export function UnitsTraded(/**@type {t.UnitsTraded}*/m)
 {
  ui.msg.innerText = "Units Traded: " + m.num;
  Res(m.buyer);
  Res(m.seller);
  r.beep();
 }

 export function CurrentLeader(/**@type {t.CurrentLeader}*/m)
 {
  if (m.anyBidders)
  {
    if (ui.cb(m.p).className != 'trading')
    {
      TradeEnd();
      ui.cb(m.p).className = 'trading';
    }
  }
  else
  {
    TradeEnd();
  }
 }

 export function AuctionTime(/**@type {t.AuctionTime}*/m)
 {
   let timeEl = ui.time(g.myColor);
   show(timeEl);
   timeEl.style.width = (m.num * 100) + "%";
 }

 export function AuctionResult(/**@type {t.AuctionResult}*/m)
 {
    hide(ui.aucdone);
    hide(ui.target);
    hide(ui.targetval);
    hide(ui.targetline);
    hide(ui.time(g.myColor));

    let mat = g.landlotOverlay.material;
    // @ts-ignore
    mat.opacity =.5;
    g.landlotOverlay.visible = false;

    if (m.sold)
    {
      ui.msg.innerText = "Lot sold";
      r.ClaimLot(m.winner, m.lot);
      setPlboxSpanText(m.winner, MONEYSPAN, m.newMoney);
    }
    else if (ui.aname.innerText.startsWith("LAND"))
    {
      ui.msg.innerText = "Lot didn't sell.";
    }

    new Audio("/sound/bell.mp3").play();
 }

export function ConfirmTrade(/**@type {t.ConfirmTrade}*/m)
{
  if (m.buyer == g.myColor)
  {
    if (m.price == g.curbid && g.target >= m.price)
    {
      send(t.TradeConfirmed(m.tradeID));
      return;
    }
  }

  else if (m.seller == g.myColor)
  {
    if (m.price == g.curbid && g.target <= m.price)
    {
      send(t.TradeConfirmed(m.tradeID));
      return;
    }
  }

  console.log("out of sync confirmation requested...");
}

export function SellerReset(/**@type {t.SellerReset}*/m)
{
  if (m.pc == "COLONY")
  {
    ui.storesell.style.visibility =  "hidden";
    ui.storesell1.style.visibility = "hidden";
    ui.storesell2.style.visibility = "hidden";
  }

  ui.msg.innerText = m.msg;
  if (m.pc == g.myColor)
  {
    let targ = g.outVal;
    ui.target.style.bottom = ((targ - g.minBid) * 2 / g.bidIncr + 11) + '%';
    ui.targetval.innerText = 'Target: Out'; 
  }
}

export function BuyerReset(/**@type {t.BuyerReset}*/m)
{
  ui.msg.innerText = m.msg;
  if (m.pc == g.myColor)
  {
    let targ = g.passVal;
    ui.target.style.bottom = ((targ - g.minBid) * 2 / g.bidIncr + 11) + '%';
    ui.targetval.innerText = 'Target: Pass'; 
  }
}

export function Res(/**@type {t.Res}*/m)
{
  if (m.pc.length == 1)
  {
    let suffix = '';
    if (m.needed > m.res) suffix = ' [/ ' + m.needed + ']';
    if (m.label.length > 0)
      setPlboxSpanText(m.pc, BOTTOMSPAN, m.label + ": " + m.res + suffix);
    setPlboxSpanText(m.pc, MONEYSPAN, m.money);
  }

  if (m.pc == 'COLONY')
  {
    ui.storeunits.innerText = m.res.toString();
  }
}

export function LotAuction(/**@type {t.LotAuction}*/ l)
{
  ui.msg.innerText = "Lot " + LandLotStr(l.e, l.n) + " for sale.";
  ui.msgblink.innerText = 'Click anywhere to continue.'; 
  g.landlotOverlay.position.x = l.e * 4;
  g.landlotOverlay.position.z = l.n * -4;
  g.landlotOverlay.visible = true;
  hide(ui.aucdone);
}



