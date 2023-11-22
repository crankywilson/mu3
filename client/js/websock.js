import * as t from "./types.js";
import * as m from "./msgs.js";

function handleWSMsg(/** @type {MessageEvent} */ ev)
{
    /** @type {t.Msg} */ let msg = JSON.parse(ev.data);
    return m[msg._mt](msg);
}

/** @return {WebSocket}  */
export function initWS()
{
    let ws = new WebSocket("wss://" + window.location.hostname + "/wss/");
    ws.onmessage = handleWSMsg;
    return ws;
}
