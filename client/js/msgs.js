export * from './msgs_pregame.js';
import * as t from "./types.js";
import * as r from "./ren3d.js";

import { ui } from "./game.js"

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

function showScores(/**@type {{s: number, c: string}[]}*/ scores, /**@type {number}*/ numPlayers)
{
  const leftPositions = [[],[42.5],[30,55],[10,42.5,75],[5,30,55,80]];
  let lpi = 0;
  
  scores.sort((a,b)=>{return b.s-a.s;});  // descending
  for (let ci of scores)
  {
    let lp = leftPositions[numPlayers][lpi];
    ui.plbox(ci.c).style.left = lp + '%';

    lpi++;
    setPlboxSpanText(ci.c, BOTTOMSPAN, "Score: " + ci.s + "  (#" + lpi + ")");
  }
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

  if (msg.g.state.indexOf("AUCTION") > 0)
    r.stopAnimating();
  else
    r.startAnimating();

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
  
  if (msg.g.state == "SCORE")
    showScores(scores, msg.g.players.length);
}

export function PlayerRejoined(/**@type {t.PlayerRejoined}*/ msg)
{
}