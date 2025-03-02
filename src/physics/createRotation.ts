import { Vector3 } from "@babylonjs/core";

export default function rotateAround(vector: any, axis: any, theta: any) {
  return vector
    .scale(Math.cos(theta))
    .addInPlace(Vector3.Cross(axis, vector).scaleInPlace(Math.sin(theta)))
    .addInPlace(
      axis.scale(Vector3.Dot(axis, vector) * (1.0 - Math.cos(theta)))
    );
}
