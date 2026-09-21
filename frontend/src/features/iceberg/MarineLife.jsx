import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// A distant marine layer: transparent, depth-tested, always behind the iceberg.
export default function MarineLife({ time, quality }) {
  const layer = useRef();
  const material = useRef();
  useFrame(({ camera, size }) => {
    if (!layer.current || !material.current) return;
    const depth = Math.max(0, -camera.position.y);
    layer.current.visible = depth > .1;
    layer.current.position.copy(camera.position);
    layer.current.quaternion.copy(camera.quaternion);
    layer.current.translateZ(-170);
    const height = 340 * Math.tan(camera.fov * Math.PI / 360);
    layer.current.scale.set(height * size.width / size.height, height, 1);
    material.current.uniforms.time.value = time.value;
    material.current.uniforms.depth.value = depth;
    material.current.uniforms.aspect.value = size.width / size.height;
    material.current.uniforms.fishCount.value = Math.min(28, quality.fishSchoolCount * 14);
    material.current.uniforms.jellyCount.value = Math.min(2, quality.jellyfishCount);
    material.current.uniforms.detail.value = quality.tier === 'mobile-light' ? .5 : quality.tier === 'mobile-enhanced' ? 1 : 2;
  }, -1);
  return <mesh ref={layer} renderOrder={0}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial ref={material} transparent depthWrite={false}
      uniforms={{ time: { value: 0 }, depth: { value: 0 }, aspect: { value: 1 }, fishCount: { value: 28 }, jellyCount: { value: 2 }, detail: { value: 2 } }}
      vertexShader={`varying vec2 uvMarine; void main(){uvMarine=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`
        varying vec2 uvMarine;
        uniform float time, depth, aspect, fishCount, jellyCount, detail;
        float hash(float n){return fract(sin(n*127.1)*43758.5453);}
        float ellipse(vec2 p,vec2 r){return 1.-smoothstep(.8,1.,length(p/r));}
        void main(){
          vec2 uv=uvMarine;
          vec3 color=vec3(0.); float alpha=0.;
          float fishZone=smoothstep(14.,20.,depth)*(1.-smoothstep(31.,37.,depth));
          for(int i=0;i<28;i++){
            float n=float(i); float side=step(14.,n);
            if(n>=fishCount) continue;
            float individuality=hash(n+40.);
            float speed=mix(.012,.008,side);
            float travel=mod(time*speed+side*.63,1.55)-.25;
            float heading=mix(1.,-1.,side);
            // Cohesive, uneven school with a tapered formation and lagging individuals.
            float rank=hash(n+1.);
            vec2 center=vec2(mix(travel,1.-travel,side),mix(.64,.36,side));
            center.x+=heading*(rank-.5)*.20;
            center.y+=(hash(n+9.)-.5)*(.045+.09*rank);
            center.y+=sin(time*.17-rank*3.+side)*.008;
            center.x+=sin(time*.23+n)*.002;
            center.y+=(depth-24.)*mix(.003,.0015,side);
            vec2 p=uv-center; p.x*=aspect;p.x*=heading;
            float size=mix(.0045,.009,individuality)*mix(1.,.58,side);
            vec2 q=p/size;
            float beat=sin(time*(5.+individuality*2.)+n*2.4);
            // A pointed head, full shoulder and narrow caudal peduncle.
            float bodyWidth=.23*sqrt(max(0.,1.-pow((q.x-.06)/.98,2.)));
            bodyWidth*=smoothstep(-1.,-.35,q.x)*mix(1.,.65,smoothstep(.25,1.,q.x));
            float spine=beat*.07*pow(clamp(-q.x,0.,1.),2.);
            float body=(1.-smoothstep(bodyWidth-.025,bodyWidth+.035,abs(q.y-spine)))*step(-.98,q.x)*step(q.x,1.);
            float tailX=clamp((-q.x-.68)/.65,0.,1.);
            float tailY=q.y-beat*.19*tailX;
            float tailWidth=tailX*.34;
            float tail=(1.-smoothstep(tailWidth-.025,tailWidth+.025,abs(tailY)))*step(-1.33,q.x)*step(q.x,-.68);
            // Forked tail and small dorsal fin; no bright cartoon eyes.
            tail*=smoothstep(-1.36,-1.10+abs(tailY)*.42,q.x);
            float dorsal=(1.-smoothstep(.02,.07,abs(q.x+.10)))*smoothstep(.15,.22,q.y)*(1.-smoothstep(.32,.40,q.y));
            float shape=max(body,max(tail*.8,dorsal*.55))*fishZone*mix(.48,.26,side);
            float flank=exp(-pow((q.y+.035)*11.,2.))*body;
            vec3 fishColor=mix(vec3(.018,.05,.065),vec3(.06,.14,.16),flank*.55);
            color+=fishColor*shape;
            alpha=max(alpha,shape);
          }
          float jellyZone=smoothstep(47.,54.,depth)*(1.-smoothstep(63.,70.,depth));
          for(int i=0;i<2;i++){
            float n=float(i);
            if(n>=jellyCount) continue;
            vec2 center=vec2(mix(.17,.79,n),mix(.32,.68,n));
            center+=vec2(sin(time*.08+n*2.)*.016,sin(time*.12+n)*.024+(depth-62.)*.003);
            vec2 p=uv-center;p.x*=aspect;
            float s=mix(.018,.029,hash(n+80.));
            float pulse=1.+.09*sin(time*1.3+n*2.);
            vec2 bell=p/vec2(s*pulse,s*.7);
            float radius=length(bell);
            float dome=(1.-smoothstep(.9,1.,radius))*smoothstep(-.13,-.02,bell.y);
            float rim=exp(-pow((radius-.88)*15.,2.))*step(0.,bell.y);
            float ribs=pow(.5+.5*cos(atan(bell.x,bell.y)*8.),8.)*dome;
            float tentacles=0.;
            for(int j=0;j<5;j++){
              float k=float(j)-2.;
              float x=k*s*.25+sin(p.y*80.+time*.8+n+k)*s*.12;
              tentacles+=exp(-pow((p.x-x)/(s*.035),2.))*smoothstep(-s*3.,-s*.3,p.y)*(1.-smoothstep(-s*.1,0.,p.y));
            }
            float shape=(dome*.13+rim*.38+ribs*.12+tentacles*.22)*jellyZone;
            color+=vec3(.15,.53,.59)*shape;
            alpha=max(alpha,shape);
          }

          // Tiny rising air bubbles belong only to the shallow, recently submerged zone.
          float shallow=smoothstep(.2,3.,depth)*(1.-smoothstep(12.,20.,depth));
          for(int i=0;i<14;i++){
            float n=float(i);
            vec2 center=vec2(.06+hash(n+101.)*.88,fract(hash(n+102.)+time*mix(.012,.025,hash(n+103.))));
            center.x+=sin(time*.3+n)*.006;
            vec2 p=uv-center;p.x*=aspect;
            float r=mix(.0015,.0035,hash(n+104.));
            float ring=exp(-pow((length(p)-r)/(r*.22),2.));
            float shape=ring*.28*shallow;
            color+=vec3(.12,.30,.34)*shape;alpha=max(alpha,shape);
          }
          // Sparse angular ice chips rise slowly through the sediment zone.
          float fragmentZone=smoothstep(30.,36.,depth)*(1.-smoothstep(47.,54.,depth));
          for(int i=0;i<5;i++){
            float n=float(i);
            vec2 center=vec2(.09+hash(n+141.)*.82,.12+hash(n+142.)*.72);
            center+=vec2(sin(time*.035+n)*.025,sin(time*.06+n)*.04+(depth-42.)*.009);
            vec2 p=uv-center;p.x*=aspect;
            float angle=n*2.+time*.025;
            p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
            float size=mix(.004,.011,hash(n+143.));
            float edge=abs(p.x/size)+abs((p.y+p.x*.3)/(size*1.7));
            float shape=(1.-smoothstep(.85,1.,edge))*fragmentZone*.38;
            vec3 tint=mix(vec3(.04,.11,.15),vec3(.16,.27,.30),step(p.x,p.y*.4));
            color+=tint*shape;alpha=max(alpha,shape);
          }
          // Plankton clusters give way to only a few distant, slowly pulsing organisms.
          float planktonZone=smoothstep(47.,53.,depth)*(1.-smoothstep(64.,70.,depth));
          float abyssZone=smoothstep(64.,71.,depth);
          for(int i=0;i<22;i++){
            float n=float(i);
            if(detail<.75 && n>=10.) continue;
            vec2 center=vec2(.06+hash(n+201.)*.88,.08+hash(n+202.)*.84);
            center+=vec2(sin(time*.09+n)*.009,cos(time*.07+n)*.012+(depth-60.)*.003);
            vec2 p=uv-center;p.x*=aspect;
            float far=step(18.,n);
            float zone=mix(planktonZone,abyssZone,far);
            float radius=mix(.0012,.0028,hash(n+203.));
            float pulse=pow(.5+.5*sin(time*.65+n*2.7),3.);
            float core=exp(-dot(p,p)/(radius*radius));
            float halo=exp(-dot(p,p)/(radius*radius*12.));
            float shape=(core*.5+halo*.06)*(.2+.8*pulse)*zone;
            color+=vec3(.08,.48,.43)*shape;alpha=max(alpha,shape);
          }
          if(alpha<.002)discard;
          gl_FragColor=vec4(color/max(alpha,.001),alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `} />
  </mesh>;
}
