import { Mesh, Scene, Vector3, VertexData } from "@babylonjs/core";
import rotateAround from "../physics/createRotation";

export default function createGrassBlade(scene: Scene, nbStacks: number): Mesh {
  const nbVertices = 2 * nbStacks + 1;
  const nbTriangles = 2 * (nbStacks + 1) - 1;

  const positions = new Float32Array(nbVertices * 3);
  const normals = new Float32Array(nbVertices * 3);
  const indices = new Uint32Array(nbTriangles * 3);

  const normalZ = new Vector3(0, 0, 1);
  const curvyNormal1 = rotateAround(normalZ, Vector3.UpReadOnly, Math.PI * 0.3);
  const curvyNormal2 = rotateAround(
    normalZ,
    Vector3.UpReadOnly,
    -Math.PI * 0.3
  );

  let index = 0,
    normIndex = 0,
    indIndex = 0;
  const step = 1 / nbStacks;
  const widthFactor = 0.05 / nbStacks;

  for (let i = 0; i < nbStacks; i++) {
    const y = i * step;
    const width = (nbStacks - i) * widthFactor;

    positions.set([-width, y, 0, width, y, 0], index);
    index += 6;

    normals.set(
      [
        curvyNormal1.x,
        curvyNormal1.y,
        curvyNormal1.z,
        curvyNormal2.x,
        curvyNormal2.y,
        curvyNormal2.z,
      ],
      normIndex
    );
    normIndex += 6;

    if (i > 0) {
      indices.set(
        [
          2 * (i - 1),
          2 * (i - 1) + 1,
          2 * i,
          2 * i,
          2 * (i - 1) + 1,
          2 * i + 1,
        ],
        indIndex
      );
      indIndex += 6;
    }
  }

  // Tip vertex
  positions.set([0, nbStacks * step, 0], index);
  normals.set([0, 0, 1], normIndex);

  // Last triangle
  indices.set(
    [2 * (nbStacks - 1), 2 * (nbStacks - 1) + 1, 2 * nbStacks],
    indIndex
  );

  // Create and apply vertex data
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.normals = normals;
  vertexData.indices = indices;

  const grassBlade = new Mesh("grassBlade", scene);
  vertexData.applyToMesh(grassBlade);

  return grassBlade;
}
