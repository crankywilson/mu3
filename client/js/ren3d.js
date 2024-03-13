import { Vector3, Object3D, Camera, 
         AnimationMixer, MeshLambertMaterial } from "../three/Three.js";
import { g, send, LandLotStr, getE, getN } from "./game.js";
import * as t from './types.js';
/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;  // initialized in setup.js

/**
@typedef {import("./types.js").Player} Player 
*/


let animating = false;
let camTargetIsSettlement = false;
/**@type {Vector3}*/ //@ts-ignore
let cpset     = null; //Vector3(0, 1.8, 4)
let crxset    = -.4;
/**@type {Vector3}*/ //@ts-ignore
let cpfar     = null; //Vector3(0, 32.7, 23)
let crxfar    = -.935;
let cptarget  = cpfar;
//@ts-ignore
let crxtarget = crxfar;
let readyToRender = false;

const xlocs = [1.08,.36,-.38,-1.1];
const zlocs = [-1.2,1.2];
const muleoffset = .55;


/** @type {Object.<string, Object3D>} */
let flags = {};
/** @type {Object.<string, Object3D>} */
let flagpoles = {};
/** @type {Object.<string, Object3D>} */
let landmodels = {};

/** @type {Object.<string, Object3D>} */
let nlines = {};
/** @type {Object.<string, Object3D>} */
let slines = {};
/** @type {Object.<string, Object3D>} */
let elines = {};
/** @type {Object.<string, Object3D>} */
let wlines = {};

/** @type {Object.<string, AnimationMixer>} */
let flagMixer = {};
/** @type {MeshLambertMaterial} */ // @ts-ignore
let poleMat = null;
/** @type {MeshLambertMaterial} */ // @ts-ignore
let poleMatWater = null;
/** @type {Object.<string, Object3D>} */
let riverHacks = {};

const NSide = 1;
const SSide = 2;
const ESide = 3;
const WSide = 4;

function setMyDest(/**@type {number}*/ x,/**@type {number}*/ z, 
                   /**@type {number}*/ spd)
{
  let my = g.myModel();
  g.me().dest = {x:x, z:z, spd:spd};
  send(t.NewDest(g.myColor, my.position.x, my.position.z, x, z, spd));
}

function setMyMuleDest(/**@type {number}*/ x,/**@type {number}*/ z,
                       /**@type {number}*/ spd)
{
  let my = g.me();
  let myMule = g.models.playerMule[g.myColor];
  if (my.mule == null)
    my.mule = {resOutfit:-1, x:myMule.position.x, z:myMule.position.z, dest:null};
  my.mule.dest = { x:x, z:z, spd:spd };
  send(t.NewMuleDest(g.myColor, myMule.position.x, myMule.position.z, x, z, spd));
}

function sellMule()
{
  send(t.SellMule());
}

function nowInBottomBuilding()
{
  if (currentOp == "Cantina")
  {
    let now = Date.now();
    let msRemaining = g.developStopTime - now;
    let total = g.developStopTime - g.developStartTime;
    send(t.Cantina(msRemaining/total));
    g.developStopTime = 0;
    g.developStartTime = 0;
    ui.time(g.myColor).style.visibility = "hidden";
    return;
  }

  if (currentOp == "Land")
  {
    tempBlink("Select lot for auction next month.", 8000);
    g.doLandMark = true;
    g.doAssayMark = false;
  }
  else
  {
    tempBlink("Select lot for crystite analysis.", 8000);
    g.doLandMark = false;
    g.doAssayMark = true;
  }

  setMyDest(g.models.player[g.myColor].position.x, g.mySettlementZ, 1.5);
  settlementClearOperation();
}

function headToBottomBuilding()
{
  setMyDest(g.models.player[g.myColor].position.x, zlocs[1], 1.5);
  g.destCallback = nowInBottomBuilding;
}

function requestMuleOutfit()
{
  send(t.RequestMuleOutfit(currentOp));
}

export function outfitmule()
{
  tempBlink("Outfitting MULE for " + currentOp);
  g.myModel().rotation.y = 3.14;
  setMyMuleDest(g.models.playerMule[g.myColor].position.x, zlocs[0], 1.5);
  g.destCallback = returnOutfittedMule;
}

function setMuleLight(/**@type {string}*/pc, /**@type {number}*/ resType)
{
  let sl = g.muleLight[pc];

  switch (resType) {
    case 0: sl.color.set(0x00ff00); break;
    case 1: sl.color.set(0xffff88); break;
    case 2: sl.color.set(0x663311); break;
    case 3: sl.color.set(0xaaddff); break;
  }
  sl.visible = true;

  send(t.TurnedOnMuleLight(pc, sl.color.getHex()));
}

function resStrToNum(/**@type {string}*/ resStr)
{
  if (resStr == "Energy")   return 1;
  if (resStr == "Smithore") return 2;
  if (resStr == "Crystite") return 3;
  return 0;
}

function returnOutfittedMule()
{
  setMyMuleDest(g.models.playerMule[g.myColor].position.x,
                g.myModel().position.z, 1.5);

  
  setMuleLight(g.myColor, resStrToNum(currentOp));

  g.destCallback = outfittedMuleReturned;
}

export function TurnOnMuleLight(/** @type {string}*/playerColor , /** @type {number}*/lightColor )
{
  let sl = g.muleLight[playerColor];
  sl.color.set(lightColor);
  sl.visible = true;
}

function outfittedMuleReturned()
{
  ui.msgblink.innerText = ""; 
  g.myModel().rotation.y = 0;
  settlementClearOperation();
}

