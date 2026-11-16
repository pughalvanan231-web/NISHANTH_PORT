(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67850,e=>{"use strict";e.s(["heroSnap",0,{canvas:null,version:0,baked:-1},"paintType",0,function(e,t,n,i){let o=document.createTreeWalker(t,NodeFilter.SHOW_TEXT),r=document.createRange();for(let l=o.nextNode();l;l=o.nextNode()){let o=l.textContent??"",a=l.parentElement;if(!a||!o.trim())continue;let s=getComputedStyle(a);if("hidden"===s.visibility||"none"===s.display)continue;let c=!0;for(let e=a;e&&e!==t;e=e.parentElement)if("0"===getComputedStyle(e).opacity){c=!1;break}if(!c)continue;let u=parseFloat(s.fontSize)*i;e.font=`${s.fontStyle} ${s.fontWeight} ${u}px ${s.fontFamily}`,e.fillStyle=s.color;let f=parseFloat(s.letterSpacing);"letterSpacing"in e&&(e.letterSpacing=`${Number.isFinite(f)?f*i:0}px`),e.textBaseline="alphabetic";let h="uppercase"===s.textTransform,d="capitalize"===s.textTransform,p=/\S+/g;for(let t=p.exec(o);t;t=p.exec(o)){r.setStart(l,t.index),r.setEnd(l,t.index+t[0].length);let o=r.getBoundingClientRect();if(!o.width||o.bottom<n.top||o.top>n.bottom)continue;let a=h?t[0].toUpperCase():d?t[0].charAt(0).toUpperCase()+t[0].slice(1):t[0],s=e.measureText(a),c=s.fontBoundingBoxAscent??.8*u,f=s.fontBoundingBoxDescent??.2*u,p=o.height*i;e.fillText(a,(o.left-n.left)*i,(o.top-n.top)*i+(p-c-f)/2+c)}}}])},85499,e=>{"use strict";e.s(["HERO_STAGE_ID",0,"hero-stage"])},74185,e=>{"use strict";e.i(47167);var t=e.i(43476),n=e.i(71645),i=e.i(75056),o=e.i(27735),r=e.i(60262);let l={u:e.i(58215).ANCHOR_U[0]},a={value:0},s={value:0};e.s(["FooterSky",0,function({active:e,onReady:c}){let u=(0,o.useQuality)(),f=(0,n.useRef)(0);return(0,t.jsxs)(i.Canvas,{onCreated:({gl:e})=>{e.debug.checkShaderErrors=!1},dpr:.6*u,frameloop:e?"always":"never",resize:{scroll:!1},gl:{alpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"},style:{position:"absolute",inset:0},children:[(0,t.jsx)(o.KeepDrawn,{}),(0,t.jsx)(r.Sky,{active:e,scroll:f,onReady:c,curl:a,rush:s,drive:l,firstRung:2})]})}])},51801,function(e){e.n(e.i(74185))},94389,e=>{"use strict";e.s(["skyBake",0,{on:!1},"skyCurl",0,{value:0},"skyRush",0,{value:0}])},58215,e=>{"use strict";let t={day:{toD:-.83,label:"Day",lights:{ambient:{intensity:1,color:"#d8e7fb"},key:{intensity:3.5,color:"#fff0d6"},fill:{intensity:1.25,color:"#cfe0f5"},env:{warm:4.2,cool:2,dim:.7}}},sunset:{toD:-1.22,label:"Sunset",lights:{ambient:{intensity:.85,color:"#e7d3cc"},key:{intensity:3.1,color:"#ffb070"},fill:{intensity:1.05,color:"#9fb2d2"},env:{warm:3.3,cool:1.1,dim:.45}}},night:{toD:-2,label:"Night",lights:{ambient:{intensity:1.25,color:"#9db3d6"},key:{intensity:2.3,color:"#c6d6f2"},fill:{intensity:1.15,color:"#7d93ba"},env:{warm:1.35,cool:1.6,dim:.62}}}},n=["day","sunset","night"],i=1/.15,o={u:0,toD:t.day.toD,rushTo:null,rushFrom:0,rushFor:null,rushT:0},r=n.map(e=>(t.day.toD-t[e].toD)/i);function l(e){let t=((.43+.15*e)%1+1)%1,n=Math.pow(t,1.5),i=-(6.283853*(t=n/(n+Math.pow(1-t,1.5))))-1.5708+.1,o=.4*Math.sin(i)-.1,r=Math.sin(i)+.69;return r/Math.hypot(o,r,Math.cos(i))}function a(e,t,n){let i=Math.min(1,Math.max(0,(n-e)/(t-e)));return i*i*(3-2*i)}function s(e,t,n){let i=e=>[parseInt(e.slice(1,3),16),parseInt(e.slice(3,5),16),parseInt(e.slice(5,7),16)],[o,r,l]=i(e),[a,s,c]=i(t),u=(e,t)=>Math.round(e+(t-e)*n).toString(16).padStart(2,"0");return`#${u(o,a)}${u(r,s)}${u(l,c)}`}function c(e,t,n){let i=(e,t)=>e+(t-e)*n;return{ambient:{intensity:i(e.ambient.intensity,t.ambient.intensity),color:s(e.ambient.color,t.ambient.color,n)},key:{intensity:i(e.key.intensity,t.key.intensity),color:s(e.key.color,t.key.color,n)},fill:{intensity:i(e.fill.intensity,t.fill.intensity),color:s(e.fill.color,t.fill.color,n)},env:{warm:i(e.env.warm,t.env.warm),cool:i(e.env.cool,t.env.cool),dim:i(e.env.dim,t.env.dim)}}}e.s(["ANCHOR_U",0,r,"SKY_RUSH_SECONDS",0,2.4,"SKY_TIMES",0,t,"SKY_TIME_ORDER",0,n,"SKY_TURN_SECONDS",0,150,"nearestSkyTime",0,function(e){let t=l(e);return t<-.16?"night":t<.24?"sunset":"day"},"skyClock",0,o,"skyEase",0,function(e){let t=Math.min(1,Math.max(0,e));return t*t*(3-2*t)},"skyLightsAt",0,function(e){let n=l(e),i=1-a(.08,.42,n),o=a(.02,-.34,n),r=c(t.day.lights,t.sunset.lights,i);return c(r,t.night.lights,o)},"skyNightAmount",0,function(e){return a(.02,-.34,l(e))},"toDForClock",0,function(e){let o,l,a,s,c;return t.day.toD-(o=n.length,l=Math.floor(e),c=r[s=Math.min(o-1,Math.floor((a=e-l)*o))],(l+c+((s+1<o?r[s+1]:1)-c)*(a*o-s))*i)},"turnFraction",0,function(e){return(e%1+1)%1}])},47658,e=>{"use strict";let t=new Float32Array(16),n=new Float32Array(16),i=new Float64Array(16).fill(-1e9),o=!1,r=!1;function l(){o||(o=!0,(r=window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches)&&window.addEventListener("pointermove",e=>{if("mouse"!==e.pointerType)return;let o=performance.now()/1e3;if(6>Math.hypot(e.clientX-t[0],e.clientY-n[0])&&o-i[0]<.05){t[0]=e.clientX,n[0]=e.clientY,i[0]=o;return}t.copyWithin(1,0),n.copyWithin(1,0),i.copyWithin(1,0),t[0]=e.clientX,n[0]=e.clientY,i[0]=o},{passive:!0}))}let a=new WeakMap,s=`
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
`;e.s(["POINTER_MELT",0,s,"clearTrail",0,function(e){return e.fill(0),e},"fillTrail",0,function(e,o){let l=performance.now()/1e3,a=1/0,s=1/0,c=-1/0,u=-1/0;for(let f=0;f<16;f++){let h=l-i[f],d=4*f;if(!r||h>1.4||o.width<1||o.height<1){e[d+2]=0;continue}let p=(t[f]-o.left)/o.width,m=1-(n[f]-o.top)/o.height;e[d]=p,e[d+1]=m,e[d+2]=Math.exp(-h/.45),a=Math.min(a,p),s=Math.min(s,m),c=Math.max(c,p),u=Math.max(u,m)}let f=a<=c;return e[3]=f?a:0,e[7]=f?s:0,e[11]=f?c:0,e[15]=f?u:0,e},"trailArray",0,function(){return l(),new Float32Array(64)},"trailBox",0,function(e){let t=performance.now(),n=a.get(e);return(!n||t-n.at>200)&&(n={box:e.getBoundingClientRect(),at:t},a.set(e,n)),n.box},"trailLive",0,function(){return l(),r&&performance.now()/1e3-i[0]<1.4}])},27735,e=>{"use strict";var t=e.i(71645),n=e.i(70950),n=n,i=e.i(89970),o=e.i(10024);let r=[1,.8,.65,.5],l=1e3/45,a=0,s=new Set,c=!1;function u(){return r[a]}function f(e){return!function(){if(c)return;c=!0;let e=performance.now(),t=[],n=!1,u=0,f=0;(0,o.isLowEnd)()&&0===a&&(a=(0,o.isSoftwareGL)()||(0,o.isWeakGPU)()?2:1,document.documentElement.dataset.quality=String(r[a]));let h=(o,c)=>{let d,p=performance.now();if(p-e<4e3||document.hidden||(p-u>500&&(u=p,n=function(){for(let e of document.querySelectorAll("canvas")){let t=e.getBoundingClientRect();if(!(t.bottom<=0||t.top>=innerHeight)&&0!==t.width&&"hidden"!==getComputedStyle(e).visibility)return!0}return!1}()),!n||c>250)||(t.push(c),f+=c,t.length<120&&!(f>1500&&t.length>=20)))return;f=0;let m=(d=[...t].sort((e,t)=>e-t))[d.length>>1]>Math.min(l,1.5*d[Math.floor(.05*d.length)]);t.length=0,m&&(a+=1,document.documentElement.dataset.quality=String(r[a]),s.forEach(e=>e()),a>=r.length-1&&i.default.ticker.remove(h))};i.default.ticker.add(h)}(),s.add(e),()=>s.delete(e)}e.s(["KeepDrawn",0,function(){let e=(0,n.A)();return(0,t.useEffect)(()=>e.subscribe((e,t)=>{e.viewport.dpr!==t.viewport.dpr&&e.gl.render(e.scene,e.camera)}),[e]),null},"phoneDpr",0,e=>[1.75,Math.max(1.75,2.5*e)],"scaleDpr",0,function(e,t){return"number"==typeof e?e*t:[e[0]*t,e[1]*t]},"useQuality",0,function(){return(0,t.useSyncExternalStore)(f,u,()=>1)}],27735)}]);