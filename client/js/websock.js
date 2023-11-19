// @ts-check
function setupWebsock() {
  if (location.hostname == '')
  {
    alert("Run this page through localhost to work with websocket.");
    return;
  }
  // @ts-ignore
  if (performance.getEntriesByType("navigation")[0].type == "back_forward")
  {
    location.reload();
    return;
  }

  let socketURL = 'wss://' + location.hostname + '/wss';
  // @ts-ignore
  if (location.port == 8000)
    socketURL = 'ws://' + location.hostname + ':8001/';
  if (location.search.length > 0)
    socketURL += location.search;
  else if (document.cookie.length > 0)
    socketURL += '?' + document.cookie;
  socket = new WebSocket(socketURL);
  socket.addEventListener('message', sockMessage);
  socket.onerror = function (event) { alert("Websocket error!  Press Ctrl+Shift+R when resolved."); }
  socket.onopen = websocketOpened;
}


function websocketOpened(event)
{
  send("Ready");
}


let pendingMessages = []  // queue up newer messages
function sockMessage(event)
{
  console.log('Got: ' + event.data.substring(0,55))

  // don't process new message until all older ones have had processing completed
  pendingMessages.push(event.data);
  if (pendingMessages.length > 1)
    return;

  while (pendingMessages.length > 0)
  {
      let m = pendingMessages[0];
      let o = JSON.parse(m);
      let fname = ('hm' + o.msg);
      if (fname in window && typeof(window[fname]) == "function")
        window[fname](o);
    
    pendingMessages.splice(0,1);  // splice(0,1) == pop first element
  }
}

function hmAcknowledge(m)
{
  let pb = plbox[m.char];
  let spans = pb.getElementsByTagName('span');
  spans[0].innerText = g.pl[m.char].name;
  if (spans[2].innerText.length == 0 || spans[2].innerText[0] != '*')
    spans[2].innerText = "*" + spans[2].innerText + "*";
  if (m.char == g.myChar)
  {
    e("msg").innerText = "(Waiting for other players)";
    e("msg2").innerText = '';
    e("msg2").style.visibility = 'hidden';
  }
}

function hmIdentity(m)
{
  g.myID = m.id;
}

let leftPositions = [[],[42.5],[30,55],[10,42.5,75],[5,30,55,80]];
let colorsForChar = ['','rgba(255, 0, 0, 0.2)','rgba(255, 255, 0, 0.2)','rgba(0, 255, 0, 0.2)','rgba(0, 0, 255, 0.2)'];
let colorStr = ['','#ff0000','#ffff00','#00ff00','#0000ff'];
let modelNames = ['','red','yellow','green','blue'];
let plbox = [];
let numPlayers = 4;

const fbxLoader = new FBXLoader();
const fbxloadedfn = [null,
  (fbx) => { fbxloaded(fbx, 1); },
  (fbx) => { fbxloaded(fbx, 2); },
  (fbx) => { fbxloaded(fbx, 3); },
  (fbx) => { fbxloaded(fbx, 4); },
];

function hmPlayerState(m)
{
  if (plbox.length == 0)
  {
    numPlayers = Object.keys(m).length - 1;
    for (let i=numPlayers+1; i<5; i++)
      e('p' + i).style.display = 'none';

    plbox = [e("p0"), null, null, null, null];
    e("cb1").style.visibility = 'hidden';
    e("cb2").style.visibility = 'hidden';
    e("cb3").style.visibility = 'hidden';
    e("cb4").style.visibility = 'hidden';
    e("cbl1").style.visibility = 'hidden';
    e("cbl2").style.visibility = 'hidden';
    e("cbl3").style.visibility = 'hidden';
    e("cbl4").style.visibility = 'hidden';

    let num=0;
    for (let i in m)
    {
      if (i == 'msg')
        continue;
      num++;
      let p = m[i];
      plbox[p.character] = e('p' + num);
      if (plbox[p.character] != null)
      plbox[p.character].style.left = leftPositions[numPlayers][num-1]+'%';
      e('pa' + p.character).style.visibility = "inherit";
      e('cb' + p.character).style.visibility = "inherit";
      if (p.id == g.myID)
        e('pab' + p.character).style.visibility = "inherit";
      d.totalModels++;
      fbxLoader.load('models/' + modelNames[p.character] + '.fbx', fbxloadedfn[p.character], prog, n); 
    }
    d.totalCalculated = true;
  }

  // we really should move this to hmIdentity...
  if (g.myChar < 0 && g.myID > 0)
  {
    let pos = -(numPlayers-1)/8;
    for (let i in m)
    {
      if (i == 'msg')
        continue;
      let p = m[i];
      if (p.id == g.myID)
      {
        g.myChar = p.character;
        g.mySetZ = -pos;
        g.myp = g.pl[g.myChar];
      }
      pos += .25;
    }
  }

  for (let i in m)
  {
    if (i == 'msg')
      continue;
    let p = m[i];
    let pb = plbox[p.character];
    let spans = pb.getElementsByTagName('span');
    spans[0].innerText = p.name;
    spans[1].innerText = p.money;
    if (!p.connected) 
      spans[2].innerText = '(DISCONNECTED)';
    else if (spans[2].innerText == '(DISCONNECTED)')
      spans[2].innerText = '';
    pb.style.backgroundColor = colorsForChar[p.character];
    g.pl[p.character].score = p.score;
    g.pl[p.character].name = p.name;
  }

  e("target").style.backgroundColor = colorStr[g.myChar];
  moveMyActionUIElementsToMatchPLBox();
}