export function initTHREERef(/** @type {import('../three/Three.js')} */r)
{
  THREE = r;
  cpset = new THREE.Vector3(0, 1.8, 4);
  cpfar = new THREE.Vector3(0, 32.7, 23);
  cptarget = cpfar;
  readyToRender = true;
}

export async function switchCamView(/** @type {boolean?}*/ showSettlement=null)
{
  await g.init3DComplete;

  ui.msg.innerText = "";
  if (!g.doAssayMark && !g.doLandMark)
    ui.msgblink.innerText = "";

  if (showSettlement == null)
    camTargetIsSettlement = !camTargetIsSettlement;
  else
    camTargetIsSettlement = showSettlement;

  cptarget = camTargetIsSettlement ? cpset : cpfar;
  crxtarget = camTargetIsSettlement ? crxset : crxfar;

  if (!camTargetIsSettlement)
    settlementClearOperation();  // just in case operation was canceled externally

  // this is basically for page re-load syncing -- since this function already await'ed g.init3DComplete;
  if (g.me().mule != null && g.models.playerMule[g.myColor].parent == null)
    g.scene.add(g.models.playerMule[g.myColor]);
}

function animate() 
{
  if (animating)
  {
    render();
    requestAnimationFrame( animate );
  }
}

export function startAnimating()
{
  animating = true;
  animate();
}

export function stopAnimating()
{
  animating = false;
}

function equalXZ(/**@type {Object3D}*/obj, /**@type {Vector3}*/ dest)
{
  return obj.position.x == dest.x && obj.position.z == dest.z;
}

function distanceXZ(/**@type {Object3D}*/obj, /**@type {Vector3}*/ dest)
{
  let dx = obj.position.x - dest.x;
  let dz = obj.position.z - dest.z;
  return Math.sqrt( dx * dx + dz * dz );
}

function moveTowards(
/**@type {Object3D}*/ obj,
/**@type {Vector3}*/  dest,
/**@type {number}*/   dist )
{
  // undo AdjustYForRiver
  //obj.position.y = 0;

  if (equalXZ(obj, dest)) return true;
  if (distanceXZ(obj, dest) <= dist)
  {
    obj.position.copy(dest);
    return true;
  }

  let _mov = dest.clone();
  _mov.sub(obj.position);
  _mov.normalize();
  _mov.multiplyScalar(dist);

  obj.position.add(_mov);

  return false;
}

function rotateCameraX()
{
  if (g.camera.position.equals(cpset)) 
  {
    g.camera.rotation.x = crxset;
    ui.sett.style.visibility = "visible";
    g.landlotOverlay.visible = false;
  }
  else 
  {
    let pct = (g.camera.position.z - cpfar.z) / (cpset.z - cpfar.z);
    if (pct > .75) 
    {
      pct -= .75;
      pct *= 4;
      g.camera.rotation.x = crxfar + (pct * (crxset - crxfar));
    }
    else
      g.camera.rotation.x = crxfar;

    ui.sett.style.visibility = "hidden";
  }
}

function unprojectVector(/**@type {Vector3}*/vector, /**@type {Camera}*/ camera) 
{
  let viewProjectionMatrix = new THREE.Matrix4();
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  viewProjectionMatrix.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
  return vector.applyMatrix4(viewProjectionMatrix);
}

export function getLandLotObjForMouse(/**@type {number}*/x, /**@type {number}*/y)
{
  //if (!g.camera.position.equals(cpfar)) return {e:999,n:-999}; // don't allow selecting unless in 'far' view

  let pos = new THREE.Vector3(0, 0, 0);
  var pMouse = new THREE.Vector3(
    (x / g.renderer.domElement.width) * 2 - 1,
    -(y / g.renderer.domElement.height) * 2 + 1,
    1
  );

  unprojectVector(pMouse, g.camera);

  var cam = g.camera.position;
  var m = pMouse.y / (pMouse.y - cam.y);

  pos.x = pMouse.x + (cam.x - pMouse.x) * m;
  pos.z = pMouse.z + (cam.z - pMouse.z) * m;

  return {e:(Math.floor((pos.x + 18) / 4) - 4),
          n:-(Math.floor((pos.z + 18) / 4) - 4)};
}

export function camShowingSettlement()
{
  return g.camera.position.equals(cpset);
}

function muleMovingIndepently(/**@type {Player}*/p)
{
  return (p.mule != null && p.mule.dest != null);
}

export async function SetupMounds()
{
  await g.init3DComplete;
  const moundMat = new THREE.MeshBasicMaterial( { color: 0x847463 } );
  for (let k in g.landlots)
  {
    let ldata = g.landlots[k];
    let d = ldata.mg;
    for (let i=0; i<ldata.mNum; i++)
    {
      const geometry = new THREE.SphereGeometry( 1 );
      const sphere = new THREE.Mesh( geometry, moundMat );
      g.scene.add( sphere );
      sphere.position.set(d[0],0,d[2]);
      sphere.scale.set(d[3], d[4], d[5]);
      sphere.rotation.y = d[1];
      d.splice(0,6);
    }
  }
  g.mgPlaced = true;
}

