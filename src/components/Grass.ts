import {
  Scene,
  Mesh,
  StandardMaterial,
  Color3,
  Vector3,
  VertexData,
  DynamicTexture,
  Matrix,
  Quaternion,
} from "@babylonjs/core";
import { bezierCurve } from "../utils/BezierCurve";

let windStrength = 1.0;
let windSpeed = 1.0;

export function createGrass(scene: Scene, count: number = 100000): void {
  const grassBlade = new Mesh("grassBlade", scene);
  const segments = 8;
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const p0 = new Vector3(-0.01, 0, 0);
  const p1 = new Vector3(-0.005, 0.3, 0);
  const p2 = new Vector3(0.005, 0.6, 0);
  const p3 = new Vector3(0, 0.9, 0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = bezierCurve(p0, p1, p2, p3, t);
    const thickness = (1 - t) * 0.01;

    positions.push(point.x - thickness, point.y, 0);
    positions.push(point.x + thickness, point.y, 0);

    uvs.push(0, t);
    uvs.push(1, t);

    normals.push(0, 1, 0, 0, 1, 0);

    if (i > 0) {
      const idx = i * 2;
      indices.push(idx - 2, idx - 1, idx);
      indices.push(idx - 1, idx + 1, idx);
    }
  }

  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(grassBlade);

  const grassMaterial = new StandardMaterial("grassMaterial", scene);
  const texture = new DynamicTexture("grassTexture", 256, scene, true);
  const ctx = texture.getContext();
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#0d3303");
  gradient.addColorStop(1, "#7a9d1d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  texture.update();
  grassMaterial.diffuseTexture = texture;
  grassBlade.material = grassMaterial;

  const matrices = new Float32Array(count * 16);

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    const scale = 1;
    const rotation = Math.random() * Math.PI;

    const matrix = Matrix.Compose(
      new Vector3(scale, scale, scale),
      Quaternion.RotationYawPitchRoll(rotation, 0, 0),
      new Vector3(x, 0, z)
    );

    matrix.copyToArray(matrices, i * 16);
  }

  grassBlade.thinInstanceSetBuffer("matrix", matrices, 32);

  grassBlade.alwaysSelectAsActiveMesh = true;
  grassBlade.doNotSyncBoundingInfo = true;
  grassBlade.freezeWorldMatrix();
  grassBlade.convertToUnIndexedMesh();

  grassBlade.alwaysSelectAsActiveMesh = true;
  grassBlade.isVisible = true;
}

export function setWind(strength: number, speed: number) {
  windStrength = strength;
  windSpeed = speed;
}
