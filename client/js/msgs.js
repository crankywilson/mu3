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

export function CurrentGameState(/**@type {t.CurrentGameState}*/ msg)
{
  show(ui.boardview);
  hide(ui.pendinggame);
  hide(ui.availgamesdiv);
  
  if (msg.g.state.indexOf("AUCTION") > 0)
    r.stopAnimating();
  else
    r.startAnimating();
}