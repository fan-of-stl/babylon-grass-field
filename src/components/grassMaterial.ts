import * as BABYLON from "@babylonjs/core";

function createGrassMaterial(light: any, scene: any, player: any) {
  const shaderName = "grassMaterial";
  BABYLON.Effect.ShadersStore[
    `${shaderName}FragmentShader`
  ] = `precision highp float;

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

    float ndl1 = max(dot(normalW, lightDirection), 0.0);
    float ndl2 = max(dot(-normalW, lightDirection), 0.0);
    float ndl = ndl1 + ndl2;

    // ambient lighting
    ndl = clamp(ndl + 0.1, 0.0, 1.0);

    float density = 0.2;
    float aoForDensity = mix(1.0, 0.25, density);
    float ao = mix(aoForDensity, 1.0, pow(vPosition.y, 2.0));

    gl_FragColor = vec4(finalColor * ndl * ao, 1.0);// apply color and lighting
}`;

  BABYLON.Effect.ShadersStore[`${shaderName}VertexShader`] =
    "precision highp float;\n" +
    "in vec3 position;\n" +
    "in vec3 normal;\n" +
    "uniform mat4 view;\n" +
    "uniform mat4 projection;\n" +
    "uniform vec3 cameraPosition;\n" +
    "uniform vec3 playerPosition;\n" +
    "uniform float time;\n" +
    "uniform sampler2D perlinNoise;\n" +
    "out vec3 vPosition;\n" +
    "out mat4 normalMatrix;\n" +
    "out vec3 vNormal;\n" +
    // rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
    "vec3 rotateAround(vec3 vector, vec3 axis, float theta) {\n" +
    // Please note that unit vector are required, i did not divided by the norms
    "return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));\n" +
    "}\n" +
    "float easeOut(float t, float a) {\n" +
    "return 1.0 - pow(1.0 - t, a);\n" +
    "}\n" +
    "float easeIn(float t, float alpha) {\n" +
    "return pow(t, alpha);\n" +
    "}\n" +
    // remap a value comprised between low1 and high1 to a value between low2 and high2
    "float remap(float value, float low1, float high1, float low2, float high2) {\n" +
    "return low2 + (value - low1) * (high2 - low2) / (high1 - low1);\n" +
    "}\n" +
    "#include<instancesDeclaration>\n" +
    "void main() {\n" +
    "#include<instancesVertex>\n" +
    // wind
    "vec3 objectWorld = world3.xyz;\n" +
    "float windStrength = texture2D(perlinNoise, objectWorld.xz * 0.007 + 0.1 * time).r;\n" +
    "float windDir = texture2D(perlinNoise, objectWorld.xz * 0.005 + 0.05 * time).r * 2.0 * 3.14;\n" +
    "float windLeanAngle = remap(windStrength, 0.0, 1.0, 0.25, 1.0);\n" +
    "windLeanAngle = easeIn(windLeanAngle, 2.0) * 0.75;\n" +
    // curved grass blade
    "float leanAmount = 0.3;\n" +
    "float curveAmount = leanAmount * position.y;\n" +
    "float objectDistance = length(objectWorld - playerPosition);\n" +
    // account for player presence
    "vec3 playerDirection = (objectWorld - playerPosition) / objectDistance;\n" +
    "float maxDistance = 3.0;\n" +
    "float distance01 = objectDistance / maxDistance;\n" +
    "float influence = 1.0 + 8.0 * smoothstep(0.0, 1.0, 1.0 - distance01);\n" +
    "curveAmount *= influence;\n" +
    "curveAmount += windLeanAngle * smoothstep(0.2, 1.0, distance01);\n" +
    "vec3 leanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir * smoothstep(0.2, 1.0, distance01));\n" +
    "leanAxis = normalize(mix(cross(vec3(0.0, 1.0, 0.0), playerDirection), leanAxis, smoothstep(0.0, 1.0, 1.0 - distance01)));\n" +
    "vec3 leaningPosition = rotateAround(position, leanAxis, curveAmount);\n" +
    "vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);\n" +
    "vec4 worldPosition = finalWorld * vec4(leaningPosition, 1.0);\n" +
    //vec3 viewDir = normalize(cameraPosition - worldPosition);
    //float viewDotNormal = abs(dot(viewDir, leaningNormal));
    //float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0);

    //viewSpaceThickenFactor *= smoothstep(0.0, 0.2, viewDotNormal);

    "vec4 viewPosition = view * worldPosition;\n" +
    //viewPosition.x += viewSpaceThickenFactor * leaningNormal.y;

    "vec4 outPosition = projection * viewPosition;\n" +
    "gl_Position = outPosition;\n" +
    "vPosition = position;\n" +
    "normalMatrix = transpose(inverse(finalWorld));\n" +
    "vNormal = leaningNormal;\n" +
    "}";

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

  var noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
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
      : new BABYLON.Vector3(0, 500, 0); // high y to avoid interaction with grass
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
