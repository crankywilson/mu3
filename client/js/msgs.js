export * from './msgs_pregame.js';
import * as t from "./types.js";
import * as r from "./ren3d.js";
import { g, ui } from "./game.js";

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

  ui.aucbg.style.left = "-100%";
  ui.boardview.style.left = "0px";

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

export function CurrentGameState(/**@type {t.CurrentGameState}*/ msg)
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

  if (g.state.indexOf("AUCTION") > 0)
    r.stopAnimating();
  else
    r.startAnimating();
  
  UpdateGameState({gs:g.state, _mt:""});
  month = msg.g.month;
  showScores(msg.g.players, month);
}

export function PlayerRejoined(/**@type {t.PlayerRejoined}*/ msg)
{
}

export function UpdateGameState(/**@type {t.UpdateGameState}*/ msg)
{
  for (let p in g.players)  // this include non-playing players, but it doesn't matter
  {
    let spans = ui.plbox(p).getElementsByTagName('span');
    spans[NAMESPAN].style.color = 'white';
  }

  ui.msg.innerText = "";
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
    g.markers.clear();

  if (g.state == "PLAYEREVENT")
  {
    ui.msg.innerText = "Development for month #" + month + " to begin...";
    ui.msgblink.innerText = 'Click anywhere to continue.';
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
