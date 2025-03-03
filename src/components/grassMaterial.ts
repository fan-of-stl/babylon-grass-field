import * as BABYLON from "@babylonjs/core";

function createGrassMaterial(
  light: BABYLON.DirectionalLight,
  scene: BABYLON.Scene,
  player: BABYLON.TransformNode
) {
  const shaderName = "grassMaterial";

  BABYLON.Effect.ShadersStore[`${shaderName}FragmentShader`] = `
    precision highp float;
    uniform float time;
    uniform vec3 lightDirection;
    in vec3 vPosition;
    in mat4 normalMatrix;
    in vec3 vNormal;
    void main() {
        vec3 baseColor = vec3(0.05, 0.2, 0.01);
        vec3 tipColor = vec3(0.5, 0.5, 0.1);
        vec3 finalColor = mix(baseColor, tipColor, pow(vPosition.y, 4.0));
        vec3 normalW = normalize((normalMatrix * vec4(vNormal, 0.0)).xyz);
        float ndl = max(dot(normalW, lightDirection), 0.0) + max(dot(-normalW, lightDirection), 0.0);
        ndl = clamp(ndl + 0.1, 0.0, 1.0);
        float ao = mix(1.0, 0.25, 0.2);
        ao = mix(ao, 1.0, pow(vPosition.y, 2.0));
        gl_FragColor = vec4(finalColor * ndl * ao, 1.0);
    }`;

  BABYLON.Effect.ShadersStore[`${shaderName}VertexShader`] = `
    precision highp float;
    in vec3 position;
    in vec3 normal;
    uniform mat4 view;
    uniform mat4 projection;
    uniform vec3 cameraPosition;
    uniform vec3 playerPosition;
    uniform float time;
    uniform sampler2D perlinNoise;
    out vec3 vPosition;
    out mat4 normalMatrix;
    out vec3 vNormal;

    vec3 rotateAround(vec3 v, vec3 axis, float theta) {
        return cos(theta) * v + cross(axis, v) * sin(theta) + axis * dot(axis, v) * (1.0 - cos(theta));
    }

    float easeOut(float t, float a) { return 1.0 - pow(1.0 - t, a); }
    float easeIn(float t, float alpha) { return pow(t, alpha); }
    float remap(float v, float l1, float h1, float l2, float h2) { return l2 + (v - l1) * (h2 - l2) / (h1 - l1); }

    #include<instancesDeclaration>
    void main() {
        #include<instancesVertex>
        vec3 objectWorld = world3.xyz;
        float windStrength = texture2D(perlinNoise, objectWorld.xz * 0.007 + 0.1 * time).r;
        float windDir = texture2D(perlinNoise, objectWorld.xz * 0.005 + 0.05 * time).r * 6.28;
        float windLeanAngle = easeIn(remap(windStrength, 0.0, 1.0, 0.25, 1.0), 2.0) * 0.75;
        float curveAmount = 0.3 * position.y;
        float objectDistance = length(objectWorld - playerPosition);
        vec3 playerDirection = (objectWorld - playerPosition) / objectDistance;
        float influence = 1.0 + 8.0 * smoothstep(0.0, 1.0, 1.0 - (objectDistance / 3.0));
        curveAmount *= influence;
        curveAmount += windLeanAngle * smoothstep(0.2, 1.0, (objectDistance / 3.0));
        vec3 leanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir * smoothstep(0.2, 1.0, (objectDistance / 3.0)));
        leanAxis = normalize(mix(cross(vec3(0.0, 1.0, 0.0), playerDirection), leanAxis, smoothstep(0.0, 1.0, 1.0 - (objectDistance / 3.0))));
        vec3 leaningPosition = rotateAround(position, leanAxis, curveAmount);
        vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);
        vec4 worldPosition = finalWorld * vec4(leaningPosition, 1.0);
        vec4 viewPosition = view * worldPosition;
        gl_Position = projection * viewPosition;
        vPosition = position;
        normalMatrix = transpose(inverse(finalWorld));
        vNormal = leaningNormal;
    }`;

  const grassMaterial = new BABYLON.ShaderMaterial(
    shaderName,
    scene,
    shaderName,
    {
      attributes: ["position", "normal"],
      uniforms: [
        "world",
        "worldView",
        "worldViewProjection",
        "view",
        "projection",
        "viewProjection",
        "time",
        "lightDirection",
        "cameraPosition",
        "playerPosition",
      ],
      defines: ["#define INSTANCES"],
      samplers: ["perlinNoise"],
    }
  );

  const noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
  noiseTexture.animationSpeedFactor = 0;
  noiseTexture.brightness = 0.5;
  noiseTexture.octaves = 3;

  grassMaterial.backFaceCulling = false;
  grassMaterial.setVector3("lightDirection", light.direction);
  grassMaterial.setTexture("perlinNoise", noiseTexture);

  let elapsedSeconds = 0;
  scene.onBeforeRenderObservable.add(() => {
    elapsedSeconds += scene.getEngine().getDeltaTime() / 1000;
    const playerPosition = player
      ? player.position
      : new BABYLON.Vector3(0, 10, 0);
    const cameraPosition = scene.activeCamera
      ? scene.activeCamera.position
      : new BABYLON.Vector3(0, 0, 0);
    grassMaterial.setVector3("playerPosition", playerPosition);
    grassMaterial.setVector3("cameraPosition", cameraPosition);
    grassMaterial.setFloat("time", elapsedSeconds);
  });

  return grassMaterial;
}

export default createGrassMaterial;
