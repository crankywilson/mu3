import * as THREE from '../three/Three.js';

let scene = new THREE.Scene();
scene.add(new THREE.Object3D());

function setup()
{
  document.getElementById("msg").innerText += "\nModules Loaded";
}


setup();
