// @ts-check
const st = {
  SCORE: 'SCORE',
  WAITINGFORALLJOIN: 'WAITINGFORALLJOIN',
  WAITFORLANDGRANT: 'WAITFORLANDGRANT',
  LANDGRANT: 'LANDGRANT',
  WAITINGTOSTARTIMPROVE: 'WAITINGTOSTARTIMPROVE',
  MOVEPLAYER: 'MOVEPLAYER',
  SETTLEMENT: 'SETTLEMENT',
  LANDAUCTION_SHOW: 'LANDAUCTION_SHOW',
  TRANSITION_TO_SETTLEMENT: 'TRANSITION_TO_SETTLEMENT',
  TRANSITION_OUT_STLMNT: 'TRANSITION_OUT_STLMNT',
  PRODUCTION_ANIM: 'PRODUCTION_ANIM',
  PRODUCTION_DONE: 'PRODUCTION_DONE'
};

class Dest
{
  constructor(/**@type {number}*/ x, /**@type {number}*/ y, /**@type {number}*/ z, muleOnly=false, muleupg=-1)
  {
    this.x = x;
    this.y = y;
    this.z = z;
    this.muleOnly = muleOnly;
    this.muleupg = muleupg;
    this.pauseCount = 0;
    /** @type {?PlotData} */
    this.installPlot = null;
    /** @type {?PlotData} */
    this.uninstallPlot = null;
    this.cantina = false;
    this.land = false;
    this.assay = false;
  }
}

class Player 
{
  constructor() 
  {
    /** @type {?THREE.Mesh} */            this.model = null;
    /** @type {?THREE.AnimationMixer} */  this.mixer = null;
    /** @type {?THREE.AnimationMixer} */  this.mumix = null;
    /** @type {?Dest[]} */                this.dests = [];
                                          this.speed = 1.5;
    /** @type {?THREE.Scene} */           this.mule  = null;
                                          this.money = 1000;
                                          this.score = 0;
                                          this.mulefollowing = false;
                                          this.name  = '';
  }
}

class PlotData
{
  constructor(k)
  {
    this.k = k;
    this.ownerChar = 0;
    this.res       = -1;
    /** @type {?THREE.Scene} */
    this.flag      = null;
    /** @type {?THREE.AnimationMixer} */ 
    this.flagMixer = null;
    /** @type {?THREE.Mesh} */
    this.pole      = null;
    /** @type {?THREE.Mesh[]} */
    this.lines = [null, null, null, null];     // ind 0=N, 1=S, 2=W, 3=E
    /** @type {?THREE.Object3D} */
    this.rsrc3d    = null;
  }
}

let g =
{
  state: st.WAITINGFORALLJOIN,
  pl: [new Player(), new Player(), new Player(), new Player(), new Player()], // indexed by charID
  /** @type {Object.<string, PlotData>} */
  plots: {},
  plotsProcessedForRemove: {},
  /** @type {Number[]} */
  awaiting: [],  // player ID
  plotOverlay: new THREE.Mesh(new THREE.PlaneGeometry(4, 4, 1, 1), new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: .5 })),
  blinkPlotOverlay: false,
  myID: -1,
  myChar: -1,
  mySetZ: 0,
  myp: new Player(),
  myMuleType: -1,       // let's say '4' means marking for land auction and '5' means assay
  waitingForMule: false,
  sellingMule: false,
  selectedBuilding: false,
  playerEvents: {},  // set before IMPROVE state sent -- this is referenced then to show data and play appropriate sound
  markers: new THREE.Group,
  prodGroup: new THREE.Group,
  minBid: 10,
  bidIncr: 1,
  maxBid: 45,
  passVal: 7,
  passThresh: 8,
  outVal: 50,   // this val used to take seller out as well as buyer to increase max bid if store has no units left
  outThresh: 49,
  buying: true,
  selloffers: true,
  target: 0,
  curbid: 0,
  auctionRes: ""
};

g.plotOverlay.rotation.x = -90 * Math.PI / 180;

function sendMyPosData()
{
  let my = g.pl[g.myChar];
  socket.send(JSON.stringify(
    { 
      msg: "PosData",
      char: g.myChar, 
      pos: my.model.position,
      speed: my.speed, 
      dests: my.dests,
      mule: my.mule != null,
      muleFollowing: my.mulefollowing
    }
  ));
}

