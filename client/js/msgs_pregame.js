import * as t from "./types.js";
import { ui, send } from "./game.js"

const hidden = "hidden";
const visible = "inherit";

export function AvailableGames(/**@type {t.AvailableGames}*/ msg)
{
  ui.boardview.style.visibility = hidden;
  ui.pendinggame.style.visibility = hidden;
  ui.availgamesdiv.style.visibility = visible;
  ui.gamelist.options.length = 0;
  for (let i of msg.games) { ui.gamelist.options.add(new Option(i)); }

  /* autoconnect */
  if (ui.gamelist.length == 0)
    send(t.CreateGame('New Game', 'R'));
  else
    send(t.JoinGameRequest('New Game'));
}

export function JoinGameDenial(/**@type {t.JoinGameDenial}*/ msg)
{
  alert("Could not join game: " + msg.reason);
}

export function GameNameExists(/**@type {t.GameNameExists}*/ msg)
{
  alert("Couldn't create game - name is already in use.");
}

export function JoinedGameStats(/**@type {t.JoinedGameStats}*/ msg)
{
  ui.gamename.innerText = msg.gameName;
  ui.gameowner.innerText = msg.ownerName;
  ui.boardview.style.visibility = hidden;
  ui.pendinggame.style.visibility = visible;
  ui.availgamesdiv.style.visibility = hidden;
  ui.startgame.style.visibility = msg.youAreOwner ? visible : hidden;

  for (let c of ['R','Y','G','B'])
  {
    ui.namespan(c).innerText = "";
    ui.ip(c).innerText = "";
    ui.nameinput(c).style.display = msg.currentColor == c ? "inherit" : "none";
    ui.dcspan(c).style.visibility = hidden;
    ui.ccspan(c).style.visibility = hidden;
    ui.kick(c).style.visibility = hidden;
    ui.col(c).style.backgroundColor =  msg.currentColor == c ? "white" : "beige";
  }

  for (let p of msg.players)
  {
    let c = p.color;
    ui.nameinput(c).value = p.name;
    ui.namespan(c).innerText = c == msg.currentColor ? "Your Name:" : p.name;
    ui.ip(c).innerText = p.ip;
    if (msg.youAreOwner)
    {
      ui.ccspan(c).style.visibility = visible;
      ui.kick(c).style.visibility = c == msg.currentColor ? hidden : visible;
    }
    ui.desiredclr(c).innerText = p.colrReq == "NONE" ? c : p.colrReq;
    if (p.colrReq != p.color && p.colrReq != "NONE")
      ui.dcspan(c).style.visibility = visible;
  }

  let nameedit = ui.nameinput(msg.currentColor);
  if (nameedit.value[0] == '(') nameedit.select();
}
