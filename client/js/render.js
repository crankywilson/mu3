// @ts-check
function render() 
{
  const delta = clock.getDelta();

  handleCamMove(delta);
  moveChars(delta);
  animFlags(delta);

  if (g.blinkPlotOverlay)
  {
    let frame = ((Math.floor(clock.elapsedTime * 100)) % 100);
    if (frame <= 50)
      g.plotOverlay.material.opacity = frame/100;
    else
      g.plotOverlay.material.opacity = (100-frame)/100;
  }

  renderer.render( scene, camera );
}

function animFlags(delta)
{
  for (let k in g.plots)
  {
    if (g.plots[k].flagMixer != null)
      g.plots[k].flagMixer.update(delta);
  }
}




function animate() 
{
  if (auctioning) return;
  requestAnimationFrame( animate );
  render();
}


let slcolor = [0x00ff00, 0xffff88, 0x663311, 0xaaddff];
let dudestilltime = .55;
let mulestilltime = 7;

let _v3 = new THREE.Vector3();
let _v3r = new THREE.Vector3();
let _v3o = new THREE.Vector3();
let _done = {done:false};
let _lastPos = new THREE.Vector3();
function moveChars(delta)
{
  let mlz = d.mlz;
  for (let i=1; i<5; i++)
  {
    if (g.pl[i].model == null)
      continue;
    if (g.pl[i].dests.length > 0)
    {
      let d = g.pl[i].dests[0];
      if (d.pauseCount > 0)
      {
        d.pauseCount--;
        continue;
      }
      AdjustYForRiver(d, false);
      let m = d.muleOnly ? g.pl[i].mule : g.pl[i].model;
      if (m == null) continue;
      if (d.muleOnly && d.z == mlz)
        m.rotation.y = 0;
      _v3.set(d.x, d.y, d.z);
      _v3o.copy(m.position);
      _done.done = false;
      _v3r = move(m.position, _v3, g.pl[i].speed * delta, _done);
      m.position.set(_v3r.x, _v3r.y, _v3r.z);
      if (d.muleOnly && d.z == mlz)
      {
        g.pl[i].model.rotation.y = Math.atan2(
            g.pl[i].mule.position.x - g.pl[i].model.position.x,
            g.pl[i].mule.position.z - g.pl[i].model.position.z
          );
      }
      if (_done.done && !d.muleOnly)
      {
        g.pl[i].mixer.setTime(dudestilltime);
        g.pl[i].dests.shift();
        if (g.pl[i].dests.length > 0 && !g.pl[i].dests[0].muleOnly)
        {
          g.pl[i].model.rotation.y = Math.atan2(
            g.pl[i].dests[0].x - g.pl[i].model.position.x,
            g.pl[i].dests[0].z - g.pl[i].model.position.z
          );
        }
        else if (g.pl[i].dests.length > 0 && g.pl[i].dests[0].muleOnly)
        {
          if (g.sellingMule)
          {
            setTimeout(()=>send("SellMule"), 250);
            g.pl[i].model.rotation.y = 0;
            g.pl[i].mule.rotation.y = Math.atan2(
             g.pl[i].dests[0].x - g.pl[i].mule.position.x,
             g.pl[i].mule.position.z - g.pl[i].dests[0].z, 
            );
            d = g.pl[i].dests[0];
          }
        }
        else
        {
          g.pl[i].model.rotation.y = 0;
          if (i == g.myChar)
          {
            if (d.installPlot != null)
              installMule(d.installPlot);
            if (d.uninstallPlot != null)
              uninstallMule(d.uninstallPlot);
            if (d.assay)
              assay();
            if (d.land)
              land();
            if (d.cantina)
              cantina();
          }
        }
      }
      else if (_done.done && d.muleOnly)
      {
        g.pl[i].dests.shift();
        if (d.muleupg >= 0)
        {
          if (g.myChar == i)
          {
            g.selectedBuilding = false;
            settlementMouseMove(0,0);
          }
          
          /** @type {?THREE.SpotLight} */ // @ts-ignore
          let sl = g.pl[i].mule.getObjectByName('outfitlight');
          if (sl == undefined)
          {
            sl = new THREE.SpotLight(0x00ff00, 20);
            sl.position.set(0,9,0)
            sl.distance=0.35
            sl.name='outfitlight';
          }
          sl.color.set(slcolor[d.muleupg]);
          g.pl[i].mule.add(sl.target)  // must do this or spotlight won't point to right thing when mule is moved
          g.pl[i].mule.add(sl)

          g.pl[i].mule.rotation.y = 3.14;
          g.pl[i].dests[0].pauseCount = 1;
        }
        else
        {
          g.pl[i].mumix.setTime(mulestilltime);
          g.pl[i].mulefollowing = true;
        }
        if (g.pl[i].dests.length == 0)
        {
          g.pl[i].model.rotation.y = 0;
          g.pl[i].mule.rotation.y = (g.pl[i].mule.position.x > g.pl[i].model.position.x ? -1.57 : 1.57);
        }
      }
      else if (!_done.done)
      {
        if (d.muleOnly || (!d.muleOnly && g.pl[i].mule && g.pl[i].mulefollowing))
        {
          let newTime = g.pl[i].mumix.time + (delta * g.pl[i].speed * 12);
          if (newTime > 20.5)
            newTime -= 16.5;
          g.pl[i].mumix.setTime(newTime);
        }
        if (!d.muleOnly)
        {
          g.pl[i].mixer.update(delta * g.pl[i].speed);
        }
      }

      if (!d.muleOnly && g.pl[i].mule && g.pl[i].mulefollowing)
      {
        let d = _v3o.sub(_v3r).normalize().multiplyScalar(.5);
        if (d.length() > 0)
        {
          g.pl[i].mule.position.copy(m.position);
          g.pl[i].mule.position.add(d);
          g.pl[i].mule.rotation.y = Math.atan2(-d.x, d.z);
        }

        if (_done.done)
          g.pl[i].mumix.setTime(mulestilltime);
      }

      AdjustYForRiver(g.pl[i].model);
      AdjustYForRiver(g.pl[i].mule);
    }
    if (i == g.myChar)
    {
      let pos = g.pl[i].model.position;
      if (g.pl[i].dests.length > 0 && g.pl[i].dests[0].x == 0 && 
          g.pl[i].dests[0].z > -2  && g.pl[i].dests[0].z < 2  &&
          g.state == st.MOVEPLAYER && pos.x > -2 && pos.x < 2 && pos.y > -2 && pos.y < 2)
      {
        g.state = st.TRANSITION_TO_SETTLEMENT;
        scene.remove(g.plotOverlay);
      }
    }
  }
}