export async function SyncLandGeom()
{
  await g.init3DComplete;

  for (let k in g.landlots)
  {
    let e = getE(k);
    let n = getN(k);
    let ll = g.landlots[k];
    if (ll.res < 0 && k in landmodels)
      deleteLandModelIfExists(k);
    else if (ll.res >= 0 && 
            ( (k in landmodels && landmodels[k].name != ll.res.toString()) ||
              (!(k in landmodels)) ) )
    {
      deleteLandModelIfExists(k);
      addLandModel(e, n, ll.res, k);
    }

    let existingLineColor = null;
    if (k in nlines) existingLineColor = nlines[k].name;
    else if (k in slines) existingLineColor = slines[k].name;
    else if (k in elines) existingLineColor = elines[k].name;
    else if (k in wlines) existingLineColor = wlines[k].name;
    if (ll.owner != existingLineColor)
    {
      for (let side=NSide; side<=WSide; side++) 
        removeLineIfExists(e, n, side);
      if (ll.owner != null)
      {
        addLines(e, n, ll.owner);
        removeFlag(e, n);
        addFlag(e, n, ll.owner);
      }
      syncLinesFlags(e, n);
    }
  }
}

function AdjustYForRiver(/**@type {Object3D}*/ obj)
{
  // let's sink the player if he is in the river
  let objInRiver = (obj.position.x > -2 && obj.position.x < 2) &&
                   (obj.position.z > 2 || obj.position.z < -2);
  obj.position.y = objInRiver ? -.15 : 0;
}

const playerstilltime = .55;
const mulestilltime = 7;

function AnimatePlayerAndMule(
/**@type {Player}*/ p, 
/**@type {string}*/ c,
/**@type {number}*/ delta)
{
  if (p.dest != null)
  {
    let playerModel = g.models.player[c];
    if (playerModel == null) return;

    let spd = p.dest.spd;
    let dest = new Vector3(p.dest.x, 0, p.dest.z);
    playerModel.rotation.y = Math.atan2(
      p.dest.x - playerModel.position.x,
      p.dest.z - playerModel.position.z);

    g.mixer[c].update(delta * p.dest.spd);
    
    if (moveTowards(playerModel, dest, delta * spd))
    {
      if (c == g.myColor)
        send(t.DestReached(c, dest.x, dest.z));

      p.dest = null;
      playerModel.rotation.y = 0;
      g.mixer[c].setTime(playerstilltime);

      if (p.mule != null && p.mule.dest == null)
        g.mixerMule[c].setTime(mulestilltime);

      if (g.myColor == c && g.destCallback != null && !muleMovingIndepently(p))
      {
        let cb = g.destCallback;
        g.destCallback = null;
        cb();
      }
    }

    AdjustYForRiver(playerModel);

    // this moves the mule with the player
    if (p.mule != null && p.mule.dest == null)
    {
      let newTime = g.mixerMule[c].time + (delta * spd * 12);
      if (newTime > 20.5)
        newTime -= 16.5;
      g.mixerMule[c].setTime(newTime);
      let muleModel = g.models.playerMule[c];

      let d = muleModel.position.sub(dest).normalize().multiplyScalar(muleoffset);
      if (d.length() > 0)
      {
        muleModel.position.x = playerModel.position.x + d.x;  // add() method seemed to not work?
        muleModel.position.z = playerModel.position.z + d.z;
      }

      muleModel.rotation.y = Math.atan2(
        dest.x - muleModel.position.x,
        muleModel.position.z - dest.z);

      AdjustYForRiver(muleModel);
    }   
  }
  // this is for mule movement independent of the player
  if (p.mule != null && p.mule.dest != null)
  {
    let muleModel = g.models.playerMule[c];

    muleModel.rotation.y = Math.atan2(
      p.mule.dest.x - muleModel.position.x,
      muleModel.position.z - p.mule.dest.z);

    let newTime = g.mixerMule[c].time + (delta * p.mule.dest.spd * 12);
      if (newTime > 20.5)
        newTime -= 16.5;
      g.mixerMule[c].setTime(newTime);

    if (moveTowards(muleModel,
      new Vector3(p.mule.dest.x, 0, p.mule.dest.z), delta * p.mule.dest.spd))
    {
      if (c == g.myColor)
        send(t.MuleDestReached(c, p.mule.dest.x, p.mule.dest.z));

      p.mule.dest = null;
      g.mixerMule[c].setTime(mulestilltime);
      muleModel.rotation.y = Math.atan2(
        g.models.player[c].position.x - muleModel.position.x,
        muleModel.position.z - g.models.player[c].position.z);

      if (g.myColor == c && g.destCallback != null)
      {
        let cb = g.destCallback;
        g.destCallback = null;
        cb();
      }
    }
  }
}

function animFlags(/**@type {number}*/delta)
{
  for (let k in flagMixer)
    flagMixer[k].update(delta);
}

export function removePlayerAndMule(/**@type {string}*/pc)
{
  g.scene.remove(g.models.player[pc]);
  let p = g.players[pc];
  if (p == null) return;
  let mule = p.mule;
  if (mule != null) {
    p.mule = null;
    g.scene.remove(g.models.playerMule[pc]);
  }
}

function handleTimer()
{
  let tt = ui.time(g.myColor);
  let now = Date.now();
  let msRemaining = g.developStopTime - now;
  if (msRemaining <= 0)
  {
    g.developStopTime = 0;
    g.developStartTime = 0;
    g.waitingForServerResponse = true;
    g.landlotOverlay.visible = false;
    tt.style.visibility = "hidden";
    g.startNewProdReadyPromise();
    g.setProdReady();
    removePlayerAndMule(g.myColor);
    switchCamView(false);
    g.destCallback = null;
    bell.play();
    tempBlink("You have run out of time.", 4000); 
    send(t.TimeUp(g.myColor));
    return;
  }

  tt.style.visibility = "visible";
  tt.style.width = (g.developStopTime - now) * 100 / (g.developStopTime - g.developStartTime) + "%";
}