function hmDisconnected(m)
{
  let pb = plbox[m.character];
  let spans = pb.getElementsByTagName('span');
  spans[2].innerText = '(DISCONNECTED)';
}

function hmMounds(m)
{
  const moundMat = new THREE.MeshBasicMaterial( { color: 0x847463 } );
  for (let d of m['mounds'])
  {
    const geometry = new THREE.SphereGeometry( 1 );
    const sphere = new THREE.Mesh( geometry, moundMat );
    scene.add( sphere );
    sphere.position.set(d[0],0,d[2]);
    sphere.scale.set(d[3], d[4], d[5]);
    sphere.rotation.y = d[1];
  }
}

function hmScores(m)
{
  let index=0;
  let pos = -(numPlayers-1)/8
  for (let s of m.scores)
  {
    let pb = plbox[s.char];
    let spans = pb.getElementsByTagName('span');
    spans[0].innerText = g.pl[s.char].name + " [#" + s.ranking + "]";
    spans[2].innerText = "Score: " + s.score;
    pb.style.left = leftPositions[numPlayers][index]+'%';
    index++;
    g.pl[s.char].model.position.x = pos;
    g.pl[s.char].model.position.z = -pos;
    if (g.pl[s.char].model.parent != scene)
      scene.add(g.pl[s.char].model);
    if (s.char == g.myChar)
    {
      g.mySetZ = -pos;
      sendMyPosData();
    }
    pos += .25
  }
  moveMyActionUIElementsToMatchPLBox();
  if (m.month == 1)
    e("msg").innerText = 'All players have arrived to Irata.  Another ship will arrive in 12 months.';
  else
    e("msg").innerText = 'Beginning of month ' + m.month + '. ' + m.colonyStateMsg;
}

function hmPosData(m)
{
  if (g.myChar == m.char)
    return;

  updatePosData(m);
}


function hmNOPLOTSFORSALE(m)
{
  e("msg").innerText = "No plots for sale this month."
  prepSound.play();
}

function hmNOMOREPLOTSFORSALE(m)
{
  e("msg").innerText = "No more plots for sale this month."
}

function clearStars()
{
  for (let i=1; i<5; i++)
  {
    let pb = plbox[i];
    if (pb == null) continue;
    let spans = pb.getElementsByTagName('span');
    if (spans[2].innerText[0] == "*")
      spans[2].innerText = "";
  }
}


function hmMules(m)
{
  e("mulecount").innerText = m.avail;
}

let prepSound = (new Audio("/sound/prep.wav"));
let notSound = (new Audio("/sound/not.wav"));
let stepSound = (new Audio("/sound/step.mp3"));
let beepSound = (new Audio("/sound/beep.wav"));

