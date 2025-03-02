import { Mesh, Vector3 } from "@babylonjs/core";
import createSquareMatrixBuffer from "../components/createSquareMatrix";

class ThinInstancePatch {
  private baseMesh?: Mesh;
  private readonly position: Vector3;
  private readonly matrixBuffer: Float32Array;

  constructor(patchPosition: Vector3, matrixBuffer: Float32Array) {
    this.position = patchPosition;
    this.matrixBuffer = matrixBuffer;
  }

  static CreateSquare(position: Vector3, size: number, resolution: number) {
    return new ThinInstancePatch(
      position,
      createSquareMatrixBuffer(position, size, resolution)
    );
  }

  createInstances(baseMesh: Mesh) {
    if (!baseMesh.geometry) {
      throw new Error(
        "Tried to create instances from a mesh without geometry."
      );
    }

    if (!this.baseMesh) {
      this.baseMesh = baseMesh.clone();
      this.baseMesh.makeGeometryUnique();
    }

    this.baseMesh.isVisible = true;
    this.baseMesh.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16);
  }
}

export default ThinInstancePatch;
