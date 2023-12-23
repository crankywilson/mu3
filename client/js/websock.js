import * as t from "./types.js";
import * as m from "./msgs.js";
import {g} from "./game.js";

function handleWSMsg(/** @type {MessageEvent} */ ev)
{
    /** @type {t.Msg} */ let msg = JSON.parse(ev.data);
    // @ts-ignore
    return m[msg._mt](msg); 
}

function handlerWSError(/** @type {Event} */ ev)
{
    if (ev.target instanceof WebSocket)
        ui.msg.innerText = "error on websocket connecting to " + ev.target.url;
}

function handleClose(/** @type {Event} */ ev)
{
    alert("websocket disconnected");
}


/** @return {WebSocket}  */
export function initWS()
{
    let prot = "wss://";
    let host = window.location.hostname;
    if (host == "localhost" || host.startsWith("192") || host.startsWith("127"))
        prot = "ws://";
    
    let qstring = "";
    
    if (document.location.search.length > 1)
        qstring = document.location.search;
    else if (document.cookie.length > 1)
        qstring = document.cookie;
    
    let c = new URLSearchParams(qstring).get("c");
    if (c != null)
        g.myColor = c;
    
    let ws = new WebSocket(prot + window.location.hostname + "/wss/" + qstring);
    
    ws.onmessage = handleWSMsg;
    ws.onerror = handlerWSError;
    ws.onclose = handleClose;
    
    return ws;
}
