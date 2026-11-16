(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,87584,e=>{"use strict";var t=e.i(43476),a=e.i(71645),l=e.i(75056),r=e.i(48546),i=e.i(89970),n=e.i(83495),o=e.i(72588),s=e.i(81784),u=e.i(94389),c=e.i(10038),f=e.i(4058),d=e.i(94800);let h=new Set;function v(){return(0,d.useFrame)(({gl:e,scene:t,camera:a,size:l})=>{e.autoClear=!1,e.setScissorTest(!1),e.setViewport(0,0,l.width,l.height),e.clear(!0,!0,!1),e.render(t,a),h.forEach(t=>{let a=(0,c.getStageElement)(t.name);if(!a)return;let r=a.getBoundingClientRect();if(r.width<=0||r.height<=0)return;let i=Math.min(r.bottom,(0,c.getStageCoverTop)(t.name)),n=Math.max(r.top,r.bottom-r.height*(0,c.getStageReveal)(t.name));if(i<=Math.max(n,0)||r.top>=l.height)return;e.setViewport(r.left,l.height-r.bottom,r.width,r.height),e.setScissor(r.left,l.height-i,r.width,i-n),e.setScissorTest(!0);let o=r.width/r.height;t.camera.aspect!==o&&(t.camera.aspect=o,t.camera.updateProjectionMatrix()),e.clearDepth();let s=e.toneMapping;void 0!==t.toneMapping&&(e.toneMapping=t.toneMapping),e.render(t.scene,t.camera),e.toneMapping=s}),e.setScissorTest(!1),e.setViewport(0,0,l.width,l.height),e.autoClear=!0},1),null}var m=e.i(90072),p=e.i(10024);function g(e){let t=Math.min(3,Math.max(.5,e||1.6)),a=(0,p.isPhone)()?900:1600;return{width:a,height:Math.round(a/t)}}let w=[{page:"#101114",ink:"#f3f1ec",accent:"#4a6fa5",panel:"#1e2026"},{page:"#efe7da",ink:"#1d1b18",accent:"#2f5d50",panel:"#e0d5c3"},{page:"#e9eef6",ink:"#14213d",accent:"#3a6df0",panel:"#d6dfee"},{page:"#f4f1ea",ink:"#232019",accent:"#8a7a52",panel:"#e7e0d2"},{page:"#17120f",ink:"#f1e9dd",accent:"#6f7f86",panel:"#2a221d"}];function y(e,t,a,l,r,i){e.beginPath(),e.moveTo(t+i,a),e.arcTo(t+l,a,t+l,a+r,i),e.arcTo(t+l,a+r,t,a+r,i),e.arcTo(t,a+r,t,a,i),e.arcTo(t,a,t+l,a,i),e.closePath()}let x=`
  uniform float uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // The middle leads and the edges drag: scrolling down lifts the page, so
    // the centre of the card sits low for a moment and springs back.
    float across = sin(uv.x * 3.14159265);
    p.y -= across * uVelocity * 0.08;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`,S=`
  uniform sampler2D uTex;
  uniform vec2  uPlane;
  uniform vec2  uImage;
  uniform vec2  uMouse;
  uniform float uHover;
  uniform float uReveal;
  uniform float uVelocity;
  uniform float uTime;
  uniform vec3  uPaper;
  uniform float uRadius;
  uniform float uShade;
  varying vec2 vUv;

  const float R = 0.26;

  // object-fit: cover, around the centre.
  vec2 cover(vec2 uv, float zoom) {
    float planeAspect = uPlane.x / uPlane.y;
    float imageAspect = uImage.x / uImage.y;
    vec2 s = planeAspect > imageAspect
      ? vec2(1.0, imageAspect / planeAspect)
      : vec2(planeAspect / imageAspect, 1.0);
    return (uv - 0.5) * s / zoom + 0.5;
  }

  float roundedBox(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float aspect = uPlane.x / uPlane.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);

    // ---- the fold, as in GRADE_FRAG, run backwards ----------------------
    vec2 dir = normalize(vec2(aspect, -1.0));
    float sMin = dot(vec2(0.0, 1.0), dir);
    float sMax = dot(vec2(aspect, 0.0), dir);
    float curl = 1.0 - uReveal;
    float crease = mix(sMax, sMin, curl);
    float d = dot(p, dir) - crease;
    // Not laid down yet: the paper behind shows through.
    if (d > 0.0) discard;

    float t = -d;
    float k = clamp(t / R, 0.0, 1.0);
    float bend = R * (1.0 - cos(k * 1.5707963));
    vec2 q = p + dir * (2.0 * t + bend);
    bool flap = curl > 0.0005
      && q.x >= 0.0 && q.x <= aspect && q.y >= 0.0 && q.y <= 1.0;

    vec3 col;
    float edge;
    if (flap) {
      // The back of the card. A shade DARKER than the paper, not the paper
      // itself: a flap the colour of the page it lies on read as a smudge
      // rather than a sheet. Darker inside the roll, with a highlight along
      // the curve where it catches the light, and a rim at its own edge.
      vec3 back = mix(uPaper, vec3(0.05, 0.045, 0.04), 0.1);
      float shade = 0.84 + 0.16 * smoothstep(0.0, 1.0, k);
      col = back * shade;
      col += vec3(0.06) * pow(1.0 - abs(k * 2.0 - 1.0), 3.0);
      vec2 qp = q * uPlane.y;
      edge = roundedBox(qp - uPlane * 0.5, uPlane * 0.5, uRadius);
      col *= 1.0 - 0.16 * smoothstep(-3.0, -0.5, edge);
    } else {
      vec2 uv = vUv;
      vec2 m = (vUv - uMouse) * vec2(aspect, 1.0);
      float lens = exp(-dot(m, m) * 14.0) * uHover;
      uv -= (vUv - uMouse) * lens * 0.18;
      vec2 tuv = cover(uv, 1.0 + 0.05 * uHover);

      float split = abs(uVelocity) * 0.012 + lens * 0.006;
      col.r = texture2D(uTex, tuv + vec2(split, 0.0)).r;
      col.g = texture2D(uTex, tuv).g;
      col.b = texture2D(uTex, tuv - vec2(split, 0.0)).b;

      // The flap's shadow on the card beneath it, only while there is a flap.
      col *= 1.0 - 0.22 * exp(-t / (R * 0.45)) * smoothstep(0.0, 0.02, curl);

      // Grain, so even flat colour reads as printed rather than filled.
      col += (hash(vUv * uPlane + fract(uTime) * 91.7) - 0.5) * 0.025;

      edge = roundedBox(vUv * uPlane - uPlane * 0.5, uPlane * 0.5, uRadius);
    }

    col *= uShade;
    float alpha = 1.0 - smoothstep(-1.0, 0.5, edge);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`,b=null,T=(e,t,a,l)=>e+(t-e)*(1-Math.exp(-l*a));function M(e){return e.width<=0||e.height<=0?null:{aspect:Math.round(e.width/e.height*20)/20,width:40*Math.round(e.width/40)}}function R(){let e=(0,c.useWorkItems)();return(0,t.jsx)(t.Fragment,{children:e.map(e=>(0,t.jsx)(P,{item:e},e.id))})}function P({item:e}){let l=(0,a.useRef)(null),i=(0,r.useThree)(e=>e.size),n=(0,a.useMemo)(()=>new m.ShaderMaterial({vertexShader:x,fragmentShader:S,uniforms:{uTex:{value:null},uImage:{value:new m.Vector2(16,10)},uPlane:{value:new m.Vector2(1,1)},uMouse:{value:new m.Vector2(.5,.5)},uHover:{value:0},uReveal:{value:0},uVelocity:{value:0},uTime:{value:0},uPaper:{value:new m.Color("#ffffff")},uRadius:{value:0},uShade:{value:1}},transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1}),[]);(0,a.useEffect)(()=>()=>n.dispose(),[n]);let[o,s]=(0,a.useState)(()=>M(e.rect)??{aspect:1.6,width:800}),u=(0,a.useRef)(o),[f,h]=(0,a.useState)(!1),v=(0,a.useRef)(!1);(0,a.useEffect)(()=>{let t;if(!f)return;let{project:a,index:l}=e,r=o.aspect<1&&a.imagePortrait?a.imagePortrait:a.image;if(r)(t=new m.TextureLoader().load(r,e=>{let t=e.image;n.uniforms.uImage.value.set(t.naturalWidth||t.width,t.naturalHeight||t.height)})).colorSpace=m.SRGBColorSpace,t.anisotropy=8;else{t=function(e,t){let{width:a,height:l}=g(t),r=document.createElement("canvas");r.width=a,r.height=l;let i=r.getContext("2d");i&&function(e,t,a,l){let r,i=w[t%w.length],n=(r=97+53*t,()=>((r=0x41c64e6d*r+12345&0x7fffffff)>>>8)/8388608),o=Math.min(a,l)/100,s=l>a;e.fillStyle=i.page,e.fillRect(0,0,a,l);let u=7*o,c=0+6*o;if(e.fillStyle=i.ink,y(e,0+u,c,9*o,3*o,1.5*o),e.fill(),!s){for(let t=0;t<3;t++)e.globalAlpha=.55,e.fillRect(0+.46*a+11*t*o,c+ +o,7*o,1.2*o);e.globalAlpha=1}e.fillStyle=i.accent,y(e,0+a-u-13*o,c-.8*o,13*o,4.6*o,2.3*o),e.fill();let f=0+18*o,d=s?a-2*u:.46*a;e.fillStyle=i.ink;for(let t=0;t<3;t++){let a=d*(2===t?.55+.2*n():.85+.15*n());y(e,0+u,f+8*t*o,a,5.4*o,+o),e.fill()}e.globalAlpha=.5;for(let t=0;t<2;t++)e.fillRect(0+u,f+24*o+3*o+3.2*t*o,d*(.8-.25*t),1.4*o);e.globalAlpha=1,e.fillStyle=i.accent,y(e,0+u,f+24*o+12*o,16*o,5*o,2.5*o),e.fill();let h=s?0+u:0+.54*a,v=s?f+24*o+24*o:f-2*o,m=s?a-2*u:.46*a-u,p=s?.3*l:.5*l;e.save(),y(e,h,v,m,p,2*o),e.clip();let g=e.createLinearGradient(h,v,h+m,v+p);g.addColorStop(0,i.panel),g.addColorStop(1,i.accent),e.fillStyle=g,e.fillRect(h,v,m,p),e.globalAlpha=.85,e.fillStyle=i.page,e.beginPath(),e.arc(h+m*(.3+.4*n()),v+p*(.35+.3*n()),.28*Math.min(m,p),0,2*Math.PI),e.fill(),e.globalAlpha=1,e.restore();let x=s?2:3,S=s?v+p+6*o:0+.76*l,b=0+l-S-5*o,T=3*o,M=(a-2*u-T*(x-1))/x;for(let t=0;t<x;t++){let a=0+u+t*(M+T);e.fillStyle=i.panel,y(e,a,S,M,b,1.6*o),e.fill(),e.fillStyle=i.ink,e.globalAlpha=.6,e.fillRect(a+2.5*o,S+b-6*o,.5*M,1.4*o),e.globalAlpha=1}}(i,e,a,l);let n=new m.CanvasTexture(r);return n.colorSpace=m.SRGBColorSpace,n.anisotropy=8,n}(l,o.aspect);let{width:e,height:a}=g(o.aspect);n.uniforms.uImage.value.set(e,a)}return n.uniforms.uTex.value=t,()=>t.dispose()},[e,n,o,f]);let p=(0,a.useRef)({inside:!1,x:.5,y:.5});return(0,a.useEffect)(()=>{let t=e.el,a=e=>{let a=t.getBoundingClientRect();p.current.x=(e.clientX-a.left)/a.width,p.current.y=1-(e.clientY-a.top)/a.height},l=e=>{"mouse"===e.pointerType&&(p.current.inside=!0,a(e))},r=()=>{p.current.inside=!1};return t.addEventListener("pointerenter",l),t.addEventListener("pointermove",a),t.addEventListener("pointerleave",r),()=>{t.removeEventListener("pointerenter",l),t.removeEventListener("pointermove",a),t.removeEventListener("pointerleave",r)}},[e.el]),(0,d.useFrame)((t,a)=>{let r,o=l.current;if(!o)return;let f=e.rect,d=M(f);d&&(d.aspect!==u.current.aspect||d.width!==u.current.width)&&(u.current=d,s(d));let m=f.top-window.scrollY;!v.current&&f.width>0&&m<2.5*i.height&&m+f.height>-(1.5*i.height)&&(v.current=!0,h(!0));let g=f.width>0&&m<i.height+120&&m+f.height>-120;if(o.visible=g,!g)return;o.position.set(f.left-window.scrollX+f.width/2-i.width/2,i.height/2-(m+f.height/2),0),o.scale.set(f.width,f.height,1);let w=n.uniforms;w.uPlane.value.set(f.width,f.height);let y=(r=Math.min(1,Math.max(0,(i.height-m)/(.55*i.height))))*r*(3-2*r);w.uReveal.value=T(w.uReveal.value,y,10,a);let x=p.current;w.uHover.value=T(w.uHover.value,+!!x.inside,6,a),w.uMouse.value.x=T(w.uMouse.value.x,x.x,12,a),w.uMouse.value.y=T(w.uMouse.value.y,x.y,12,a),w.uVelocity.value=c.stageScroll.velocity,w.uTime.value=t.clock.elapsedTime}),(0,t.jsx)("mesh",{ref:l,geometry:b??=new m.PlaneGeometry(1,1,48,48),material:n,frustumCulled:!1})}function k(){let e=(0,r.useThree)(e=>e.advance),t=(0,r.useThree)(e=>e.gl);return(0,a.useEffect)(()=>{let a=0,l=null,r=-1,n=window.scrollY,o=2,s=!1,f=document.documentElement;f.dataset.stageLive="0",t.domElement.style.visibility="hidden";let d=e=>{e!==s&&(s=e,f.dataset.stageLive=e?"1":"0",t.domElement.style.visibility=e?"":"hidden")},h=t=>{if(u.skyCurl.value>.001&&(0,c.stageHasSomethingOnScreen)())o=0;else if(o>=2){null===l&&(l=t),d(!1);return}else o+=1;d(!0),null!==l&&(a+=t-l,l=null,r=-1,c.stageScroll.velocity=0);let i=window.scrollY;if(r>=0){let e=Math.max(t-r,1/240),a=Math.max(-1,Math.min(1,(i-n)/e/2600));c.stageScroll.velocity+=(a-c.stageScroll.velocity)*(1-Math.exp(-(9*e)))}r=t,n=i,c.stageScroll.y=i,e(t-a)};return i.default.ticker.add(h),()=>{i.default.ticker.remove(h),delete f.dataset.stageLive,t.domElement.style.visibility=""}},[e,t]),null}i.default.registerPlugin(n.ScrollTrigger),e.s(["StageCanvas",0,function(){let{phase:e,heroReady:r}=(0,o.useIntro)(),i=(0,s.useFirstInteraction)(),u=(r||"boot"!==e)&&i,[d,h]=(0,a.useState)(!1);(0,a.useEffect)(()=>{if(!u||d)return;if("function"==typeof window.requestIdleCallback){let e=window.requestIdleCallback(()=>h(!0),{timeout:900});return()=>window.cancelIdleCallback(e)}let e=setTimeout(()=>h(!0),200);return()=>clearTimeout(e)},[u,d]);let[m]=(0,a.useState)([1,1.5]);return(0,a.useEffect)(()=>{let e=0,t=()=>{cancelAnimationFrame(e),e=requestAnimationFrame(()=>(0,c.measureAll)())};window.addEventListener("resize",t),n.ScrollTrigger.addEventListener("refresh",t);let a=new ResizeObserver(t);return a.observe(document.body),document.fonts?.ready.then(t),()=>{cancelAnimationFrame(e),window.removeEventListener("resize",t),n.ScrollTrigger.removeEventListener("refresh",t),a.disconnect()}},[]),(0,t.jsx)("div",{"aria-hidden":!0,className:"screen-tallest pointer-events-none z-0",children:d&&(0,t.jsxs)(l.Canvas,{frameloop:"never",orthographic:!0,resize:{scroll:!1},camera:{position:[0,0,1e3],near:1,far:4e3,zoom:1},dpr:m,gl:{antialias:!1,alpha:!0,stencil:!1,depth:!0,powerPreference:"high-performance"},onCreated:({gl:e})=>{e.debug.checkShaderErrors=!1,e.setClearColor("#ffffff",0),document.documentElement.dataset.stage="on"},children:[(0,t.jsx)(k,{}),(0,t.jsx)(f.WarmUp,{}),(0,t.jsx)(R,{}),(0,t.jsx)(v,{})]})})}],87584)},7941,function(e){e.n(e.i(87584))},4058,e=>{"use strict";var t=e.i(71645),a=e.i(48546),l=e.i(90072);let r=0,i=Promise.resolve(),n=()=>new Promise(e=>requestAnimationFrame(()=>e()));function o(e,t,a,l=()=>!1,r,n=s,c){let f=i.then(()=>u(e,t,a,l,r,n,c));return i=f.catch(()=>{}),f}let s=8;async function u(e,t,a,r,i,o=s,c){let f,d;if(r())return;let h=()=>"function"==typeof o?o():o,v=performance.now(),m=async()=>performance.now()-v<h()||(await n(),v=performance.now(),!r()),p=[];t.traverse(e=>{e.material&&(e.isMesh||e.isPoints||e.isLine)&&p.push(e)});let g=e.getRenderTarget(),w=[];for(let l of p){if(!await m())return;let r=l.visible;l.visible=!0;try{i&&e.setRenderTarget(i),w.push(e.compileAsync(l,a,t))}catch{}finally{e.setRenderTarget(g),l.visible=r}}if(await Promise.all(w),r())return;for(let a of(f=new Set,d=e=>{e&&e.isTexture&&!e.isRenderTargetTexture&&!e.isVideoTexture&&e.image&&f.add(e)},t.traverse(e=>{let t=e.material;if(t)for(let e of Array.isArray(t)?t:[t]){for(let t of Object.values(e))d(t);let t=e.uniforms;if(t)for(let e in t)d(t[e]?.value)}}),f)){if(!await m())return;e.initTexture(a)}c?.();let y=0;for(;y<p.length;){if(await n(),r())return;let o=performance.now(),s=[],u=[],c=[];t.traverse(e=>{e.visible||(e.visible=!0,u.push(e)),e.isLight&&!e.layers.isEnabled(31)&&(e.layers.enable(31),c.push(e)),e.frustumCulled&&(e.frustumCulled=!1,s.push(e))});let f=a.layers.mask;a.layers.set(31);let d=e.autoClear;e.autoClear=!1;let v=e.getRenderTarget(),m=new l.Vector4;e.getScissor(m);let g=e.getScissorTest();i?e.setRenderTarget(i):(e.setScissor(0,0,1,1),e.setScissorTest(!0));try{do{let l=p[y++],r=l.layers.mask;l.layers.set(31);try{e.render(t,a)}finally{l.layers.mask=r}}while(y<p.length&&performance.now()-o<h())}finally{for(let t of(i?e.setRenderTarget(v):(e.setScissorTest(g),e.setScissor(m.x,m.y,m.z,m.w)),e.autoClear=d,a.layers.mask=f,c))t.layers.disable(31);for(let e of s)e.frustumCulled=!0;for(let e of u)e.visible=!1}}}e.s(["WarmUp",0,function(){let e=(0,a.useThree)(e=>e.gl),l=(0,a.useThree)(e=>e.scene),i=(0,a.useThree)(e=>e.camera);return(0,t.useEffect)(()=>{let t=!1,a=()=>{t||o(e,l,i,()=>t).then(()=>{t||(r+=1,document.documentElement.dataset.stageWarm=String(r),window.dispatchEvent(new Event("stagewarm")))})};if("function"==typeof window.requestIdleCallback){let e=window.requestIdleCallback(a,{timeout:400});return()=>{t=!0,window.cancelIdleCallback?.(e)}}let n=window.setTimeout(a,150);return()=>{t=!0,clearTimeout(n)}},[e,l,i]),null},"warmUpScene",0,o])}]);