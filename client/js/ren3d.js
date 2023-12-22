import { g } from "./game.js"

let animating = false;

function animate() 
{
  if (animating)
    requestAnimationFrame( animate );
  render();
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

function render()
{
  g.renderer.render( g.scene, g.camera );
}
