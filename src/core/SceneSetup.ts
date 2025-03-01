import {
  ArcRotateCamera,
  Engine,
  HDRCubeTexture,
  HemisphericLight,
  Mesh,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { createGround } from "../components/Ground";

export function createScene(canvas: HTMLCanvasElement): {
  engine: Engine;
  scene: Scene;
} {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 4,
    Math.PI / 3,
    0,
    new Vector3(4, 1, 4),
    scene
  );
  camera.attachControl(canvas, true);
  // camera.lowerRadiusLimit = 50;
  // camera.upperRadiusLimit = 300;
  // camera.wheelPrecision = 25;
  // camera.panningSensibility = 700;

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Mesh.CreateGround("ground", 10, 10, 100, scene);
  createGround(scene);

  const hdrTexture = new HDRCubeTexture("/environment/sky.hdr", scene, 512);
  scene.environmentTexture = hdrTexture;
  scene.createDefaultSkybox(hdrTexture, true, 1000);

  return { engine, scene };
}
