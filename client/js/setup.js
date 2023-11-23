
import { g, ui, mark3DInitialized } from "./game.js"
import * as t from "./types.js"

/** @type {import('../three/Three.js')} */ //@ts-ignore
let THREE = null;

/** @typedef {import('../three/Three.js').Texture} Texture */

function sandLoaded(/**@type {Texture}*/ sandtexture)
{
  const groundMaterial = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
  sandtexture.wrapS = THREE.RepeatWrapping;
  sandtexture.wrapT = THREE.RepeatWrapping;
  sandtexture.anisotropy = 16;
  sandtexture.repeat.set( 6, 6 );
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
    flowDirection: new THREE.Vector2( 0, 2.25 ),
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
  mm.map = mt;
  let gmo = new THREE.Mesh( mp, mm );
  gmo.position.set(0,4,-11);
  g.scene.add(gmo);
}

function setBldngTexture(/**@type{}*/ x, n)
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
  g.scene = new THREE.Scene();
  g.camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 200 );
  g.camera.position.set( 0, 32.7, 23 );
  g.camera.rotation.set(-.935, 0, 0);
  g.clock = new THREE.Clock();
  g.renderer = new THREE.WebGLRenderer( { antialias: true } );
  g.renderer.setSize( ui.boardview.clientWidth, ui.boardview.clientHeight );
	g.renderer.setPixelRatio( window.devicePixelRatio );
	ui.boardview.appendChild( g.renderer.domElement );

	let ambientLight = new THREE.AmbientLight( 0xdddddd, 3.7 );
	g.scene.add( ambientLight );

	let directionalLight = new THREE.DirectionalLight( 0xccaa88, 7.5 );
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
  g.textures.buldingResTexture[3] = await textureLoader.loadAsync('img/crystite.png');
  setBldngTexture( 1.11,  0);
  setBldngTexture(  .37,  1);
  setBldngTexture( -.37,  2);
  setBldngTexture(-1.13,  3);


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
  brlm.position.y = 0.01;
  brlm.rotation.x = Math.PI * - 0.5;
  g.scene.add(brlm);

  const brrg = new THREE.PlaneGeometry( .5, 1.3 );
  const brrm = new THREE.Mesh( brlg, new THREE.MeshBasicMaterial( {color: '#663311'} ));
  brrm.position.x = 1.77;
  brrm.position.y = 0.01;
  brrm.rotation.x = Math.PI * - 0.5;
  g.scene.add(brrm);

  g.scene.background = new THREE.Color( 0xffeedd );

  /* GLTF */
  let GLTFLoader = await import('../three/addons/GLTFLoader.js');
  let l = new GLTFLoader.GLTFLoader()
  g.models.mule = await l.loadAsync('models/atat/scene.gltf');
  

  if (mark3DInitialized != null)
    mark3DInitialized();  // causes awaiting on g.init3DComplete to proceed

  //requestAnimationFrame(animate);
}

function joinGameClick()
{
  g.send(
    t.JoinGameRequest(
      ui.gamelist.options[ui.gamelist.selectedIndex].text));
}

function createGameClick()
{
  let gameName = prompt('Enter unique game name');
  if (gameName != null)
    g.send(t.CreateGame(gameName, 'R'));
}

function setup()
{
  ui.boardview.style.visibility = "hidden";
  ui.msg.innerText = "";
  setup3d();
  ui.joingame.onclick = joinGameClick;
  ui.creategame.onclick = createGameClick;
}
/*
function animate() 
{
  requestAnimationFrame( animate );
  render();
}

function render()
{
  g.renderer.render( g.scene, g.camera );
}
*/

setup();