function hmGameState(m)
{
  clearStars();

  e("mulecount").innerText = m.mules;
  g.awaiting = m.awaiting;
  if (m.state.startsWith('AUCTION') || m.state == "LANDAUCTION")
  {
    let auc = document.getElementById("aucbg");
    let boardview = document.getElementById("boardview");
    auc.style.left = "0px";
    boardview.style.left = "100%";
    auctioning = true; // stops render loop for baordview
    e("mnum").innerText = m.month;
    e("pab" + g.myChar).style.visibility = (g.awaiting.includes(g.myID)) ? "inherit" : "hidden";
  }
  else
  {
    if (auctioning)
    {
      auctioning = false;
      animate();
    }
  }
  
  switch (m.state)
  {
    case 'SCORE':
      g.state = st.SCORE;
      e("aucbg").style.left = "-100%";
      e("boardview").style.left = "0px";
      e("msg2").innerText = 'Click anywhere to continue.'
      e("msg2").style.visibility = 'visible';
      prepSound.play();
      break;
    case 'WAITFORLANDGRANT':
      g.state = st.WAITFORLANDGRANT;
      e("msg").innerText = 'Land grant will begin shortly.'
      prepSound.play();
      break;
    case 'LANDGRANT':
      g.state = st.LANDGRANT;
      e("msg").innerText = 'Land grant:  Click on an available plot to claim.'
      if (g.awaiting.indexOf(g.myID) == -1) e("msg").innerText = '(waiting on other players)';
      notSound.play();
      mouseMove(null);
      g.plotOverlay.material.color.set("#FFFFFF");
      break;
    case 'WAITINGTOSTARTIMPROVE':
      g.state = st.WAITINGTOSTARTIMPROVE;
      /* PlayerEvent handled here */
      e("msg").innerHTML="Development for month #" + m.month + " about to begin.<BR><LABEL><INPUT ID=AUTOMULE TYPE=CHECKBOX CHECKED>Automatically obtain MULE</INPUT></LABEL>";
      e("msg2").innerText="Click below to continue.";
      e("msg2").style.visibility="visible";
      prepSound.play();
      break;
    case 'IMPROVE':
      if (g.awaiting.includes(g.myID))
        g.state = st.TRANSITION_TO_SETTLEMENT;
      notSound.play();
      g.selectedBuilding = false;
      if (g.waitingForMule)
      {
        e("msg").innerText = "Waiting for mule";
        bm[7].color.set(colorStr[g.myChar]);
      }
      break;
    case 'AUCTIONPREP':
      e("preblock").style.visibility = "visible";
      e("ablock").style.visibility = "hidden";
      e("cbl1").style.visibility = 'hidden';
      e("cbl2").style.visibility = 'hidden';
      e("cbl3").style.visibility = 'hidden';
      e("cbl4").style.visibility = 'hidden';
      break;
    case 'AUCTION':
    case 'LANDAUCTION':
      e("preblock").style.visibility = "hidden";
      e("ablock").style.visibility = "visible";
      if (m.state == 'LANDAUCTION')
      {
        buy();
        e("aucsell").style.visibility = 'hidden'; 
      }
      break;
    case 'WAITINGFORLANDAUCTION':
      g.state = st.LANDAUCTION_SHOW;
      e("aucbg").style.left = "-100%";
      e("boardview").style.left = "0px";
      break;
    case 'PROD':
      if (g.plotOverlay.parent != null)
        scene.remove(g.plotOverlay);
      g.state = st.PRODUCTION_ANIM;
      break;
  }
}

function hmPlots(m)
{
  for (let k in m.plots)
  {
    if (!(k in g.plots))
    {
      g.plots[k] = new PlotData(k);
    }

    if (g.plots[k].ownerChar != m.plots[k].ownerChar)
    {
      if (g.plots[k].ownerChar > 0)
      {
        removeLinesAndFlags(k);
        restoreNeighborLinesAndFlags(k);
      }
      g.plots[k].ownerChar = m.plots[k].ownerChar;
      if (g.plots[k].ownerChar > 0)
      {
        addFlag(k);

        addLine(k, NORTH);
        addLine(k, SOUTH);
        addLine(k, EAST);
        addLine(k, WEST);
      }
    }

    if (g.plots[k].res != m.plots[k].res)
    {
      if (g.plots[k].res > -1)
      {
        scene.remove(g.plots[k].rsrc3d);
        g.plots[k].rsrc3d = null;
        g.plots[k].res - -1;
      }
      g.plots[k].res = m.plots[k].res;
      if (g.plots[k].res > -1)
      {
        g.plots[k].rsrc3d = d.prodmod[g.plots[k].res].clone();
        let es = strToPlot(k);
        g.plots[k].rsrc3d.position.set(es[0] * 4, 0, es[1] * 4);
        scene.add(g.plots[k].rsrc3d);
      }
      restoreNeighborLinesAndFlags(k);
    }
  }
  removeAllExtraLinesAndFlags();
}


