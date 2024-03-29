
import { g, ui, mark3DInitialized, send,
         mouseMove, mouseClick, LandLotStr,
         beginSliding, stopSliding, slide, WumpusClicked
       } from "./game.js";
import * as t from "./types.js";
import { initWS } from "./websock.js";
import * as r from "./ren3d.js";

/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;

/** @typedef {import('../three/Three.js').Texture} Texture */
/** @typedef {import('../three/Three.js').Object3D} Object3D */

function sandLoaded(/**@type {Texture}*/ sandtexture)
{
  const groundMaterial = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
  sandtexture.wrapS = THREE.RepeatWrapping;
  sandtexture.wrapT = THREE.RepeatWrapping;
  sandtexture.anisotropy = 16;
  sandtexture.repeat.set( 6, 6 );
  sandtexture.encoding = THREE.sRGBEncoding;
  groundMaterial.map = sandtexture;
  groundMaterial.needsUpdate = true;

  const groundGeometry = new THREE.PlaneGeometry( 60, 23 );
  
  const ground = new THREE.Mesh( groundGeometry, groundMaterial );
  ground.position.x = -32
  ground.position.y = 0;
  ground.rotation.x = Math.PI * - 0.5;
  g.scene.add( ground );

  const ground2 = new THREE.Mesh( groundGeometry, groundMaterial );
  ground2.position.x = 32
  ground2.position.y = 0;
  ground2.rotation.x = Math.PI * - 0.5;
  g.scene.add( ground2 );

  const groundGeometry3 = new THREE.PlaneGeometry( 3.1, 3.6 );
  const groundMaterial3 = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
  const ground3 = new THREE.Mesh( groundGeometry3, groundMaterial3 );
  groundMaterial3.map = sandtexture;
  ground3.position.x = 0
  ground3.position.y = 0;
  ground3.rotation.x = Math.PI * - 0.5;
  g.scene.add( ground3 );
}

async function riverbedLoaded(/**@type {Texture}*/ rbtext)
{
  const groundGeometry4 = new THREE.PlaneGeometry( 60, 30 );
  const groundMaterial4 = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );

  rbtext.wrapS = THREE.RepeatWrapping;
  rbtext.wrapT = THREE.RepeatWrapping;
  rbtext.anisotropy = 16;
  rbtext.repeat.set( 5, 1 );
  rbtext.encoding = THREE.sRGBEncoding;
  groundMaterial4.map = rbtext;
  groundMaterial4.needsUpdate = true;

  const ground4 = new THREE.Mesh( groundGeometry4, groundMaterial4 );
  ground4.position.x = 0
  ground4.position.y = -1;
  ground4.rotation.x = Math.PI * - 0.5;
  g.scene.add( ground4 );

  let WaterMod = await import('../three/addons/Water2.js');
  let water = new WaterMod.Water( new THREE.PlaneGeometry( 10, 23 ), {
    color: '#ffffff',
    scale: 6.8,
    flowDirection: new THREE.Vector2( 0, 1.25 ),
    textureWidth: 1024,
    textureHeight: 1024
  } );

	water.position.y = -.01;
	water.rotation.x = Math.PI * - 0.5;
	g.scene.add( water );
}

function mountainsLoaded(/**@type {Texture}*/ mt)
{
  const mp = new THREE.PlaneGeometry( 52.5, 8 );
  const mm = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
  mt.wrapS = THREE.RepeatWrapping;
  mt.wrapT = THREE.RepeatWrapping;
  mt.anisotropy = 16;
  mt.repeat.set( 1, 1 );
  mt.encoding = THREE.sRGBEncoding;
  mm.map = mt;
  let gmo = new THREE.Mesh( mp, mm );
  gmo.position.set(0,4,-11);
  g.scene.add(gmo);
}

function setBldngTexture(/**@type {Number}*/ x, /**@type {Number}*/ n)
{
  let texture = g.textures.buldingResTexture[n];
  let pg = new THREE.PlaneGeometry( .2, .4 );
  let material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });
  let cm = new THREE.Mesh( pg, material );
  cm.position.set(x, 0.2, -1.5);
  g.scene.add(cm);
}

