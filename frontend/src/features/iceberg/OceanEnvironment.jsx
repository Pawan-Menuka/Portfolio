import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, DoubleSide } from 'three';
import { createIceEnvironment } from './ice-materials.js';
import { createOceanSurface } from './ocean-surface.js';
import MarineLife from './MarineLife.jsx';

function Surface({ time }) {
  const group = useRef();
  useEffect(() => {
    const surface = createOceanSurface(time);
    const parent = group.current;
    parent.add(surface.water);
    return () => { parent.remove(surface.water); surface.dispose(); };
  }, [time]);
  useFrame(({ camera }) => { if (group.current) group.current.visible = camera.position.y > .08; }, -1);
  return <group ref={group} />;
}

export default function OceanEnvironment({ time, quality }) {
  const { scene, camera } = useThree();
  useEffect(() => {
    const environment = createIceEnvironment();
    const previous = scene.environment;
    // oxlint-disable-next-line react/immutability -- Three.js scene properties are imperative resources.
    scene.environment = environment;
    return () => { scene.environment = previous; environment.dispose(); };
  }, [scene]);
  const uniforms = useMemo(() => ({ oceanTime: time, viewDepth: { value: 0 } }), [time]);
  const backgroundMaterial = useRef();
  const surfaceMaterial = useRef();
  const particleMaterial = useRef();
  useFrame(() => {
    // Update the material-owned uniforms rather than relying on the JSX input object.
    for (const ref of [backgroundMaterial, surfaceMaterial, particleMaterial]) {
      if (!ref.current) continue;
      ref.current.uniforms.viewDepth.value = Math.max(0, -camera.position.y);
      ref.current.uniforms.oceanTime.value = time.value;
    }
  }, -1);
  const particles = useMemo(() => {
    const values = new Float32Array(quality.marineSnowCount * 3);
    let seed = 2809;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < values.length; i += 3) values.set([(random() - .5) * 180, -random() * 96, (random() - .5) * 180], i);
    return values;
  }, [quality.marineSnowCount]);
  return <>
    <Surface time={time} />
    <MarineLife time={time} quality={quality} />
    <mesh scale={450} renderOrder={-10}>
      <sphereGeometry args={[1, quality.tier === 'mobile-light' ? 16 : 32, quality.tier === 'mobile-light' ? 8 : 16]} />
      <shaderMaterial ref={backgroundMaterial} side={BackSide} depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec3 direction; uniform float viewDepth; uniform float oceanTime;
          float auroraHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float auroraNoise(vec2 p){
            vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
            return mix(mix(auroraHash(i),auroraHash(i+vec2(1.,0.)),f.x),mix(auroraHash(i+vec2(0.,1.)),auroraHash(i+vec2(1.,1.)),f.x),f.y);
          }
          float auroraFbm(vec2 p){return .57*auroraNoise(p)+.28*auroraNoise(p*2.13+7.4)+.15*auroraNoise(p*4.71-3.2);}
          void main(){ float y=normalize(direction).y; float haze=exp(-abs(y)*14.);
            vec3 d=normalize(direction);
            float cloud=.5+.5*sin(d.x*9.+sin(d.z*13.)+oceanTime*.015);
            vec3 sky=mix(vec3(.003,.009,.016),vec3(.012,.038,.049),haze);
            sky+=vec3(.003,.008,.011)*cloud*exp(-abs(y-.12)*8.);
            vec3 baseSky=sky;
            float aboveSurface=smoothstep(0.,1.5,cameraPosition.y);
            float skyAngle=atan(d.x,d.z);
            float skyFade=smoothstep(.025,.16,y);
            // World-direction noise avoids a repeated ring or an azimuth seam.
            vec2 auroraDomain=d.xz*3.8+vec2(oceanTime*.009,-oceanTime*.006);
            float warp=auroraFbm(auroraDomain*.83+vec2(2.3,8.1));
            vec2 folded=auroraDomain+vec2(warp*1.6,auroraNoise(auroraDomain+13.)*.8);
            for(int layer=0;layer<2;layer++){
              float layerId=float(layer);
              vec2 p=folded+vec2(9.7,4.1)*layerId;
              float ridge=.11+layerId*.11+auroraFbm(p)*.29;
              float thickness=mix(.008,.027,auroraNoise(p*1.7+5.));
              float height=mix(.045,.18,auroraNoise(p*.9-6.));
              float above=y-ridge;
              float edge=exp(-pow(above/thickness,2.));
              float veil=smoothstep(-.008,.018,above)*exp(-max(above,0.)/height);
              float folds=auroraNoise(p*vec2(19.,23.)+vec2(above*3.,oceanTime*.014));
              float broken=smoothstep(.30,.68,auroraFbm(p*.73+19.));
              float intensity=broken*(edge*.34+veil*(.07+.25*folds))*(1.-layerId*.4)*skyFade;
              vec3 tint=mix(vec3(.009,.12,.067),vec3(.03,.022,.065),smoothstep(.04,.2,above));
              sky+=tint*intensity;
            }
            // Underwater receives only broad scattered color, never curtain edges.
            float diffuseAurora=auroraNoise(d.xz*1.8+vec2(oceanTime*.006,4.2));
            vec3 auroraGlow=vec3(.004,.022,.018)*diffuseAurora*smoothstep(-.1,.65,y)*exp(-viewDepth*.055);
            sky=mix(baseSky+auroraGlow,sky,aboveSurface);
            vec2 starGrid=vec2(skyAngle*90.,y*150.);
            vec2 cell=floor(starGrid);
            float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
            vec2 starPosition=vec2(fract(seed*71.3),fract(seed*43.7));
            float star=1.-smoothstep(.015,.11,length(fract(starGrid)-starPosition));
            sky+=vec3(.35,.46,.55)*star*step(.985,seed)*skyFade*(.8+.2*sin(oceanTime*.35+seed*60.))*aboveSurface;
            // Night descent: diffuse surface spill dies away before the deep zones.
            float middle=smoothstep(10.,38.,viewDepth);
            float deep=smoothstep(38.,68.,viewDepth);
            float calm=smoothstep(68.,84.,viewDepth);
            vec3 water=mix(vec3(.002,.018,.025),vec3(.0015,.008,.020),middle);
            water=mix(water,vec3(.0007,.0025,.009),deep);
            water*=mix(1.,.65,calm);
            float overhead=smoothstep(-.35,.9,y);
            float surfaceSpill=exp(-viewDepth*.12);
            water+=vec3(.004,.022,.024)*overhead*surfaceSpill;
            water+=auroraGlow*surfaceSpill*.35;
            // Broad, low-contrast suspended layers, without directional beams.
            float suspended=auroraFbm(d.xz*3.+vec2(y*5.,oceanTime*.008));
            float sedimentZone=smoothstep(29.,36.,viewDepth)*(1.-smoothstep(48.,56.,viewDepth));
            water+=vec3(.003,.012,.016)*smoothstep(.32,.75,suspended)*sedimentZone;
            gl_FragColor=vec4(mix(sky,water,smoothstep(0.,5.,viewDepth)),1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.05, 0]} renderOrder={2}>
      <planeGeometry args={[800, 800]} />
      <shaderMaterial ref={surfaceMaterial} side={DoubleSide} transparent depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec3 world; void main(){world=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`}
        fragmentShader={`varying vec3 world; uniform float viewDepth; uniform float oceanTime;
          void main(){if(cameraPosition.y>0.) discard; float ripple=.5+.5*sin(world.x*.38+sin(world.z*.32+oceanTime*.2));
            float alpha=.16*exp(-viewDepth*.12)*exp(-length(world.xz)*.006); gl_FragColor=vec4(vec3(.035,.12,.14)*( .75+ripple*.25),alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
    <points frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
      <shaderMaterial ref={particleMaterial} transparent depthWrite={false} uniforms={uniforms}
        vertexShader={`uniform float oceanTime; uniform float viewDepth; varying float fade; varying float luminous;
          void main(){
            float seed=fract(sin(dot(position,vec3(12.9898,78.233,37.719)))*43758.5453);
            vec3 p=position; p.y=-mod(-p.y+oceanTime*mix(.045,.16,seed),96.);
            p.x+=sin(oceanTime*.09+p.z*.06)*1.4;
            p.z+=cos(oceanTime*.065+p.x*.05)*.8;
            vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
            float depth=-mv.z;
            float nearLayer=1.-smoothstep(15.,45.,depth);
            float farLayer=smoothstep(65.,130.,depth);
            luminous=step(.965,seed)*smoothstep(48.,68.,viewDepth)*smoothstep(40.,58.,-p.y);
            gl_PointSize=clamp(mix(140.,260.,seed)/max(depth,1.),1.2,5.)+luminous*3.;
            fade=smoothstep(3.,12.,depth)*exp(-depth*.009)*mix(.25,.5,seed);
            fade*=mix(1.,.45,nearLayer)*mix(1.,.55,farLayer);
            fade*=mix(.65,.12,smoothstep(18.,70.,viewDepth));
            fade+=luminous*(.2+.12*sin(oceanTime*.5+seed*40.))*smoothstep(3.,14.,depth)*exp(-depth*.018);
          }`}
        fragmentShader={`varying float fade; varying float luminous; void main(){float r=length(gl_PointCoord-.5); gl_FragColor=vec4(mix(vec3(.38,.7,.78),vec3(.24,.92,.78),luminous),fade*(1.-smoothstep(.02,.5,r)));}`} />
    </points>
    <pointLight position={[4, -72, 5]} color="#4fc4de" intensity={38} distance={30} decay={1.4} />
  </>;
}