function hmPlotGranted(m)
{
  g.plotOverlay.material.color.set('#ffffff');
  scene.remove(g.plotOverlay);
  let ind = g.awaiting.indexOf(g.myID);
  if (ind > -1)
    g.awaiting.splice(ind, 1);
  e("msg").innerText = 'Plot Granted.  (Waiting for other players)';
}


function hmMuleObtained(m)
{
  g.waitingForMule = false;
  settlementMouseMove(0,0);

  if (g.pl[g.myChar].dests.length == 0)
    g.pl[g.myChar].dests.push(new Dest(d.muleStartX-0.5, 0, g.mySetZ));

  cloneMuleModel(g.myChar);
  e("msg").innerText = "MULE obtained.";
}


function hmMuleSold(m)
{
  scene.remove(g.myp.mule);
  g.myp.mule = null;
  g.myp.mulefollowing = false;
  g.sellingMule = false;
  g.waitingForMule = false;
  settlementMouseMove(0,0);
  e("msg").innerText = "MULE sold.";
}


function hmNoMoreMules(m)
{
  g.waitingForMule = false;
  settlementMouseMove(0,0);
  e("msg").innerText = "No more MULEs available.";
}

function hmCannotAffordMule(m)
{
  g.waitingForMule = false;
  settlementMouseMove(0,0);
  e("msg").innerText = "You can't afford a MULE.";
}

function hmPlayerEvents(m)
{
  g.playerEvents = m.events;
}

function hmMoney(m)
{
  let pb = plbox[m.character];
  let spans = pb.getElementsByTagName('span');
  spans[1].innerText = m.money;
}

function hmCantAffordOutfit(m)
{
  g.selectedBuilding = false;
  settlementMouseMove(0,0);
  e("msg").innerText = "You can't afford to outfit.  Cost is (\u20BF)" + m.cost;
}

function hmStartOutfit(m)
{
  e("msg").innerText = "Outfitting MULE.  Cost is (\u20BF)" + m.cost;
  g.myp.dests.push(new Dest(d.mlx[m.res], 0, d.mlz, true, m.res));
  g.myp.dests.push(new Dest(d.mlx[m.res], 0, g.myp.model.position.z, true));
  g.myMuleType = m.res;
  sendMyPosData();
}

function hmUnhighlight(m)
{
  g.plotOverlay.material.color.set("#ffffff");
  scene.remove(g.plotOverlay);
  e("msg").innerText = '';
}

function hmMuleInstalled(m)
{
  e("msg").innerText = "Your MULE has been installed.";
}

function hmSetMule(m)
{
  g.myMuleType = m.type;
  if (g.myp.mule == null)
    cloneMuleModel(g.myChar, true);
  
  /** @type {?THREE.SpotLight} */ // @ts-ignore
  let sl = g.myp.mule.getObjectByName('outfitlight');
  if (sl == undefined)
  {
    sl = new THREE.SpotLight(0x00ff00, 20);
    sl.position.set(0,9,0)
    sl.distance=0.35
    sl.name='outfitlight';
  }
  sl.color.set(slcolor[m.type]);
  g.myp.mule.add(sl.target)
  g.myp.mule.add(sl);

  e("msg").innerText = "You are now controlling a MULE outfitted for " + m.tstr;
}

function hmAssay(m)
{
  let es = strToPlot(m.plot);
  addCrysMarker(es[0], es[1], m.assay);
}

let cantinaSound = new Audio("/sound/cantina.mp3");

function hmCantinaWinnings(m)
{
  if (g.myChar == m.char)
  {
    cantinaSound.play();
    g.selectedBuilding = false;
    settlementMouseMove(0,0);
    e("msg").innerText = "You won (\u20BF)" + m.amt + " gambling at the Cantina.  (Waiting for other players)";
    g.state = st.TRANSITION_OUT_STLMNT;
    g.plotOverlay.material.color.set("#000000");
    let ind = g.awaiting.indexOf(g.myID);
    if (ind > -1)
      g.awaiting.splice(ind, 1);
    
  }
  else
    plbox[m.char].getElementsByTagName('span')[2].innerText = "Won (\u20BF)" + m.amt;

  scene.remove(g.pl[m.char].model);
}