function updatePosData(m)
{
  let p = g.pl[m.char];
  p.model.position.set(m.pos.x, m.pos.y, m.pos.z);
  p.speed = m.speed;
  p.dests = m.dests;
  p.mulefollowing = m.muleFollowing;
  if (p.mule != null && !m.mule)
  {
    scene.remove(p.mule);
    p.mule = null;
  }
  else if (p.mule == null && m.mule)
  {
    cloneMuleModel(m.char);
  }

  if (p.dests.length > 0 && !p.dests[0].muleOnly)
  {
    p.model.rotation.y = Math.atan2(
      p.dests[0].x - p.model.position.x,
      p.dests[0].z - p.model.position.z
    );
  }
}

function setupComplete() 
{
  e("msg").innerText = "Setup complete";
  send('SetupComplete');
  requestAnimationFrame(animate);
}

let _viewProjectionMatrix = new THREE.Matrix4();
function unprojectVector(vector, camera) 
{
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  _viewProjectionMatrix.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
  return vector.applyMatrix4(_viewProjectionMatrix);
}

let _plotCoord = new THREE.Vector2();
function getPlotForMouse(x, y) 
{
  var pos = new THREE.Vector3(0, 0, 0);
  var pMouse = new THREE.Vector3(
    (x / renderer.domElement.width) * 2 - 1,
    -(y / renderer.domElement.height) * 2 + 1,
    1
  );

  unprojectVector(pMouse, camera);

  var cam = camera.position;
  var m = pMouse.y / (pMouse.y - cam.y);

  pos.x = pMouse.x + (cam.x - pMouse.x) * m;
  pos.z = pMouse.z + (cam.z - pMouse.z) * m;


  _plotCoord.x = (Math.floor((pos.x + 18) / 4) - 4);
  _plotCoord.y = -(Math.floor((pos.z + 18) / 4) - 4);

  return _plotCoord;
}

function highlightPlot(/**@type {THREE.Vector2}*/ plot) 
{
  if (plot.x > -5 && plot.x < 5 && plot.y > -3 && plot.y < 3) {
    if (g.plotOverlay.parent == null)
      scene.add(g.plotOverlay);
    g.plotOverlay.position.set(plot.x * 4, .01, plot.y * -4);
  }
  else {
    if (g.plotOverlay.parent != null)
      scene.remove(g.plotOverlay);
  }
}

let _raycaster = new THREE.Raycaster();
let _pointer = new THREE.Vector2();
function settlementMouseMove(x, y) 
{
  _pointer.x = (x / window.devicePixelRatio / window.innerWidth) * 2 - 1;
  _pointer.y = - (y / window.devicePixelRatio / window.innerHeight) * 2 + 1;
  _raycaster.setFromCamera(_pointer, camera);
  const intersects = _raycaster.intersectObjects(d.buildingsGroup.children);
  for (let i = 0; i < d.buildingsGroup.children.length; i++)
  {
    //  @ts-ignore
    d.buildingsGroup.children[i].material.color.set(d.buildingColor);
  }
  e("msg").innerText = "";
  e("msg").style.backgroundColor = "";
  if (intersects.length > 0) {
    //  @ts-ignore
    let mat = intersects[0].object.material;
    mat.color.set(0x999999);
    e("msg").innerText = mat.name;
    e("msg").style.backgroundColor = "rgba(255,255,255,.4)";
  }
  else {
    let plot = getPlotForMouse(x, y);
    if (plot.x != 0) {
      e("msg").innerText = "Leave Settlement";
      e("msg").style.backgroundColor = "rgba(255,255,255,.4)";
    }
  }
}

function plotOverlayIsWhite()
{
  return g.plotOverlay.material.color.r == 1 && 
          g.plotOverlay.material.color.g == 1 &&
          g.plotOverlay.material.color.b == 1;
}


function validForLandGrant(x, y)
{
  if (!g.awaiting.includes(g.myID))
    return false;
  return plotAvail(x, -y);
}

