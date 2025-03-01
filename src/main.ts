import { createGrass, setWind } from "./components/Grass";
import { createScene } from "./core/SceneSetup";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const { engine, scene } = createScene(canvas);

createGrass(scene);

const windControl = document.createElement("input");
windControl.type = "range";
windControl.min = "0";
windControl.max = "5";
windControl.step = "0.1";
windControl.value = "1";
windControl.style.position = "absolute";
windControl.style.top = "10px";
windControl.style.left = "10px";
windControl.style.zIndex = "1000";
document.body.appendChild(windControl);

const fpsCounter = document.createElement("span");
fpsCounter.style.position = "absolute";
fpsCounter.style.background = "black";
fpsCounter.style.color = "#fff";
fpsCounter.style.width = "100px";
fpsCounter.style.height = "30px";
fpsCounter.style.padding = "10px";
fpsCounter.style.textAlign = "center";
fpsCounter.style.top = "10px";
fpsCounter.style.right = "10px";
fpsCounter.style.zIndex = "1000";
fpsCounter.innerHTML = "-";
document.body.appendChild(fpsCounter);

windControl.addEventListener("input", (event) => {
  const value = parseFloat((event.target as HTMLInputElement).value);
  setWind(value, 1.0);
});

engine.runRenderLoop(() => {
  fpsCounter.innerHTML = `${Math.floor(engine.getFps())}`;
  scene.render();
});

window.addEventListener("resize", () => engine.resize());
