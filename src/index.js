import React, { useCallback } from "react";
import * as ReactDOM from "react-dom";

import { fetchSomething, macro, micro } from "./utils";

let firstInit = false;
let updatingState = false;

console.clear();

const renderModes = document.getElementById("renderModes");
const rootElement = document.getElementById("root");

if (renderModes) {
  renderModes.addEventListener("click", handleRenderModesClick);
}

function App() {
  const dataRef = React.useRef();

  if (firstInit) {
    requestAnimationFrame(() => (firstInit = false));
    macro("App first init");
    performance.mark("nodeMount.start");
  }

  if (updatingState) {
    requestAnimationFrame(() => (updatingState = false));
    micro("render: re-creating VDOM for reconciliation (diffing & patching)");
  } else {
    macro("render (initial)");
  }

  const [, forceUpdate] = React.useState(null);
  const [count, setCount] = React.useState(0);
  const [flag, setFlag] = React.useState("N");

  window.setTimeout(() => {
    macro("setTimeout (main thread is free)");
  });

  requestAnimationFrame(() => {
    macro("requestAnimationFrame (after paint)");
  });

  window.queueMicrotask(() => {
    micro("queueMicrotask");
  });

  window.Promise.resolve().then(() => {
    micro("Promise.resolve().then()");
  });

  React.useLayoutEffect(() => {
    micro("useLayoutEffect: here you can read & change DOM (before paint)");
  });

  React.useEffect(() => {
    micro("useEffect");
  });

  const onNodeMountUnmount = useCallback((node) => {
    dataRef.value = node;

    const nodeMounted = node !== null;
    if (nodeMounted) {
      macro("node mounted (before paint)");

      performance.mark("nodeMounted.end");
      performance.measure("nodeMounted", "nodeMount.start", "nodeMounted.end");

      return;
    }

    const nodeUnmounted = node === null;
    if (nodeUnmounted) {
      macro("node unmounted");
    }
  }, []);

  return (
    <div ref={onNodeMountUnmount}>
      {/* actions */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
        <button onClick={() => onUpdate("flag")}>UPDATE: FLAG</button>
        <button onClick={() => onUpdate("count")}>UPDATE: COUNT</button>
        <button onClick={() => onUpdate("multi")}>
          UPDATE: COUNT + FLAG (BATCHING?)
        </button>
        <button onClick={onForceUpdate}>FORCE UPDATE</button>
      </div>

      {/* state */}
      <code>
        <pre style={{ margin: 0 }}>count: {count}</pre>
        <pre style={{ margin: 0 }}>flag: {flag}</pre>
      </code>
    </div>
  );

  function onForceUpdate() {
    console.clear();

    updatingState = true;

    forceUpdate();
  }

  function onUpdate(type) {
    console.clear();
    macro("=== click ===");
    macro(`todo: update "${type}"`);

    fetchSomething().then(() => {
      performance.mark("stateUpdate.start");
      micro("before state update");

      updatingState = true;

      const updateCount = () => setCount((c) => c + 1);
      const updateFlag = () => setFlag((f) => (f === "Y" ? "N" : "Y"));

      if (type === "count") {
        updateCount(); // Does not re-render yet
      } else if (type === "flag") {
        updateFlag();
      } else if (type === "multi") {
        // React 18 with `createRoot` batches these:
        updateCount(); // Does not re-render yet
        updateFlag(); // Does not re-render yet
        // React 18 will only re-render once at the end (that's batching!)
      }

      micro("after state update");
      performance.mark("stateUpdate.end");

      performance.measure(
        "stateUpdated",
        "stateUpdate.start",
        "stateUpdate.end"
      );
    });
  }
}

function handleRenderModesClick(event) {
  const button = event.target.closest("button");

  const doesntHaveClosestButton = !button;
  if (doesntHaveClosestButton) {
    return;
  }

  const type = button.getAttribute("id");

  // unmount already mounted App (if it's there)
  ReactDOM.unmountComponentAtNode(rootElement);

  console.clear();
  macro("click", "render mode", type);

  firstInit = true;

  if (type === "old") {
    // This keeps the old behavior:
    ReactDOM.render(<App />, rootElement);
  }
  if (type === "new") {
    // This opts into the new behavior!
    ReactDOM.createRoot(rootElement).render(<App />);
  }
}
