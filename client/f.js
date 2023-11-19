// eventually move this to js folder?

function handleSomeMsg(/**@type {SomeMsg}*/ msg)
{
    console.log("Color is: " + msg.p);
    return 3;
}

function sleep(n)
{
    return new Promise((resolve) => setTimeout(resolve, n))
}

const     sock = new WebSocket(
    "ws://localhost:8888/");
    
async function send(/**@type {Msg}*/ obj)
{
    let msg = JSON.stringify(obj);
    console.log();
    await sleep(2000);
    sock.send(msg);
}

function handle(/**@type {Msg}*/ msg)
{
    let fname = "handle" + msg._mt;
    if (fname in window && typeof(window[fname]) == "function")
        window[fname](msg);
}


let m = {p:"R", props:[], _mt:"SomeMsg"};
handle(m);

/** @type {SomeMsg} */ 
let msg = {_mt:"SomeMsg", p:"G", props:["fdfs"]};
send( msg );