function hmProd(m)
{
  setTimeout(()=>showProduction(m), 4000); 
  for (var i=g.markers.children.length-1; i >= 0; --i)            
    g.markers.remove(g.markers.children[i]);
}

function hmAuctionPrep(m)
{
  if (m.type == "LAND")
    e("msg").innerHTML = "(Bidding starts at \u20BF <span>" + m.resPrice + "</span>)";
  else
    e("msg").innerHTML = "(Store has <span>" + m.avail + "</span> units.  Sale price is \u20BF <span>" + m.resPrice + "</span>)";
  e("msg").style.backgroundColor = "";
  e("storeunits").innerText = m.avail;
  e("storesell").style.visibility =  (m.avail < 1) ? "hidden" : "inherit";
  e("storesell1").style.visibility =  (m.avail < 1) ? "hidden" : "inherit";
  e("storesell2").style.visibility =  (m.avail < 1) ? "hidden" : "inherit";
  e("sellline").style.visibility =  (m.avail < 1) ? "hidden" : "inherit";
  e("sellline").style.bottom = "81%";
  e("storebuy").style.visibility = "inherit";
  e("storebuy1").style.visibility = "inherit";
  e("buyline").style.bottom = "11%";
  e("buyline").style.visibility = "inherit";
  e("pab" + g.myChar).style.visibility = "inherit";
  e("aname").innerText = m.type + " Auction";

  e("aucdone").style.visibility = "inherit";
  e("targetline").style.visibility = "inherit";
  e("target").style.visibility = "inherit";
  e("targetval").style.visibility = "inherit";

  g.auctionRes = m.type;
  g.bidIncr = m.bidIncrement;

  if (m.type == "LAND") 
  {
    return;
  }

  if (!('deltas' in m))
  {
    for (let char in m.playerRes)
      setBtmText(char, m.type + ": " + m.playerRes[char]);
    return;
  }

  for (let d of m.deltas)
  {
    e("start" + d.char).innerText = d.vals.prev;
    e("used" + d.char).innerText = d.vals.used;
    e("spoiled" + d.char).innerText = d.vals.spoiled;
    e("prod" + d.char).innerText = d.vals.produced;
    e("curr" + d.char).innerText = d.cur;
    setBtmText(d.char, m.type + ": " + d.cur);
    e("req" + d.char).innerText = d.vals.needed;
    let diff = d.cur - d.vals.needed;
    if (diff < 0)
    {
      e("diff" + d.char).innerText = "(" + diff.toString() + ")";
      e("diff" + d.char).style.color = "pink";
      if (d.char == g.myChar) // @ts-ignore
        document.getElementsByName("buysell" + d.char)[1].checked = true;
    }
    else
    {
      e("diff" + d.char).innerText = "(+" + diff + ")";
      e("diff" + d.char).style.color = "lightgreen";
      if (d.char == g.myChar) // @ts-ignore
        document.getElementsByName("buysell" + d.char)[0].checked = true;
    }
  }
}

