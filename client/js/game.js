import * as t from "./types.js";
import {
  camShowingSettlement,
  getLandLotObjForMouse
} from "./ren3d.js";

/**
@typedef {import('../three/Three.js').Object3D} Object3D 
@typedef {import('../three/Three.js').Scene} Scene 
@typedef {import('../three/Three.js').PerspectiveCamera} Camera 
@typedef {import('../three/Three.js').AnimationClip} AnimationClip 
@typedef {import('../three/Three.js').Texture} Texture 
@typedef {import('../three/Three.js').Material} Material 
@typedef {import('../three/Three.js').Clock} Clock 
@typedef {import('../three/Three.js').WebGLRenderer} WebGLRenderer 
@typedef {import('../three/Three.js').Group} Group 
@typedef {import('../three/Three.js').AnimationMixer} Mixer 
**/

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
  /** @type {Object.<string, t.Player?>} */ 
  players: 
  {
     /** @type {t.Player?} */ 
     R: null,
     /** @type {t.Player?} */ 
     Y: null,
     /** @type {t.Player?} */ 
     G: null,
     /** @type {t.Player?} */ 
     B: null
  },
  
  myColor: "?",

  me: function() { return this.players[this.myColor]; }, 
  
  models: {
    /** @type {Object3D} */ //@ts-ignore
    mule: null,
    /** @type {Object3D} */ //@ts-ignore
    flag: null,
    /** @type {Object3D[]} */ //@ts-ignore
    prod: [null, null, null, null],
    /** @type {Object.<string, Object3D>} */ //@ts-ignore
    player:
    {
      R: null,
      Y: null,
      G: null,
      B: null
    }
  },

  /** @type {Object.<string, Mixer>} */ //@ts-ignore
  mixer:
  {
    R: null,
    Y: null,
    G: null,
    B: null
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

  /** @type {Group} */ //@ts-ignore
  buildingsGroup: null,

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

  prepSound: new Audio("/sound/prep.wav"),
  notSound:  new Audio("/sound/not.wav"),
  stepSound: new Audio("/sound/step.mp3"),
  beepSound: new Audio("/sound/beep.wav"),

  /** @type {t.LandLotDict} */
  landlots: {},
  moundGeomPlaced: false,
  doLandLotOverlay: true,
  /** @type {Object3D?} */ 
  landlotOverlay: null,

  /** @type {t.GameState} */
  state: "?",


  /** @type {WebSocket} */
  // @ts-ignore
  ws: null,

  init3DComplete: new Promise(get3DInitResolver)
};

export function send(/**@type {t.Msg}*/ msg)
{
  g.ws.send(JSON.stringify(msg));
}

function e(/** @type { string } */ id)
{
  return document.getElementById(id) ?? new HTMLElement();
}
/**@returns {HTMLDivElement} */ // @ts-ignore  
function div(id) { return e(id); }
/**@returns {HTMLSelectElement} */ // @ts-ignore  
function sel(id) { return e(id); }
/**@returns {HTMLInputElement} */ // @ts-ignore  
function inp(id) { return e(id); }
/**@returns {HTMLButtonElement} */ // @ts-ignore  
function btn(id) { return e(id); }