function AdjustYForRiver(m, mIsModel=true)
{
  if (m == null) return;
  let _v3 = m;
  if (mIsModel)
    _v3 = m.position;
  if (_v3.x > -2 && _v3.x < 2 && ! (_v3.z > -2 && _v3.z < 2))
    _v3.y = -.15;
  else
    _v3.y = 0;
}

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

const NORTH = 0;
const SOUTH = 1;
const WEST = 2;
const EAST = 3;

function reverseDir(d)
{
  if (d == NORTH) return SOUTH;
  if (d == SOUTH) return NORTH;
  if (d == EAST) return WEST;
  if (d == WEST) return EAST;
  return -1;
}

function removeExtraLinesAndFlags(e, s, o, r, fromKey="", comingDir=-1)
{
  let thisPlotKey = plotToStr(e, s);
  if (!(thisPlotKey in g.plots))
    return;

  if (thisPlotKey in g.plotsProcessedForRemove)
    return;

  let thisPlot = g.plots[thisPlotKey];
  if (thisPlot.ownerChar != o)
    return;

  if (thisPlot.res != r)
    return;

  // at this point we've found a matching plot
  g.plotsProcessedForRemove[thisPlotKey] = true;

  if (fromKey != "" && comingDir >= 0)
  {
    if (g.plots[fromKey].lines[comingDir] != null)
    {
      scene.remove(g.plots[fromKey].lines[comingDir]);
      g.plots[fromKey].lines[comingDir] = null;
    }
    let thisDir = reverseDir(comingDir);
    if (thisPlot.lines[thisDir] != null)
    {
      scene.remove(thisPlot.lines[thisDir]);
      thisPlot.lines[thisDir] = null;
    }
    if (thisPlot.flag != null)
    {
      thisPlot.flagMixer.stopAllAction();
      thisPlot.flagMixer.uncacheRoot(thisPlot.flag);
      scene.remove(thisPlot.flag);
      thisPlot.flag = null;
    }
    if (thisPlot.pole != null)
    {
      scene.remove(thisPlot.pole);
      thisPlot.pole = null;
    }
  }

  removeExtraLinesAndFlags(e, s-1, o, r, thisPlotKey, NORTH);
  removeExtraLinesAndFlags(e, s+1, o, r, thisPlotKey, SOUTH);
  removeExtraLinesAndFlags(e+1, s, o, r, thisPlotKey, EAST);
  removeExtraLinesAndFlags(e-1, s, o, r, thisPlotKey, WEST);
}

