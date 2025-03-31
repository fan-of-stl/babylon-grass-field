import {
  ArcRotateCamera,
  DirectionalLight,
  Engine,
  HDRCubeTexture,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { createGround } from "../components/Ground";
import createGrassBlade from "../components/grassCreation";
import createGrassMaterial from "../components/grassMaterial";
import ThinInstancePatch from "../utils/ThinInstancePatch";
import { createPlayer } from "../components/createPlayer";

export function createScene(canvas: HTMLCanvasElement): {
  engine: Engine;
  scene: Scene;
} {
  const engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
  const scene = new Scene(engine);
  scene.clearColor.set(0.8, 0.9, 1, 1);
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 3,
    15,
    new Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 50;
  camera.wheelPrecision = 15;
  camera.panningSensibility = 600;

  new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  const light = new DirectionalLight(
    "dirLight",
    new Vector3(1, -1, 0).normalize(),
    scene
  );
  light.intensity = 0.7;

  createGround(scene);

  const player = createPlayer(scene);

  const grassBlade = createGrassBlade(scene, 5);
  grassBlade.isVisible = false; // Use instances instead
  grassBlade.material = createGrassMaterial(light, scene, player);

  const patchSize = 40;
  const patchResolution = patchSize * 10;
  const patch = ThinInstancePatch.CreateSquare(
    new Vector3(0, 0, 0),
    patchSize + 50,
    patchResolution
  );
  patch.createInstances(grassBlade, camera);

  const hdrTexture = new HDRCubeTexture("/environment/sky.hdr", scene, 256);
  scene.environmentTexture = hdrTexture;
  scene.createDefaultSkybox(hdrTexture, true, 500);

  return { engine, scene };
}