let _lastX = 0;
let _lastY = 0;
function mouseMove(mouseEvent) {
  let x = 0;
  let y = 0;

  if (mouseEvent == null) {
    x = _lastX;
    y = _lastY;
  }
  else {
    x = mouseEvent.pageX;// - view.getBoundingClientRect().x, 
    y = mouseEvent.pageY;
    _lastX = x;
    _lastY = y;
  }

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

  if (g.state == st.LANDGRANT || g.state == st.MOVEPLAYER) {
    if (plotOverlayIsWhite() && g.awaiting.includes(g.myID)) {
      let plot = getPlotForMouse(x, y);
      if (g.state == st.LANDGRANT && !validForLandGrant(plot.x, plot.y))
        plot.x = 9;  // cause highlotPlot to make overlay go away...
      highlightPlot(plot);
    }
  }
  else if (g.state == st.SETTLEMENT) {
    if (g.waitingForMule || g.selectedBuilding) return;
    settlementMouseMove(x, y);
  }
}

function startMove(char, spd)
{
  
}

function checkForCharMoveSet(plotXClickedOn)
{
  // leave settlement if clicked outside
  if (plotXClickedOn != 0) {
    g.state = st.TRANSITION_OUT_STLMNT;
    let destx = plotXClickedOn * 3;
    let destz = g.pl[g.myChar].model.position.z;
    g.pl[g.myChar].dests.push(new Dest(destx, 0, destz));
    g.pl[g.myChar].model.rotation.y = Math.atan2(destx - g.pl[g.myChar].model.position.x,
      destz - g.pl[g.myChar].model.position.z);
    e("msg").innerText = "";
    e("msg").style.backgroundColor = "";
    sendMyPosData();
    return;
  }
  
  // determine what was clicked on by finding white texture
  for (let i = 0; i < d.buildingsGroup.children.length; i++)
  {
    // @ts-ignore
    /**@type {THREE.MeshLambertMaterial}*/ let mat = d.buildingsGroup.children[i].material;
    if (mat.color.r > .5)
    {
      let destx = d.buildingsGroup.children[i].position.x;
      let destz = g.pl[g.myChar].model.position.z;
      g.pl[g.myChar].dests.length = 0;
      g.pl[g.myChar].dests.push(new Dest(destx, 0, destz));

      g.pl[g.myChar].speed = 1.5;
      g.pl[g.myChar].model.rotation.y = Math.atan2(
        destx - g.pl[g.myChar].model.position.x,
        destz - g.pl[g.myChar].model.position.z
      );

      if (mat.name == "Mule") /* clicked on mule building */
      {
        if (g.myp.mule == null)
        {
          g.pl[g.myChar].dests[0].x -= .5;
          send("MuleReq");
          g.waitingForMule=true;
          e("msg").innerText = "Waiting for MULE";
          mat.color.set(colorStr[g.myChar]);
        }
        else
        {
          g.pl[g.myChar].dests.push(new Dest(g.pl[g.myChar].dests[0].x, 0, g.pl[g.myChar].dests[0].z + 1, true));
          g.sellingMule=true;
          g.waitingForMule=true;
          e("msg").innerText = "Selling MULE";
          mat.color.set(colorStr[g.myChar]);
        }
      }
      else /* figure out which building clicked */
      {
        mat.color.set(colorStr[g.myChar]);
        let valid = true;
        let outfit = false;

        /* outfit mule click */
        if (d.buildingsGroup.children[i].position.z < g.pl[g.myChar].model.position.z)
        {
          outfit = true;
          if (g.myp.mule == null)
          {
            e("msg").innerText = "You must buy a mule to outfit first.";
            valid = false;
          }
        }
        else /* lower building (not mule) clicked */
        {
          if (g.myp.mule != null)
          {
            e("msg").innerText = "No mules allowed.";
            valid = false;
          }
        }

        if (valid)
        {
          g.selectedBuilding = true;
          if (outfit)
          {
            e("msg").innerText = "Outfitting MULE for " + mat.name;
            send("OutfitReq", {res:bmToRes[mat.name]});

            if (g.myp.mule.position.x >= destx)
              destx -= .5
            else
              destx += .5

            g.myp.dests.length = 0;
            g.myp.dests.push(new Dest(destx, 0, destz));

            g.myp.model.rotation.y = Math.atan2(
              destx - g.myp.model.position.x,
              destz - g.myp.model.position.z
            );
          }
          else  // cantina, land, or assay 
          {
            e("msg").innerText = "Going to " + mat.name;
            let newDest = new Dest(destx, 0, d.buildingsGroup.children[i].position.z - .25);
            if (mat.name == "Assay")
              newDest.assay = true;
            if (mat.name == "Land")
              newDest.land = true;
            if (mat.name == "Cantina")
              newDest.cantina = true;

            g.myp.dests.push(newDest);
          }
        }
        else
        {
          //  @ts-ignore
          d.buildingsGroup.children[i].material.color.set(d.buildingColor);
        }
      }

      sendMyPosData();
      break;
    }
  }
}

