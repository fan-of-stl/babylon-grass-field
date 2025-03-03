import * as BABYLON from "@babylonjs/core";

function createWindControls() {
  const windControl = document.createElement("input");
  Object.assign(windControl, {
    type: "range",
    min: "0.1",
    max: "0.8",
    step: "0.1",
    value: "0.1",
    id: "wind-control",
  });
  Object.assign(windControl.style, {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: "1000",
  });

  const windSpeedDisplay = document.createElement("div");
  Object.assign(windSpeedDisplay.style, {
    position: "absolute",
    top: "40px",
    left: "10px",
    zIndex: "1000",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "5px",
    borderRadius: "5px",
    fontSize: "14px",
  });

  document.body.appendChild(windControl);
  document.body.appendChild(windSpeedDisplay);

  return { windControl, windSpeedDisplay };
}

function createGrassMaterial(
  light: BABYLON.DirectionalLight,
  scene: BABYLON.Scene,
  player: BABYLON.TransformNode
): BABYLON.ShaderMaterial {
  const shaderName = "grassMaterial";
  let strength = 0.1;

  const { windControl, windSpeedDisplay } = createWindControls();

  BABYLON.Effect.ShadersStore[`${shaderName}FragmentShader`] = `
    precision highp float;
    uniform float time;
    uniform float windStrength;
    uniform vec3 lightDirection;
    in vec3 vPosition;
    in mat4 normalMatrix;
    in vec3 vNormal;
    in float vWindInfluence;
    in float vRandomFactor;

    void main() {
        vec3 baseColor = mix(vec3(0.04, 0.18, 0.01), vec3(0.06, 0.22, 0.02), vRandomFactor);
        vec3 tipColor = mix(vec3(0.45, 0.52, 0.08), vec3(0.55, 0.48, 0.12), vRandomFactor);
        
        float windColorShift = vWindInfluence * 0.2;
        float heightFactor = pow(vPosition.y, 4.0);
        vec3 finalColor = mix(baseColor, tipColor, heightFactor + windColorShift);
        
        vec3 normalW = normalize((normalMatrix * vec4(vNormal, 0.0)).xyz);
        float ndl = max(dot(normalW, lightDirection), 0.2);
        
        float ao = mix(0.3, 1.0, pow(vPosition.y, 1.5));
        
        float sss = pow(max(dot(normalW, -lightDirection), 0.0), 4.0) * 0.2;
        
        gl_FragColor = vec4(finalColor * (ndl + sss) * ao, 1.0);
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
    uniform float windStrength;
    uniform sampler2D perlinNoise;
    out vec3 vPosition;
    out mat4 normalMatrix;
    out vec3 vNormal;
    out float vWindInfluence;
    out float vRandomFactor;

    vec3 rotateAround(vec3 v, vec3 axis, float theta) {
        float cosTheta = cos(theta);
        float sinTheta = sin(theta);
        return cosTheta * v + sinTheta * cross(axis, v) + dot(axis, v) * (1.0 - cosTheta) * axis;
    }

    float easeIn(float t, float alpha) { return pow(t, alpha); }
    float easeInOut(float t) { return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t; }
    float remap(float v, float l1, float h1, float l2, float h2) { return l2 + (v - l1) * (h2 - l2) / (h1 - l1); }

    float hash(vec2 p) {
        p = 50.0 * fract(p * 0.3183099);
        return fract(p.x * p.y * (p.x + p.y));
    }

    float multiscaleNoise(sampler2D noiseTex, vec2 uv, float time, float strength, int octaves) {
        float result = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        float maxValue = 0.0;
        
        for (int i = 0; i < octaves; i++) {
            float timeOffset = time * (0.5 / float(i+1)) * strength;
            
            vec2 dir = vec2(sin(float(i) * 1.7), cos(float(i) * 2.3));
            
            result += amplitude * texture(noiseTex, uv * frequency + dir * timeOffset).r;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.1;
        }
        
        return result / maxValue;
    }

    #include<instancesDeclaration>
    void main() {
        #include<instancesVertex>
        vec3 objectWorld = world3.xyz;
        
        vRandomFactor = hash(objectWorld.xz);
        
        float primaryNoise = multiscaleNoise(perlinNoise, objectWorld.xz * 0.003, time * 0.2, windStrength, 3);
        
        float secondaryNoise = multiscaleNoise(perlinNoise, objectWorld.xz * 0.01, time * 0.4, windStrength, 2);
        
        float detailNoise = multiscaleNoise(perlinNoise, objectWorld.xz * 0.05, time * 0.7, windStrength, 1);
        
        float heightFactor = pow(position.y, 1.8) * (0.8 + vRandomFactor * 0.4);
        
        float windEffect = primaryNoise * 0.7 + secondaryNoise * 0.25 + detailNoise * 0.05;
        
        float windWave = sin(time * (0.6 + vRandomFactor * 0.2) + objectWorld.x * 0.1) * 0.3 + 
                        cos(time * (0.4 + vRandomFactor * 0.1) + objectWorld.z * 0.08) * 0.2;
        
        float rollingWind = mix(windEffect, windWave, 0.2 + vRandomFactor * 0.1);
        rollingWind = easeInOut(rollingWind);
        
        float windDir = texture(perlinNoise, objectWorld.xz * 0.002 + time * 0.02).r * 6.28;
        
        float windLeanAngle = easeIn(remap(rollingWind, 0.0, 1.0, 0.1, 1.0), 1.5) * 
                             (0.6 + vRandomFactor * 0.2) * windStrength;
        
        float objectDistance = length(objectWorld - playerPosition);
        float safeDistance = max(objectDistance, 0.001);
        vec3 playerDirection = (objectWorld - playerPosition) / safeDistance;
        
        float playerInfluence = 1.0 + 7.0 * smoothstep(0.0, 1.0, 1.0 - (objectDistance / 2.5));
        playerInfluence *= 1.0 - (vRandomFactor * 0.3);
        
        float curveAmount = 0.25 * position.y * heightFactor;
        curveAmount *= playerInfluence;
        
        float distanceBlend = smoothstep(0.1, 0.8, (objectDistance / 2.5));
        curveAmount += windLeanAngle * heightFactor * distanceBlend;
        
        vec3 windLeanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir + vRandomFactor * 0.4);
        vec3 playerLeanAxis = cross(vec3(0.0, 1.0, 0.0), normalize(playerDirection + vec3(vRandomFactor * 0.2 - 0.1)));
        vec3 leanAxis = normalize(mix(playerLeanAxis, windLeanAxis, distanceBlend));
        
        vec3 leaningPosition = rotateAround(position, leanAxis, curveAmount);
        vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);
        
        vec4 worldPosition = finalWorld * vec4(leaningPosition, 1.0);
        vec4 viewPosition = view * worldPosition;
        gl_Position = projection * viewPosition;
        
        vPosition = position;
        normalMatrix = transpose(inverse(finalWorld));
        vNormal = leaningNormal;
        vWindInfluence = windEffect * heightFactor * windStrength;
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
        "windStrength",
      ],
      defines: ["#define INSTANCES"],
      samplers: ["perlinNoise"],
    }
  );

  const noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
  noiseTexture.animationSpeedFactor = 0;
  noiseTexture.brightness = 0.5;
  noiseTexture.octaves = 5;
  noiseTexture.persistence = 0.62;

  grassMaterial.backFaceCulling = false;
  grassMaterial.setVector3("lightDirection", light.direction);
  grassMaterial.setTexture("perlinNoise", noiseTexture);

  let timeCounter = 0;
  let animationFrameId: number | null = null;
  let observer: BABYLON.Observer<BABYLON.Scene> | null = null;

  const updateShaderParameters = () => {
    timeCounter += scene.getEngine().getDeltaTime() * 0.001;

    grassMaterial.setFloat("time", timeCounter);
    grassMaterial.setFloat("windStrength", strength);

    if (scene.activeCamera) {
      grassMaterial.setVector3("cameraPosition", scene.activeCamera.position);
    } else {
      grassMaterial.setVector3(
        "cameraPosition",
        new BABYLON.Vector3(0, 1.8, 0)
      );
    }

    if (player && player.position) {
      grassMaterial.setVector3("playerPosition", player.position);
    } else {
      grassMaterial.setVector3("playerPosition", new BABYLON.Vector3(0, 0, 0));
    }
  };

  const setupRenderLoop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    observer = scene.onBeforeRenderObservable.add(() => {
      try {
        updateShaderParameters();
      } catch (error) {
        console.warn("Error updating grass shader parameters:", error);

        if (scene.onBeforeRenderObservable && observer) {
          scene.onBeforeRenderObservable.remove(observer);
        }
      }
    });

    const animateLoop = () => {
      try {
        updateShaderParameters();
        animationFrameId = requestAnimationFrame(animateLoop);
      } catch (error) {
        console.warn("Fallback animation loop error:", error);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };

    animationFrameId = requestAnimationFrame(animateLoop);
  };

  setupRenderLoop();

  windControl.addEventListener("input", (event) => {
    try {
      const target = event.target as HTMLInputElement;
      if (target && target.value) {
        strength = parseFloat(target.value);
        const windSpeedMps = 10 + strength * 100;
        windSpeedDisplay.innerHTML = `Wind Speed: ${windSpeedMps.toFixed(
          1
        )} m/s`;
      }
    } catch (error) {
      console.warn("Error updating wind strength:", error);
    }
  });

  const initialWindSpeedMps = 10 + strength * 100;
  windSpeedDisplay.innerHTML = `Wind Speed: ${initialWindSpeedMps.toFixed(
    1
  )} m/s`;

  return grassMaterial;
}

export default createGrassMaterial;