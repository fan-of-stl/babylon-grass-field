import { Scene, Vector3, TransformNode, SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders";

export function createPlayer(scene: Scene) {
  const player = new TransformNode("player", scene);

  SceneLoader.ImportMesh("", "/models/", "head.glb", scene, (meshes) => {
    const head = meshes[0];

    head.parent = player;

    head.position = new Vector3(0, 1.8, 0);
    head.scaling = new Vector3(0.5, 0.5, 0.5);
    head.rotation.y = Math.PI;

    console.log("Head model attached to player!");
  });

  player.position = new Vector3(0, 0, 0);

  return player;
}
