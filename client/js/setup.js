// @ts-check
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 200 );
let clock = new THREE.Clock();
let renderer = new THREE.WebGLRenderer( { antialias: true } );
/** @type {?WebSocket} */
let socket = null;
const bm = [];
const bmToRes = {};

let d = 
{
  totalModels: 0,
  totalCalculated: false,
  modelsLoaded: 0,
  /** @type {?THREE.Scene} */
  mulemod: null,
  /** @type {?THREE.Scene} */ 
  flagmod: null,
  /** @type {?THREE.AnimationClip} */ 
  flagAnim: null,
  /** @type {?THREE.AnimationClip} */ 
  muleAnim: null,
  poleMat: new THREE.MeshLambertMaterial( {color: 0x666666, reflectivity: 15} ),
  /** @type {?THREE.Texture[]} */
  flagTexture: [null, null, null, null, null],
  plotboundMat: [null, 
    new THREE.MeshLambertMaterial( {color: '#ff0000', reflectivity: 15}),
    new THREE.MeshLambertMaterial( {color: '#ff8a45', reflectivity: 15}),
    new THREE.MeshLambertMaterial( {color: '#006600', reflectivity: 15}),
    new THREE.MeshLambertMaterial( {color: '#3366ff', reflectivity: 15})
  ],
  /** @type {?THREE.Scene[]} */ 
  prodmod: [null, null, null, null],
  /** @type {?THREE.Group} */ 
  buildingsGroup: null,
  buildingColor: 0x666666,
  muleStartX: 0,
  mlx: [0,0,0,0],
  mlz: -1.3,
  /** @type {?THREE.Texture[]} */ 
  cryst: [null, null, null, null],
  resTexture: [null, null, null, null]
};



function e(el)
{
  return document.getElementById(el);
}


