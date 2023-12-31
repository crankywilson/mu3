import * as t from "./types.js";
import {
  camShowingSettlement,
  getLandLotObjForMouse,
  settlementMouseMove,
  settlementClick,
  goInSettlement,
  tempBlink
} from "./ren3d.js";

/**
@typedef {import('../three/Three.js').Object3D} Object3D 
@typedef {import('../three/Three.js').Scene} Scene 
@typedef {import('../three/Three.js').PerspectiveCamera} Camera 
@typedef {import('../three/Three.js').AnimationClip} AnimationClip 
@typedef {import('../three/Three.js').Texture} Texture 
@typedef {import('../three/Three.js').MeshLambertMaterial} Material 
@typedef {import('../three/Three.js').Clock} Clock 
@typedef {import('../three/Three.js').WebGLRenderer} WebGLRenderer 
@typedef {import('../three/Three.js').Group} Group 
@typedef {import('../three/Three.js').AnimationMixer} Mixer 
@typedef {import('../three/Three.js').SpotLight} SpotLight 
@typedef {import('../three/Three.js').Mesh} Mesh 
@typedef {import('../three/Three.js').MeshPhongMaterial} MeshPhongMaterial
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

  /** @returns {t.Player} */ //@ts-ignore
  me: function() { return this.players[this.myColor]; }, 
  
  /** @returns {Object3D} */ //@ts-ignore
  myModel: function() { return this.models.player[this.myColor]; }, 

  mySettlementZ : 0,

  doLandMark: false,
  doAssayMark: false,

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
    },
    /** @type {Object.<string, Object3D>} */ //@ts-ignore
    playerMule:
    {
      R: null,
      Y: null,
      G: null,
      B: null
    }
  },

  /** @type {function?} */ 
  destCallback: null,

  /** @type {Object.<string, Mixer>} */ //@ts-ignore
  mixer:
  {
    R: null,
    Y: null,
    G: null,
    B: null
  },

  /** @type {Object.<string, Mixer>} */ //@ts-ignore
  mixerMule:
  {
    R: null,
    Y: null,
    G: null,
    B: null
  },

  /** @type {Object.<string, SpotLight>} */ //@ts-ignore
  muleLight:
  {
    R: null,
    Y: null,
    G: null,
    B: null
  },

  /** @type {AnimationClip} */ //@ts-ignore
  flagAnim: null,

  
  textures: {
    /** @type {Texture[]} */ //@ts-ignore
    crystiteLevelTexture: [null, null, null, null],
    /** @type {Texture[]} */ //@ts-ignore
    buldingResTexture: [null, null, null, null],
    /** @type {Object.<string, Texture>} */
    flag: {}
  },

  materials: {
    /** @type {Material[]} */ //@ts-ignore
    building: [],
    /** @type {Object.<string, Material>} */
    buildingByName: {},
    /** @type {Object.<string, Material>} */
    lotColor: {}
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

  buildingColor: 0x888888,
  muleStartX: 0,

  prepSound: new Audio("/sound/prep.wav"),
  notSound:  new Audio("/sound/not.wav"),
  stepSound: new Audio("/sound/step.mp3"),
  beepSound: new Audio("/sound/beep.wav"),

  /** @type {t.LandLotDict} */
  landlots: {},
  mgPlaced: false,

  /** @type {Mesh} */ // @ts-ignore
  landlotOverlay: null,

   /** @type {MeshPhongMaterial} */ // @ts-ignore
   lloMaterial: null,

  /** @type {t.GameState} */
  state: "?",

  waitingForServerResponse: false,

  /** @type {WebSocket} */ // @ts-ignore
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
  rdesiredimg: e('rdesiredimg'),
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
  ydesiredimg: e('ydesiredimg'),
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
  gdesiredimg: e('gdesiredimg'),
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
  bdesiredimg: e('bdesiredimg'),
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
  desiredimg: function(/**@type {string}*/clr) { if (clr == 'R') return ui.rdesiredimg; if (clr == 'Y') return ui.ydesiredimg; if (clr == 'G') return ui.gdesiredimg; return ui.bdesiredimg; },
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

export function LandLotStr(/**@type {number}*/e, /**@type {number}*/n)
{
  let ret="";
  if (e < 0) ret += "W" + (-e).toString();
  else if (e == 0) ret += "R" + e.toString();
  else ret += "E" + e.toString();
  if (n < 0) ret += "S" + (-n).toString();
  else ret += "N" + n.toString();
  return ret;
}

export function getE(/**@type {string}*/k)
{
  let e = parseInt(k[1]);
  if (k[0] == 'W') e = -e;
  return e;
}

export function getN(/**@type {string}*/k)
{
  let n = parseInt(k[3]);
  if (k[2] == 'S') n = -n;
  return n;
}

function validForLandGrant(/**@type {string}*/k)
{
  if (getE(k) == 0 && getN(k) == 0) return false;
  if (!(k in g.landlots) || g.landlots[k].owner != null) return false;
  return true;
}

function highlightPlot(/**@type {string}*/k)
{
  if (g.landlotOverlay == null) return;  // not initalized yet...

  let e = getE(k);
  let n = getN(k);
  if (e > -5 && e < 5 && n > -3 && n < 3) {
    g.landlotOverlay.visible = true;
    g.landlotOverlay.position.set(e * 4, .01, n * -4);
  }
  else {
    g.landlotOverlay.visible = false;
  }
}

export function mouseMove(/**@type {PointerEvent}*/ mouseEvent)
{
  if (g.waitingForServerResponse) return;

  let x = mouseEvent.pageX;
  let y = mouseEvent.pageY;

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

  if (camShowingSettlement() && g.state == "IMPROVE") 
  {
    settlementMouseMove(x, y);
    return;
  }

  if (g.state == "IMPROVE" || g.state == "LANDGRANT")
  {
    if (g.state == "IMPROVE") ui.msg.innerText = "";
    let o = getLandLotObjForMouse(x, y);
    if (o.e > 4 || o.e < -4 || o.n > 2 || o.n < -2)
    {
      g.landlotOverlay.visible = false;
      return;
    }

    let k = LandLotStr(o.e, o.n);
    if (g.state == "LANDGRANT" && !validForLandGrant(k))
      g.landlotOverlay.visible = false;
    else
      highlightPlot(k);
  }
}

function llocolor(/**@type {string}*/s)
{
  if (s=="R") return 0xff0000;
  if (s=="Y") return 0xffff00;
  if (s=="G") return 0x00ff00;
  return 0x0000ff;
}

export function mouseClick(/**@type {PointerEvent}*/ mouseEvent)
{
  if (g.waitingForServerResponse) return;

  let x = mouseEvent.pageX;
  let y = mouseEvent.pageY;

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

  if (g.state == "SCORE" || g.state == "PLAYEREVENT")
  {
    ui.msgblink.innerText = "";
    if (g.state == "SCORE") ui.msg.innerText = "(Waiting for other players to begin land grant)";
    if (g.state == "PLAYEREVENT") ui.msg.innerText = "(Waiting for other players to begin development)";
    g.waitingForServerResponse = true;
    send(t.Continue());
  }
  else if (g.state == "IMPROVE")
  {
    if (camShowingSettlement())
    {
      settlementClick(x, y);
      return;
    }
    ui.msgblink.innerText = "";
    let o = getLandLotObjForMouse(x, y);

    let dest = {x: o.e * 4, z: o.n * -4, spd: 2.5};
    if (dest.x == g.myModel().position.x &&
        dest.z == g.myModel().position.z)
    {
      let k = LandLotStr(o.e, o.n);
      
      if (g.doAssayMark)
      {
        g.doLandMark = g.doAssayMark = false;
        send(t.Assay(o.e, o.n));
        return;
      }
     
      if (!(k in g.landlots) || g.landlots[k].owner != g.myColor)
      {
        tempBlink("You don't own this lot.");
        return;
      }

      if (g.doLandMark)
      {
        g.doAssayMark = g.doLandMark = false;
        send(t.AuctionLot(o.e, o.n));
        tempBlink("This lot will be auctioned next month.");
        return;
      }

      if (g.me().mule != null)
      {
        g.lloMaterial.color.set(llocolor(g.myColor)); 
        g.waitingForServerResponse = true;
        send(t.InstallMule(o.e, o.n));
      }
      else if (g.landlots[k].res > -1)
      {
        g.lloMaterial.color.set(llocolor(g.myColor)); 
        g.waitingForServerResponse = true;
        send(t.UninstallMule(o.e, o.n));
      }
      return;
    }

    if (dest.x == 0 && dest.z == 0)
    {
      if (g.myModel().position.x < 0)
        dest.x = -2;
      else
        dest.x = 2;
      dest.z = g.mySettlementZ;

      g.destCallback = goInSettlement;
    }

    send(t.NewDest(g.myColor, g.myModel().position.x,
      g.myModel().position.z, dest.x, dest.z, dest.spd));

    g.me().dest = dest;
  }
  else if (g.state == "LANDGRANT")
  {
    if (g.landlotOverlay.visible)
    {
      let o = getLandLotObjForMouse(x, y);
      if (o.e < -4 || o.e > 4 || o.n > 2 || o.n < -2) return;
      g.lloMaterial.color.set(llocolor(g.myColor)); 
      g.waitingForServerResponse = true;
      send(t.ClaimLot(o.e, o.n));
    }
    return;
  }
}
