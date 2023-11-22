import * as ws from "./websock.js";

/**
@typedef {import('../three/Three.js').Object3D} Object3D 
@typedef {import('../three/Three.js').Scene} Scene 
@typedef {import('../three/Three.js').Camera} Camera 
@typedef {import('../three/Three.js').AnimationClip} AnimationClip 
@typedef {import('../three/Three.js').Texture} Texture 
@typedef {import('../three/Three.js').Material} Material 
@typedef {import('../three/Three.js').Clock} Clock 
@typedef {import('../three/Three.js').WebGLRenderer} WebGLRenderer 
@typedef {import('../three/Three.js').Group} Group 
@typedef {import('./types.js').Msg} Msg 
**/

/**
@typedef Player
 @property {boolean} gameMember
 @property {string} name
 @property {number} money
 @property {string} colorStr
 @property {boolean} hasMule
 @property {Material?} plotBoundsMaterial
 @property {Texture?} flagTexture
**/
function DefaultPlayer(/** @type { string } */strColor)
{
  return {
    gameMember: false,
    name: "",
    money: 1000,
    colorStr: strColor,
    hasMule: false,
    plotBoundsMaterial: null,
    flagTexture: null
  };
}

/** @type { function? } */
export let mark3DInitialized = null;  // this immediately get overwitten by Promise constructor
                                      // at which point calling this as a function will mark
                                      // the Promise as complete...

function get3DInitResolver(/** @type { function } */ resolve, /** @type { function } */ unused)
{
  mark3DInitialized = resolve;
}

export let g = 
{
  players: 
  {
     /** @type {Player} */ 
     R: DefaultPlayer("R"),
     /** @type {Player} */ 
     Y: DefaultPlayer("Y"),
     /** @type {Player} */ 
     G: DefaultPlayer("G"),
     /** @type {Player} */ 
     B: DefaultPlayer("B")
  },
  
  /** @type {Player} */ //@ts-ignore
  me: null,
  
  /** @returns {Player} */ // the function is typed, unlike g.players[colorStr] 
  pl: function(/**@type {string}*/ colorStr)
  {
    return this.players[colorStr]; 
  },
  
  models: {
    /** @type {Object3D} */ //@ts-ignore
    mule: null,
    /** @type {Object3D} */ //@ts-ignore
    flag: null,
    /** @type {Object3D[]} */ //@ts-ignore
    prod: [null, null, null, null]
  },

  textures: {
    /** @type {Texture[]} */ //@ts-ignore
    crystiteLevelTexture: [null, null, null, null],
    /** @type {Texture[]} */ //@ts-ignore
    buldingResTexture: [null, null, null, null]
  },

  materials: {
    /** @type {Material[]} */ //@ts-ignore
    building: []
  },

  animations: {},

  /** @type {Camera} */ // @ts-ignore
  camera: null,
  /** @type {Scene} */ // @ts-ignore
  scene: null,
  /** @type {Clock} */ // @ts-ignore
  clock: null,
  /** @type {WebGLRenderer} */ // @ts-ignore
  renderer: null,
  /** @type {Group} */ //@ts-ignore
  buildingGroup: null,
  /** @type {Group} */ //@ts-ignore
  markers: null,
  /** @type {Group} */ //@ts-ignore
  prodGroup: null,

  buildingColor: 0x666666,
  muleStartX: 0,

  /** @type {WebSocket} */
  ws: ws.initWS(),

  send: function(/**@type {Msg}*/ msg)
  {
    this.ws.send(JSON.stringify(msg));
  },

  init3DComplete: new Promise(get3DInitResolver)
};

function e(/** @type { string } */ id)
{
  return document.getElementById(id) ?? new HTMLElement();
}
/**@returns {HTMLDivElement} */ // @ts-ignore  
function div(id) { return e(id); }
/**@returns {HTMLSelectElement} */ // @ts-ignore  
function sel(id) { return e(id); }

export let ui =
{
    msg: div("msg"),
    boardview: div("boardview"),
    availgamesdiv: div("availgamesdiv"),
    gamelist: sel("gamelist"),
    pendinggame: div("pendinggame"),
    joingame: e("joingame"),
    creategame: e("creategame"),
};



// allows these in global for debug access
globalThis.g = g;
globalThis.ui = ui;  

