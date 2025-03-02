import { Color3, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";

export function createGround(scene: Scene): void {
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100, subdivisions: 10 },
    scene
  );

  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new Color3(0.4, 0.3, 0.2);
  groundMaterial.specularColor = Color3.Black();
  groundMaterial.alpha = 0.3;

  ground.material = groundMaterial;
}