async function setup3d()
{
  THREE = await import('../three/Three.js');
  r.initTHREERef(THREE);

  g.scene = new THREE.Scene();
  g.camera = new THREE.PerspectiveCamera( 30, ui.boardview.clientWidth / ui.boardview.clientHeight, 0.1, 200 );
  g.camera.position.set( 0, 32.7, 23 );
  g.camera.rotation.set(-.935, 0, 0);
  g.camera.aspect = 2;
  g.camera.updateProjectionMatrix();
  g.clock = new THREE.Clock();
  g.renderer = new THREE.WebGLRenderer( { antialias: true } );
  g.renderer.setSize( ui.boardview.clientWidth, ui.boardview.clientHeight );
	g.renderer.setPixelRatio( window.devicePixelRatio );
  g.renderer.useLegacyLights = true;
	ui.boardview.appendChild( g.renderer.domElement );

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.8 );
	g.scene.add( ambientLight );

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
	directionalLight.position.set( - 1, 1, -1 );
	g.scene.add( directionalLight );

	let textureLoader = new THREE.TextureLoader();
  let sand = await textureLoader.loadAsync('img/sand.jpg');
  sandLoaded(sand);
  let riverbed = await textureLoader.loadAsync('img/rb.jpg');
  await riverbedLoaded(riverbed);
  let mountains = await textureLoader.loadAsync('img/mountains.jpg');
  mountainsLoaded(mountains);
  g.textures.crystiteLevelTexture[0] = await textureLoader.loadAsync('img/no.png');
  g.textures.crystiteLevelTexture[1] = await textureLoader.loadAsync('img/low.png');
  g.textures.crystiteLevelTexture[2] = await textureLoader.loadAsync('img/med.png');
  g.textures.crystiteLevelTexture[3] = await textureLoader.loadAsync('img/high.png');
  g.textures.buldingResTexture[0] = await textureLoader.loadAsync('img/food.png');
  g.textures.buldingResTexture[1] = await textureLoader.loadAsync('img/energy.png'); 
  g.textures.buldingResTexture[2] = await textureLoader.loadAsync('img/smithore.png');
  g.textures.buldingResTexture[2].encoding = THREE.sRGBEncoding;
  g.textures.buldingResTexture[3] = await textureLoader.loadAsync('img/crystite.png');
  setBldngTexture( 1.11,  0);
  setBldngTexture(  .37,  1);
  setBldngTexture( -.37,  2);
  setBldngTexture(-1.13,  3);

  g.materials.lotColor["R"] = new THREE.MeshLambertMaterial( {color: '#ff0000', reflectivity: 15}); 
  g.materials.lotColor["Y"] = new THREE.MeshLambertMaterial( {color: '#ddaa80', reflectivity: 15}); 
  g.materials.lotColor["G"] = new THREE.MeshLambertMaterial( {color: '#008500', reflectivity: 15}); 
  g.materials.lotColor["B"] = new THREE.MeshLambertMaterial( {color: '#3366ff', reflectivity: 15}); 


	// buildings
  g.buildingsGroup = new THREE.Group()
  for (let i=0; i<8; i++)
    g.materials.building[i] = new THREE.MeshLambertMaterial( {color: g.buildingColor, reflectivity: 15} );

  let bm = g.materials.building;
  bm[0].name = 'Crystite';
  bm[1].name = 'Smithore';
  bm[2].name = 'Energy';
  bm[3].name = 'Food';
  bm[4].name = 'Assay';
  bm[5].name = 'Land';
  bm[6].name = 'Cantina';
  bm[7].name = 'Mule';

  for (let m of bm) g.materials.buildingByName[m.name] = m;

	for (let i=0; i<4; i++)
	{
		let b1g = new THREE.BoxGeometry( .5, .4, .1 );
		let b1mesh = new THREE.Mesh( b1g, bm[i] );
		b1mesh.position.set(-1.1 + i*.7333, .2, -1.6);
		g.buildingsGroup.add( b1mesh );
    
		let b2g = new THREE.BoxGeometry( .5, .4, .1 );
		let b2mesh = new THREE.Mesh( b2g, bm[i+4] );
		b2mesh.position.set(-1.1 + i*.7333, .2, 1.6);
		g.buildingsGroup.add( b2mesh );

    if (i+4 == 7) // this is the mule building
    {
      g.muleStartX = b2mesh.position.x;
    }

		let b1gl = new THREE.BoxGeometry( .1, .4, .5 );
		let b1lmesh = new THREE.Mesh( b1gl, bm[i] );
		b1lmesh.position.set(-.9 + i*.7333, .2, -1.3);
		g.buildingsGroup.add( b1lmesh );

		let b1gr = new THREE.BoxGeometry( .1, .4, .5 );
		let b1rmesh = new THREE.Mesh( b1gr, bm[i] );
		b1rmesh.position.set(-1.3 + i*.7333, .2, -1.3);
		g.buildingsGroup.add( b1rmesh );

		let b2gr = new THREE.BoxGeometry( .1, .4, .5 );
		let b2rmesh = new THREE.Mesh( b2gr, bm[i+4] );
		b2rmesh.position.set(-1.3 + i*.7333, .2, 1.3);
		g.buildingsGroup.add( b2rmesh );

		let b2gl = new THREE.BoxGeometry( .1, .4, .5 );
		let b2lmesh = new THREE.Mesh( b2gl, bm[i+4] );
		b2lmesh.position.set(-.9 + i*.7333, .2, 1.3);
		g.buildingsGroup.add( b2lmesh );

    g.markers = new THREE.Group();
    g.prodGroup = new THREE.Group();

    g.scene.add(g.markers);
    g.scene.add(g.prodGroup);
	}
    
  g.scene.add(g.buildingsGroup);

  // bridges
  const brlg = new THREE.PlaneGeometry( .5, 1.3 );
  const brlm = new THREE.Mesh( brlg, new THREE.MeshBasicMaterial( {color: '#663311'} ));
  brlm.position.x = -1.77;
  brlm.position.y = 0.02;
  brlm.rotation.x = Math.PI * - 0.5;
  g.scene.add(brlm);

  const brrm = new THREE.Mesh( brlg, new THREE.MeshBasicMaterial( {color: '#663311'} ));
  brrm.position.x = 1.77;
  brrm.position.y = 0.02;
  brrm.rotation.x = Math.PI * - 0.5;
  g.scene.add(brrm);

  g.scene.background = new THREE.Color( 0xffeedd );

  /* GLTF */
  let GLTFLoader = await import('../three/addons/GLTFLoader.js');
  let l = new GLTFLoader.GLTFLoader();

  /* mule */
  let mule = await l.loadAsync('models/atat/scene.gltf');
  g.models.mule = mule.scene;
  g.models.mule.scale.set(.06,.05,.06);
  g.models.mule.rotation.y = Math.PI;
  g.models.mule.position.set(1.1,0,1.1);
  let mixer = new THREE.AnimationMixer(g.models.mule);
  let action = mixer.clipAction( mule.animations[ 0 ] );
  let muleAnim = mule.animations[ 0 ];
  action.play();
  mixer.setTime(7);
  let SkeletonUtils = await import('../three/addons/SkeletonUtils.js');

  for (let c in g.models.playerMule)
  {
    g.models.playerMule[c] = SkeletonUtils.clone(g.models.mule);
    g.mixerMule[c] = new THREE.AnimationMixer(g.models.playerMule[c]);
    let action = g.mixerMule[c].clipAction(muleAnim);
    action.play();

    let sl = new THREE.SpotLight(0x00ff00, 20);
    sl.position.set(0,9,0)
    sl.distance=0.35
    sl.name='outfitlight';
    sl.color.set(0);
    sl.visible = false;
    g.models.playerMule[c].add(sl.target);  // must do this or spotlight won't point to right thing when mule is moved
    g.models.playerMule[c].add(sl);
    g.muleLight[c] = sl;
  }

  /* land models */
	let gltf = await l.loadAsync('models/plants/plants.gltf');
  g.models.prod[0] = gltf.scene;
  g.models.prod[0].scale.set(100,50,100);
  g.models.prod[0].rotation.y = Math.PI;
	gltf = await l.loadAsync('models/energy/energy.gltf');
  g.models.prod[1] = gltf.scene;
  g.models.prod[1].scale.set(.5,.5,.5);
  g.models.prod[1].rotation.y = 1.8;
  gltf = await l.loadAsync('models/excv/excv.gltf');
  g.models.prod[2] = gltf.scene;
  g.models.prod[2].scale.set(10,10,10);
  g.models.prod[2].rotation.y = -1;
	gltf = await l.loadAsync('models/drill/drill.gltf');
  g.models.prod[3] = gltf.scene;
  g.models.prod[3].scale.set(30,30,30);

  gltf = await l.loadAsync('models/blueflag/scene.gltf');
  g.models.flag = gltf.scene;
  g.models.flag.scale.set(.2,.2,.2);
  g.flagAnim = gltf.animations[ 0 ];
  mixer = new THREE.AnimationMixer(g.models.flag);
  action = mixer.clipAction( g.flagAnim );
  action.play();

  const tl = new THREE.TextureLoader();
  g.textures.flag["R"] = await tl.loadAsync('img/redf.png');
  g.textures.flag["Y"] = await tl.loadAsync('img/yellowf.png');
  g.textures.flag["G"] = await tl.loadAsync('img/greenf.png');
  g.textures.flag["B"] = await tl.loadAsync('img/bluef.png');


  let FBXLoader = await import('../three/addons/FBXLoader.js');
  let fbxLoader = new FBXLoader.FBXLoader();

  if (g.state == "?" || g.players["R"] != null)
    fbxloaded(await fbxLoader.loadAsync('./models/red.fbx'), 'R');
  if (g.state == "?" || g.players["Y"] != null)
    fbxloaded(await fbxLoader.loadAsync('./models/yellow.fbx'), 'Y');
  if (g.state == "?" || g.players["G"] != null)
    fbxloaded(await fbxLoader.loadAsync('./models/green.fbx'), 'G');
  if (g.state == "?" || g.players["B"] != null)
    fbxloaded(await fbxLoader.loadAsync('./models/blue.fbx'), 'B');

  g.lloMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: .5 });
  g.landlotOverlay = new THREE.Mesh(new THREE.PlaneGeometry(4, 4, 1, 1), g.lloMaterial);
  g.landlotOverlay.rotation.x = -90 * Math.PI / 180;
  g.scene.add(g.landlotOverlay);
  g.landlotOverlay.visible = false;

  if (mark3DInitialized != null)
    mark3DInitialized();  // causes awaiting on g.init3DComplete to proceed

  onWindowResize();
}

