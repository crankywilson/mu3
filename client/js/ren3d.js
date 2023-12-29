import { Vector3, Object3D, Camera } from "../three/Three.js";
import { g, send } from "./game.js";
import * as t from './types.js';
/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;  // initialized in setup.js

/**
@typedef {import("./types.js").Player} Player 
*/


function setMyDest(/**@type {number}*/ x,/**@type {number}*/ z, 
                   /**@type {number}*/ spd)
{
  let my = g.models.player[g.myColor];
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
}

function headToBottomBuilding()
{
}

function requestMuleOutfit()
{
  send(t.RequestMuleOutfit(currentOp));
}

export function outfitmule()
{
  tempBlink("Outfitting MULE for " + currentOp);
  g.models.player[g.myColor].rotation.y = 3.14;
  setMyMuleDest(g.models.playerMule[g.myColor].position.x, zlocs[0], 1.5);
  g.destCallback = returnOutfittedMule;
}

function returnOutfittedMule()
{
  setMyMuleDest(g.models.playerMule[g.myColor].position.x,
                g.models.player[g.myColor].position.z, 1.5);

  let sl = g.muleLight[g.myColor];

  switch (currentOp) {
    case "Food": sl.color.set(0x00ff00); break;
    case "Energy": sl.color.set(0xffff88); break;
    case "Smithore": sl.color.set(0x663311); break;
    case "Crystite": sl.color.set(0xaaddff); break;
  }
  sl.visible = true;

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
  g.models.player[g.myColor].rotation.y = 0;
  settlementClearOperation();
}

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

  if (showSettlement == undefined)
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

function moveTowards(
/**@type {Object3D}*/ obj,
/**@type {Vector3}*/  dest,
/**@type {number}*/   dist )
{
  if (obj.position.equals(dest)) return true;
  if (obj.position.distanceTo(dest) <= dist)
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
    if (g.landlotOverlay != null && g.landlotOverlay.parent == g.scene)
      g.scene.remove(g.landlotOverlay);
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

export function SyncLandGeom()
{
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
        send(t.DestReached(c, p.x, p.z));

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

function render()
{
  if (!readyToRender) return;
  const delta = g.clock.getDelta();

  moveTowards(g.camera, cptarget, delta * 60);
  rotateCameraX();

  for (let c in g.players)
  {
    let p = g.players[c];
    if (p == null) continue;
    AnimatePlayerAndMule(p, c, delta);
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
    if (intersects[0].object.position.z > 0)
      ui.msgblink.innerText = "";
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

export function settlementClick(/**@type {number}*/x, /**@type {number}*/y)
{
  let sel = settlementMouseMove(x,y);
  if (typeof sel == "number")
  {
  }
  else if (typeof sel == "string")
  {
    settlementStartOperation(sel);
    let muleOutfit = -1;
    let bottomLoc = -1
    switch (sel) {
      case "Mule":    if (bottomLoc == -1) bottomLoc = 0;
      case "Cantina": if (bottomLoc == -1) bottomLoc = 1;
      case "Assay":   if (bottomLoc == -1) bottomLoc = 2;
      case "Land":    if (bottomLoc == -1) bottomLoc = 3;
        if (g.me().mule != null && bottomLoc > 0)
        {
          tempBlink("Sorry, no MULEs allowed", 7500);
          settlementClearOperation();
          return;
        }
        setMyDest(xlocs[bottomLoc], g.me().z, 1.5);
        if (bottomLoc == 0 && g.me().mule == null)
          g.destCallback = requestMule;
        else if (bottomLoc == 0 && g.me().mule != null)
          g.destCallback = sellMule;
        else if (bottomLoc == 1)
          g.destCallback = headToBottomBuilding;
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
        setMyDest(g.models.player[g.myColor].position.x, 
                  g.models.player[g.myColor].position.z, 1.5);
      }
      else
      {
        let delta = muleoffset;
        if (xlocs[muleOutfit] < g.models.player[g.myColor].position.x)
          delta = -delta;
        setMyDest(xlocs[muleOutfit] + delta, 
            g.models.player[g.myColor].position.z, 1.5);
      }
      
      g.destCallback = requestMuleOutfit;
    }
  }
}

export function buymule()
{
  let modelm = g.models.playerMule[g.myColor];
  let modelp = g.models.player[g.myColor];

  modelm.position.x = xlocs[0];
  modelm.position.z = zlocs[1];
  g.scene.add(modelm);
  g.muleLight[g.myColor].visible = false;

  setMyMuleDest(modelm.position.x, modelp.position.z, 1.5);

  setMyDest(modelp.position.x - muleoffset,
            modelp.position.z, 1.5);

  g.destCallback = settlementClearOperation;
}