/* autogenerated ui: */
export let ui =
{
  boardview: div('boardview'),
  sett: div('sett'),
  mulecount: e('mulecount'),
  mulecost: e('mulecost'),
  aucbg: div('aucbg'),
  auc: div('auc'),
  aname: e('aname'),
  mnum: e('mnum'),
  preblock: div('preblock'),
  pa1: div('pa1'),
  start1: e('start1'),
  used1: e('used1'),
  spoiled1: e('spoiled1'),
  prod1: e('prod1'),
  curr1: e('curr1'),
  req1: e('req1'),
  diff1: e('diff1'),
  pab1: div('pab1'),
  bs1s: inp('bs1s'),
  bs1b: inp('bs1b'),
  pa2: div('pa2'),
  start2: e('start2'),
  used2: e('used2'),
  spoiled2: e('spoiled2'),
  prod2: e('prod2'),
  curr2: e('curr2'),
  req2: e('req2'),
  diff2: e('diff2'),
  pab2: div('pab2'),
  bs2s: inp('bs2s'),
  bs2b: inp('bs2b'),
  pa3: div('pa3'),
  start3: e('start3'),
  used3: e('used3'),
  spoiled3: e('spoiled3'),
  prod3: e('prod3'),
  curr3: e('curr3'),
  req3: e('req3'),
  diff3: e('diff3'),
  pab3: div('pab3'),
  bs3s: inp('bs3s'),
  bs3b: inp('bs3b'),
  pa4: div('pa4'),
  start4: e('start4'),
  used4: e('used4'),
  spoiled4: e('spoiled4'),
  prod4: e('prod4'),
  curr4: e('curr4'),
  req4: e('req4'),
  diff4: e('diff4'),
  pab4: div('pab4'),
  bs4s: inp('bs4s'),
  bs4b: inp('bs4b'),
  ablock: div('ablock'),
  storebuy: e('storebuy'),
  storesell: e('storesell'),
  storesell1: div('storesell1'),
  storeunits: e('storeunits'),
  storesell2: div('storesell2'),
  storebuy1: div('storebuy1'),
  aucsell: btn('aucsell'),
  aucbuy: btn('aucbuy'),
  aucdone: btn('aucdone'),
  sellline: e('sellline'),
  buyline: e('buyline'),
  cb1: e('cb1'),
  cbl1: div('cbl1'),
  cbv1: e('cbv1'),
  cb2: e('cb2'),
  cbl2: div('cbl2'),
  cbv2: e('cbv2'),
  cb3: e('cb3'),
  cbl3: div('cbl3'),
  cbv3: e('cbv3'),
  cb4: e('cb4'),
  cbl4: div('cbl4'),
  cbv4: e('cbv4'),
  targetline: div('targetline'),
  target: div('target'),
  targetval: div('targetval'),
  rplbox: div('rplbox'),
  yplbox: div('yplbox'),
  gplbox: div('gplbox'),
  bplbox: div('bplbox'),
  msg: e('msg'),
  msgblink: e('msgblink'),
  availgamesdiv: div('availgamesdiv'),
  gamelist: sel('gamelist'),
  joingame: btn('joingame'),
  creategame: btn('creategame'),
  pendinggame: div('pendinggame'),
  gamename: e('gamename'),
  gameowner: e('gameowner'),
  rcol: e('rcol'),
  rnamespan: e('rnamespan'),
  rnameinput: inp('rnameinput'),
  rip: e('rip'),
  rdesiredbtn: btn('rdesiredbtn'),
  rdcspan: e('rdcspan'),
  rdesiredclr: e('rdesiredclr'),
  rccspan: e('rccspan'),
  rchangecolor: sel('rchangecolor'),
  rkick: btn('rkick'),
  ycol: e('ycol'),
  ynamespan: e('ynamespan'),
  ynameinput: inp('ynameinput'),
  yip: e('yip'),
  ydesiredbtn: btn('ydesiredbtn'),
  ydcspan: e('ydcspan'),
  ydesiredclr: e('ydesiredclr'),
  yccspan: e('yccspan'),
  ychangecolor: sel('ychangecolor'),
  ykick: btn('ykick'),
  gcol: e('gcol'),
  gnamespan: e('gnamespan'),
  gnameinput: inp('gnameinput'),
  gip: e('gip'),
  gdesiredbtn: btn('gdesiredbtn'),
  gdcspan: e('gdcspan'),
  gdesiredclr: e('gdesiredclr'),
  gccspan: e('gccspan'),
  gchangecolor: sel('gchangecolor'),
  gkick: btn('gkick'),
  bcol: e('bcol'),
  bnamespan: e('bnamespan'),
  bnameinput: inp('bnameinput'),
  bip: e('bip'),
  bdesiredbtn: btn('bdesiredbtn'),
  bdcspan: e('bdcspan'),
  bdesiredclr: e('bdesiredclr'),
  bccspan: e('bccspan'),
  bchangecolor: sel('bchangecolor'),
  bkick: btn('bkick'),
  startgame: btn('startgame'),
  plbox: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rplbox; if (clr == 'Y') return ui.yplbox; if (clr == 'G') return ui.gplbox; return ui.bplbox; },
  col: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rcol; if (clr == 'Y') return ui.ycol; if (clr == 'G') return ui.gcol; return ui.bcol; },
  namespan: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rnamespan; if (clr == 'Y') return ui.ynamespan; if (clr == 'G') return ui.gnamespan; return ui.bnamespan; },
  nameinput: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rnameinput; if (clr == 'Y') return ui.ynameinput; if (clr == 'G') return ui.gnameinput; return ui.bnameinput; },
  ip: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rip; if (clr == 'Y') return ui.yip; if (clr == 'G') return ui.gip; return ui.bip; },
  desiredbtn: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rdesiredbtn; if (clr == 'Y') return ui.ydesiredbtn; if (clr == 'G') return ui.gdesiredbtn; return ui.bdesiredbtn; },
  dcspan: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rdcspan; if (clr == 'Y') return ui.ydcspan; if (clr == 'G') return ui.gdcspan; return ui.bdcspan; },
  desiredclr: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rdesiredclr; if (clr == 'Y') return ui.ydesiredclr; if (clr == 'G') return ui.gdesiredclr; return ui.bdesiredclr; },
  ccspan: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rccspan; if (clr == 'Y') return ui.yccspan; if (clr == 'G') return ui.gccspan; return ui.bccspan; },
  changecolor: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rchangecolor; if (clr == 'Y') return ui.ychangecolor; if (clr == 'G') return ui.gchangecolor; return ui.bchangecolor; },
  kick: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rkick; if (clr == 'Y') return ui.ykick; if (clr == 'G') return ui.gkick; return ui.bkick; },
}
/* end autogenerated ui */