function setup()
{
  setupWebsock();
  camera.position.set( 0, 32.7, 23 );
  camera.rotation.set(-.935, 0, 0);

  // light

	const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.8 );
	scene.add( ambientLight );

	const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
	directionalLight.position.set( - 1, 1, -1 );
	scene.add( directionalLight );

	// renderer

	let boardview = document.getElementById("boardview");
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( boardview.clientWidth, boardview.clientHeight );
	renderer.setPixelRatio( window.devicePixelRatio );
	document.getElementById("boardview").appendChild( renderer.domElement );

  // ground
  const textureLoader = new THREE.TextureLoader();
  d.totalModels++;
  textureLoader.load( 'img/sand.jpg', sandLoaded, prog); 
  d.totalModels++;
  textureLoader.load( 'img/rb.jpg', riverbedloaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/mountains.jpg', mountainsLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/no.png', noCrysLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/low.png', lowCrysLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/med.png', medCrysLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/high.png', highCrysLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/food.png', foodTextureLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/energy.png', energyTextureLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/smithore.png', smithoreTextureLoaded, prog);
  d.totalModels++;
  textureLoader.load( 'img/crystite.png', crystiteTextureLoaded, prog);

	// buildings
  d.buildingsGroup = new THREE.Group()
  for (let i=0; i<8; i++)
    bm[i] = new THREE.MeshLambertMaterial( {color: d.buildingColor, reflectivity: 15} );

  bm[0].name = 'Crystite';
  bm[1].name = 'Smithore';
  bm[2].name = 'Energy';
  bm[3].name = 'Food';
  bm[4].name = 'Assay';
  bm[5].name = 'Land';
  bm[6].name = 'Cantina';
  bm[7].name = 'Mule';

  bmToRes[bm[0].name] = 3;
  bmToRes[bm[1].name] = 2;
  bmToRes[bm[2].name] = 1;
  bmToRes[bm[3].name] = 0;

	for (let i=0; i<4; i++)
	{
		let b1g = new THREE.BoxGeometry( .5, .4, .1 );
		let b1mesh = new THREE.Mesh( b1g, bm[i] );
		b1mesh.position.set(-1.1 + i*.7333, .2, -1.6);
		d.buildingsGroup.add( b1mesh );

    d.mlx[3-i] = b1mesh.position.x;


		let b2g = new THREE.BoxGeometry( .5, .4, .1 );
		let b2mesh = new THREE.Mesh( b2g, bm[i+4] );
		b2mesh.position.set(-1.1 + i*.7333, .2, 1.6);
		d.buildingsGroup.add( b2mesh );

    if (i+4 == 7) // this is the mule building
    {
      d.muleStartX =b2mesh.position.x;
    }

		let b1gl = new THREE.BoxGeometry( .1, .4, .5 );
		let b1lmesh = new THREE.Mesh( b1gl, bm[i] );
		b1lmesh.position.set(-.9 + i*.7333, .2, -1.3);
		d.buildingsGroup.add( b1lmesh );

		let b1gr = new THREE.BoxGeometry( .1, .4, .5 );
		let b1rmesh = new THREE.Mesh( b1gr, bm[i] );
		b1rmesh.position.set(-1.3 + i*.7333, .2, -1.3);
		d.buildingsGroup.add( b1rmesh );

		let b2gr = new THREE.BoxGeometry( .1, .4, .5 );
		let b2rmesh = new THREE.Mesh( b2gr, bm[i+4] );
		b2rmesh.position.set(-1.3 + i*.7333, .2, 1.3);
		d.buildingsGroup.add( b2rmesh );

		let b2gl = new THREE.BoxGeometry( .1, .4, .5 );
		let b2lmesh = new THREE.Mesh( b2gl, bm[i+4] );
		b2lmesh.position.set(-.9 + i*.7333, .2, 1.3);
		d.buildingsGroup.add( b2lmesh );

    scene.add(g.markers);
    scene.add(g.prodGroup);
	}
    
  scene.add(d.buildingsGroup);

  // bridges
  const brlg = new THREE.PlaneGeometry( .5, 1.3 );
  const brlm = new THREE.Mesh( brlg, new THREE.MeshBasicMaterial( {color: '#663311'} ));
  brlm.position.x = -1.77;
  brlm.position.y = 0.01;
  brlm.rotation.x = Math.PI * - 0.5;
  scene.add(brlm);

  const brrg = new THREE.PlaneGeometry( .5, 1.3 );
  const brrm = new THREE.Mesh( brlg, new THREE.MeshBasicMaterial( {color: '#663311'} ));
  brrm.position.x = 1.77;
  brrm.position.y = 0.01;
  brrm.rotation.x = Math.PI * - 0.5;
  scene.add(brrm);

  scene.background = new THREE.Color( 0xffeedd );

  const gltfl = new GLTFLoader();
  d.totalModels++;
	gltfl.load('models/atat/scene.gltf', muleloaded, prog, n);
  d.totalModels++;
	gltfl.load('models/plants/plants.gltf', foodloaded, prog, n);
  d.totalModels++;
	gltfl.load('models/energy/energy.gltf', energyloaded, prog, n);
  d.totalModels++;
	gltfl.load('models/excv/excv.gltf', smithoreloaded, prog, n);
  d.totalModels++;
  gltfl.load('models/drill/drill.gltf', crystiteloaded, prog, n);
  d.totalModels++;
	gltfl.load('models/blueflag/scene.gltf', flagloaded, n, n);

  const tl = new THREE.TextureLoader();
  d.totalModels++;
  tl.load('img/redf.png', function(t) { d.flagTexture[1] = t; loadProgress(); });
  d.totalModels++;
  tl.load('img/yellowf.png', function(t) { d.flagTexture[2] = t; loadProgress(); });
  d.totalModels++;
  tl.load('img/greenf.png', function(t) { d.flagTexture[3] = t; loadProgress(); });
  d.totalModels++;
  tl.load('img/bluef.png', function(t) { d.flagTexture[4] = t; loadProgress(); });

	window.addEventListener( 'resize', onWindowResize );
	onWindowResize();

  window.addEventListener('contextmenu', (e) => {e.preventDefault();}, false);
}

function n(ignore)
{
}

function onWindowResize() {
	let boardview = document.getElementById("boardview");
	camera.aspect = 2;//window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( boardview.clientWidth, boardview.clientHeight );

}

function loadProgress()
{
  d.modelsLoaded++;
  e("msg").innerText = "Model " + d.modelsLoaded + "  of " + d.totalModels + " loaded";
    
  if (d.totalCalculated && d.modelsLoaded == d.totalModels)
    setupComplete();
}

function fbxloaded(dude, n)
{
  dude.scale.set(.004,.0025,.004);
  dude.position.x = 0;
  dude.position.z = 0;

  if (n == g.myChar)
    dude.position.z = g.mySetZ;

  g.pl[n].model = dude;
  g.pl[n].mixer = new THREE.AnimationMixer(dude);
  let action = g.pl[n].mixer.clipAction( dude.animations[0] );
  action.play();
  g.pl[n].mixer.setTime(.55);
  scene.add(dude);

  loadProgress();
}


function muleloaded(mule)
{
    d.mulemod = mule.scene;
    d.mulemod.scale.set(.06,.05,.06);
    d.mulemod.rotation.y = Math.PI;
    d.mulemod.position.set(1.1,0,1.1);
    let mixer = new THREE.AnimationMixer(mule.scene);
    let action = mixer.clipAction( mule.animations[ 0 ] );
    d.muleAnim = mule.animations[ 0 ];
    action.play();
    mixer.setTime(7);

    loadProgress();
}

