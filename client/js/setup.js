import * as THREE from '../three/Three.js';
import * as t from "../types.js";
import {g, ui} from "./game.js"

function setup()
{
  let scene = new THREE.Scene();
  g.me.name = "New Player";

  ui.msg.innerText += "\nModules Loaded";
}


function handleMsg(/** @type {t.Msg} */ msg)
{
  if (msg._mt = "") return;
  g.me.money -= 6;
}

setup();
