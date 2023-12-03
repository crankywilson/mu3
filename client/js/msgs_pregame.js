import * as t from "./types.js";

export function AvailableGames(/**@type {t.AvailableGames}*/ msg)
{
  ui.boardview.style.visibility = "hidden";
  ui.pendinggame.style.visibility = "hidden";
  ui.availgamesdiv.style.visibility = "visible";
  ui.gamelist.options.length = 0;
  for (let i of msg.games) { ui.gamelist.options.add(new Option(i)); }
}

export function GameNameExists(/**@type {t.GameNameExists}*/ msg)
{
  alert("Couldn't create game - name is already in use.");
}

export function JoinedGameStats(/**@type {t.JoinedGameStats}*/ msg)
{
  ui.boardview.style.visibility = "hidden";
  ui.pendinggame.style.visibility = "visible";
  ui.availgamesdiv.style.visibility = "hidden";
}

