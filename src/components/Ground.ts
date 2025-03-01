import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";

export function createGround(scene: Scene): void {
  // Create a ground mesh
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 100, height: 100 },
    scene
  );

  // Create a material
  const groundMaterial = new StandardMaterial("groundMaterial", scene);

  // Load textures
  groundMaterial.diffuseTexture = new Texture(
    "textures/brown_mud_leaves_01_diff_4k.jpg",
    scene
  ); // Albedo/Diffuse
  groundMaterial.bumpTexture = new Texture(
    "textures/brown_mud_leaves_01_nor_gl_4k.png",
    scene
  ); // Normal Map
  groundMaterial.specularTexture = new Texture(
    "textures/brown_mud_leaves_01_rough_4k",
    scene
  ); // Roughness Map
  // groundMaterial.displacementTexture = new Texture("textures/brown_mud_leaves_01_disp_4k.png", scene); // Displacement Map

  // Adjust texture properties
  groundMaterial.specularColor = Color3.Black(); // Reduce specular reflections
  groundMaterial.bumpTexture.level = 1; // Adjust normal strength
  groundMaterial.useParallax = true; // Enable parallax mapping
  groundMaterial.useParallaxOcclusion = true; // Enhance depth effect

  // Assign material to ground
  ground.material = groundMaterial;
}