function render()
{
  if (!readyToRender) return;
  const delta = g.clock.getDelta();

  // the way this was written, it's possible for cam
  // to end in settlement but player to turn around and
  // be outside -- we'll force this to reconcile here...
  if (g.myModel() != null)
    if (Math.abs(g.myModel().position.x) > 2.5)
      if (cptarget != cpfar)
        switchCamView(false);

  let moveCamComplete = moveTowards(g.camera, cptarget, delta * 60);
  if (g.shouldCallProdReady && moveCamComplete && cptarget == cpfar)
  {
    g.setProdReady();
    g.shouldCallProdReady = false;
  }

  rotateCameraX();
  animFlags(delta);

  if (g.developStopTime > 0)
    handleTimer();

  for (let c in g.players)
  {
    let p = g.players[c];
    if (p == null) continue;
    AnimatePlayerAndMule(p, c, delta);
  }

  if (g.state == 'SHOWLANDFORSALE' && g.landlotOverlay != null)
  { 
    let m = g.landlotOverlay.material;
    if (m instanceof THREE.MeshPhongMaterial)
      m.opacity = Math.floor(g.clock.elapsedTime * 2) % 2 ? .5 : .2;
  }

  g.renderer.render( g.scene, g.camera );
}


export function settlementMouseMove(/**@type {number}*/x, /**@type {number}*/y)
{
  if (!readyToRender) return null;
  if (currentOp != "") return null;

  let raycaster = new THREE.Raycaster();
  let pointer = new THREE.Vector2();

  pointer.x = (x / window.devicePixelRatio / window.innerWidth) * 2 - 1;
  pointer.y = - (y / window.devicePixelRatio / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, g.camera);
  const intersects = raycaster.intersectObjects(g.buildingsGroup.children);
  for (let i = 0; i < g.buildingsGroup.children.length; i++)
  {
    // @ts-ignore
    g.buildingsGroup.children[i].material.color.set(g.buildingColor);
  }
  ui.msg.innerText = "";
  ui.msg.style.backgroundColor = "";
  if (intersects.length > 0) {
    //  @ts-ignore
    let mat = intersects[0].object.material;
    mat.color.set(0xcccccc);
    ui.msg.innerText = mat.name;
    ui.msg.style.backgroundColor = "rgba(255,255,255,.4)";
    //if (intersects[0].object.position.z > 0 && !g.doAssayMark && !g.doLandMark)
    //  ui.msgblink.innerText = "";
    return mat.name;
  }
  else {
    let o =getLandLotObjForMouse(x, y);
    if (o.e != 0) {
      ui.msg.innerText = "Leave Settlement";
      ui.msg.style.backgroundColor = "rgba(255,255,255,.4)";
      return o.e;
    }
  }

  return null;
}

async function sleep(/**@type {number}*/msdur)
{
  return new Promise((r)=>setTimeout(r, msdur));
}

export async function tempBlink(/**@type {string}*/msg, /**@type {number}*/msdur=5000)
{
  ui.msgblink.innerText = msg;
  await sleep(msdur);
  if (ui.msgblink.innerText == msg)
  ui.msgblink.innerText = "";
}

/** @type {Object.<string, number>} */
const opColors =
{
  R: 0xdd0000,
  Y: 0xdddd00,
  G: 0x00dd00,
  B: 0x0000dd
};

let currentOp = "";

function settlementStartOperation(/**@type {string}*/op)
{
  g.materials.buildingByName[op].color.set(opColors[g.myColor]);
  currentOp = op;
}

export function settlementClearOperation()
{
  for (let i = 0; i < g.buildingsGroup.children.length; i++)
  {
    // @ts-ignore
    g.buildingsGroup.children[i].material.color.set(g.buildingColor);
  }
  currentOp = "";
}

function requestMule()
{
  send(t.MuleRequest());
}

function headOutOfSettlement()
{
  setMyDest(g.myModel().position.x < 0 ? -4 : 4, g.myModel().position.z, 2.5);
  switchCamView(false);
}

export function goInSettlement()
{
  setMyDest(0, g.mySettlementZ, 1.5);
  switchCamView(true);
}



globalThis.flags = flags;

function addFlag(/**@type {number}*/ e,/**@type {number}*/ n, /**@type {string}*/ pc)
{
  let k = LandLotStr(e, n);
  if (k in flags) return;

  let f = g.models.flag.clone();
  let mixer = new THREE.AnimationMixer(f);
  let action = mixer.clipAction(g.flagAnim);
  action.play();
  g.scene.add(f);
  
  flags[k] = f;
  flagMixer[k] = mixer;

  function updateTexture(/**@type {Object3D}*/ child)
  {
    if (child instanceof THREE.Mesh) {
      child.material = child.material.clone();
      child.material.map = g.textures.flag[pc];
    }
  }
  f.traverse(updateTexture);

  f.position.set(e * 4 - 1, 1.5, n * -4);

  // hack to get flags to show in river
  if (e == 0 && riverHacks[k] == undefined)
  {
    let b = g.landlotOverlay.clone();
    b.material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 });
    b.position.x = e * 4;
    b.position.y = 2;
    b.position.z = n * -4;
    g.scene.add(b);
    riverHacks[k] = b;

      let m = new THREE.Mesh(new THREE.PlaneGeometry(4, 4, 1, 1), b.material);
      m.position.copy(new Vector3(e*4,2,n*-4));
      m.rotation.x = -90 * Math.PI / 180;
      g.scene.add(m);

  }

  let poleGeom = new THREE.CylinderGeometry(.04, .05, 1.8);
  if (poleMat == null)
  {
    poleMat = new THREE.MeshLambertMaterial(
       {color:  0x666666, reflectivity: 15} );
    poleMatWater = new THREE.MeshLambertMaterial(
       {color:  0xdddddd, reflectivity: 15} );
  }
  
  flagpoles[k] = new THREE.Mesh( poleGeom, e == 0 ? poleMatWater : poleMat );
  flagpoles[k].position.set(e * 4 - 1.35, .9, n * -4);
  g.scene.add(flagpoles[k]);
}