function doubleClick(mouseEvent)
{
  if (g.state == st.MOVEPLAYER && g.awaiting.includes(g.myID)) 
  {
    let x = mouseEvent.pageX;
    let y = mouseEvent.pageY;

    x *= window.devicePixelRatio;
    y *= window.devicePixelRatio;

    let plot = getPlotForMouse(x, y);
    checkForCharMovePlots(plot.x, plot.y);
    let plotData = g.plots[plotToStr(plot.x,-plot.y)];
    if (g.myp.mule != null || g.myMuleType >= 4)
    {
      if (g.myMuleType < 4 && plotData.ownerChar != g.myChar)
        return;
      g.plotOverlay.material.color.set(colorStr[g.myChar]);
      g.myp.dests[0].installPlot = plotData;
    }
    else if (plotData.res >= 0 && plotData.ownerChar == g.myChar)
    {
      g.plotOverlay.material.color.set(colorStr[g.myChar]);
      g.myp.dests[0].uninstallPlot = plotData;
    }
  }
}

function installMule(/**@type {PlotData}*/ plot)
{
  send("InstallMule", {plot:plot.k, type:g.myMuleType})
  g.myMuleType = -1;
  if (g.myp.mule != null)  // this function used for assay and land, so there might not actually be a mule
  {
    scene.remove(g.myp.mule);
    g.myp.mule = null;
    g.myp.mulefollowing = false;
  }
  sendMyPosData();
  // note that hmUnhighlight handles plotoverlay once server processes msg
}

function uninstallMule(/**@type {PlotData}*/ plot)
{
  send("UninstallMule", {plot:plot.k, type:g.myMuleType});
}

function land()
{
  g.selectedBuilding = false;
  settlementMouseMove(0,0);
  g.myMuleType = 4;
  e("msg").innerText = "Mark plot you wish to sell.";
  g.myp.dests.push(new Dest(g.myp.model.position.x, 0, g.mySetZ));
  g.myp.model.rotation.y = 3.14;
  sendMyPosData();
}

function assay()
{
  g.selectedBuilding = false;
  settlementMouseMove(0,0);
  g.myMuleType = 5;
  e("msg").innerText = "Obtain soil sample from plot.";
  g.myp.dests.push(new Dest(g.myp.model.position.x, 0, g.mySetZ));
  g.myp.model.rotation.y = 3.14;
  sendMyPosData();
}

function addCrysMarker(e, s, n)
{
  let pg = new THREE.PlaneGeometry( 3.75, .8 );
  let material = new THREE.MeshBasicMaterial({
        map: d.cryst[n],
        transparent: true
    });
  let cm = new THREE.Mesh( pg, material );
  cm.rotation.x =  Math.PI * - 0.5;
  cm.position.set(e*4, 0.1, s*4-1.4);
  g.markers.add(cm);
}

function cantina()
{
  send("Cantina");
}

function send(/**@type {string}*/ msg, data=null)
{
  if (data == null)
    data = {};

  data.msg = msg;
  socket.send(JSON.stringify(data));
}

function cloneMuleModel(char, useMyPos=false)
{
  // @ts-ignore
  g.pl[char].mule = THREE.SkeletonUtils.clone(d.mulemod);
  g.pl[char].mumix = new THREE.AnimationMixer(g.pl[char].mule);
  let action = g.pl[char].mumix.clipAction(d.muleAnim);
  action.play();

  /* so the idea here is that if I asked for mule, I clone it and tell the server...
     other chars that get mules will set their position data and handling that will clone the mules */
  if (char == g.myChar)
  {
    if (useMyPos)
    {
      g.pl[char].mule.position.copy(g.myp.model.position);
      g.myp.mulefollowing = true;
    }
    else
      g.pl[char].dests.push(new Dest(d.muleStartX, 0, g.pl[g.myChar].model.position.z, true));

    sendMyPosData();
  }

  scene.add(g.pl[char].mule);
}

