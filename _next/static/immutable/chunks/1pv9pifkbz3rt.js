(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,75415,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(75056),n=e.i(94800),u=e.i(48546),i=e.i(90072);let s=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,o=`
  uniform sampler2D uPrev;
  uniform vec2 uFrom;
  uniform vec2 uTo;
  uniform float uAspect;
  uniform float uDecay;
  uniform float uDraw;
  uniform float uRadius;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float v = texture2D(uPrev, vUv).r * uDecay;
    if (uDraw > 0.5) {
      // In screen heights, so the stroke is round whatever the shape of the screen.
      vec2 k = vec2(uAspect, 1.0);
      vec2 p = vUv * k;
      vec2 a = uFrom * k;
      vec2 ab = uTo * k - a;
      float len2 = dot(ab, ab);
      float h = len2 > 1e-8 ? clamp(dot(p - a, ab) / len2, 0.0, 1.0) : 0.0;
      float d = length(p - a - ab * h);
      v += smoothstep(uRadius, 0.0, d) * uStrength;
    }
    // Capped: a spot crossed again and again would otherwise take ever longer
    // to fade back.
    gl_FragColor = vec4(min(v, 1.2), 0.0, 0.0, 1.0);
  }
`;var l=e.i(10024);let v=`
  uniform sampler2D uTrail;
  uniform vec2 uLens;
  uniform float uLensR;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;

  float lensHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float lensNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(lensHash(i), lensHash(i + vec2(1.0, 0.0)), u.x),
               mix(lensHash(i + vec2(0.0, 1.0)), lensHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 scale = vec2(uAspect, 1.0);
    vec2 delta = vUv * scale - uLens * scale;
    float blob = uLensR > 0.001 ? exp(-dot(delta, delta) / (uLensR * uLensR)) : 0.0;
    float field = blob + texture2D(uTrail, vUv).r * 1.3;
    float mask = 0.0;

    if (field > 0.28) {
      float t = uTime * 0.35;
      float wobble = lensNoise(vUv * scale * 6.0 + vec2(t, -t * 0.8)) * 0.65
        + lensNoise(vUv * scale * 13.0 - vec2(t * 1.3, t)) * 0.35;
      float liquid = field + (wobble - 0.5) * 0.22;
      float antiAlias = 1.5 * fwidth(liquid);
      mask = smoothstep(0.5 - antiAlias, 0.5 + antiAlias, liquid);
    }

    // White, premultiplied: the canvas is laid over the hero with
    // mix-blend-mode: difference, so white turns whatever is under the drop
    // to its negative - black SERVICES to white, white paper to black - as
    // the About hero's lens does. (It was black: a dark blot, not a lens.)
    gl_FragColor = vec4(vec3(mask), mask);
  }
`;function c(e,t){return new i.WebGLRenderTarget(e,t,{type:i.HalfFloatType,format:i.RGBAFormat,minFilter:i.LinearFilter,magFilter:i.LinearFilter,depthBuffer:!1,stencilBuffer:!1})}function d(){let e=(0,u.useThree)(e=>e.gl),r=(0,u.useThree)(e=>e.size),l=(0,u.useThree)(e=>e.viewport.dpr),d=Math.max(2,Math.round(r.width*l)),m=Math.max(2,Math.round(r.height*l)),f=r.width/Math.max(r.height,1),[h,p]=(0,a.useState)(!1),g=(0,a.useRef)({x:.5,y:.5,lastX:NaN,lastY:NaN,movedAt:-1/0,inside:!1}),w=(0,a.useRef)(0),x=(0,a.useRef)(0),T=(0,a.useMemo)(()=>{let e=Math.max(2,Math.round(.5*d)),t=Math.max(2,Math.round(.5*m));return[c(e,t),c(e,t)]},[d,m]),b=(0,a.useMemo)(()=>{let e=new i.ShaderMaterial({vertexShader:s,fragmentShader:o,depthTest:!1,depthWrite:!1,uniforms:{uPrev:{value:null},uFrom:{value:new i.Vector2},uTo:{value:new i.Vector2},uAspect:{value:1},uDecay:{value:1},uDraw:{value:0},uRadius:{value:.085},uStrength:{value:.48}}}),t=new i.Scene,a=new i.Mesh(new i.PlaneGeometry(2,2),e);return t.add(a),{scene:t,mesh:a,material:e,camera:new i.OrthographicCamera(-1,1,1,-1,0,1)}},[]),y=(0,a.useMemo)(()=>new i.ShaderMaterial({vertexShader:s,fragmentShader:v,transparent:!0,depthTest:!1,depthWrite:!1,uniforms:{uTrail:{value:null},uLens:{value:new i.Vector2(.5,.5)},uLensR:{value:0},uAspect:{value:1},uTime:{value:0}}}),[]);return(0,a.useEffect)(()=>{let e=window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"),t=()=>p(e.matches);return t(),e.addEventListener("change",t),()=>e.removeEventListener("change",t)},[]),(0,a.useEffect)(()=>{if(!h)return;let t=e.domElement,a=e=>{let a=t.getBoundingClientRect();if(!a.width||!a.height)return;let r=(e.clientX-a.left)/a.width,n=1-(e.clientY-a.top)/a.height,u=g.current;u.inside=r>=0&&r<=1&&n>=0&&n<=1,u.inside&&(u.x=r,u.y=n,u.movedAt=performance.now())},r=()=>{g.current.inside=!1,g.current.lastX=NaN,g.current.lastY=NaN};return window.addEventListener("pointermove",a,{passive:!0}),document.documentElement.addEventListener("pointerleave",r),()=>{window.removeEventListener("pointermove",a),document.documentElement.removeEventListener("pointerleave",r)}},[e,h]),(0,a.useEffect)(()=>{let t=e.getRenderTarget();for(let t of T)e.setRenderTarget(t),e.clear();return e.setRenderTarget(t),()=>T.forEach(e=>e.dispose())},[e,T]),(0,a.useEffect)(()=>()=>{b.mesh.geometry.dispose(),b.material.dispose(),y.dispose()},[y,b]),(0,n.useFrame)((t,a)=>{let r=Math.min(a,.05);x.current+=r;let n=g.current,u=T[w.current],i=T[1-w.current],s=h&&performance.now()-n.movedAt<120&&(Number.isNaN(n.lastX)||n.x!==n.lastX||n.y!==n.lastY),o=b.material.uniforms;o.uPrev.value=u.texture,o.uAspect.value=f,o.uDecay.value=Math.pow(.1608066690215766,r),o.uDraw.value=+!!s,s&&(o.uFrom.value.set(Number.isNaN(n.lastX)?n.x:n.lastX,Number.isNaN(n.lastY)?n.y:n.lastY),o.uTo.value.set(n.x,n.y),n.lastX=n.x,n.lastY=n.y);let l=e.getRenderTarget();e.setRenderTarget(i),e.clear(),e.render(b.scene,b.camera),e.setRenderTarget(l),w.current=1-w.current;let v=1-Math.pow(.89,60*r),c=1-Math.pow(.9,60*r);y.uniforms.uTrail.value=i.texture,y.uniforms.uAspect.value=f,y.uniforms.uTime.value=x.current,y.uniforms.uLens.value.x+=(n.x-y.uniforms.uLens.value.x)*v,y.uniforms.uLens.value.y+=(n.y-y.uniforms.uLens.value.y)*v,y.uniforms.uLensR.value+=((h&&n.inside?.15:0)-y.uniforms.uLensR.value)*c}),(0,t.jsx)("mesh",{frustumCulled:!1,material:y,children:(0,t.jsx)("planeGeometry",{args:[2,2]})})}e.s(["ServicesLiquidLens",0,function({active:e}){return(0,t.jsx)(r.Canvas,{flat:!0,frameloop:e?"always":"never",dpr:[1,(0,l.isPhone)()?1.3:1.5],resize:{scroll:!1},gl:{alpha:!0,antialias:!1,powerPreference:"high-performance"},onCreated:({gl:e})=>e.setClearColor(0,0),style:{height:"100%",pointerEvents:"none",width:"100%"},children:(0,t.jsx)(d,{})})}],75415)},92579,function(e){e.n(e.i(75415))}]);