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
@typedef {import('./types.js').Player} Player 
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
  /** @type {Object.<string, Player?>} */ 
  players: 
  {
     /** @type {Player?} */ 
     R: null,
     /** @type {Player?} */ 
     Y: null,
     /** @type {Player?} */ 
     G: null,
     /** @type {Player?} */ 
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

  /** @type {WebSocket} */
  // @ts-ignore
  ws: null,

  init3DComplete: new Promise(get3DInitResolver)
};

export function send(/**@type {Msg}*/ msg)
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
  p1: div('p1'),
  p2: div('p2'),
  p3: div('p3'),
  p4: div('p4'),
  msg: e('msg'),
  msg2: e('msg2'),
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

