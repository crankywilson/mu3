import { g } from "./game.js"

/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;  // initialized in setup.js

/** 
@typedef {import('../three/Three.js').Vector3} Vector3 
@typedef {import('../three/Three.js').Clock} Clock 
@typedef {import('../three/Three.js').Object3D} Object3D 

@typedef MoveQItem
 @property {Object3D} obj
 @property {Vector3} dest
 @property {function} cbArrived

@typedef {Set<MoveQItem>} MoveQ
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
let crxtarget = crxfar;
let readyToRender = false;
/**@type {MoveQ}*/
let movingObjs = new Set();

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
    //e("sett").style.visibility = "visible";
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
  }
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

function render()
{
  if (!readyToRender) return;
  const delta = g.clock.getDelta();

  moveTowards(g.camera, cptarget, delta * 60);
  rotateCameraX();

  for (let i of movingObjs)
  {
    // I think we need to do a model anim here
    if (moveTowards(i.obj, i.dest, delta * 60))
    {
      i.cbArrived(i.obj);
      movingObjs.delete(i);  // internet tells me this is safe
    }
  }

  g.renderer.render( g.scene, g.camera );
}




