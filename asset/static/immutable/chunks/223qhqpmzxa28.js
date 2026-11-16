(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,59109,e=>{"use strict";e.i(47167);var t=e.i(43476),r=e.i(71645),n=e.i(75056),i=e.i(27735),a=e.i(60262);let o={u:2/3},l={value:0},u={value:0};e.s(["NightSky",0,function({active:e,onCanvas:c,drive:s=o}){let f=(0,i.useQuality)(),h=(0,r.useRef)(0),[p,d]=(0,r.useState)(!1);return(0,t.jsxs)(n.Canvas,{onCreated:({gl:e})=>{e.debug.checkShaderErrors=!1,c?.(e.domElement)},dpr:.6*f,frameloop:e?"always":"never",resize:{scroll:!1},gl:{alpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!0,powerPreference:"high-performance"},style:{position:"absolute",inset:0,opacity:+!!p},children:[(0,t.jsx)(i.KeepDrawn,{}),(0,t.jsx)(a.Sky,{active:e,scroll:h,onReady:()=>d(!0),curl:u,rush:l,drive:s,firstRung:2})]})}])},44146,function(e){e.n(e.i(59109))},47658,e=>{"use strict";let t=new Float32Array(16),r=new Float32Array(16),n=new Float64Array(16).fill(-1e9),i=!1,a=!1;function o(){i||(i=!0,(a=window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches)&&window.addEventListener("pointermove",e=>{if("mouse"!==e.pointerType)return;let i=performance.now()/1e3;if(6>Math.hypot(e.clientX-t[0],e.clientY-r[0])&&i-n[0]<.05){t[0]=e.clientX,r[0]=e.clientY,n[0]=i;return}t.copyWithin(1,0),r.copyWithin(1,0),n.copyWithin(1,0),t[0]=e.clientX,r[0]=e.clientY,n[0]=i},{passive:!0}))}let l=new WeakMap,u=`
  uniform vec4 uMeltTrail[16];

  vec2 pmSwirl(vec2 uv, float t) {
    vec2 p = -1.0 + 2.0 * uv;
    float w = 1.6;
    p += 0.1  * cos((1.5 * w) * p.yx + 1.1 * t + vec2(0.1, 1.1));
    p += 0.1  * cos((2.3 * w) * p.yx + 1.3 * t + vec2(3.2, 3.4));
    p += 0.1  * cos((2.2 * w) * p.yx + 1.7 * t + vec2(1.8, 5.2));
    p += 0.64 * cos((2.5 * w) * p.yx + 1.4 * t + vec2(6.3, 3.9));
    float r = length(p);
    return vec2(r, r * 0.5);
  }

  float pmTrail(vec2 uv, float aspect, float radius) {
    // Nothing on the trail: nothing to work out, anywhere on the screen.
    if (uMeltTrail[1].z < 0.002) return 0.0;
    vec2 s = vec2(aspect, 1.0);
    // Nor anywhere outside the trail's bounds (fillTrail packs them into the
    // w's). Without this every pixel of a full-screen sky walked all fifteen
    // segments for as long as the mouse moved, and the hero - already the
    // dearest frame on the site - slowed down under the pointer (the owner).
    vec2 lo = vec2(uMeltTrail[0].w, uMeltTrail[1].w) - radius / s;
    vec2 hi = vec2(uMeltTrail[2].w, uMeltTrail[3].w) + radius / s;
    if (uv.x < lo.x || uv.y < lo.y || uv.x > hi.x || uv.y > hi.y) return 0.0;
    float k = 0.0;
    for (int i = 0; i < 15; i++) {
      vec4 a = uMeltTrail[i];
      vec4 b = uMeltTrail[i + 1];
      float st = min(a.z, b.z);
      if (st < 0.002) continue;
      vec2 pa = (uv - a.xy) * s;
      vec2 ba = (b.xy - a.xy) * s;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      float d = length(pa - ba * h);
      k = max(k, smoothstep(radius, 0.0, d) * st);
    }
    return k;
  }

  vec2 pointerMelt(vec2 uv, float aspect, float radius, float amount, float t) {
    float k = pmTrail(uv, aspect, radius);
    if (k < 0.002) return uv;
    k = k * k * (3.0 - 2.0 * k);
    // The swirl's rings, close-set, so the patch under the pointer runs like
    // liquid rather than sliding over as one piece.
    vec2 sw = pmSwirl(uv * 2.5, t * 0.24);
    return uv + vec2(cos(sw.x * 9.0), sin(sw.y * 9.0)) * amount * 0.25 * k;
  }
`;e.s(["POINTER_MELT",0,u,"clearTrail",0,function(e){return e.fill(0),e},"fillTrail",0,function(e,i){let o=performance.now()/1e3,l=1/0,u=1/0,c=-1/0,s=-1/0;for(let f=0;f<16;f++){let h=o-n[f],p=4*f;if(!a||h>1.4||i.width<1||i.height<1){e[p+2]=0;continue}let d=(t[f]-i.left)/i.width,v=1-(r[f]-i.top)/i.height;e[p]=d,e[p+1]=v,e[p+2]=Math.exp(-h/.45),l=Math.min(l,d),u=Math.min(u,v),c=Math.max(c,d),s=Math.max(s,v)}let f=l<=c;return e[3]=f?l:0,e[7]=f?u:0,e[11]=f?c:0,e[15]=f?s:0,e},"trailArray",0,function(){return o(),new Float32Array(64)},"trailBox",0,function(e){let t=performance.now(),r=l.get(e);return(!r||t-r.at>200)&&(r={box:e.getBoundingClientRect(),at:t},l.set(e,r)),r.box},"trailLive",0,function(){return o(),a&&performance.now()/1e3-n[0]<1.4}])},27735,e=>{"use strict";var t=e.i(71645),r=e.i(70950),r=r,n=e.i(89970),i=e.i(10024);let a=[1,.8,.65,.5],o=1e3/45,l=0,u=new Set,c=!1;function s(){return a[l]}function f(e){return!function(){if(c)return;c=!0;let e=performance.now(),t=[],r=!1,s=0,f=0;(0,i.isLowEnd)()&&0===l&&(l=(0,i.isSoftwareGL)()||(0,i.isWeakGPU)()?2:1,document.documentElement.dataset.quality=String(a[l]));let h=(i,c)=>{let p,d=performance.now();if(d-e<4e3||document.hidden||(d-s>500&&(s=d,r=function(){for(let e of document.querySelectorAll("canvas")){let t=e.getBoundingClientRect();if(!(t.bottom<=0||t.top>=innerHeight)&&0!==t.width&&"hidden"!==getComputedStyle(e).visibility)return!0}return!1}()),!r||c>250)||(t.push(c),f+=c,t.length<120&&!(f>1500&&t.length>=20)))return;f=0;let v=(p=[...t].sort((e,t)=>e-t))[p.length>>1]>Math.min(o,1.5*p[Math.floor(.05*p.length)]);t.length=0,v&&(l+=1,document.documentElement.dataset.quality=String(a[l]),u.forEach(e=>e()),l>=a.length-1&&n.default.ticker.remove(h))};n.default.ticker.add(h)}(),u.add(e),()=>u.delete(e)}e.s(["KeepDrawn",0,function(){let e=(0,r.A)();return(0,t.useEffect)(()=>e.subscribe((e,t)=>{e.viewport.dpr!==t.viewport.dpr&&e.gl.render(e.scene,e.camera)}),[e]),null},"phoneDpr",0,e=>[1.75,Math.max(1.75,2.5*e)],"scaleDpr",0,function(e,t){return"number"==typeof e?e*t:[e[0]*t,e[1]*t]},"useQuality",0,function(){return(0,t.useSyncExternalStore)(f,s,()=>1)}],27735)}]);