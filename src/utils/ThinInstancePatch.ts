import { Camera, Mesh, Vector3 } from "@babylonjs/core";
import createSquareMatrixBuffer from "../components/createSquareMatrix";

class ThinInstancePatch {
  private baseMesh?: Mesh;
  private readonly position: Vector3;
  private readonly matrixBuffer: Float32Array;
  private static totalGrassInstances = 0;

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

  createInstances(baseMesh: Mesh, camera: Camera) {
    if (!baseMesh.geometry) {
      throw new Error("Tried to create instances from a mesh without geometry.");
    }

    if (!this.baseMesh) {
      this.baseMesh = baseMesh.clone();
      this.baseMesh.makeGeometryUnique();
    }

    // Get distance from camera to patch
    const distance = Vector3.Distance(this.position, camera.position);

    // Define LOD distances
    const highDetailDistance = 30; // Full detail within 30 units
    const midDetailDistance = 60; // Medium detail within 60 units
    const lowDetailDistance = 100; // Low detail beyond 100 units

    let lodFactor = 1.0; // Default (Full resolution)
    
    if (distance > highDetailDistance) {
        lodFactor = 0.5; // Reduce by 50% beyond 30 units
    }
    if (distance > midDetailDistance) {
        lodFactor = 0.25; // Reduce to 25% beyond 60 units
    }
    if (distance > lowDetailDistance) {
        lodFactor = 0.1; // Sparse grass far away
    }

    // Reduce matrix buffer size based on LOD
    const reducedInstances = Math.floor(this.matrixBuffer.length / 16 * lodFactor);
    const lodMatrixBuffer = this.matrixBuffer.slice(0, reducedInstances * 16);

    this.baseMesh.isVisible = true;
    this.baseMesh.thinInstanceSetBuffer("matrix", lodMatrixBuffer, 16);

    const numInstances = lodMatrixBuffer.length / 16;
    ThinInstancePatch.totalGrassInstances += numInstances;
    console.log(`Total Grass Instances: ${ThinInstancePatch.totalGrassInstances}`);

    ThinInstancePatch.updateGrassCounter();
}


  private static updateGrassCounter() {
    let counterElement = document.getElementById("grass-counter");
    if (!counterElement) {
      counterElement = document.createElement("div");
      counterElement.id = "grass-counter";
      counterElement.style.position = "absolute";
      counterElement.style.top = "80px";
      counterElement.style.left = "10px";
      counterElement.style.padding = "8px 12px";
      counterElement.style.background = "rgba(0, 0, 0, 0.7)";
      counterElement.style.color = "white";
      counterElement.style.fontSize = "16px";
      counterElement.style.fontFamily = "Arial, sans-serif";
      counterElement.style.borderRadius = "5px";
      document.body.appendChild(counterElement);
    }
    counterElement.textContent = `Total Grass Instances: ${ThinInstancePatch.totalGrassInstances}`;
  }
}

export default ThinInstancePatch;