function fbxloaded(/**@type {Object3D}*/ model, /**@type {string}*/ color)
{
  model.scale.set(.004,.0025,.004);
  model.position.x = 0;
  model.position.z = 0;

  g.models.player[color] = model;
  g.mixer[color] = new THREE.AnimationMixer(model);
  let action = g.mixer[color].clipAction( model.animations[0] );
  action.play();
  g.mixer[color].setTime(.55);
}

function joinGameClick()
{
  send(
    t.JoinGameRequest(
      ui.gamelist.options[ui.gamelist.selectedIndex].text));
}

function createGameClick()
{
  let gameName = prompt('Enter unique game name');
  if (gameName != null)
    send(t.CreateGame(gameName, 'R'));
}

/**@returns {HTMLInputElement} */
function inputTarget(/**@type {Event}*/ e)
{
  if (e.target instanceof HTMLInputElement) return e.target;
  return new HTMLInputElement();
}

/**@returns {string} */
function targetID(/**@type {Event}*/ e)
{
  if (e.target instanceof HTMLElement) return e.target.id;
  return "";
}

function sync_rygb()
{
  for (let en in ui)
  {
    if (!en.startsWith('r'))
      continue;
    if (!('y' + en.substring(1) in ui))
      continue;
    if (!('g' + en.substring(1) in ui))
      continue;
    if (!('b' + en.substring(1) in ui))
      continue;

    // @ts-ignore
    let e = ui[en];

    for (let prop in e) 
    { 
      if (prop.startsWith('on'))
      {
        // @ts-ignore
        let val = e[prop]; 
        if (val != null)
        {
          for (let c of ['y', 'g', 'b'])
          {
            let o = document.getElementById(c + e.id.substring(1));
            if (o != null)
            {
              // @ts-ignore
              o[prop] = val;
            }
          }
        }
      }
    }
  }
}

