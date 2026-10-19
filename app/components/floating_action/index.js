"use strict";

const send = (type, data = {}) => window.parent.postMessage({isStreamlitMessage:true,type,...data}, "*");
const frame = window.frameElement;
const button = document.getElementById("action");
const label = document.getElementById("label");
const symbol = document.getElementById("symbol");
let current = null;
let suppressClick = false;

function clampPosition(x, y) {
  return {
    x: Math.max(4, Math.min(x, window.innerWidth - 194)),
    y: Math.max(4, Math.min(y, window.innerHeight - 62))
  };
}

function place(x, y, persist = false) {
  const pos = clampPosition(x, y);
  frame.style.position = "fixed";
  frame.style.zIndex = "9999";
  frame.style.width = "190px";
  frame.style.height = "58px";
  frame.style.maxWidth = "none";
  frame.style.maxHeight = "none";
  frame.style.left = `${pos.x}px`;
  frame.style.top = `${pos.y}px`;
  frame.style.right = "auto";
  frame.style.bottom = "auto";
  frame.style.margin = "0";
  frame.style.border = "0";
  frame.style.background = "transparent";
  if (persist && current) localStorage.setItem(`citycare-float-${current.id}`, JSON.stringify(pos));
}

function render(args) {
  current = args;
  label.textContent = args.label || "Open";
  symbol.textContent = args.id === "assistant" ? "✦" : "＋";
  button.classList.toggle("assistant", args.id === "assistant");
  button.setAttribute("aria-label", `${args.label}. Drag to move this button.`);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(`citycare-float-${args.id}`) || "null"); } catch (_) {}
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    place(saved.x, saved.y);
  } else {
    const mobile = window.innerWidth < 600;
    const x = window.innerWidth - (mobile ? 204 : (args.id === "assistant" ? 204 : 412));
    const y = window.innerHeight - (mobile ? (args.id === "assistant" ? 142 : 78) : 82);
    place(x, y, true);
  }
  send("streamlit:setFrameHeight", {height:58});
}

button.addEventListener("pointerdown", event => {
  if (!current || event.button !== 0) return;
  event.preventDefault();
  button.setPointerCapture(event.pointerId);
  current.drag = {pointerX:event.screenX,pointerY:event.screenY,x:parseFloat(frame.style.left)||0,y:parseFloat(frame.style.top)||0,moved:false};
});
button.addEventListener("pointermove", event => {
  if (!current || !current.drag) return;
  const dx = event.screenX - current.drag.pointerX;
  const dy = event.screenY - current.drag.pointerY;
  if (Math.abs(dx) + Math.abs(dy) > 5) current.drag.moved = true;
  if (current.drag.moved) place(current.drag.x + dx,current.drag.y + dy);
});
function finishDrag() {
  if (!current || !current.drag) return;
  if (current.drag.moved) {
    place(parseFloat(frame.style.left)||0,parseFloat(frame.style.top)||0,true);
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 250);
  }
  current.drag = null;
}
button.addEventListener("pointerup",finishDrag);
button.addEventListener("pointercancel",finishDrag);
button.addEventListener("click",event => {
  if (suppressClick || !current) { event.preventDefault(); return; }
  send("streamlit:setComponentValue", {value:{target:current.target,token:`${Date.now()}-${Math.random()}`},dataType:"json"});
});
window.addEventListener("resize",() => {
  if (!current) return;
  place(parseFloat(frame.style.left)||0,parseFloat(frame.style.top)||0,true);
});
window.addEventListener("message",event => {
  if (event.data && event.data.type === "streamlit:render") render(event.data.args || {});
});
send("streamlit:componentReady", {apiVersion:1});
send("streamlit:setFrameHeight", {height:58});