function addLines(/**@type {number}*/ e,/**@type {number}*/ n, /**@type {string}*/ pc, /**@type {number?}*/onlySide = null)
{
  let k = LandLotStr(e, n);
  let mat = g.materials.lotColor[pc];

  let bg = new THREE.BoxGeometry(4, .01, .1);
  let m = new THREE.Mesh( bg, mat );
  if ((onlySide == NSide || onlySide == null) && !(k in nlines))
  {
    nlines[k] = m;
    m.position.set(e*4, 0, n*-4 - 1.95);
    m.name = pc;
    g.scene.add(m);
  }

  if ((onlySide == SSide || onlySide == null) && !(k in slines))
  {
    m = new THREE.Mesh( bg, mat );
    slines[k] = m;
    m.position.set(e*4, 0, n*-4 + 1.95);
    m.name = pc;
    g.scene.add(m);
  }

  bg = new THREE.BoxGeometry(.1, .01, 4);
  if ((onlySide == ESide || onlySide == null) && !(k in elines))
  {
    m = new THREE.Mesh( bg, mat );
    elines[k] = m;
    m.position.set(e*4 + 1.95, 0, n*-4);
    m.name = pc;
    g.scene.add(m);
  }

  if ((onlySide == WSide || onlySide == null) && !(k in wlines))
  {
    m = new THREE.Mesh( bg, mat );
    wlines[k] = m;
    m.position.set(e*4 - 1.95, 0, n*-4);
    m.name = pc;
    g.scene.add(m);
  }
}

function deleteLandModelIfExists(/**@type {string}*/k)
{
  if (k in landmodels)
  {
    let m = landmodels[k];
    g.scene.remove(m);
    delete landmodels[k];
  }
}

/** @param msg */
export function MuleRemoved(/**@type {t.MuleRemoved}*/msg)
{
  if (msg.pc == g.myColor)
  {
    g.lloMaterial.color.set(0xffffff);
    g.landlotOverlay.visible = false;
    g.waitingForServerResponse = false;
  }

  let p = g.players[msg.pc];
  if (p == null) return;
 
  if (msg.existingResType > -1) {
    p.mule = {x:p.x, z:p.z, resOutfit:msg.existingResType, dest:null};
    if (g.models.playerMule[msg.pc].parent == null)
      g.scene.add(g.models.playerMule[msg.pc]);
    setMuleLight(msg.pc, msg.existingResType);
  }

  let k = LandLotStr(msg.e, msg.n);
  deleteLandModelIfExists(k);

  g.landlots[k].res = -1;
  syncLinesFlags(msg.e, msg.n);
}

function addLandModel(/**@type {number}*/ e,/**@type {number}*/ n, 
        /**@type {number}*/r,/**@type {string}*/k)
{
  let m = g.models.prod[r].clone();
  m.name = r.toString();
  m.position.x = e*4;
  m.position.z = -n*4;
  g.scene.add(m);
  
  g.landlots[k].res = r;
  landmodels[k] = m;
}

export function UninstallMule(/**@type {t.MuleRemoved}*/msg)
{
  if (msg.pc == g.myColor)
  {
    g.lloMaterial.color.set(0xffffff);
    g.landlotOverlay.visible = false;
    g.waitingForServerResponse = false;
  }

  deleteLandModelIfExists(LandLotStr(msg.e, msg.n));
  let m = g.models.playerMule[msg.pc];
  let pm = g.models.player[msg.pc];
  g.scene.add(m);
  setMuleLight(msg.pc, msg.existingResType);
  let p = g.players[msg.pc];
  if (p == null) return;
  p.x = pm.position.x;
  p.z = pm.position.z;
  p.mule = { resOutfit:msg.existingResType, x:p.x, z:p.z, dest:null };
  m.position.x = p.x;
  m.position.z = p.z;
}

export function MuleInstalled(/**@type {t.MuleInstalled}*/msg)
{
  if (msg.pc == g.myColor)
  {
    g.lloMaterial.color.set(0xffffff);
    g.landlotOverlay.visible = false;
    g.waitingForServerResponse = false;
  }

  if (msg.resType < -1) return;

  let p = g.players[msg.pc];
  if (p == null) return;
  let mule = p.mule;
  if (msg.existingResType > -1 && mule != null) {
    mule.resOutfit = msg.existingResType;
    setMuleLight(msg.pc, msg.existingResType);
  }
  else {
    p.mule = null;
    g.scene.remove(g.models.playerMule[msg.pc]);
  }

  let k = LandLotStr(msg.e, msg.n);
  if (k in landmodels)
    g.scene.remove(landmodels[k]);
  
  addLandModel(msg.e,msg.n,msg.resType,k);

  syncLinesFlags(msg.e, msg.n);
}

function ll(/**@type {number}*/e, /**@type {number}*/n)
{
  let ll = g.landlots[LandLotStr(e,n)];
  if (ll == null || ll == undefined || ll.owner == null) return null;
  return ll;
}

function owner(/**@type {number}*/e, /**@type {number}*/n)
{
  let l = ll(e,n);
  return l ? l.owner : null;
}

