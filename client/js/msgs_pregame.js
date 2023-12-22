import * as t from "./types.js";
import { ui, send } from "./game.js"
const hidden = "hidden";
const visible = "visible";


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
/*
<td id="rcol" style="background-color: white; padding: 10px;">
      <span id="rnamespan" style="color: #5f4c28;">Your Name:</span>
      <input id="rnameinput" type="text" value="-Red-"><br>
      <span id="rip" style="color: #5f4c28;">255.255.255.255</span><br>
      <img src="img/red.png" style="position:relative"><br>
      <button id="rdesiredbtn" style="position: relative;">Desired Character</button><P>
      (Desired color is <span id="rdesiredclr" style="color:black">R</span>)<BR>
      Character color: <select id="rchangecolor" style="color:red"><option selected style="color: red;">R</option><option style="color:gold">Y</option><option style="color: green;">G</option><option style="color:blue">B</option></select>
      <P><button id="rkick" style="position: relative;">Kick Out</button><P>
    </td>
*/
export function JoinedGameStats(/**@type {t.JoinedGameStats}*/ msg)
{
  ui.gamename.innerText = msg.gameName;
  ui.gameowner.innerText = msg.ownerName;
  ui.boardview.style.visibility = hidden;
  ui.pendinggame.style.visibility = visible;
  ui.availgamesdiv.style.visibility = hidden;
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
      ui.dcspan(c).style.visibility = visible;
      ui.ccspan(c).style.visibility = visible;
      ui.kick(c).style.visibility = c == msg.currentColor ? hidden : visible;
    }
  }

  let nameedit = ui.nameinput(msg.currentColor);
  if (nameedit.value[0] == '(') nameedit.select();

  // might want to set cookie for/if game owner
}