function removeAllExtraLinesAndFlags()
{
  g.plotsProcessedForRemove = {}
  for (let k in g.plots)
  {
    if (k in g.plotsProcessedForRemove)
      continue;

    let es = strToPlot(k);

    let plot = g.plots[k];

    if (plot.ownerChar > 0 && plot.res >= 0)
      removeExtraLinesAndFlags(es[0], es[1], plot.ownerChar, plot.res);
  }
}

function removeLinesAndFlags(k)
{
  let thisPlot = g.plots[k];

  for (let i=0; i<4; i++)
  {
    if (thisPlot.lines[i] != null)
    {
      scene.remove(thisPlot.lines[i]);
      thisPlot.lines[i] = null;
    }
  }

  if (thisPlot.flag != null)
  {
    thisPlot.flagMixer.stopAllAction();
    thisPlot.flagMixer.uncacheRoot(thisPlot.flag);
    scene.remove(thisPlot.flag);
    thisPlot.flag = null;
  }

  if (thisPlot.pole != null)
  {
    scene.remove(thisPlot.pole);
    thisPlot.pole = null;
  }
}

function restoreNeighborLinesAndFlags(k)
{
  let thisPlot = g.plots[k];
  let es = strToPlot(k);

  let wplotKey = plotToStr(es[0] - 1, es[1]);
  if (wplotKey in g.plots)
  {
    addLine(wplotKey, EAST);
    addFlag(wplotKey);
  }

  let eplotKey = plotToStr(es[0] + 1, es[1]);
  if (eplotKey in g.plots)
  {
    addLine(eplotKey, WEST);
    addFlag(eplotKey);
  }

  let splotKey = plotToStr(es[0], es[1] + 1);
  if (splotKey in g.plots)
  {
    addLine(splotKey, NORTH);
    addFlag(splotKey);
  }

  let nplotKey = plotToStr(es[0] - 1, es[1] - 1);
  if (nplotKey in g.plots)
  {
    addLine(nplotKey, SOUTH);
  }

  // also restore lines and flags on this plot
  for (let i=0; i<4; i++) addLine(k, i);
  addFlag(k);
}

function addLine(k, dir)
{
  let plot = g.plots[k];
  let es = strToPlot(k);

  if (plot.ownerChar > 0)
  {
    if (plot.lines[dir] != null)
      return;  // already a line here...

    let mat = d.plotboundMat[plot.ownerChar];
    let g = null;
    if (dir == NORTH || dir == SOUTH)
      g = new THREE.BoxGeometry(4, .01, .1);
    else
      g = new THREE.BoxGeometry(.1, .01, 4);

    let m = new THREE.Mesh( g, mat );

    switch (dir) {
      case NORTH: m.position.set(es[0]*4, 0, es[1]*4 - 1.95); break;
      case SOUTH: m.position.set(es[0]*4, 0, es[1]*4 + 1.95); break;
      case EAST:  m.position.set(es[0]*4 + 1.95, 0, es[1]*4); break;
      case WEST:  m.position.set(es[0]*4 - 1.95, 0, es[1]*4); break;
    }

    plot.lines[dir] = m;
    scene.add(m);
  }
}

function addFlag(k)
{
  let es = strToPlot(k);
  if (g.plots[k].ownerChar < 1)
    return;

  if (g.plots[k].pole != null)
    return;

  if (k[1] == 'R') 
  {
    let marker =  new THREE.CylinderGeometry(.1, .1, .3);
    g.plots[k].pole = new THREE.Mesh( marker, d.plotboundMat[g.plots[k].ownerChar] );
    g.plots[k].pole.position.set(es[0] * 4 - 1.35, .1, es[1] * 4);
    scene.add(g.plots[k].pole);
  }
  else
  {
    let f = d.flagmod.clone();
    let mixer = new THREE.AnimationMixer(f);
    let action = mixer.clipAction(d.flagAnim);
    action.play();
    scene.add(f);
    
    g.plots[k].flag = f;
    g.plots[k].flagMixer = mixer;

    function updateTexture(child)
    {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
        child.material.map = d.flagTexture[g.plots[k].ownerChar];
      }
    }
    f.traverse(updateTexture);

    f.position.set(es[0] * 4 - 1, 1.5, es[1] * 4);
    let poleGeom = new THREE.CylinderGeometry(.04, .05, 1.8);
    g.plots[k].pole = new THREE.Mesh( poleGeom, d.poleMat );
    g.plots[k].pole.position.set(es[0] * 4 - 1.35, .9, es[1] * 4);
    scene.add(g.plots[k].pole);
    g.plots[k].flag = f;
  }
}

