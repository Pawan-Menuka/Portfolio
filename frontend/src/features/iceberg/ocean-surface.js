import { Color, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Refractor } from 'three/addons/objects/Refractor.js';

// Retain both helpers explicitly so every offscreen target can be disposed.
export function createOceanSurface(time) {
  const geometry = new PlaneGeometry(1400, 1400);
  const options = { textureWidth: 256, textureHeight: 256, multisample: 0, clipBias: .002 };
  const reflector = new Reflector(geometry, options);
  const refractor = new Refractor(geometry, options);
  reflector.matrixAutoUpdate = refractor.matrixAutoUpdate = false;
  const matrix = new Matrix4();
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { oceanTime: time, textureMatrix: { value: matrix }, reflectionMatrix: reflector.material.uniforms.textureMatrix, reflection: { value: reflector.getRenderTarget().texture }, refraction: { value: refractor.getRenderTarget().texture }, tint: { value: new Color('#8bc1ce') } },
    vertexShader: `varying vec3 vWorld; varying vec4 vCoord; varying vec4 vReflection; uniform mat4 textureMatrix; uniform mat4 reflectionMatrix;
      void main() { vWorld=(modelMatrix*vec4(position,1.)).xyz; vCoord=textureMatrix*vec4(position,1.); vReflection=reflectionMatrix*vec4(position,1.); gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.); }`,
    fragmentShader: `uniform float oceanTime; uniform sampler2D reflection; uniform sampler2D refraction; uniform vec3 tint;
      varying vec3 vWorld; varying vec4 vCoord; varying vec4 vReflection;
      void main() {
        vec2 p=vWorld.xz;
        float a=p.x*.62+p.y*.26+oceanTime*.85;
        float b=p.x*.18-p.y*.72-oceanTime*.63;
        float c=length(p-vec2(3.,-2.))*.85-oceanTime*1.05;
        float localRipple=exp(-length(p)*.018);
        vec2 ripple=vec2(sin(a)+.6*sin(b),cos(b)+.45*sin(a*.7));
        ripple+=.35*sin(c)*normalize(p-vec2(3.,-2.)+vec2(.001))*localRipple;
        vec3 n=normalize(vec3(ripple.x*.045,1.,ripple.y*.045));
        vec3 eye=normalize(cameraPosition-vWorld);
        float fresnel=.02+.98*pow(1.-max(dot(n,eye),0.),5.);
        vec2 uv=vCoord.xy/vCoord.w + ripple*.0025;
        vec3 reflected=texture2D(reflection,vReflection.xy/vReflection.w+ripple*.0025).rgb;
        vec3 refracted=texture2D(refraction,uv).rgb;
        vec3 color=mix(refracted*tint,reflected,clamp(fresnel,.04,.82));
        float glint=pow(max(dot(reflect(-normalize(vec3(-.4,.8,.2)),n),eye),0.),100.);
        color+=vec3(.18,.32,.38)*glint;
        // Soft moving crests catch the cold ambient sky light, without white foam.
        float crest=pow(.5+.5*sin(a+.5*sin(b)),10.);
        color+=vec3(.012,.030,.034)*crest*localRipple;
        float horizon=1.-exp(-length(p)/380.);
        color=mix(color,vec3(.012,.048,.064),horizon*.65);
        gl_FragColor=vec4(color,.68);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.position.y = .025;
  water.renderOrder = 1;
  const position = new Vector3();
  water.onBeforeRender = (renderer, scene, camera) => {
    material.uniforms.oceanTime.value = time.value;
    if (camera.getWorldPosition(position).y <= .03) return;
    matrix.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
    matrix.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(water.matrixWorld);
    water.visible = false;
    try {
      reflector.matrixWorld.copy(water.matrixWorld);
      refractor.matrixWorld.copy(water.matrixWorld);
      reflector.getReflectionCamera(camera).layers.set(0);
      reflector.onBeforeRender(renderer, scene, camera);
      refractor.onBeforeRender(renderer, scene, camera);
    } finally { water.visible = true; }
  };
  return { water, dispose() { reflector.dispose(); refractor.dispose(); geometry.dispose(); material.dispose(); } };
}