function checkForCharMovePlots(x, y)
{
  let destx = g.plotOverlay.position.x;
  let destz = g.plotOverlay.position.z;
  g.pl[g.myChar].dests.length = 0;
  if (destx == 0 && destz == 0)
  {
    destz = g.mySetZ;
    g.pl[g.myChar].dests.push(new Dest(g.pl[g.myChar].model.position.x < 0 ? -2 : 2, 0, destz));
  }
  g.pl[g.myChar].dests.push(new Dest(destx, 0, destz));
  g.pl[g.myChar].speed = 2.5;
  g.pl[g.myChar].model.rotation.y = Math.atan2(
    destx - g.pl[g.myChar].model.position.x,
    destz - g.pl[g.myChar].model.position.z
  );
  sendMyPosData();
}

function mouseClick(mouseEvent) {

  let x = mouseEvent.pageX;// - view.getBoundingClientRect().x, 
  let y = mouseEvent.pageY;

  x *= window.devicePixelRatio;
  y *= window.devicePixelRatio;

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
}

function tooFar(from, to, pos) {
  if (from.x != to.x)
    return Math.abs(to.x - from.x) <= Math.abs(pos.x - from.x);
  if (from.y != to.y)
    return Math.abs(to.y - from.y) <= Math.abs(pos.y - from.y);
  if (from.z != to.z)
    return Math.abs(to.z - from.z) <= Math.abs(pos.z - from.z);
  return true;
}

let _mov = new THREE.Vector3()
function move(from, to, dist, done=null) {
  _mov.set(to.x, to.y, to.z);
  _mov.sub(from);
  _mov.normalize();
  _mov.multiplyScalar(dist);
  _mov.add(from);
  if (tooFar(from, to, _mov))
  {
    _mov.set(to.x, to.y, to.z);
    if (done != null) done.done = true;
  }

  return _mov;
}

const cpset = new THREE.Vector3(0, 1.8, 4);
const crxset = -.4;
const cpfar = new THREE.Vector3(0, 32.7, 23);
const crxfar = -.935;

function handleCamMove(delta) {

  if (g.state == st.TRANSITION_TO_SETTLEMENT) {
    camera.position.copy(move(camera.position, cpset, 60 * delta));
    if (camera.position.equals(cpset)) {
      camera.rotation.x = crxset;
      g.state = st.SETTLEMENT;
      e("sett").style.visibility = "visible";
    }
    else {
      let pct = (camera.position.z - cpfar.z) / (cpset.z - cpfar.z);
      if (pct > .75) {
        pct -= .75;
        pct *= 4;
        camera.rotation.x = crxfar + (pct * (crxset - crxfar));
      }
    }
  }
  else if (g.state == st.TRANSITION_OUT_STLMNT || 
    (g.state == st.PRODUCTION_ANIM && !camera.position.equals(cpfar))) 
  {
    if (e("sett").style.visibility != "hidden")
      e("sett").style.visibility = "hidden";
    camera.position.copy(move(camera.position, cpfar, 60 * delta));
    if (camera.position.equals(cpfar)) {
      g.state = st.MOVEPLAYER;
      camera.rotation.x = crxfar;
    }
    else {
      let pct = (camera.position.z - cpset.z) / (cpfar.z - cpset.z);
      if (pct < .25) {
        pct *= 4;
        camera.rotation.x = crxset - (pct * (crxset - crxfar));
      }
      else
        camera.rotation.x = crxfar;
    }
  }
}


function strToPlot(/**@type {string}*/ plotStr)
{
  let e = Number(plotStr[2])
  if (plotStr[1] == 'W')
    e = -e;
  let s = Number(plotStr[4])
  if (plotStr[3] == 'N')
    s = -s;
  return [e,s];
}


function plotToStr(/**@type {number}*/e, /**@type {number}*/s)
{
  let k = 'P';
  if (e > 0)
    k += 'E'
  else if (e < 0)
    k += 'W'
  else
    k += 'R'
  k += Math.abs(e)
  if (s >= 0)
    k += 'S'
  else
    k += 'N'
  k += Math.abs(s);
  return k;
}


function plotAvail(/**@type {number}*/ e, /**@type {number}*/ s)
{
  let k = plotToStr(e,s);
  if (!(k in g.plots))
    return false;
  if (e == 0 && s == 0)
    return false;
  return g.plots[k].ownerChar == 0;
}

