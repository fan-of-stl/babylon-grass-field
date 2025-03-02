import {
  ArcRotateCamera,
  DirectionalLight,
  Engine,
  HDRCubeTexture,
  HemisphericLight,
  Mesh,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { createGround } from "../components/Ground";
import createGrassBlade from "../components/grassCreation";
import createGrassMaterial from "../components/grassMaterial";
import ThinInstancePatch from "../utils/ThinInstancePatch";

export function createScene(canvas: HTMLCanvasElement): {
  engine: Engine;
  scene: Scene;
} {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

  const camera = new ArcRotateCamera(
    "camera1",
    0,
    3.14 / 4,
    20,
    Vector3.Zero(),
    scene
  );
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 3; // Prevents zooming too close
  camera.upperRadiusLimit = 30; // Limits max zoom distance
  camera.wheelPrecision = 20; // Smooth zoom control
  camera.panningSensibility = 500; // Slows down panning for better control

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  var light = new DirectionalLight(
    "light",
    new Vector3(1, -1, 0).normalize(),
    scene
  );

  light.intensity = 0.7;

  // Mesh.CreateGround("ground", 10, 10, 100, scene);
  createGround(scene);

  var grassBlade = createGrassBlade(scene, 5);
  grassBlade.isVisible = false;

  grassBlade.material = createGrassMaterial(light, scene, undefined);

  const patchSize = 20;
  const patchResolution = patchSize * 10;

  const patch = ThinInstancePatch.CreateSquare(
    new Vector3(0, 0, 0),
    patchSize,
    patchResolution
  );
  patch.createInstances(grassBlade);

  const hdrTexture = new HDRCubeTexture("/environment/sky.hdr", scene, 512);
  scene.environmentTexture = hdrTexture;
  scene.createDefaultSkybox(hdrTexture, true, 1000);

  return { engine, scene };
}
