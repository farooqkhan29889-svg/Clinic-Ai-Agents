export default function({ parentElement, setTriggerValue }) {
  let root = document.getElementById("citycare-floating-actions");
  if (!root) root = parentElement.querySelector("#citycare-floating-actions");
  if (root.parentElement !== document.body) document.body.appendChild(root);
  const buttons = Array.from(root.querySelectorAll(".citycare-floating-shortcut"));
  window.__citycareFloatingNavigate = setTriggerValue;
  const storageKey = id => `citycare-float-${id}`;
  const clamp = (button, x, y) => ({
    x: Math.max(4, Math.min(x, window.innerWidth - button.offsetWidth - 4)),
    y: Math.max(4, Math.min(y, window.innerHeight - button.offsetHeight - 4))
  });
  const save = (button, x, y) => {
    const point = clamp(button, x, y);
    button.style.left = `${point.x}px`;
    button.style.top = `${point.y}px`;
    try { localStorage.setItem(storageKey(button.dataset.id), JSON.stringify(point)); } catch (_) {}
  };

  buttons.forEach(button => {
    const id = button.dataset.id;
    let point = null;
    try { point = JSON.parse(localStorage.getItem(storageKey(id)) || "null"); } catch (_) {}
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      const mobile = window.innerWidth < 600;
      point = {
        x: window.innerWidth - (mobile ? 204 : (id === "assistant" ? 204 : 412)),
        y: window.innerHeight - (mobile ? (id === "assistant" ? 142 : 78) : 82)
      };
    }
    const initial = clamp(button, point.x, point.y);
    button.style.left = `${initial.x}px`;
    button.style.top = `${initial.y}px`;
    button.title = "Drag to move; position is saved in this browser";

    if (button.dataset.dragBound === "true") return;
    button.dataset.dragBound = "true";
    button.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button._drag = {startX:event.clientX,startY:event.clientY,left:parseFloat(button.style.left)||0,top:parseFloat(button.style.top)||0,moved:false};
    });
    button.addEventListener("pointermove", event => {
      const drag = button._drag;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved) {
        const next = clamp(button,drag.left+dx,drag.top+dy);
        button.style.left = `${next.x}px`;
        button.style.top = `${next.y}px`;
      }
    });
    button.addEventListener("pointerup", () => {
      const drag = button._drag;
      if (!drag) return;
      if (drag.moved) {
        save(button,parseFloat(button.style.left)||0,parseFloat(button.style.top)||0);
        button._suppressClick = true;
        window.setTimeout(() => { button._suppressClick = false; },250);
      }
      button._drag = null;
    });
    button.addEventListener("pointercancel", () => { button._drag = null; });
    button.addEventListener("click", event => {
      if (button._suppressClick) { event.preventDefault(); return; }
      window.__citycareFloatingNavigate("navigate",button.dataset.target);
    });
  });

  if (!root.dataset.resizeBound) {
    root.dataset.resizeBound = "true";
    window.addEventListener("resize",() => {
      buttons.forEach(button => save(button,parseFloat(button.style.left)||0,parseFloat(button.style.top)||0));
    });
  }
}