function res(/**@type {number}*/e, /**@type {number}*/n)
{
  let l = ll(e,n);
  return l ? l.res : -1;
}

function removeFlag(/**@type {number}*/e, /**@type {number}*/n)
{
  let k = LandLotStr(e,n);
  if (k in flags)
  {
    g.scene.remove(flags[k]);
    delete flags[k];
  }
  if (k in flagpoles)
  {
    g.scene.remove(flagpoles[k]);
    delete flagpoles[k];
  }
  if (k in flagMixer)
  {
    delete flagMixer[k];
  }
}

function setflagen(/**@type {{e:number,n:number}}*/ flagen, /**@type {number}*/e, /**@type {number}*/n)
{ flagen.e = e; flagen.n = n; }

function ownerres(/**@type {number}*/e, /**@type {number}*/n, /**@type {string}*/o, /**@type {number}*/r)
{
  return owner(e, n) == o && res(e, n) == r;
}

function recursiveFindAdjacentLots(/**@type {number}*/e, /**@type {number}*/n,
  /**@type {string}*/thisOwner, /**@type {number}*/thisRes,
  /**@type {Set<string>}*/ keySet, /**@type {{e:number,n:number}}*/ flagen)
{
  keySet.add(LandLotStr(e,n));

  if (e != 0)
  {
    if ((flagen.e == 0) ||
        (n > flagen.n)  ||
        (n == flagen.n && e < flagen.e)) 
          setflagen(flagen, e, n);
  }

  if (e < 4 && ownerres(e+1, n, thisOwner, thisRes) && !keySet.has(LandLotStr(e+1,n)))
    recursiveFindAdjacentLots(e+1, n, thisOwner, thisRes, keySet, flagen);

  if (e > -4 && ownerres(e-1, n, thisOwner, thisRes) && !keySet.has(LandLotStr(e-1,n)))
    recursiveFindAdjacentLots(e-1, n, thisOwner, thisRes, keySet, flagen);

  if (n < 2 && ownerres(e, n+1, thisOwner, thisRes) && !keySet.has(LandLotStr(e,n+1)))
    recursiveFindAdjacentLots(e, n+1, thisOwner, thisRes, keySet, flagen);

  if (n > -2 && ownerres(e, n-1, thisOwner, thisRes) && !keySet.has(LandLotStr(e,n-1)))
    recursiveFindAdjacentLots(e, n-1, thisOwner, thisRes, keySet, flagen);
}

function handleFlags(/**@type {number}*/e, /**@type {number}*/n)
{
  if (e > 4) return;
  if (e < -4) return;
  if (n > 2) return;
  if (n < -2) return;

  let thisowner = owner(e,n);
  let thisres = res(e,n);
  if (thisowner == null) return;

  let flagen = {e:e,n:n};
  let keySet = new Set();
  recursiveFindAdjacentLots(e, n, thisowner, thisres, keySet, flagen);
  for (let k of keySet)
  {
    let e = getE(k);
    let n = getN(k);
    if (e == flagen.e && n == flagen.n) addFlag(e, n, thisowner);
    else removeFlag(e, n);
  }
}

function removeLineIfExists(/**@type {number}*/e,  /**@type {number}*/n, 
                    /**@type {number}*/side)
{
  let l = undefined;
  let k = LandLotStr(e,n);

       if (side == NSide) { l = nlines[k]; delete nlines[k]; }
  else if (side == SSide) { l = slines[k]; delete slines[k]; }
  else if (side == ESide) { l = elines[k]; delete elines[k]; }
  else if (side == WSide) { l = wlines[k]; delete wlines[k]; }

  if (l != undefined && l != null)
    g.scene.remove(l);
}


/**@param otherSide*/
function mergeOrAddLines(/**@type {number}*/thisE,   /**@type {number}*/thisN, 
                         /**@type {number}*/otherE,  /**@type {number}*/otherN,
                         /**@type {number}*/thisSide,/**@type {number}*/otherSide)
{
  if (otherE > 4 || otherE < -4) return;
  if (otherN > 2 || otherN < -2) return;

  if (owner(thisE, thisN) == owner(otherE, otherN) &&
        res(thisE, thisN) ==   res(otherE, otherN) &&
      owner(thisE, thisN) !=  null)
  {
    removeLineIfExists(thisE,  thisN,  thisSide);
    removeLineIfExists(otherE, otherN, otherSide);
  }
  else 
  {
    let pc = owner(otherE, otherN);
    if (pc != null)
      addLines(otherE, otherN, pc, otherSide);

    // may be necessary in case of re-outfitting a previously joined area
    pc = owner(thisE, thisN);
    if (pc != null)
      addLines(thisE,  thisN,  pc, thisSide); 
  }
}

function syncLinesFlags(/**@type {number}*/e, /**@type {number}*/n)
{
  let thisowner = owner(e,n);
  let thisres = res(e,n);
  let unclaiming = thisowner == null;

  mergeOrAddLines(e, n, e+1, n, ESide, WSide);
  mergeOrAddLines(e, n, e-1, n, WSide, ESide);
  mergeOrAddLines(e, n, e, n+1, NSide, SSide);
  mergeOrAddLines(e, n, e, n-1, SSide, NSide);


  // flags
  if (unclaiming)
  {
    if (owner(e+1,n) != null) handleFlags(e+1, n);
    if (owner(e-1,n) != null) handleFlags(e-1, n);
    if (owner(e,n+1) != null) handleFlags(e, n+1);
    if (owner(e,n-1) != null) handleFlags(e, n-1);
  }
  else
  {
    handleFlags(e,n);
    if (owner(e+1,n) != thisowner || res(e+1,n) != thisres) handleFlags(e+1, n);
    if (owner(e-1,n) != thisowner || res(e-1,n) != thisres) handleFlags(e-1, n);
    if (owner(e,n+1) != thisowner || res(e,n+1) != thisres) handleFlags(e, n+1);
    if (owner(e,n-1) != thisowner || res(e,n-1) != thisres) handleFlags(e, n-1);
  }
}

