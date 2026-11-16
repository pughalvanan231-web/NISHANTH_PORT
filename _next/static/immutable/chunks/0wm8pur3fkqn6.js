(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,39425,e=>{"use strict";var t=e.i(60262),r=e.i(94389);e.s(["Sky",()=>t.Sky,"SkyBackdrop",()=>t.SkyBackdrop,"skyBake",()=>r.skyBake,"skyCurl",()=>r.skyCurl,"skyRush",()=>r.skyRush])},40083,function(e){e.n(e.i(39425))},47658,e=>{"use strict";let t=new Float32Array(16),r=new Float32Array(16),i=new Float64Array(16).fill(-1e9),a=!1,n=!1;function o(){a||(a=!0,(n=window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches)&&window.addEventListener("pointermove",e=>{if("mouse"!==e.pointerType)return;let a=performance.now()/1e3;if(6>Math.hypot(e.clientX-t[0],e.clientY-r[0])&&a-i[0]<.05){t[0]=e.clientX,r[0]=e.clientY,i[0]=a;return}t.copyWithin(1,0),r.copyWithin(1,0),i.copyWithin(1,0),t[0]=e.clientX,r[0]=e.clientY,i[0]=a},{passive:!0}))}let l=new WeakMap,s=`
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
`;e.s(["POINTER_MELT",0,s,"clearTrail",0,function(e){return e.fill(0),e},"fillTrail",0,function(e,a){let o=performance.now()/1e3,l=1/0,s=1/0,c=-1/0,u=-1/0;for(let h=0;h<16;h++){let p=o-i[h],f=4*h;if(!n||p>1.4||a.width<1||a.height<1){e[f+2]=0;continue}let v=(t[h]-a.left)/a.width,d=1-(r[h]-a.top)/a.height;e[f]=v,e[f+1]=d,e[f+2]=Math.exp(-p/.45),l=Math.min(l,v),s=Math.min(s,d),c=Math.max(c,v),u=Math.max(u,d)}let h=l<=c;return e[3]=h?l:0,e[7]=h?s:0,e[11]=h?c:0,e[15]=h?u:0,e},"trailArray",0,function(){return o(),new Float32Array(64)},"trailBox",0,function(e){let t=performance.now(),r=l.get(e);return(!r||t-r.at>200)&&(r={box:e.getBoundingClientRect(),at:t},l.set(e,r)),r.box},"trailLive",0,function(){return o(),n&&performance.now()/1e3-i[0]<1.4}])}]);