function hmBids(m)
{
  let anyRealBids = false;

  g.minBid = m.minBid;
  g.maxBid = m.minBid + (35 * g.bidIncr);
  g.passVal = m.minBid - (3 * g.bidIncr);
  g.passThresh = g.passVal + g.bidIncr;
  g.outVal = g.maxBid + (5 * g.bidIncr);
  g.outThresh = g.outVal - g.bidIncr;

  for (let char in m.current)
  {
    let newBid = m.current[char];
    let img = e("cb" + char);
    let lbl = e("cbl" + char);

    if (newBid == 0)
    { 
      img.style.bottom = "0%";
      lbl.style.visibility = "hidden";
    }
    else if (newBid == 9999)
    {
      img.style.bottom = "86%";
      lbl.style.visibility = "hidden";
    }
    else
    {
      anyRealBids = true;
      img.style.bottom = ((newBid - g.minBid) * 2 / g.bidIncr + 11) + '%';
      e("cbv" + char).innerText = newBid;
      let r = img.getBoundingClientRect();
      let p = img.parentElement.getBoundingClientRect();
      lbl.style.left = r.left + 5 + "px";
      lbl.style.top = r.bottom - p.top + "px";
      lbl.style.visibility = "visible";
      if (char in m.buying)
        lbl.innerHTML = (m.buying[char] ? "Bid" : "Ask") + lbl.innerHTML.substring(3);
    }
  
    if (Number(char) == g.myChar)
      g.curbid = newBid;

    if (char in m.buying)
      if (img instanceof HTMLImageElement) 
        img.src = "img/" + imgprefix[char] + (m.buying[char] ? "buy.png" : "sell.png");
  }

  if (m.highestBuyPrice > 0 && m.highestBuyPrice < 9999)
  {
    e("buyline").style.bottom = ((m.highestBuyPrice - g.minBid) * 2 / g.bidIncr + 11) + '%'; 
    e("buyline").style.visibility = "inherit";
  }
  else
    e("buyline").style.visibility = "hidden";

  if (m.lowestSellPrice > 0 && m.lowestSellPrice < 9999)
  {
    e("sellline").style.bottom = ((m.lowestSellPrice - g.minBid) * 2 / g.bidIncr + 11) + '%'; 
    e("sellline").style.visibility = "inherit";
    g.selloffers = true;
  }
  else
  {
    e("sellline").style.visibility = "hidden";
    g.selloffers = false;
  }

  e("storebuy").style.visibility = (m.storeBuy) ? "inherit" : "hidden";
  e("storebuy1").style.visibility = (m.storeBuy) ? "inherit" : "hidden";

  if (anyRealBids)
    stepSound.play();
}

function hmConfirmTrade(m)
{
  if (m.buyer == g.myChar)
  {
    if (m.price == g.curbid && g.target >= m.price)
    {
      send('TradeConfirmed', {tradeID:m.tradeID});
      return;
    }
  }

  else if (m.seller == g.myChar)
  {
    if (m.price == g.curbid && g.target <= m.price)
    {
      send('TradeConfirmed', {tradeID:m.tradeID});
      return;
    }
  }

  send('Target', {target:g.target}); 
}

function hmBeginTrade(m)
{
  if (m.buyer > 0)
    e("cb" + m.buyer).className = 'trading';
  else
    e("storebuy").className = 'trading';

  if (m.seller > 0)
    e("cb" + m.seller).className = 'trading';
  else
    e("storesell").className = 'trading';
}

function hmEndTrade(m)
{
  e("cb1").className = '';
  e("cb2").className = '';
  e("cb3").className = '';
  e("cb4").className = '';
  e("storebuy").className = '';
  e("storesell").className = '';
}

function hmUnitsTraded(m)
{
  e("msg").innerText = "Units Traded: " + m.units;
  for (let char in m.res)
    if (Number(char) > 0)
      setBtmText(char, g.auctionRes + ": " + m.res[char]);
    else
      e("storeunits").innerText = m.res[char];
  for (let char in m.money)
    if (Number(char) > 0)
    setMoney(char, m.money[char]);

  beepSound.play();
}

function hmStoreOut(m)
{
  e("msg").innerText = "Store has no more units to trade."
  e("storesell").style.visibility =  "hidden";
  e("storesell1").style.visibility = "hidden";
  e("storesell2").style.visibility = "hidden";
}

function hmUpdMsg(m)
{
  e("msg").innerText = m.txt;
}

function hmPlotToBeAuctioned(m)
{
  e("msg").innerText = "Plot " + m.plotStr + " for sale.";
  e("msg2").innerText = 'Click anywhere to continue.'
  e("msg2").style.visibility = 'visible';
  prepSound.play();
  g.plotOverlay.material.color.set('#ffffff');
  let es = strToPlot(m.plotStr);
  g.plotOverlay.position.set(es[0] * 4, .01, es[1] * 4);
  if (g.plotOverlay.parent == null)
    scene.add(g.plotOverlay);
  g.blinkPlotOverlay = true;
}

function hmLandAuctionWinner(m)
{
  if (m.char == 0)
  {
    e("msg").innerText = "Plot didn't sell.";
    return;
  }

  e("msg").innerText = "Plot sold to " + g.pl[m.char].name + " for (\u20BF)" + m.price + ".";
  let pb = plbox[m.char];
  let spans = pb.getElementsByTagName('span');
  spans[1].innerText = m.money;
  e("cb" + m.char).className = 'trading';
}

