import { createScene } from "./core/SceneSetup";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const { engine, scene } = createScene(canvas);

const loader = document.createElement("div");
loader.innerText = "Loading...";
Object.assign(loader.style, {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "black",
  color: "white",
  padding: "15px",
  fontSize: "18px",
  zIndex: "1000",
});
document.body.appendChild(loader);



const fpsCounter = document.createElement("span");
Object.assign(fpsCounter.style, {
  position: "absolute",
  background: "black",
  color: "#fff",
  width: "100px",
  height: "30px",
  padding: "10px",
  textAlign: "center",
  top: "10px",
  right: "10px",
  zIndex: "1000",
});
fpsCounter.innerText = "-";
document.body.appendChild(fpsCounter);



const updateUI = () => {
  fpsCounter.innerText = `${Math.floor(engine.getFps())}`;
  requestAnimationFrame(updateUI);
};
updateUI();

engine.runRenderLoop(() => scene.render());

scene.executeWhenReady(() => {
  loader.style.display = "none";
});

window.addEventListener("resize", () => engine.resize());