// allows these in global for debug access
globalThis.g = g;
globalThis.ui = ui;  

function LandLotStr(/**@type {number}*/e, /**@type {number}*/n)
{
  let ret="";
  if (e < 0) ret += "W" + (-e).toString();
  else if (e == 0) ret += "R" + e.toString();
  else ret += "E" + e.toString();
  if (n < 0) ret += "S" + (-n).toString();
  else ret += "N" + n.toString();
  return ret;
}

function getE(/**@type {string}*/k)
{
  let e = parseInt(k[1]);
  if (k[0] == 'W') e = -e;
  return e;
}

function getN(/**@type {string}*/k)
{
  let n = parseInt(k[3]);
  if (k[2] == 'S') n = -n;
  return n;
}

function settlementMouseMove(/**@type {number}*/x, /**@type {number}*/y)
{
}

function validForLandGrant(/**@type {string}*/k)
{
  return true;
}

function highlightPlot(/**@type {string}*/k)
{
  if (g.landlotOverlay == null) return;  // not initalized yet...

  let e = getE(k);
  let n = getN(k);
  if (e > -5 && e < 5 && n > -3 && n < 3) {
    if (g.landlotOverlay.parent == null)
      g.scene.add(g.landlotOverlay);
    g.landlotOverlay.position.set(e * 4, .01, n * -4);
  }
  else {
    if (g.landlotOverlay.parent != null)
      g.scene.remove(g.landlotOverlay);
  }
}

let _lastX = 0;
let _lastY = 0;
export function mouseMove(/**@type {PointerEvent}*/ mouseEvent)
{
  let x = 0;
  let y = 0;

  if (mouseEvent == null) {
    x = _lastX;
    y = _lastY;
  }
  else {
    x = mouseEvent.pageX;
    y = mouseEvent.pageY;
    _lastX = x;
    _lastY = y;
  }

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

  if (camShowingSettlement()) 
  {
    settlementMouseMove(x, y);
    return;
  }

  if (g.doLandLotOverlay && g.landlotOverlay != null)
  {
    let o = getLandLotObjForMouse(x, y);
    let k = LandLotStr(o.e, o.n);
    if (g.state == "LANDGRANT" && !validForLandGrant(k))
      g.scene.remove(g.landlotOverlay);
    else 
      highlightPlot(k);
  }
}
  


export function mouseClick(/**@type {PointerEvent}*/ mouseEvent)
{
  let x = mouseEvent.pageX;
  let y = mouseEvent.pageY;

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

  if (g.state == "SCORE")
  {
    ui.msgblink.innerText = "";
    send(t.Continue());
  }
/*
  if (g.state == st.SCORE || g.state == st.PRODUCTION_DONE ||
      g.state == st.LANDAUCTION_SHOW) {
    hmAcknowledge({char:g.myChar});
    send("Acknowledge");
    if (g.blinkPlotOverlay)
    {
      g.blinkPlotOverlay = false;
      g.plotOverlay.material.opacity = .5;
      if (g.plotOverlay.parent != null)
        scene.remove(g.plotOverlay);
    }
    if (g.state == st.PRODUCTION_DONE)
    {
      for (var i=g.prodGroup.children.length-1; i >= 0; --i)            
      g.prodGroup.remove(g.prodGroup.children[i]);
      if (g.plotOverlay.parent != null)
        scene.remove(g.plotOverlay);
    }
    return;
  }
  if (g.state == st.MOVEPLAYER) {
    if (!g.awaiting.includes(g.myID)) return;
    if (!plotOverlayIsWhite()) return;
    let plot = getPlotForMouse(x, y);
    checkForCharMovePlots(plot.x, plot.y);
    return;
  }
  if (g.state == st.SETTLEMENT) {
    if (g.waitingForMule || g.selectedBuilding) return;
    let plot = getPlotForMouse(x, y);
    checkForCharMoveSet(plot.x);
    return;
  }
  if (g.state == st.LANDGRANT) {
    if (!plotOverlayIsWhite()) return;
    let plot = getPlotForMouse(x, y);
    if (validForLandGrant(plot.x, plot.y)) {
      g.plotOverlay.material.color.set(colorStr[g.myChar]);
      send("PlotRequest", {x: plot.x, y: -plot.y});
    }
    return;
  }
  if (g.state == st.WAITINGTOSTARTIMPROVE)
  {
    if (y > e("msg2").getBoundingClientRect().bottom)
    {
      // @ts-ignore
      if (e("AUTOMULE").checked)
      {
        g.waitingForMule = true;
        send("AutoMule");
      }
      e("msg").innerText = "Waiting for other players.";
      e("msg2").innerText = "";
      e("msg2").style.visibility = "hidden";
      send("Acknowledge");
    }
    return;
  }
  */
}

export function doubleClick(/**@type {MouseEvent}*/ ev)
{
}