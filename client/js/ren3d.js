import { Vector3, Object3D, Camera } from "../three/Three.js";
import { g, send } from "./game.js";
import * as t from './types.js';
/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;  // initialized in setup.js


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


export function initTHREERef(/** @type {import('../three/Three.js')} */r)
{
  THREE = r;
  cpset = new THREE.Vector3(0, 1.8, 4);
  cpfar = new THREE.Vector3(0, 32.7, 23);
  cptarget = cpfar;
  readyToRender = true;
}

export function switchCamView()
{
  camTargetIsSettlement = !camTargetIsSettlement;
  cptarget = camTargetIsSettlement ? cpset : cpfar;
  crxtarget = camTargetIsSettlement ? crxset : crxfar;
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
  if (!g.camera.position.equals(cpfar)) return {e:999,n:-999}; // don't allow selecting unless in 'far' view

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

export async function SetupMounds()
{
  await g.init3DComplete;
  const moundMat = new THREE.MeshBasicMaterial( { color: 0x847463 } );
  for (let k in g.landlots)
  {
    let ldata = g.landlots[k];
    let d = ldata.moundGeom;
    for (let i=0; i<ldata.numMounds; i++)
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
  g.moundGeomPlaced = true;
}

export function SyncLandGeom()
{
}

const playerstilltime = .55;
const mulestilltime = 7;

function AnimatePlayerAndMule(
/**@type {import("./types.js").Player}*/ p, 
/**@type {string}*/ c,
/**@type {number}*/ delta)
{
  if (p.dest != null)
  {
    let playerModel = g.models.player[c];

    playerModel.rotation.y = Math.atan2(
      p.dest.x - playerModel.position.x,
      p.dest.z - playerModel.position.z);

    g.mixer[c].update(delta * p.dest.spd);

    if (p.mule != null)
      moveTowards(g.models.playerMule[c], 
        new Vector3(p.dest.x, 0, p.dest.z), delta * p.dest.spd);
        
    if (moveTowards(playerModel, 
          new Vector3(p.dest.x, 0, p.dest.z), delta * p.dest.spd))
    {
      if (c == g.myColor)
        send(t.DestReached(c, p.x, p.z));

      p.dest = null;
      playerModel.rotation.y = 0;
      g.mixer[p.color].setTime(playerstilltime);
      if (g.myColor == c && g.destCallback != null)
      {
        let cb = g.destCallback;
        g.destCallback = null;
        cb();
      }
    }
  }
  else if (p.mule != null && p.mule.dest != null)
  {
    let muleModel = g.models.playerMule[c];

    /* should we rotate model to face dest? */
    /* think we need to do mixer stuff here */

    if (moveTowards(muleModel,
      new Vector3(p.mule.dest.x, 0, p.mule.dest.z), delta * p.mule.dest.spd))
    {
      p.mule.dest = null;
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




