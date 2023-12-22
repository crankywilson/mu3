import * as t from "./types.js";
import * as m from "./msgs.js";

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


/** @return {WebSocket}  */
export function initWS()
{
    let prot = "wss://";
    let host = window.location.hostname;
    if (host == "localhost" || host.startsWith("192") || host.startsWith("127"))
        prot = "ws://";
    let ws = new WebSocket(prot + window.location.hostname + "/wss/");
    ws.onmessage = handleWSMsg;
    ws.onerror = handlerWSError;
    return ws;
}