export function UnclaimLot(/**@type {string}*/k)
{
  let oldOwner = g.landlots[k].owner;
  let e = getE(k);
  let n = getN(k);

  if (g.landlots[k].res > -1 && oldOwner != null)
    MuleRemoved({_mt:"",pc:oldOwner,e:e,n:n,existingResType:-1});
  
  g.landlots[k].owner = null;
  g.landlots[k].res = -1;

  if (k in elines) { let l = elines[k]; g.scene.remove(l); delete elines[k]; }
  if (k in wlines) { let l = wlines[k]; g.scene.remove(l); delete wlines[k]; }
  if (k in nlines) { let l = nlines[k]; g.scene.remove(l); delete nlines[k]; }
  if (k in slines) { let l = slines[k]; g.scene.remove(l); delete slines[k]; }

  removeFlag(e, n);
  syncLinesFlags(e, n);
}

export function ClaimLot(/**@type {string}*/pc, /**@type {string}*/k)
{
  let e = getE(k);
  let n = getN(k);
  let l = ll(e, n);
  if (l != null && l.owner == pc) return;
  if (l != null) UnclaimLot(k);

  g.landlots[k].owner = pc;
  addLines(e, n, pc);
  addFlag(e, n, pc);
  syncLinesFlags(e, n);
}

export function settlementClick(/**@type {number}*/x, /**@type {number}*/y)
{
  let sel = settlementMouseMove(x,y);
  if (typeof sel == "number")
  {
    setMyDest(sel < 0 ? -1.7 : 1.7, g.myModel().position.z, 1.5);
    g.destCallback = headOutOfSettlement;
  }
  else if (typeof sel == "string")
  {
    settlementStartOperation(sel);
    let muleOutfit = -1;
    let bottomLoc = -1
    switch (sel) {
      case "Mule":    if (bottomLoc == -1) bottomLoc = 0;
      case "Cantina": if (bottomLoc == -1) bottomLoc = 1;
      case "Assay":   if (bottomLoc == -1) bottomLoc = 3;
      case "Land":    if (bottomLoc == -1) bottomLoc = 2;
        if (g.me().mule != null && bottomLoc > 0)
        {
          tempBlink("Sorry, no MULEs allowed", 7500);
          settlementClearOperation();
          return;
        }
        if (bottomLoc == 0 && g.me().mule == null)
          g.destCallback = requestMule;
        else if (bottomLoc == 0 && g.me().mule != null)
        {
          if (g.models.playerMule[g.myColor].position.x == xlocs[0])
          {
            // skip player walking
            sellMule();
            return;
          }
          g.destCallback = sellMule;
        }
        else if (bottomLoc > 0)
          g.destCallback = headToBottomBuilding;

        setMyDest(xlocs[bottomLoc], g.myModel().position.z, 1.5);
        break;
      case "Food":
        muleOutfit = 0; break;
      case "Energy":
        muleOutfit = 1; break;
      case "Smithore":
        muleOutfit = 2; break;
      case "Crystite":
        muleOutfit = 3; break;
    }
    if (muleOutfit >= 0)
    {
      if (g.me().mule == null)
      {
        tempBlink("You must first buy a MULE to outfit", 7500);
        settlementClearOperation();
        return;
      }
      if (g.models.playerMule[g.myColor].position.x == xlocs[muleOutfit])
      {
        setMyDest(g.myModel().position.x, 
                  g.myModel().position.z, 1.5);
      }
      else
      {
        let delta = muleoffset;
        if (xlocs[muleOutfit] < g.myModel().position.x)
          delta = -delta;
        setMyDest(xlocs[muleOutfit] + delta, 
            g.myModel().position.z, 1.5);
      }
      
      g.destCallback = requestMuleOutfit;
    }
  }
}

export function buymule()
{
  let modelm = g.models.playerMule[g.myColor];
  let modelp = g.myModel();

  modelm.position.x = xlocs[0];
  modelm.position.z = zlocs[1];
  g.scene.add(modelm);
  g.muleLight[g.myColor].visible = false;

  setMyMuleDest(modelm.position.x, modelp.position.z, 1.5);

  setMyDest(modelp.position.x - muleoffset,
            modelp.position.z, 1.5);

  g.destCallback = settlementClearOperation;
}

export function RemoveMuleFromScene(/**@type {string}*/ pc)
{
  if (pc != g.myColor)
    g.scene.remove(g.models.playerMule[pc]);
}

function removeMule()
{
  settlementClearOperation();
  g.me().mule = null;
  g.scene.remove(g.models.playerMule[g.myColor]);
  g.muleLight[g.myColor].visible = false;
  if (g.models.player[g.myColor].position.x > xlocs[0])
    setMyDest(xlocs[0], g.models.player[g.myColor].position.z, 1.5);

  send(t.MuleRemovedFromScene());
}

function muleGoesBack()
{
  setMyMuleDest(xlocs[0], zlocs[1], 1.5);

  g.destCallback = removeMule;
}

export function sellMuleConfirmed()
{
  let modelp = g.myModel();
  let modelm = g.models.playerMule[g.myColor];

  if (modelm.position.x == xlocs[0])
  {
    // skip player walking
    muleGoesBack();
    return;
  }

  setMyDest(xlocs[0] + muleoffset,
    modelp.position.z, 1.5);

  g.destCallback = muleGoesBack;
}


