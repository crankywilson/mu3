/**
@typedef Player
 @property {string} name
 @property {number} money
 @property {boolean} mule
**/

export let g = 
{
  players: 
  {
     /** @type {Player} */ R: { name: "", money: 1000, mule: false },
     /** @type {Player} */ B: { name: "", money: 1000, mule: false }
  },
  /** @type {Player} */
  me: { name: "", money: 1000, mule: false },
  
  myColor: "R",
  
  /** @type {WebSocket} */
  ws: new WebSocket("/wss")
};

export let ui =
{
    /** @type {HTMLDivElement} */ // @ts-ignore
    msg: document.getElementById("msg")
};

globalThis.g = g;  // allows 'g' to be used easily in browser debugger

