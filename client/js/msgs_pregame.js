

import {g} from './game.js';
import * as t from "./types.js";

export function AvailableGames(/**@type {t.AvailableGames}*/ msg)
{
    ui.boardview.style.visibility = "hidden";
    ui.pendinggame.style.visibility = "hidden";
    ui.availgamesdiv.style.visibility = "visible";
    ui.gamelist.options.length = 0;
    for (let i of msg.games) { ui.gamelist.options.add(new Option(i)); }
}

export function CreateGame(/**@type {t.CreateGame}*/ msg)
{
  if (msg._mt = "") return;
  g.me.money -= 6;
}