let cantinaSound = new Audio("/sound/cantina.mp3");
let bell = new Audio("/sound/bell.mp3");

export async function CantinaWinnings(/**@type {t.CantinaResult}*/ msg)
{
  if (msg.pc == g.myColor)
  {
    g.startNewProdReadyPromise();
    cantinaSound.play();
    tempBlink("You won (\u20BF)" + msg.winnings + " gambling at the Cantina.", 5500);
    g.waitingForServerResponse = true;
    await sleep(4000);
    switchCamView(false);
    g.shouldCallProdReady = true;
  }
  
  g.scene.remove(g.models.player[msg.pc]);
}

export async function AssayResult(/**@type {t.AssayResult}*/msg)
{
  let pg = new THREE.PlaneGeometry( 3.75, .8 );
  let material = new THREE.MeshBasicMaterial({
        map: g.textures.crystiteLevelTexture[msg.val],
        transparent: true
    });
  let cm = new THREE.Mesh( pg, material );
  cm.rotation.x =  Math.PI * - 0.5;
  cm.position.set(msg.e*4, 0.1, msg.n*-4-1.4);
  g.markers.add(cm); 
  await sleep(12000);
  g.markers.remove(cm);
}

/**@param {Object3D} box @param {number} e @param {number} s @param {number} n*/
function setPosForProdBox(box, e, s, n)
{
  let x = e * 4 - 2.5 + n;
  let y = .15;
  let z = s * 4 + 1.5;
  if (n > 4 && n < 8)
   x -= 3.5;
  else if (n >= 8)
  {
    x = e * 4 + 1.5;
    z = s * 4 + 1 - (.5 * (n-8));
  }
  box.position.set(x,y,z);
}

let ba = [
 new Audio("/sound/beep.wav"),
 new Audio("/sound/beep.wav"),
 new Audio("/sound/beep.wav"), 
 new Audio("/sound/beep.wav"), 
 new Audio("/sound/beep.wav")];
let bi = 0;
export async function beep()
{
  ba[bi%ba.length].play();
  bi++;
}


/** @param {string[]} keys */
export async function addProdUnits(keys)
{
  /** @type {Object.<string,number>} */
  let prodCounts = {};
  for (let k of keys)
  {
    let pc = g.landlots[k].owner;
    if (pc == null) continue;
    beep();
    
    let box = new THREE.BoxGeometry(.2,.2,.2);
    let mesh = new THREE.Mesh(box, g.materials.lotColor[pc]);
    mesh.userData = g.landlots[k];
    mesh.userData["lotKey"] = k;
    g.prodGroup.add(mesh);
    
    if (prodCounts[k] == undefined)
      prodCounts[k] = 0;
    prodCounts[k]++;

    setPosForProdBox(mesh, getE(k), -getN(k), prodCounts[k]);
    
    await sleep(80);
  }
}

export async function Production(/**@type {t.Production}*/msg, /**@type {t.ColonyEvent}*/ colonyEvent)
{
  await g.readyToShowProduction;

  if (colonyEvent.eventType > -1 && colonyEvent.beforeProd)
  {
    ui.msg.innerText = colonyEvent.fullMsg;
    // do sounds?
    
    if (colonyEvent.lotKey != null)
    {
      let e = getE(colonyEvent.lotKey);
      let n = getN(colonyEvent.lotKey);
      if (e > -5 && e < 5 && n > -3 && n < 3) {
        g.landlotOverlay.visible = true;
        g.landlotOverlay.position.set(e * 4, .01, n * -4);
      }
    }

    /* asteroid, radiation */
    if (colonyEvent.eventType == 5 || colonyEvent.eventType == 6)
    {
      if (colonyEvent.lotKey != null)
      {
        deleteLandModelIfExists(
          LandLotStr(getE(colonyEvent.lotKey),
            getN(colonyEvent.lotKey)));
        g.landlots[colonyEvent.lotKey].res = -1;
        let e = getE(colonyEvent.lotKey);
        let n = getN(colonyEvent.lotKey);
        syncLinesFlags(e, n);
      }
    }

    await sleep(2000);
  }
  
  await sleep(1000);
  await addProdUnits(msg.lotKeys);
  await sleep(1500);
  
  if (colonyEvent.eventType > -1 && !colonyEvent.beforeProd)
  {
    ui.msg.innerText = colonyEvent.fullMsg;
    // remove prod units for pest attack, pirates
    
    if (colonyEvent.eventType == 1 /* PEST */ && colonyEvent.lotKey != null)
    {
      let e = getE(colonyEvent.lotKey);
      let n = getN(colonyEvent.lotKey);
      if (e > -5 && e < 5 && n > -3 && n < 3) {
        g.landlotOverlay.visible = true;
        g.landlotOverlay.position.set(e * 4, .01, n * -4);
      }
      
      let children = [...g.prodGroup.children];
      for (let ch of children)
      {
        if (ch.userData["lotKey"] == colonyEvent.lotKey)
          g.prodGroup.remove(ch);
      }
    }

    if (colonyEvent.eventType == 7 /* PIRATES */)
    {   
      let children = [...g.prodGroup.children];
      for (let ch of children)
      {
        if (ch.userData["res"] == 3 /* CRYSTITE */)
          g.prodGroup.remove(ch);
      }
    }

    await sleep(2000);
  }

  ui.msgblink.innerText = 'Click anywhere to continue.';
  g.didProd = true;
}
