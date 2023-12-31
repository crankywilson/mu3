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
}

function showScores(/**@type {{s: number, c: string}[]}*/ scores, 
                    /**@type {number}*/ numPlayers, /**@type {number}*/ month)
{
  const leftPositions = [[],[42.5],[30,55],[10,42.5,75],[5,30,55,80]];
  let lpi = 0;
  
  scores.sort((a,b)=>{return b.s-a.s;});  // descending
  for (let ci of scores)
  {
    let lp = leftPositions[numPlayers][lpi];
    ui.plbox(ci.c).style.left = lp + '%';

    lpi++;
    if (g.state == "SCORE")
      setPlboxSpanText(ci.c, BOTTOMSPAN, "Score: " + ci.s + "  (#" + lpi + ")");
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

async function AddModelIfNeeded(/**@type {string}*/ color)
{
  await g.init3DComplete;
  let playerModel = g.models.player[color];
  if (playerModel.parent == null)
    g.scene.add(playerModel);
}

export function CurrentGameState(/**@type {t.CurrentGameState}*/ msg)
{
  show(ui.boardview);
  hide(ui.pendinggame);
  hide(ui.availgamesdiv);
  
  document.cookie = "?g=" + encodeURIComponent(msg.g.name) + 
                    "&c=" + g.myColor + "; max-age=3600";

  let scores = [];
  
  for (let p of msg.g.players) 
  {
    g.players[p.color] = p;
    setPlboxSpanText(p.color, NAMESPAN, p.name);
    setPlboxSpanText(p.color, MONEYSPAN, p.money);
    show(ui.plbox(p.color));
    scores.push({s:p.score, c:p.color});

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
  showScores(scores, msg.g.players.length, msg.g.month);
}

export function PlayerRejoined(/**@type {t.PlayerRejoined}*/ msg)
{
}

export function UpdateGameState(/**@type {t.UpdateGameState}*/ msg)
{
  ui.msg.innerText = "";
  g.state = msg.gs;

  for (let pi in g.players)
  {
    if (g.players[pi] == null) continue;
    setPlboxSpanText(pi, BOTTOMSPAN, "");
  }

  if (g.state == "IMPROVE")
  {
    let my = g.me();
    if (my.x > -2 && my.x < 2 && my.z > -2 && my.z < 2)
      r.switchCamView(true);
  }
}

export function MuleObtained(/**@type {t.MuleObtained}*/ msg)
{
  g.doLandMark = false;
  g.doAssayMark = false;

  setPlboxSpanText(msg.pc, MONEYSPAN, msg.newMoney);
  ui.mulecount.innerText = msg.numMules.toString();
  if (g.myColor != msg.pc) return;
  
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
  }
}

export function DestReached(/**@type {t.DestReached}*/msg)
{
  if (msg.pc != g.myColor)
  {
  }
}

export function NewMuleDest(/**@type {t.NewMuleDest}*/msg)
{
  if (msg.pc != g.myColor)
  {
  }
}

export function MuleDestReached(/**@type {t.MuleDestReached}*/msg)
{
  if (msg.pc != g.myColor)
  {
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

export function CantinaResult(/**@type {t.CantinaResult}*/msg)
{
  r.CantinaWinnings(msg);
}