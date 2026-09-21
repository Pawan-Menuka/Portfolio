import { Color, DataTexture, EquirectangularReflectionMapping, FloatType, MeshPhysicalMaterial, MeshStandardMaterial, RGBAFormat } from 'three';

// A small linear HDR sky: cold horizon fill and a broad overhead light source.
export function createIceEnvironment() {
  const width = 128, height = 64, data = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const elevation = Math.sin((y / (height - 1) - .5) * Math.PI);
    const light = Math.exp(-((x / width - .23) ** 2 / .012 + (y / height - .78) ** 2 / .018)) * 3;
    const fill = .035 + Math.max(0, elevation) * .3;
    const i = (y * width + x) * 4;
    data.set([fill * .55 + light * .8, fill * .8 + light * .94, fill + light, 1], i);
  }
  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

export function applyIceMaterials(scene, time, quality = { tier: 'desktop-full', transmissionSamples: 6 }) {
  scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    const submerged = mesh.name === 'ice_below';
    const old = mesh.material;
    const lightweight = quality.tier === 'mobile-light';
    const Material = lightweight ? MeshStandardMaterial : MeshPhysicalMaterial;
    const material = new Material({
      color: submerged ? '#80c5d5' : '#e1f0f5',
      roughness: lightweight ? .4 : submerged ? .28 : .23, metalness: 0, flatShading: true,
      envMapIntensity: lightweight ? .35 : .65,
      ...(!lightweight && {
        transmission: submerged ? .32 : .18, thickness: submerged ? 8 : 2.4,
        ior: 1.31, attenuationColor: new Color(submerged ? '#318ba5' : '#a3dbe8'),
        attenuationDistance: submerged ? 18 : 10, clearcoat: .12, clearcoatRoughness: .3,
      }),
    });
    material.onBeforeCompile = shader => {
      shader.uniforms.iceTime = time;
      shader.vertexShader = 'varying vec3 vIceWorld;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvIceWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
      shader.fragmentShader = 'varying vec3 vIceWorld;\nuniform float iceTime;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float depth = max(-vIceWorld.y, 0.0);
        float waterFraction = cameraPosition.y < 0.0 ? 1.0 : clamp(depth / max(cameraPosition.y + depth, .001), 0.0, 1.0);
        float waterDistance = distance(cameraPosition, vIceWorld) * waterFraction;
        float haze = 1.0 - exp(-waterDistance * (.004 + depth * .00006));
        vec3 waterColor = mix(vec3(.002, .018, .025), vec3(.0007, .0025, .009), smoothstep(10.0, 75.0, depth));
        ${submerged ? `
          // Optical thickness is approximate; geometry and vertex normals stay intact.
          float body = clamp(1.0 - length(vIceWorld.xz) / 32.0, .15, 1.0);
          outgoingLight *= mix(vec3(.76, .95, 1.0), vec3(.25, .62, .75), body * .42);
          // Approximate spectral absorption: red fades first, then green.
          // Use each fragment's actual depth so the ice has a continuous gradient.
          vec3 downwelling = exp(-depth * vec3(.034, .019, .012));
          vec3 viewTransmission = exp(-waterDistance * vec3(.009, .0035, .0018));
          outgoingLight *= (vec3(.08, .10, .13) + .87 * downwelling) * viewTransmission;
          float caustic = pow(.5 + .5 * sin(vIceWorld.x * .75 + sin(vIceWorld.z * .63 + iceTime * .25) * 2.0 + iceTime * .18), 12.0);
          outgoingLight += vec3(.006, .016, .019) * caustic * exp(-depth * .18);
          float rim = pow(1.0 - abs(dot(normal, geometryViewDir)), 3.0);
          // Restrained blue edge fill preserves the silhouette in the night scene.
          outgoingLight += vec3(.001, .008, .016) * rim * smoothstep(28.0, 78.0, depth);
        ` : ''}
        outgoingLight = mix(outgoingLight, waterColor, clamp(haze, 0.0, .78));
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey = () => `ice-optics-v3-${submerged}-${quality.tier}-${quality.transmissionSamples}`;
    mesh.material = material;
    for (const entry of Array.isArray(old) ? old : [old]) entry.dispose();
  });
}