/** @this {GlobalEventHandlers} */
function handleColorChange()
{  
  if (!(this instanceof HTMLSelectElement)) return;
  let c = this.id[0].toUpperCase();
  send(t.SetColor(c, this.value));
  this.value = c;
  ui.ccspan(c).style.visibility = "hidden";
}

function debug(/**@type {KeyboardEvent} */ev)
{
  if (g.state != "IMPROVE") return;
  if (g.camera.position.z < 20) return;
  let e = g.landlotOverlay.position.x / 4;
  let n = g.landlotOverlay.position.z / -4;
  let k = LandLotStr(e,n);
  if (ev.key == "a") r.ClaimLot(g.myColor, k);
  if (ev.key == "r") r.UnclaimLot(k);
  if (ev.key == "f") r.MuleInstalled({_mt:"",pc:g.myColor,resType:0,e:e,n:n,existingResType:-1});
  if (ev.key == "e") r.MuleInstalled({_mt:"",pc:g.myColor,resType:1,e:e,n:n,existingResType:-1});
  if (ev.key == "s") r.MuleInstalled({_mt:"",pc:g.myColor,resType:2,e:e,n:n,existingResType:-1});
  if (ev.key == "c") r.MuleInstalled({_mt:"",pc:g.myColor,resType:3,e:e,n:n,existingResType:-1});
  if (ev.key == "u") r.MuleRemoved({_mt:"",pc:g.myColor,e:e,n:n,existingResType:-1});
}