let prodMsg = null;
let prodCounts = {};

function showProduction(m)
{
  prodMsg = m;
  prodCounts = {};

  let units = [];
  
  for (let k in m.prod)
  {
    for (let i=0; i<m.prod[k]; i++)
      units.push(k);
  }

  shuffle(units);

  setTimeout(()=>addProdUnit(units), 200); 
  if (m.showEventBeforeAnim)
  {
    e("msg").innerText = m.eventStr;
    if (m.event == 5 || m.event == 6) /* meteor and radiation */
    {
      let es = strToPlot(m.plot);
      g.plotOverlay.position.set(es[0] * 4, .01, es[1] * 4);
      if (g.plotOverlay.parent == null) scene.add(g.plotOverlay);
      g.blinkPlotOverlay = true;
      if (g.plots[m.plot].res > -1)
      {
        scene.remove(g.plots[m.plot].rsrc3d);
        g.plots[m.plot].rsrc3d = null;
        g.plots[m.plot].res = -1;
      }
    }
  }
  else
    e("msg").innerText ="";
  g.state = st.PRODUCTION_ANIM;
}

function addProdUnit(units)
{
  let unit = units.pop();
  if (unit == undefined)
  {
    handleProdEnd();
  }
  else
  {
    new Audio("/sound/beep.wav").play();
    console.log(unit);
    console.log(units.length);
    
    let es = strToPlot(unit);
    
    let box = new THREE.BoxGeometry(.2,.2,.2);
    let mesh = new THREE.Mesh(box, d.plotboundMat[g.plots[unit].ownerChar]);
    mesh.userData = unit;
    g.prodGroup.add(mesh);
    
    if (unit in prodCounts)
      prodCounts[unit]++;
    else
      prodCounts[unit] = 1;

    setPosForProdBox(mesh, es[0], es[1], prodCounts[unit]);
    
    setTimeout(()=>addProdUnit(units), 140);
  }
}

function handleProdEnd()
{
  let m = prodMsg;

  if (m.showEventBeforeAnim)
  {
    e("msg").innerText = m.eventStr;
    setTimeout(()=>handleProdEnd2(), 2000);
    if (m.event == 1 /* pest attack */)
    {
      let meshesToRemove = [];
      for (let mesh of g.prodGroup.children)
      {
        if (mesh.userData == m.plot)
          meshesToRemove.push(mesh);
      }
      for (let mesh of meshesToRemove)
        g.prodGroup.remove(mesh);

      let es = strToPlot(m.plot);
      g.plotOverlay.position.set(es[0] * 4, .01, es[1] * 4);
      if (g.plotOverlay.parent == null) scene.add(g.plotOverlay);
      g.blinkPlotOverlay = true;
    }
    else if (m.event == 7 /* pirates */)
    {
      let meshesToRemove = [];
      for (let mesh of g.prodGroup.children)
      {
        let plotStr = (typeof mesh.userData == 'string') ? mesh.userData : ''; 
        if (g.plots[plotStr].res == 3)
          meshesToRemove.push(mesh);
      }
      for (let mesh of meshesToRemove)
        g.prodGroup.remove(mesh);
    }
  }
  else
  {
    setTimeout(()=>handleProdEnd2(), 1000);
  }
}

function handleProdEnd2()
{
  g.state = st.PRODUCTION_DONE;
  e("msg2").innerText = 'Click anywhere to continue.'
  e("msg2").style.visibility = 'visible';
  prepSound.play();
}

function shuffle(array) 
{
  for (let i = array.length - 1; i > 0; i--) 
  {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function preaucclick()
{
  e("pab" + g.myChar).style.visibility = "hidden";
  e("msg").innerText = "Waiting for other players.";
  let btns = document.getElementsByName("buysell" + g.myChar);
  if (btns[0] instanceof HTMLInputElement && btns[0].checked)
    sell();
  else
    buy();
  send("Acknowledge")
}

function setBtmText(char, msg)
{
  let pb = plbox[char];
  let spans = pb.getElementsByTagName('span');
  spans[2].innerText = msg;
}

function setMoney(char, money)
{
  let pb = plbox[char];
  let spans = pb.getElementsByTagName('span');
  spans[1].innerText = money;
}