function foodloaded(mdl)
{
  d.prodmod[0] = mdl.scene;
  d.prodmod[0].scale.set(100,50,100);
  d.prodmod[0].rotation.y = Math.PI;
  d.prodmod[0].position.set(0,-.15,-4);
  //scene.add(foodmdl);

  loadProgress();
}

function energyloaded(mdl)
{
  d.prodmod[1] = mdl.scene;
  d.prodmod[1].scale.set(.5,.5,.5);
  d.prodmod[1].rotation.y = 1.8;
  d.prodmod[1].position.set(4,0,-4);
  //scene.add(energymdl);

  loadProgress();
}

function smithoreloaded(mdl)
{
  d.prodmod[2] = mdl.scene;
  d.prodmod[2].scale.set(10,10,10);
  d.prodmod[2].rotation.y = -1;
  d.prodmod[2].position.set(-4,-0,0);
  //scene.add(smithoremdl);

  loadProgress();
}

function crystiteloaded(mdl)
{
  d.prodmod[3] = mdl.scene;
  d.prodmod[3].scale.set(30,30,30);
  d.prodmod[3].position.set(-4,-0,-4);
  //scene.add(crystitemdl);

  loadProgress();
}

function flagloaded(fl)
{
  d.flagmod = fl.scene;
  d.flagAnim = fl.animations[ 0 ];
  d.flagmod.scale.set(.2,.2,.2);
  d.flagmod.position.set(1.1,.4,-.8);
  let mixer = new THREE.AnimationMixer(fl.scene);
  let action = mixer.clipAction( fl.animations[ 0 ] );
  action.play();
  //scene.add(flagb);
  //flags.push({scene:fl.scene, mixer:mixer});
  loadProgress();
}

let gmo = null;
function mountainsLoaded(mt)
{
    const mp = new THREE.PlaneGeometry( 50, 8 );
    const mm = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
    mt.wrapS = THREE.RepeatWrapping;
    mt.wrapT = THREE.RepeatWrapping;
    mt.anisotropy = 16;
    mt.repeat.set( 1, 1 );
    mm.map = mt;
    gmo = new THREE.Mesh( mp, mm );
    gmo.position.set(0,4,-11);
    scene.add(gmo);
    loadProgress();
}

function medCrysLoaded(texture)
{
  d.cryst[2] = texture;
  loadProgress();
}

function noCrysLoaded(texture)
{
  d.cryst[0] = texture;
  loadProgress();
}

function lowCrysLoaded(texture)
{
  d.cryst[1] = texture;
  loadProgress();
}

function highCrysLoaded(texture)
{
  d.cryst[3] = texture;
  loadProgress();
}

function setBldngTexture(texture, x, n)
{
  d.resTexture[n] = texture;
  let pg = new THREE.PlaneGeometry( .2, .4 );
  let material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });
  let cm = new THREE.Mesh( pg, material );
  cm.position.set(x, 0.2, -1.5);
  scene.add(cm);
  loadProgress();
}

function foodTextureLoaded(t)     { setBldngTexture(t, 1.11, 0); }
function energyTextureLoaded(t)   { setBldngTexture(t, .37,  1); }
function smithoreTextureLoaded(t) { setBldngTexture(t, -.37, 2); }
function crystiteTextureLoaded(t) { setBldngTexture(t, -1.13, 3); }

function riverbedloaded(rbtext)
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
  scene.add( ground4 );


  let water = new Water( new THREE.PlaneGeometry( 10, 23 ), {
    color: '#ffffff',
    scale: 1.8,
    flowDirection: new THREE.Vector2( 0, .25 ),
    textureWidth: 1024,
    textureHeight: 1024
  } );

	water.position.y = -.01;
	water.rotation.x = Math.PI * - 0.5;
	scene.add( water );

  loadProgress();
}


function sandLoaded(sandtexture)
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
  scene.add( ground );

  const ground2 = new THREE.Mesh( groundGeometry, groundMaterial );
  ground2.position.x = 32
  ground2.position.y = 0;
  ground2.rotation.x = Math.PI * - 0.5;
  scene.add( ground2 );

  const groundGeometry3 = new THREE.PlaneGeometry( 3.1, 3.6 );
  const groundMaterial3 = new THREE.MeshStandardMaterial( { roughness: 0.8, metalness: 0.4 } );
  const ground3 = new THREE.Mesh( groundGeometry3, groundMaterial3 );
  groundMaterial3.map = sandtexture;
  ground3.position.x = 0
  ground3.position.y = 0;
  ground3.rotation.x = Math.PI * - 0.5;
  scene.add( ground3 );

  loadProgress();
}

function prog(p)
{
  let m = e('msg').innerText;
  if (m.indexOf('[') > 0) 
      m = m.substring(0, m.indexOf('[') - 1);
  m += ' [' + p.loaded + ']';
  e('msg').innerText = m;
}