/** @param {any} _ */
async function StartGameClick(_)
{
  ui.startgame.disabled = true;
  ui.startgame.innerText = "Waiting for game init";
  await g.init3DComplete;
  send(t.StartGame());
}

function setupPending()
{
  ui.joingame.onclick = joinGameClick;
  ui.creategame.onclick = createGameClick;
  
  // note that y/g/b controls should get sync'ed with r via sync_rygb() at end of setup()

  ui.rnameinput.onfocus    = (e)=>{ inputTarget(e).select(); };
  ui.rnameinput.oninput    = (e)=>{ send(t.NameChange(inputTarget(e).value)); };
  ui.rdesiredbtn.onclick   = (e)=>{ send(t.ColorReq(targetID(e)[0].toUpperCase())); };
  ui.rdesiredimg.onclick   = ui.rdesiredbtn.onclick;
  ui.rchangecolor.onchange = handleColorChange;
  ui.rkick.onclick         = (e)=>{ send(t.Kick(targetID(e)[0].toUpperCase())); };
  ui.startgame.onclick     = StartGameClick;

  document.onkeydown = debug;
}

/** @this {GlobalEventHandlers} */
function btnBuySellClick()
{
  if (!(this instanceof HTMLButtonElement)) return;
  let pc = this.id[0].toUpperCase();
  send(t.BuySell(pc, ui.bsb(pc).checked));
  ui.pabbs(pc).style.visibility = "hidden";
}

function btnDoneClick()
{
  send(t.Continue());
  ui.target.style.visibility = "hidden";
  ui.targetline.style.visibility = "hidden";
  ui.aucdone.style.visibility = "hidden";
  ui.aucbuy.style.visibility = "hidden";
  ui.aucsell.style.visibility = "hidden";
}

function btnSellClick()
{
  send(t.BuySell(g.myColor, false));
}

function btnBuyClick()
{
  send(t.BuySell(g.myColor, true));
}

function setupAuctions()
{
  const slider = ui.target;
  slider.onpointerdown = beginSliding;
  slider.onpointerup = stopSliding;
  ui.targetline.onpointerdown = (e)=>{ beginSliding(e, true); slide(e); };

  ui.rbtnbuysell.onclick = btnBuySellClick;
  ui.aucdone.onclick = btnDoneClick;
  ui.aucbuy.onclick = btnBuyClick;
  ui.aucsell.onclick = btnSellClick;
}

function onWindowResize() 
{
  g.camera.aspect = 2;
  g.camera.updateProjectionMatrix();
  g.renderer.setSize( ui.boardview.clientWidth, ui.boardview.clientHeight );
}

function setup()
{
  g.ws = initWS();
  ui.boardview.style.visibility = "hidden";
  ui.msg.innerText = "";
  
  window.addEventListener('resize', onWindowResize );
  window.addEventListener('contextmenu', (e) => {e.preventDefault();}, false);
  ui.boardview.onpointermove = mouseMove;
  ui.boardview.onpointerdown = mouseClick;
  ui.wumpus.onclick = WumpusClicked;

  setup3d();
  setupPending();
  setupAuctions();
  sync_rygb();
}

setup();
