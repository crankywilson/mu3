// @ts-check
let coffy = 0;

function beginSliding(e, fromLine=false) {
  slider.style.cursor = 'grabbing';
  slider.onpointermove = slide;
  slider.setPointerCapture(e.pointerId);
  if (!fromLine)
      coffy = (e.y - slider.getBoundingClientRect().y);
}

function stopSliding(e) {
  slider.style.cursor = 'grab';
  slider.onpointermove = null;
  slider.releasePointerCapture(e.pointerId);
}

let _lastTarget = -1;
function sendIfDifferent(msg, obj)
{
  if (obj.target != _lastTarget)
    send(msg, obj);

  _lastTarget = obj.target;
}

function slide(e) {
    let divRect = slider.parentElement.getBoundingClientRect();
    slider.style.top = (e.y - divRect.y - coffy) + 'px';
    let pct = (divRect.bottom - slider.getBoundingClientRect().bottom)/divRect.height*100;

    let targ = Math.round((pct - 11)/2) * g.bidIncr + g.minBid;
    if (targ < g.minBid)
    {
     if (targ < g.passThresh && g.buying) targ = g.passVal;
     else targ = g.minBid;
    }
    else if (targ > g.maxBid)
    {
      if (targ >= g.outThresh && (!g.buying || !g.selloffers)) targ = g.outVal;
      else targ = g.maxBid;
    }
    slider.style.top = '';
    slider.style.bottom = ((targ - g.minBid) * 2 / g.bidIncr + 11) + '%';
    //console.log(slider.style.bottom);
    if (targ == g.passVal) 
    { 
      t.innerText = 'Target: Pass'; 
      sendIfDifferent('Target', {target:0}); 
      g.target = 0;
    }
    else if (targ == g.outVal) 
    { 
      t.innerText = (g.buying ? '+++' : 'Target: Out'); 
      sendIfDifferent('Target', {target:9999}); 
      g.target = 9999;
    }
    else 
    {
      t.innerText = 'Target: ' + targ;
      sendIfDifferent('Target', {target:targ});
      g.target = targ;
    }
}

const slider = document.getElementById('target');
const t = document.getElementById('targetval');
slider.onpointerdown = beginSliding;
slider.onpointerup = stopSliding;

let auctioning = false;

document.addEventListener('keydown', (event) => {
    if (event.key == 'z') { send('Debug');}
    if (event.key == 'a') { testauc(); }
    if (event.key != 't') return;
    let auc = document.getElementById("aucbg");
    let boardview = document.getElementById("boardview");
    if (auc.getBoundingClientRect().left >= 0)
    {
        auc.style.left = "-100%";
        boardview.style.left = "0px";
        auctioning = false;
        animate();
    }
    else
    {
        auc.style.left = "0px";
        boardview.style.left = "100%";
        auctioning = true;
    }
}, false);

let keepGoing = false;
function testauc()
{
  keepGoing = !keepGoing;
  if (keepGoing)
    send("StartTrade");
}

function hmConfirm(m)
{
  if (keepGoing)
    send("Confirmed");
}


let imgprefix = ['?','r','y','g','b'];
function buy()
{
  send("Buy");
  let img = e("cb" + g.myChar);
  if (img instanceof HTMLImageElement) img.src = "img/" + imgprefix[g.myChar] + "buy.png";
  img.style.bottom = "0%";
  e("target").style.bottom = "5%";
  e("aucbuy").style.visibility = "hidden";
  e("aucsell").style.visibility = "inherit";
  g.buying = true;
  t.innerText = "(Drag)";
}

function sell()
{
  send("Sell");
  let img = e("cb" + g.myChar);
  if (img instanceof HTMLImageElement) img.src = "img/" + imgprefix[g.myChar] + "sell.png";
  img.style.bottom = "86%";
  e("target").style.bottom = "91%";
  e("aucbuy").style.visibility = "inherit";
  e("aucsell").style.visibility = "hidden";
  g.buying = false;
  t.innerText = "(Drag)";
}

function moveMyActionUIElementsToMatchPLBox()
{
  if (plbox.length == 0)
    return;

  let myLeftPct = 0;

  for (let i=1; i<=4; i++)
  {
    if (plbox[i] == null)
      continue;

    let plboxleftPct =  Number(plbox[i].style.left.replace('%',''));
    if (plboxleftPct > 79)
      plboxleftPct -= 5;

    e('pa' + i).style.left = plboxleftPct + '%';
    e('cb' + i).style.left = (plboxleftPct + 3.5) + '%';
    if (i == g.myChar)
      myLeftPct = plboxleftPct;
  }

  e("aucbuy").style.left = (myLeftPct + 4.5) + "%";
  e("aucsell").style.left = (myLeftPct + 4.5) + "%";
  e("aucdone").style.left = (myLeftPct + 14.5) + "%";
  e("targetline").style.left = (myLeftPct + 15) + "%";
  e("target").style.left = (myLeftPct + 14.5) + "%";
  e("targetval").style.left = (myLeftPct + 11.25) + "%";
}

function aucdone()
{
  send("Acknowledge");
  e("aucbuy").style.visibility = "hidden";
  e("aucsell").style.visibility = "hidden";
  e("aucdone").style.visibility = "hidden";
  e("targetline").style.visibility = "hidden";
  e("target").style.visibility = "hidden";
  e("targetval").style.visibility = "hidden";
}