import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";

function createSquareMatrixBuffer(
  position: Vector3,
  size: number,
  resolution: number
) {
  const totalInstances = resolution * resolution;
  const matrixBuffer = new Float32Array(totalInstances * 16);
  const cellSize = size / resolution;
  const halfSize = size * 0.5;
  const TWO_PI = 6.283185307; // Precompute constant

  // Reuse objects to reduce memory allocation
  const scalingVec = new Vector3();
  const rotationQuat = new Quaternion();
  const positionVec = new Vector3();
  const matrix = new Matrix();

  let index = 0;
  for (let x = 0; x < resolution; x++) {
    const offsetX = x * cellSize - halfSize;
    for (let z = 0; z < resolution; z++) {
      const offsetZ = z * cellSize - halfSize;

      // Slightly randomize position within the grid cell
      const randX = Math.random() * cellSize;
      const randZ = Math.random() * cellSize;
      positionVec.set(
        position.x + offsetX + randX,
        0,
        position.z + offsetZ + randZ
      );

      // Compute scaling (random but within a controlled range)
      const scale = 0.7 + Math.random() * 0.6;
      scalingVec.set(scale, scale, scale);

      // Compute random rotation around Y-axis
      Quaternion.RotationAxisToRef(
        Vector3.UpReadOnly,
        Math.random() * TWO_PI,
        rotationQuat
      );

      // Compose transformation matrix
      Matrix.ComposeToRef(scalingVec, rotationQuat, positionVec, matrix);

      // Copy matrix to buffer
      matrix.copyToArray(matrixBuffer, index << 4); // index * 16 using bit shift for slight perf boost
      index++;
    }
  }

  return matrixBuffer;
}

export default createSquareMatrixBuffer;
