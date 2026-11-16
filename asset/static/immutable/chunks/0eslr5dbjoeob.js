(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,15957,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(18566),l=e.i(59280),o=e.i(40242),i=e.i(44354),n=e.i(89970),s=e.i(85146),u=e.i(90072),d=e.i(8560);let c=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,h=`
  precision highp float;

  #define MAX_PLANES 18
  #define MAX_LINKS 18
  #define MAX_TEXT 1
  #define MAX_RULES 1

  varying vec2 vUv;

  uniform vec2  uResolution;   // canvas size in px
  uniform vec2  uSize;         // resting plane size in px
  uniform float uRadius;       // resting corner radius in px

  // per-plane state, driven from JS
  uniform float uCount;
  uniform vec2  uPos[MAX_PLANES];    // centre in px, origin at screen centre
  uniform float uRot[MAX_PLANES];    // radians
  // xy = 0..1 per axis, z = brightness (1 = lit, 0 = black), w = which atlas
  // cell this plane wears. All three ride in here rather than in arrays of
  // their own because GLSL ES gives every element of a uniform array a full
  // vec4 row whatever it is declared as — zw were already being paid for and
  // thrown away. The cell is resolved on the CPU because it depends on where
  // the plane sits on the ring, not on its index, and working that out per
  // pixel in the loop below would be absurd.
  uniform vec4  uScale[MAX_PLANES];

  // honey threads between neighbours, driven from JS
  uniform float uLinkCount;
  uniform vec2  uLinkA[MAX_LINKS];
  uniform vec2  uLinkB[MAX_LINKS];
  // (radius at the ends, radius at the pinch, droop, fillet)
  uniform vec4  uLinkPar[MAX_LINKS];

  uniform float uK;            // smin blend strength in px
  uniform float uWobble;       // surface tension noise amount, px
  uniform float uTime;
  uniform vec3  uColor;
  uniform vec2  uTone;         // the art's lift and gain in this room

  // --- the compile look (the site's own, in place of the honey) -------------
  // 1 = on. Each card is built by a band of code sweeping down it: the picture
  // above the band, characters in it in the picture's colours, and below it
  // the card not built yet - paper, faint lines of source and its edge.
  uniform float uLook;
  // Cards stay cards however small or folded (the dealt look): no drop, no pill.
  uniform float uSharp;
  uniform float uBuild[MAX_PLANES];  // how far down each card is built, 0..1
  uniform sampler2D uGlyph;          // 8 x 8 code glyphs, alpha (ring/glyphs.js)
  uniform vec3  uPaper;

  // All the artwork lives in one atlas: ESSL 1.00 cannot index an array of
  // samplers with a varying index, so a per-plane texture is not an option.
  uniform sampler2D uAtlas;
  uniform vec2  uGrid;         // atlas cells across, down
  uniform float uBlend;        // px over which neighbouring art crossfades
  uniform float uTextured;

  // The opened card wears a full-size copy of its art in place of its atlas
  // cell, which was never meant to be seen at that size. Always sampled, so
  // the derivatives the mip selection needs stay defined, and masked in by
  // cell; zw cover-fit the art to a frame that has left 3:2.
  uniform sampler2D uHero;
  uniform vec4  uHeroP;        // cell it stands in for (-1 = none), mix, crop
  // The full-size picture's own cover-fit to the frame, from its real shape:
  // the atlas cell is cut to 3:2, the picture is not (the site's are 4:3),
  // and reading it through the cell's crop zoomed it on a tall frame.
  uniform vec2  uHeroC;

  // Footage, one clip at a time, over the still it starts from: a card's on
  // the ring and on its hero, or a clip on the project page. Read in the
  // space the plane already shows (the hero crop's 3:2, or a page box), and
  // zw cover-fit the clip into it the way the still was cut from it.
  uniform sampler2D uLive;
  uniform vec4  uLiveP;        // cell it plays on (-1 = none), mix, fit

  // The opened project's other pictures, on a sheet of their own: cells at
  // or past uMoreP.x are read from it instead of the atlas. Each cell holds
  // its picture already fitted to the box it is shown in, stretched to fill
  // the cell, so the plane's own 0..1 reads it back undistorted whatever
  // shape the box is.
  uniform sampler2D uMore;
  uniform vec4  uMoreP;        // first cell it covers, cells across, mix, rows

  // The page's type: one sheet of white-on-transparent blocks, each laid on
  // the page as an ink mask at the box the DOM gave it. Drawn in this pass
  // rather than left in the DOM so the words pass through the lip the way
  // the pictures do.
  uniform sampler2D uText;
  uniform float uTextCount;
  uniform vec4  uTextRect[MAX_TEXT];  // centre.xy, half size.zw, world px
  uniform vec4  uTextUV[MAX_TEXT];    // its place on the sheet: u, v, du, dv
  uniform float uTextA[MAX_TEXT];     // ink alpha, reveal and tone folded in

  // The page's hairlines, drawn here and not by the DOM: the DOM scrolls on
  // the compositor and the canvas a frame behind it, so a rule left to the
  // DOM slid against the type it rules off whenever the page moved. A rule
  // is 1 css px tall, hung from its top edge; alpha 0 is none.
  uniform vec4  uRule[MAX_RULES];     // x0, x1, top y (world px), ink alpha

  // --- pointer -------------------------------------------------------------
  // Nothing is ever drawn at the cursor. It only changes how the ring behaves
  // around it: the field goes soft, and a wake runs out through the surface.
  // Packed into vec4s for the same reason the link parameters are.
  uniform vec4 uMouse;  // cursor.xy px, presence 0..1, blend px added at it
  uniform vec4 uMelt;   // reach px, wake px, wake frequency, wake speed

  // --- the cursor's bead ---------------------------------------------------
  // The one exception: on the ring the cursor is a drop of the ink, in the
  // field with the cards. A capsule round the pointer — a circle while it
  // is a drop, drawn out sideways into a pill over a card — with a tail
  // that trails it, and the thread of honey it pulls out of a card it
  // leaves: the same bridge as the ring's, anchored inside that card. It
  // melts into the cards on a blend of its own (the softening above would
  // swallow something this small whole), and in the colour race the drop
  // and its thread are cell 1000, which wears the ink.
  uniform vec4 uBead;    // head.xy (the pointer), tail.xy px
  uniform vec4 uBeadR;   // half height, tail radius, blend px, colour blend px
  uniform vec4 uBeadT;   // thread: anchor.xy px, radius at the ends, at the pinch
  // And the word cut out of the pill, so it is read in the picture under
  // it, darkened a little to hold against the honey on any picture.
  uniform sampler2D uBeadTex;  // the word: g glyphs
  uniform vec4 uBeadL;   // word alpha, half width px, thread droop, thread fillet
  uniform vec4 uBeadLP;  // the word's half width, half height px, darkening, -


  vec2 atlasUV(vec2 uv, float idx) {
    float col = mod(idx, uGrid.x);
    float row = floor(idx / uGrid.x);
    return (vec2(col, row) + uv) / uGrid;
  }

  vec2 moreUV(vec2 uv, float idx) {
    float k = max(idx - uMoreP.x, 0.0);
    float col = mod(k, uMoreP.y);
    float row = floor(k / uMoreP.y);
    return (vec2(col, row) + uv) / vec2(uMoreP.y, max(uMoreP.w, 1.0));
  }


  // --- glass lip -----------------------------------------------------------
  // A band along the top and bottom of the screen behaving like the rounded
  // edge of a thick glass sheet. Because the whole scene is evaluated from p,
  // warping p here refracts the planes and the honey together, with no second
  // pass and no render target.
  uniform float uBandTop;     // px
  uniform float uBandBottom;  // px
  uniform vec4  uGlass;       // refract px, squeeze, ripple px, ripple freq
  uniform float uFringe;      // px of chromatic split inside the band
  uniform float uSheen;       // lift applied across the lip

  // Warps p in place and returns how deep into the lip this pixel sits, 0..1.
  float glassBend(inout vec2 p) {
    float band = p.y > 0.0 ? uBandTop : uBandBottom;
    if (band <= 0.5) return 0.0;

    float dy = abs(p.y) - (uResolution.y * 0.5 - band);
    if (dy <= 0.0) return 0.0;

    float t = clamp(dy / band, 0.0, 1.0);
    // Circular profile: barely bends at the inner edge, falls away sharply at
    // the very edge, which is what reads as thickness rather than a gradient.
    float bend = 1.0 - sqrt(max(0.0, 1.0 - t * t));

    float s = sign(p.y);
    // Sampling back toward centre throws content outward, so the image
    // stretches forward into the lip and swells as it reaches the edge.
    // Both terms are signed: negatives invert the lip and compress instead.
    p.y -= s * bend * (uGlass.x + sin(p.x * uGlass.w) * uGlass.z);
    p.x *= 1.0 - bend * uGlass.y;

    return bend;
  }

  // --- simplex noise -------------------------------------------------------
  // Copyright (C) 2011 Ashima Arts. All rights reserved.
  // Copyright (C) 2011-2016 by Stefan Gustavson (Classic noise and others)
  // Distributed under the MIT License. https://github.com/ashima/webgl-noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // --- sdf helpers ---------------------------------------------------------
  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  // The honey between two planes: a flat slab spanning centre to centre, as
  // wide as the edges it comes off and pinched in the middle, drooping under
  // its own weight.
  //
  // Deliberately not a capsule. A capsule has a round cross-section, so at
  // full merge it bulges out past the flat sides of the planes themselves.
  // This is swept as a box, so while the planes overlap it stays entirely
  // inside them and the silhouette reads as one flat card.
  float sdBridge(vec2 p, vec2 a, vec2 b, float rEnd, float rMid, float sag) {
    vec2 ba = b - a;
    float len = length(ba);
    if (len < 0.001) return 1e6;

    vec2 dir = ba / len;
    vec2 nrm = vec2(-dir.y, dir.x);

    vec2 q = p - (a + b) * 0.5;
    float along = dot(q, dir);
    float across = dot(q, nrm);

    float h = clamp(along / len + 0.5, 0.0, 1.0);
    float bell = sin(3.14159265 * h);           // 0 at the ends, 1 in the middle

    // droop, world -Y, resolved onto the across axis
    across += sag * bell * nrm.y;

    float taper = pow(1.0 - bell, 1.7);         // 1 at the ends, 0 in the middle
    float r = mix(rMid, rEnd, taper);

    // Ends are square and buried inside the planes, so they never show.
    return max(abs(along) - len * 0.5, abs(across) - r);
  }

  // Two circles and the cone tangent to both: a drop, round at the head and
  // drawn out to the tail. Exact (Inigo Quilez's uneven capsule); collapses
  // to the head's circle while the tail is still inside it.
  float sdDrop(vec2 p, vec2 a, vec2 b, float ra, float rb) {
    vec2 ba = b - a;
    float h = dot(ba, ba);
    float dr = ra - rb;
    if (h <= dr * dr + 0.01) return length(p - a) - ra;
    p -= a;
    vec2 q = vec2(abs(dot(p, vec2(ba.y, -ba.x))), dot(p, ba)) / h;
    vec2 c = vec2(sqrt(h - dr * dr), dr);
    float k = c.x * q.y - c.y * q.x;
    if (k < 0.0) return sqrt(h * dot(q, q)) - ra;
    if (k > c.x) return sqrt(h * (dot(q, q) + 1.0 - 2.0 * q.y)) - rb;
    return dot(c, q) - ra;
  }

  // smooth minimum — this is what makes the shapes read as liquid.
  // Note it also behaves as a plain min() when a is the 1e6 sentinel.
  float smin(float a, float b, float k) {
    if (k <= 0.0001) return min(a, b);
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // One plane's picture at one point of it. The atlas by default; the full-
  // size copy for the opened card's cell, cover-fitted to a hero that has
  // left 3:2; the footage over either while it plays. All are sampled and
  // masked in, so the derivatives the mip selection needs stay defined.
  vec3 artAt(vec2 uv, float cell, vec2 fr) {
    float hero = 1.0 - step(0.5, abs(cell - uHeroP.x));
    vec2 huv = 0.5 + (uv - 0.5) * uHeroC;
    uv = mix(uv, 0.5 + (uv - 0.5) * uHeroP.zw, hero);
    vec3 c;
    // Uniform branch. The offset is scaled by bend upstream, so outside the
    // lip the three taps land on the same texel and there is no fringe.
    if (uFringe > 0.0) {
      c = vec3(
        texture2D(uAtlas, atlasUV(uv + fr, cell)).r,
        texture2D(uAtlas, atlasUV(uv, cell)).g,
        texture2D(uAtlas, atlasUV(uv - fr, cell)).b
      );
    } else {
      c = texture2D(uAtlas, atlasUV(uv, cell)).rgb;
    }
    c = mix(c, texture2D(uHero, huv).rgb, hero * uHeroP.y);
    float more = step(uMoreP.x - 0.5, cell);
    c = mix(c, texture2D(uMore, moreUV(uv, cell)).rgb, more * uMoreP.z);
    // Last, so a clip plays over a page picture as well as over a card.
    float live = 1.0 - step(0.5, abs(cell - uLiveP.x));
    vec3 lc = texture2D(uLive, 0.5 + (uv - 0.5) * uLiveP.zw).rgb;
    c = mix(c, lc, live * uLiveP.y);
    // The bead wears the ink, whatever the sheets above made of its cell —
    // put through the room's tone backwards, so it comes out of it as the
    // ink the page's type wears.
    vec3 ink = (uColor - uTone.x) / max(uTone.y - uTone.x, 0.001);
    c = mix(c, ink, step(999.5, cell));
    return c;
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // A glyph cell's coverage: glyph g at f (0..1 within the cell). The sheet's
  // cells are square and ours are 11 x 18, so only the middle of each sheet
  // cell is read, at the same proportions: the glyph comes out undistorted.
  float glyphAt(float g, vec2 f) {
    vec2 gf = 0.5 + (f - 0.5) * vec2(0.55, 0.9);
    return texture2D(uGlyph, (vec2(mod(g, 8.0), floor(g / 8.0)) + gf) / 8.0).a;
  }

  // The compile look on one card at one point of it. uv is the card's 0..1
  // (y down), lq the same in px from its top left, size its px size, b how far
  // it is built, edge the distance to its outline (negative inside).
  vec3 compileAt(vec3 art, vec2 uv, vec2 lq, vec2 size, float b, float cell, float edge, vec2 fr) {
    const float BW = 0.22;                       // the band's half height, of the card
    float t = (uv.y - mix(-BW, 1.0 + BW, b)) / BW; // < -1 built, > 1 not yet
    if (t < -1.0) return art;

    vec2 cs = vec2(11.0, 18.0);                  // a character, px
    vec2 id = floor(lq / cs);
    vec2 f = fract(lq / cs);
    vec3 paper = mix(uPaper, art, 0.05);         // a ghost of the picture to come
    float line = 1.0 - smoothstep(-1.6, -0.6, edge); // inside the outline
    vec3 outline = mix(paper, uColor, 0.28);

    if (t > 1.0) {
      // Not built yet: lines of source, indented, of their own lengths, and
      // the card's outline. Still, so a card at rest costs no frames.
      float cols = size.x / cs.x;
      float indent = floor(hash(vec2(id.y, 3.0)) * 4.0) * 2.0;
      float len = 6.0 + hash(vec2(id.y, 7.0)) * (cols - 14.0);
      float code = step(indent, id.x) * step(id.x, indent + len)
                 * step(0.22, hash(id + 0.5)) * step(0.3, hash(vec2(id.y, 11.0)));
      float g = floor(hash(id) * 64.0);
      vec3 c = mix(paper, uColor, glyphAt(g, f) * code * 0.16);
      return mix(outline, c, line);
    }

    // The band: dense at its middle, scattering to its edges, every character
    // in the colour of the picture under it, changing as it goes.
    vec2 cuv = clamp((id + 0.5) * cs / size, 0.0, 1.0);
    vec3 under = artAt(cuv, cell, fr);
    vec3 ink = mix(under, uColor, 0.3);
    float g = floor(hash(id + vec2(floor(uTime * 14.0) * 0.37, 0.0)) * 64.0);
    float dens = 1.0 - abs(t);
    float on = step(hash(id * 1.3 + vec2(0.0, floor(uTime * 9.0))), dens * dens * 1.3 + 0.04);
    vec3 bg = mix(art, paper, smoothstep(-0.9, 0.3, t));
    vec3 c = mix(bg, ink, glyphAt(g, f) * on);
    // The outline holds until the picture reaches it.
    return mix(c, outline, (1.0 - line) * smoothstep(-0.6, 0.6, t));
  }

  void main() {
    // Screen position in world px, then bent by the lip.
    vec2 p = (vUv - 0.5) * uResolution;
    float bend = glassBend(p);

    // Read after the bend, so the cursor acts in the same warped space as the
    // ring: dragged into the lip, its influence is refracted with everything
    // else rather than sitting flat on top of it.
    float toMouse = length(p - uMouse.xy);

    // Blend strength is lifted in a halo around the cursor, so the ring goes
    // soft exactly where it is being touched and stays crisp everywhere else.
    // Resolved once per pixel rather than per plane: it costs one length().
    float k = uK;
    if (uMouse.z > 0.001) {
      float t = 1.0 - smoothstep(0.0, max(uMelt.x, 1.0), toMouse);
      k += uMouse.w * uMouse.z * t * t;
    }

    float d = 1e6;

    // The two planes nearest this pixel, tracked alongside the field so the
    // colour can be resolved without a second pass. In the goo between two
    // planes both are close, which is exactly where the crossfade belongs.
    float d0 = 1e6, d1 = 1e6;
    vec2 uv0 = vec2(0.5), uv1 = vec2(0.5);
    float im0 = 0.0, im1 = 0.0;
    float dm0 = 1.0, dm1 = 1.0;
    // For the compile look: the point in px on each, their sizes and builds.
    vec2 lq0 = vec2(0.0), lq1 = vec2(0.0), sz0 = vec2(1.0), sz1 = vec2(1.0);
    float bd0 = 1.0, bd1 = 1.0;

    float halfSpan = length(uSize) * 0.5;

    for (int i = 0; i < MAX_PLANES; i++) {
      if (float(i) >= uCount) break;

      vec4 st = uScale[i];
      vec2 sc = st.xy;
      float grown = max(sc.x, sc.y);
      if (grown <= 0.0001) continue;

      vec2 q = p - uPos[i];
      // Anything further out than this cannot affect the surface, so it can be
      // skipped outright — this is what keeps 32 planes affordable. Scaled by
      // the plane rather than fixed, because a plane swollen under the cursor
      // reaches further than its resting size, as does the melt around it.
      float cull = halfSpan * grown + k + uWobble + 8.0;
      if (dot(q, q) > cull * cull) continue;

      // into the plane's local frame
      float a  = uRot[i];
      float ca = cos(a), sa = sin(a);
      q = vec2(q.x * ca + q.y * sa, -q.x * sa + q.y * ca);

      vec2 halfSize = max(uSize * 0.5 * sc, vec2(0.0001));

      // starts as a circle (r = half extent), relaxes into the rounded rect
      float rMax = min(halfSize.x, halfSize.y);
      float r = min(rMax, mix(rMax, uRadius, smoothstep(0.30, 1.0, min(sc.x, sc.y))));
      // Compiled cards are cards from the first frame, never drops.
      if (uLook > 0.5 || uSharp > 0.5) r = min(rMax, uRadius);

      float di = sdRoundBox(q, halfSize, r);
      d = smin(d, di, k);

      // Local UV. Clamped, so the goo outside a plane carries that plane's
      // edge colour rather than repeating or sampling the next atlas cell.
      vec2 luv = q / (2.0 * halfSize) + 0.5;
      luv.y = 1.0 - luv.y;
      luv = clamp(luv, 0.004, 0.996);

      vec2 lsz = 2.0 * halfSize;
      vec2 lpx = luv * lsz;
      float lbd = uBuild[i];
      if (di < d0) {
        d1 = d0; uv1 = uv0; im1 = im0; dm1 = dm0; lq1 = lq0; sz1 = sz0; bd1 = bd0;
        d0 = di; uv0 = luv; im0 = st.w; dm0 = st.z; lq0 = lpx; sz0 = lsz; bd0 = lbd;
      } else if (di < d1) {
        d1 = di; uv1 = luv; im1 = st.w; dm1 = st.z; lq1 = lpx; sz1 = lsz; bd1 = lbd;
      }
    }

    // Threads strung between neighbours as they pull apart.
    for (int i = 0; i < MAX_LINKS; i++) {
      if (float(i) >= uLinkCount) break;

      vec4 par = uLinkPar[i];
      // Radii are allowed to go negative: that lifts the bridge's field clear
      // of the surface so it fades out, rather than bottoming out at zero as a
      // half-covered hairline. Only cull once it is further out than the
      // antialiasing can reach.
      if (par.x <= -3.0) continue;

      vec2 a = uLinkA[i];
      vec2 b = uLinkB[i];
      vec2 mid = (a + b) * 0.5;
      float reach = length(b - a) * 0.5 + par.x + par.w + 8.0;
      if (dot(p - mid, p - mid) > reach * reach) continue;

      d = smin(d, sdBridge(p, a, b, par.x, par.y, par.z), par.w);
    }

    // Surface tension wobble, decays to zero so resting planes are dead flat.
    if (uWobble > 0.001) {
      float n = snoise(p * 0.012 + vec2(uTime * 0.22, uTime * -0.17));
      d += n * uWobble;
    }

    // A capillary wake off the cursor, amplitude driven by how fast it is
    // moving. Rings out from it and dies over the same reach the softening
    // uses, so a flick leaves a ripple in the surface that outlives the
    // movement that made it.
    if (uMelt.y > 0.001) {
      d += sin(toMouse * uMelt.z - uTime * uMelt.w)
         * uMelt.y * exp(-toMouse / max(uMelt.x, 1.0));
    }

    // The bead last, so neither the birth's wobble nor the wake ripples a
    // shape this small. db is the bead with its thread, for the field and
    // the race; dd the bead alone, which is what sits on top of a card.
    float db = 1e6;
    float dd = 1e6;
    if (uBeadR.x > 0.05) {
      float rh = uBeadR.x;
      float pill = sdRoundBox(p - uBead.xy, vec2(max(uBeadL.y, rh), rh), rh);
      dd = smin(pill, sdDrop(p, uBead.xy, uBead.zw, rh, uBeadR.y), 3.0);
      db = dd;
      if (uBeadT.z > -3.0) {
        float dh = sdBridge(p, uBeadT.xy, uBead.xy, uBeadT.z, uBeadT.w, uBeadL.z);
        db = smin(db, dh, uBeadL.w);
      }
      d = smin(d, db, uBeadR.z);
      // Outside itself its distance counts double in the race, so it keeps
      // its colour to its own shape and neck instead of dyeing whatever goo
      // it passes near — the web between two cards, say.
      float dr = db + max(db, 0.0);
      if (dr < d0) {
        d1 = d0; uv1 = uv0; im1 = im0; dm1 = dm0;
        d0 = dr; uv0 = vec2(0.5); im0 = 1000.0; dm0 = 1.0;
      } else if (dr < d1) {
        d1 = dr; uv1 = vec2(0.5); im1 = 1000.0; dm1 = 1.0;
      }
    }

    // Clamped, not just floored: the distance cull above leaves a step in the
    // field, and an unclamped fwidth across that step paints a half-opaque
    // outline along every cull boundary.
    float aa = clamp(fwidth(d), 0.5, 2.0);
    float alpha = 1.0 - smoothstep(-aa, aa, d);

    // The page's type, in the same warped space as the field. The sheet has
    // no mipmaps, so sampling inside a loop with early-outs is safe.
    float tA = 0.0;
    for (int t = 0; t < MAX_TEXT; t++) {
      if (float(t) >= uTextCount) break;
      float a = uTextA[t];
      if (a <= 0.001) continue;
      vec4 r = uTextRect[t];
      vec2 q = p - r.xy;
      if (abs(q.x) > r.z || abs(q.y) > r.w) continue;
      vec2 tuv = q / (2.0 * r.zw) + 0.5;
      tuv.y = 1.0 - tuv.y;
      vec4 s = uTextUV[t];
      tA = max(tA, texture2D(uText, s.xy + tuv * s.zw).a * a);
    }

    // The rules, as ink like the type.
    float hw = 0.5 * max(fwidth(p.y), 0.0001);
    for (int i = 0; i < MAX_RULES; i++) {
      vec4 r = uRule[i];
      if (r.w <= 0.001 || p.x < r.x || p.x > r.y) continue;
      float cov = 1.0 - smoothstep(0.5 - hw, 0.5 + hw, abs(p.y - (r.z - 0.5)));
      tA = max(tA, cov * r.w);
    }

    // The word cut out of the pill, in the pill's own (bent) space.
    float bA = 0.0;
    if (uBeadL.x > 0.001) {
      vec2 bq = p - uBead.xy;
      if (abs(bq.x) < uBeadLP.x && abs(bq.y) < uBeadLP.y) {
        bA = texture2D(uBeadTex, bq / (2.0 * uBeadLP.xy) + 0.5).g * uBeadL.x;
      }
    }

    if (alpha <= 0.001 && tA <= 0.001) discard;

    // Even mix where the two nearest planes are equidistant, resolving to
    // whichever is clearly nearer beyond uBlend. Both the art and the dim are
    // carried across on it, so neither can put a seam down the goo.
    // Against the bead the crossfade is its own, narrower, so the drop keeps
    // its colour up to the neck instead of staining the card it touches.
    float bl = max(im0, im1) > 999.5 ? uBeadR.w : uBlend;
    float nearest = smoothstep(-bl, bl, d1 - d0);

    vec3 col = uColor;
    if (uTextured > 0.5) {
      vec2 fr = vec2(uFringe * bend / max(uSize.x, 1.0), 0.0);
      vec3 c0 = artAt(uv0, im0, fr);
      vec3 c1 = artAt(uv1, im1, fr);
      if (uLook > 0.5) {
        c0 = compileAt(c0, uv0, lq0, sz0, bd0, im0, d0, fr);
        c1 = compileAt(c1, uv1, lq1, sz1, bd1, im1, d1, fr);
      }
      col = mix(c1, c0, nearest);
    }

    // Cards standing off the one being pointed at are turned down, so the
    // hovered card reads as the lit one. Untextured, uColor is already almost
    // black and there is nothing here to see — which is fine, that mode exists
    // to read the goo's silhouette.
    // The room's tone on the art: blacks lifted toward the paper, then
    // gained. Identity in the dark room.
    if (uTextured > 0.5) col = col * uTone.y + uTone.x * (1.0 - col);

    col *= mix(dm1, dm0, nearest);

    // A card is deeper than the bead over most of it, so the race alone would
    // hide it there; it sits on top of whatever it is dragged across — but
    // for the word, where the picture shows through, a little darker.
    if (dd < aa) {
      float bc = 1.0 - smoothstep(-aa, aa, dd);
      col = mix(col, uColor, bc * (1.0 - bA));
      col = mix(col, col * uBeadLP.z, bc * bA);
    }

    // A touch of lift where the lip is steepest, so the band reads as a
    // surface catching light rather than only a warp.
    col += bend * uSheen;

    // Ink over whatever is under it: the plane where there is one, nothing
    // where there is not — col is the nearest plane's edge colour there, and
    // mixing toward it would tint the antialiased edge of every letter.
    if (tA > 0.001) {
      vec3 base = mix(uColor, col, clamp(alpha, 0.0, 1.0));
      col = mix(base, uColor, tA);
      alpha = max(alpha, tA);
    }

    // Written straight through. The atlas is tagged NoColorSpace so sampling
    // returns the authored sRGB values, and this shader adds no output
    // encoding of its own — decoding on read without encoding on write is
    // what darkens everything.
    gl_FragColor = vec4(col, alpha);
  }
`,p=(e,t)=>new Promise((a,r)=>{let l=new Image;t&&(l.fetchPriority=t),l.onload=()=>a(l),l.onerror=()=>r(Error(`failed to load ${e}`)),l.src=e}),m=["left","right"],f=e=>e?.firstElementChild?.children;function v(e,t,a){e&&(t>=1?(e.style.filter="none",e.style.opacity="1"):t<=0?(e.style.filter="none",e.style.opacity="0"):(e.style.filter=`blur(${Math.min(a/t-a,100)}px)`,e.style.opacity=`${Math.pow(t,.4)}`))}function x(e,t,a){let r={t:1},l=["",""],o=[!1,!1],i=()=>{let l=t[e];if(!l)return;let i=f(l.layers[0]),n=f(l.layers[1]),s=f(l.plain),u=r.t;for(let e=0;e<2;e++)o[e]?(v(i?.[e],1-u,l.blur??a.nameBlur),v(n?.[e],u,l.blur??a.nameBlur),s?.[e]&&(s[e].style.opacity="0")):(i?.[e]&&(i[e].style.opacity="0"),n?.[e]&&(n[e].style.opacity="0"),s?.[e]&&(s[e].style.opacity="1"));l.goo&&(l.goo.style.filter=u>=1?"none":`url(#name-goo) blur(${a.nameSoften}px)`)};return{m:r,set:(s,u)=>{let d=t[e];if(!d?.layers[0]||!d.layers[1]||!d.plain)return;n.default.killTweensOf(r),r.t=1,i();let c=[s[0]??"",s[1]??""];o=[c[0]!==l[0],c[1]!==l[1]];let h=f(d.layers[0]),p=f(d.layers[1]),m=f(d.plain);for(let e=0;e<2;e++)h?.[e]&&(h[e].textContent=l[e]),p?.[e]&&(p[e].textContent=c[e]),m?.[e]&&(m[e].textContent=c[e]);if(l=c,!o[0]&&!o[1]){r.t=1,i();return}r.t=0,i(),n.default.to(r,{t:1,duration:u??a.nameMorphTime,ease:a.nameEase,onUpdate:i})},settle:()=>{n.default.killTweensOf(r),r.t=1,i()}}}let g=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,w=`
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uTex;
  uniform float uReveal;
  uniform vec3  uColor;
  uniform float uOpacity;

  void main() {
    float gy = vUv.y + 1.0 - uReveal;
    if (gy > 1.0 || gy < 0.0) discard;

    float a = texture2D(uTex, vec2(vUv.x, gy)).a;
    if (a <= 0.001) discard;

    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`,y=2*Math.PI,b=Math.PI/2,M=Math.PI/180,k=e=>e<0?0:e>1?1:e,S=e=>1-Math.pow(1-e,3),_=e=>e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2,T=(e,t,a)=>{let r=k((a-e)/(t-e));return r*r*(3-2*r)},R=e=>0===e?0:e%2==1?(e+1)/2:-e/2,L=(e,t)=>1-Math.pow(1-t,60*e);var j=e.i(88659);let A="{}[]()<>/;:=+-*&|!?#$%_.,'\"01234567abcdefghijklmnopqrstuvwxyzAEFRS";function P(e){let t=document.createElement("canvas");t.width=t.height=512;let a=t.getContext("2d");a.fillStyle="#fff",a.textAlign="center",a.textBaseline="middle",a.font=`400 39.68px ${e}`;for(let e=0;e<64;e++){let t=A[e%A.length];a.fillText(t,e%8*64+32,64*Math.floor(e/8)+32)}let r=new u.CanvasTexture(t);return r.flipY=!1,r.minFilter=u.LinearMipmapLinearFilter,r.magFilter=u.LinearFilter,r.generateMipmaps=!0,r}var C=e.i(79422);let W="work-ring",E=e=>{try{sessionStorage.setItem(W,JSON.stringify({cell:e}))}catch{}},z=()=>{let e=new u.DataTexture(new Uint8Array([255,255,255,255]),1,1);return e.needsUpdate=!0,e};function B({projects:e,onOpen:r,onFront:l,onReveal:o,onFail:i,api:s,bare:f=!1,look:v="honey",beforeLaunch:A,dealFrom:N}){let F=(0,a.useRef)(null),q=(0,a.useRef)(null),$=(0,a.useRef)(null),G=(0,a.useRef)([]),D=(0,a.useRef)(null),O=(0,a.useRef)(null),H=(0,a.useRef)(null),V=(0,a.useRef)(null),U=(0,a.useRef)(null),I=(0,a.useRef)(null),K=(0,a.useRef)(null),X=(0,a.useRef)(r),Y=(0,a.useRef)(l),Z=(0,a.useRef)(o),J=(0,a.useRef)(i),Q=(0,a.useRef)(A),ee=(0,a.useRef)(N),et=(0,a.useRef)(s);(0,a.useEffect)(()=>{J.current=i,X.current=r,Y.current=l,Z.current=o,Q.current=A,ee.current=N});let ea=(0,a.useRef)({left:{box:null,goo:null,layers:[],plain:null},right:{box:null,goo:null,layers:[],plain:null}}),er=(0,a.useRef)(e),el=(0,a.useRef)(v);(0,a.useEffect)(()=>{let e,t,a,r,l,o,i,s=F.current,f=q.current,v=$.current,A=D.current,C=H.current,B=er.current,N=et.current;if(!s||!f||!B.length)return;let eo=!1,ei=function(e=18){let t=340*Math.sin(Math.PI/18)/Math.sin(Math.PI/Math.max(3,e)),a=(e,a)=>(340-t)*a*e/756;return{refWidth:1512,refHeight:870,fitHeight:0,minScale:.5,maxScale:1.75,narrowAt:1024,narrowPlane:1,narrowRadius:1.3,narrowText:1.5,narrowPosX:-2.5+a(4.22,1.3),narrowEndScale:4.22,tightAt:640,tightRadius:.82,tightCard:.74,tightCardH:.32,tightSpacing:.58,tightSplit:.8,planeSize:90,aspect:1.76,count:e,ringRadius:t,seed:0,radial:!0,radius:0,textured:!0,blend:14,imageOffset:0,holdAfter:0,loaderChase:.18,loaderBottom:1,loaderOut:.45,stagger:.34,launchTime:1.95,spreadEase:"power2.out",spreadTime:3.6,stageAt:.7,spinTurns:1,spinTime:2.6,spinEase:"power2.inOut",spinDelay:0,posX:-2+a(4.46,1),posY:0,endScale:4.46,moveTime:2.2,moveEase:"power2.inOut",moveDelay:.2,scrollSpeed:.0022,damping:.94,maxSpeed:12,dragSpeed:1,snap:!0,snapTime:.8,snapFrom:1,pickTime:.55,pickEase:"power3.inOut",paper:"#ffffff",ink:"#141110",toneLift:0,toneGain:1,text:"Work '26",textSize:41,face:"ui-sans-serif, system-ui, sans-serif",textWeight:400,textTracking:0,textAt:.42,textTime:.95,textStagger:.015,textEase:"power4.out",textOut:!0,textOutAt:-.5,textOutTime:.7,textOutEase:"power2.in",metaLeft:5.5,metaRight:5.5,titleSize:8.5,narrowTitle:1,tightTitle:1.25,titleGap:2,titleBlur:.15,titleDim:1,titleLean:.6,titleLeanMax:7,metaSize:1.15,metaMin:14,smallMin:13,metaGapR:1.2,blockGap:5,listReach:2.2,glow:.16,glowSpread:64,glowLight:30,grain:.05,grainBlend:"multiply",vignette:0,nameSize:24/1440*100,nameWeight:500,idxSize:16/1440*100,idxWeight:400,listSize:1,listDim:.28,nameMorphTime:1.2,nameEase:"circ.out",nameBlur:8.5,nameEdge:400,nameCut:.33,nameSoften:.35,glass:!0,bandTop:.08,bandBottom:.08,refract:60,squeeze:.05,ripple:5,rippleFreq:.02,fringe:1.5,sheen:.05,hover:!0,touchHold:.16,touchSlop:10,lag:.3,melt:34,meltReach:260,reach:1.7,swell:.09,pull:26,grab:.14,release:.06,web:.2,webReach:1.15,wave:4,waveFreq:.05,waveSpeed:7,sideScale:.035,sidePush:17,sideDim:.15,sideReach:2.4,beadSize:14,beadPillH:15,beadPillPad:15,beadKnock:.55,beadTail:.38,beadLag:.3,beadStretch:2.6,beadMelt:20,beadReach:64,beadInk:2.5,beadSnap:240,beadHold:1.3,tagText:"View",wordSize:13,openTime:1.25,openEase:"expo.inOut",openPush:320,openShrink:.6,openWeb:.3,tightOpenWeb:.1,openMelt:50,openWobble:2.5,thread:1,thin:.4,pinch:.35,sag:6,dissolve:2.9,fillet:14,wobble:3,goo:35}}(Math.max(1,t=B.length)*Math.max(1,Math.floor(18/Math.max(1,t)))),en="compile"===el.current,es="viscose"===el.current;es&&(ei.stagger=.5),en&&Object.assign(ei,{goo:0,wobble:0,glass:!1,glow:0,blend:1,pull:0,swell:.02,sidePush:0,sideDim:0,melt:0,wave:0,openMelt:0,openWobble:0,openWeb:0,tightOpenWeb:0});let eu=getComputedStyle(document.documentElement).getPropertyValue("--font-space-grotesk").trim();eu&&(ei.face=`${eu}, ui-sans-serif, system-ui, sans-serif`);let ed=getComputedStyle(document.documentElement).getPropertyValue("--font-space-mono").trim(),ec=`${ed?`${ed}, `:""}ui-monospace, monospace`,eh=(()=>{try{return JSON.parse(sessionStorage.getItem(W)||"null")}catch{return null}})(),ep=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1;eh&&Number.isInteger(eh.cell)&&(ei.imageOffset=eh.cell%B.length);let em={progress:0,launch:0,spread:0,spin:0,shift:0,slide:1};try{e=new d.WebGLRenderer({antialias:!0,alpha:!0})}catch(e){console.error("[ring] could not create a WebGL context:",e),s.dataset.fallback="",J.current?.();return}e.setPixelRatio(Math.min(window.devicePixelRatio,window.innerWidth<=640?1.5:2)),f.appendChild(e.domElement);let ef=new u.Scene,ev=new u.OrthographicCamera(-1,1,1,-1,-100,100),ex=z(),eg=z(),ew=new u.DataTexture(new Uint8Array([0,0,0,0]),1,1);ew.needsUpdate=!0;let ey={uResolution:{value:new u.Vector2(1,1)},uSize:{value:new u.Vector2(150,100)},uRadius:{value:ei.radius},uCount:{value:ei.count},uPos:{value:Array.from({length:18},()=>new u.Vector2)},uRot:{value:new Float32Array(18)},uScale:{value:Array.from({length:18},()=>new u.Vector4(0,0,1,0))},uLinkCount:{value:0},uLinkA:{value:Array.from({length:18},()=>new u.Vector2)},uLinkB:{value:Array.from({length:18},()=>new u.Vector2)},uLinkPar:{value:Array.from({length:18},()=>new u.Vector4)},uK:{value:ei.goo},uWobble:{value:ei.wobble},uTime:{value:0},uColor:{value:new u.Color(ei.ink)},uTone:{value:new u.Vector2(ei.toneLift,ei.toneGain)},uAtlas:{value:z()},uGrid:{value:new u.Vector2(1,1)},uBlend:{value:ei.blend},uTextured:{value:0},uBandTop:{value:0},uBandBottom:{value:0},uGlass:{value:new u.Vector4},uFringe:{value:0},uSheen:{value:0},uMouse:{value:new u.Vector4},uMelt:{value:new u.Vector4},uBead:{value:new u.Vector4(-1e4,-1e4,-1e4,-1e4)},uBeadR:{value:new u.Vector4},uBeadT:{value:new u.Vector4(0,0,-100,-100)},uBeadTex:{value:ew},uBeadL:{value:new u.Vector4},uBeadLP:{value:new u.Vector4(1,1,1,0)},uHero:{value:ex},uHeroP:{value:new u.Vector4(-1,0,1,1)},uHeroC:{value:new u.Vector2(1,1)},uLive:{value:eg},uLiveP:{value:new u.Vector4(-1,0,1,1)},uMore:{value:eg},uMoreP:{value:new u.Vector4(1e6,1,0,0)},uText:{value:ew},uTextCount:{value:0},uTextRect:{value:Array.from({length:1},()=>new u.Vector4)},uTextUV:{value:Array.from({length:1},()=>new u.Vector4)},uTextA:{value:new Float32Array(1)},uRule:{value:Array.from({length:1},()=>new u.Vector4)},uLook:{value:+!!en},uSharp:{value:+!!es},uBuild:{value:new Float32Array(18)},uGlyph:{value:en?P(ec):ew},uPaper:{value:new u.Color}},eb=new u.Mesh(new u.PlaneGeometry(1,1),new u.ShaderMaterial({vertexShader:c,fragmentShader:h,uniforms:ey,transparent:!0,depthWrite:!1}));eb.renderOrder=10,ef.add(eb);let eM=new u.Group;ef.add(eM),(()=>{if(s.style.setProperty("--vc-paper",ei.paper),s.style.setProperty("--vc-ink",ei.ink),ey.uColor.value.setStyle(ei.ink,u.LinearSRGBColorSpace),ey.uPaper.value.setStyle(ei.paper,u.LinearSRGBColorSpace),ey.uTone.value.set(ei.toneLift,ei.toneGain),H.current){let e=new u.Color(ei.paper).convertLinearToSRGB(),t=document.createElement("canvas");t.width=t.height=64;let a=t.getContext("2d"),r=a.createImageData(64,64),l=[e.r,e.g,e.b].map(e=>Math.round(255*e));for(let e=0;e<r.data.length;e+=4){let t=(.5>Math.random()?0:1)+(.5>Math.random()?0:1)-1;r.data[e]=l[0]+t,r.data[e+1]=l[1]+t,r.data[e+2]=l[2]+t,r.data[e+3]=255}a.putImageData(r,0,0),H.current.style.setProperty("--dither",`url(${t.toDataURL()})`)}})();let ek=(a=[],r=[],{build:()=>{l();let e=ei.textSize,t=2*Math.min(window.devicePixelRatio,2),o=`${ei.textWeight} ${e}px ${ei.face}`,i=document.createElement("canvas").getContext("2d");i.font=o;let n=[...ei.text],s=n.map(e=>i.measureText(e).width),d=ei.textTracking*e,c=s.reduce((e,t)=>e+t,0)+d*(n.length-1),h=.25*e,p=1.3*e+2*h,m=-c/2;n.forEach((l,i)=>{let n=s[i];if(l.trim()){let i=n+2*h,s=document.createElement("canvas");s.width=Math.max(1,Math.ceil(i*t)),s.height=Math.max(1,Math.ceil(p*t));let d=s.getContext("2d");d.scale(t,t),d.font=o,d.textBaseline="alphabetic",d.fillStyle="#000",d.fillText(l,h,h+e);let c=new u.CanvasTexture(s);c.colorSpace=u.NoColorSpace,c.minFilter=u.LinearFilter,c.magFilter=u.LinearFilter,c.generateMipmaps=!1;let f=new u.ShaderMaterial({vertexShader:g,fragmentShader:w,uniforms:{uTex:{value:c},uReveal:{value:0},uColor:{value:new u.Color().setStyle(ei.ink,u.LinearSRGBColorSpace)},uOpacity:{value:1}},transparent:!0,depthTest:!1,depthWrite:!1}),v=new u.Mesh(new u.PlaneGeometry(1,1),f);v.scale.set(i,p,1),v.position.set(m+n/2,0,0),v.renderOrder=0,eM.add(v),a.push(f.uniforms.uReveal),r.push(f.uniforms.uOpacity)}m+=n+d})},dispose:l=()=>{for(let e of[...eM.children])eM.remove(e),e.geometry.dispose(),e.material.uniforms.uTex.value?.dispose(),e.material.dispose();a=[],r=[]},get chars(){return a},get fades(){return r}}),eS=(o=null,i=0,{build:()=>{let e=String(ei.tagText).toUpperCase(),t=2*Math.min(window.devicePixelRatio,2),a=document.createElement("canvas");a.width=Math.ceil(160*t),a.height=Math.ceil(40*t);let r=a.getContext("2d");r.fillStyle="#000",r.fillRect(0,0,a.width,a.height),r.scale(t,t),r.font=`500 ${ei.wordSize}px ${ei.face}`;let l=.1*ei.wordSize;"letterSpacing"in r&&(r.letterSpacing=`${l}px`),r.textAlign="center",r.textBaseline="middle",i=r.measureText(e).width-l,r.fillStyle="#0f0",r.fillText(e,80+.5*l,20),o?.dispose(),(o=new u.CanvasTexture(a)).colorSpace=u.NoColorSpace,o.minFilter=u.LinearFilter,o.magFilter=u.LinearFilter,o.generateMipmaps=!1,ey.uBeadTex.value=o;let n=ey.uBeadLP.value;n.set(80,20,n.z,n.w)},dispose:()=>o?.dispose(),get width(){return i}}),e_=function(e,t,a){let{groups:r,loader:l,cut:o,live:i,count:s}=e,u=x("left",r,t),d=x("right",r,t),c=()=>{o?.setAttribute("values",`1 0 0 0 0
       0 1 0 0 0
       0 0 1 0 0
       0 0 0 ${t.nameEdge} ${-t.nameEdge*t.nameCut}`)},h=0;return{show:(e,t)=>{let r=a[e];r&&(u.set([String(e+1).padStart(2,"0"),r.title],t),d.set([r.type,r.year],t),s&&(s.textContent=`${String(e+1).padStart(2,"0")} / ${String(a.length).padStart(2,"0")}`),i&&(i.textContent=`${r.title}. ${r.type}, ${r.year}.`))},style:({textK:e,viewW:a,titleVw:o,titleX:i,blockX:n,blockW:u,blockY:d,under:h,cardTop:p})=>{let f=t.titleGap/100*(.65*a),v=o*a/100,x=Math.max(t.metaMin,t.metaSize*e*a/100),g=Math.max(t.smallMin,t.idxSize*e*a/100),w=null!=h?h+.5*g+.75*x:d,y=t.face,b=t.face,M=t.face;for(let e of m){let l=r[e];if(!l?.box)continue;let s="left"===e;l.box.style.display="";let d=s?v:x;l.blur=s?v*t.titleBlur:t.nameBlur;let c=3*d;for(let e of(l.box.style.height=`${c}px`,s?(l.box.style.width=`${Math.max(1,a-i)}px`,l.box.style.left=`${i}px`,l.box.style.right="auto",l.box.style.top=`${p-f-.5*v-.5*c}px`,l.box.style.bottom="",l.box.style.transform="none",l.box.style.translate="none",l.box.style.zIndex="-1"):(l.box.style.width=`${Math.max(160,u)}px`,l.box.style.left=`${n}px`,l.box.style.right="auto",l.box.style.top=`${w+.75*x}px`,l.box.style.bottom="",l.box.style.transform="",l.box.style.translate="",l.box.style.zIndex=""),[...l.layers,l.plain])){if(!e)continue;e.style.alignItems="",e.style.justifyContent="flex-start";let r=e.firstElementChild;r.style.alignItems="",r.style.flexDirection="",r.style.gap=s?"0":`${Math.max(.6*x,t.metaGapR*a/100)}px`,r.style.opacity=s?`${t.titleDim}`:"";let[l,i]=r.children;l.style.display=s?"none":"",l.style.order="",l.style.marginTop="",l.style.marginLeft="",l.style.lineHeight="",l.style.letterSpacing="",l.style.color="",l.style.fontFamily=b,l.style.fontSize=`${x}px`,l.style.fontWeight=`${t.nameWeight}`,i.style.fontFamily=s?y:M,i.style.fontSize=s?`${o}vw`:`${g}px`,i.style.fontWeight=s?`${t.textWeight}`:`${t.idxWeight}`,i.style.letterSpacing=s?"-0.03em":"",i.style.lineHeight=s?"1":"",i.style.color=""}}s&&(s.style.left=`${n}px`,s.style.top=`${w-.75*x}px`,s.style.fontFamily=M,s.style.fontSize=`${g}px`,s.style.fontWeight=`${t.idxWeight}`,s.style.color="var(--vc-ink-2)"),l&&(l.style.bottom=`${t.loaderBottom}vh`,l.style.fontFamily=M,l.style.fontSize=`${g}px`,l.style.fontWeight=`${t.idxWeight}`),c()},setThreshold:c,settle:()=>{u.settle(),d.settle()},lean:e=>{if(.02>Math.abs(e-h))return;h=e;let t=r.left;if(!t)return;let a=.02>Math.abs(e)?"":`skewX(${(-e).toFixed(2)}deg)`;for(let e of[...t.layers,t.plain]){let t=e?.firstElementChild;t&&(t.style.transform=a)}},dispose:()=>{n.default.killTweensOf(u.m),n.default.killTweensOf(d.m)}}}({groups:ea.current,list:v,loader:A,cut:I.current,live:U.current,count:O.current},ei,B),eT=!1,eR=0,eL=!1,ej=[],eA=e=>eL?e():ej.push(e),eP=[],eC=function(e,t,a=4096,r,l=.4,o=1.5){let i,n=Math.ceil(Math.sqrt(e.length)),s=Math.ceil(e.length/n),d=(i=Math.min(window.devicePixelRatio||1,2),Math.min(Math.min(1024,Math.max(512,Math.round(window.innerWidth*l*i))),Math.floor(a/n))),c=Math.round(d/o),h=document.createElement("canvas");h.width=n*d,h.height=s*c;let m=h.getContext("2d"),f=new u.CanvasTexture(h);f.flipY=!1,f.colorSpace=u.NoColorSpace,f.wrapS=u.ClampToEdgeWrapping,f.wrapT=u.ClampToEdgeWrapping,f.minFilter=u.LinearMipmapLinearFilter,f.magFilter=u.LinearFilter,f.generateMipmaps=!0;let v=document.createElement("canvas");v.width=v.height=8;let x=v.getContext("2d",{willReadFrequently:!0}),g=0,w=()=>t?.(g/e.length),y=(t,a)=>p(e[t],a).then(e=>{let a,l,o,i,s;return a=t%n*d,l=Math.floor(t/n)*c,o=Math.max(d/e.width,c/e.height),i=e.width*o,s=e.height*o,void(m.save(),m.beginPath(),m.rect(a,l,d,c),m.clip(),m.drawImage(e,a+(d-i)/2,l+(c-s)/2,i,s),m.restore(),r?.(t,(e=>{x.drawImage(e,0,0,8,8);let t=x.getImageData(0,0,8,8).data,a=0,r=0,l=0;for(let e=0;e<t.length;e+=4)a+=t[e],r+=t[e+1],l+=t[e+2];let o=t.length/4;return[a/o,r/o,l/o]})(e)))}).catch(e=>console.warn("[atlas]",e.message)).finally(()=>{g++,w()}),b=y(0,"high").then(()=>{f.needsUpdate=!0}),M=Promise.all([b,...e.slice(1).map((e,t)=>y(t+1,"low"))]).then(()=>{f.needsUpdate=!0});return w(),{texture:f,grid:[n,s],count:e.length,first:b,ready:M}}(B.map(e=>e.cover),e=>{eo||(eR=e)},e.capabilities.maxTextureSize,(e,t)=>{eo||(eP[e]=(([e,t,a])=>{let r=Math.max(e/=255,t/=255,a/=255),l=Math.min(e,t,a),o=r-l,i=0,n=0;o>1e-4&&(n=o/(1-Math.abs((r+l)/2*2-1)),i=(60*(i=r===e?(t-a)/o%6:r===t?(a-e)/o+2:(e-t)/o+4)+360)%360);let s=ei.glowLight,u=s<50?Math.min(45,80*n):Math.min(55,120*n);return`hsl(${i.toFixed(0)} ${u.toFixed(0)}% ${s}%)`})(t),e===tK&&t3())},window.innerWidth<=ei.tightAt?Math.max(.4,ei.tightCard):.4,ei.aspect);ey.uAtlas.value.dispose(),eC.texture.anisotropy=e.capabilities.getMaxAnisotropy(),ey.uAtlas.value=eC.texture,ey.uGrid.value.set(eC.grid[0],eC.grid[1]);let eW=eC.count,eE=e=>{let t=Math.round(ei.imageOffset);return eW>0?((t-e)%eW+eW)%eW:0};eC.first.then(()=>{eo||(eT=!0)}),eC.ready.then(()=>{eo||(eR=1)});let ez=1,eB=1,eN={left:0,top:0},eF=1,eq=1,e$=1,eG=1,eD=!1,eO=!1,eH=1,eV=0,eU=()=>eO?eH:eD?ei.narrowEndScale:ei.endScale,eI=0,eK=()=>{let e,t,a,r,l;eI=(e=document.querySelector("[data-site-nav]"))?e.getBoundingClientRect().bottom:0;let o=`${ei.listSize*eG}vw`;if(V.current&&(V.current.style.opacity=`${ei.grain}`,V.current.dataset.blend=ei.grainBlend),H.current){let e=H.current;e.style.setProperty("--vig",`${ei.vignette}`),e.style.setProperty("--glow-a",`${ei.glow}`),e.style.setProperty("--glow-w",`${ei.glowSpread}vw`),e.style.setProperty("--glow-h",`${.7*ei.glowSpread}vw`)}v&&(v.style.right=`${ei.metaRight}vw`,v.style.fontSize=`max(13px, ${o})`,eO?v.dataset.hidden="":delete v.dataset.hidden);let i=eU()*eF,n=ei.planeSize*eq*i,s=ei.blockGap/100*ez,u=.5*ez+.5*n+s,d=v&&!eO?v.offsetWidth:0,c=ei.metaRight/100*ez,h=ez-c-(d?d+.6*s:0)-u,p=.5*eB-n/ei.aspect/2,m=eO;e_.style({textK:eG,viewW:ez,titleVw:(t=ei.titleSize*(eO?ei.tightTitle:eD?ei.narrowTitle:1),a=eU()*eF,r=ei.planeSize*eq*a,l=.5*eB-r/ei.aspect/2-ei.titleGap/100*(.65*ez)-Math.max(ei.glass?ei.bandTop*eB:0,eI+8),Math.min(t,92/Math.max(1,.56*Math.max(...B.map(e=>e.title.length))),Math.max(3,l/ez*100))),titleX:m?.5*ez-.5*n:ei.metaLeft/100*ez,blockX:m?.5*ez-.5*n:u,blockW:m?n:h,blockY:.5*eB,under:m?.5*eB+n/ei.aspect/2+.035*ez:null,cardTop:p})},eX=()=>[v,O.current].filter(Boolean),eY=()=>{ez=f.clientWidth,eB=f.clientHeight,(()=>{let e=ez/Math.max(1,ei.refWidth),t=eB/Math.max(1,ei.refHeight),a=e*(1-ei.fitHeight)+Math.min(e,t)*ei.fitHeight;eF=Math.min(ei.maxScale,Math.max(ei.minScale,a));let r=eB>1.15*ez,l=ez<=ei.narrowAt,o=ez<=ei.tightAt||l&&r;if(eD=l,eO=o,eq=l?ei.narrowPlane:1,e$=(l?ei.narrowRadius:1)*(o?ei.tightRadius:1),eG=l?ei.narrowText:1,o){let e=ei.ringRadius*e$*eF,t=ei.tightSpacing*eB/(2*Math.sin(Math.PI/Math.max(3,Math.round(ei.count))));eq=Math.min(ei.tightCard*ez,eB*ei.tightCardH)/(eH=Math.max(1,t/e))/(ei.planeSize*eF),eV=-t/(.5*ez)}let i=eF*eG*(o?ei.tightSplit:1);eM.scale.set(i,i,1)})(),e.setSize(ez,eB),ev.left=-ez/2,ev.right=ez/2,ev.top=eB/2,ev.bottom=-eB/2,ev.updateProjectionMatrix(),eb.scale.set(ez,eB,1),ey.uResolution.value.set(ez,eB);let t=e.domElement.getBoundingClientRect();eN.left=t.left,eN.top=t.top},eZ=()=>{eY(),eK(),al=!0};eY(),window.addEventListener("resize",eZ);let eJ={x:0,y:0},eQ=0,e0=!1,e1=0,e2=!1,e5=0,e3=0,e4=!1,e6=0,e8=0,e9=!1,e7=-1,te={f:0},tt=null,ta=-1,tr={mix:0},tl=null,to=-1,ti=0,tn=ei.aspect,ts=0,tu=0,td=0,tc=e=>{let t=e.clientX-eN.left-eJ.x;return Math.atan2(-(e.clientY-eN.top-eJ.y),t)},th=()=>{e9&&(n.default.killTweensOf(em),e9=!1)},tp=(e,t=!0)=>{let _vIdx=eE(R(e));if(window.playVideoFullscreen&&B&&B[_vIdx]){window.playVideoFullscreen(B[_vIdx].slug);return;}let a=y/Math.round(ei.count),r=eQ-ei.seed*M-R(e)*a,l=r+Math.round((em.spin-r)/y)*y,o=Math.abs(l-em.spin)/a;if(o<.01){t&&tv(e);return}let i=ei.pickTime*Math.sqrt(Math.max(1,o)),s=eE(R(e));tX!==s&&(e_.show(s,Math.min(ei.nameMorphTime,i)),tX=s),e1=0,e4=!1,e9=!0,n.default.killTweensOf(em),n.default.to(em,{spin:l,duration:i,ease:ei.pickEase,onComplete:()=>{e9=!1,t&&tv(e)}})},tm=e=>{let t=Math.round(ei.count),a=y/t,r=-1,l=1/0;for(let o=0;o<t;o++){if(eE(R(o))!==e)continue;let t=eQ-ei.seed*M-R(o)*a,i=Math.abs(t+Math.round((em.spin-t)/y)*y-em.spin);i<l&&(l=i,r=o)}return r},tf=()=>[ea.current.left.box,ea.current.right.box].filter(Boolean),tv=t=>{let _vIdx2=eE(R(t));if(window.playVideoFullscreen&&B&&B[_vIdx2]){window.playVideoFullscreen(B[_vIdx2].slug);return;}let a,r;if(e7>=0||!e0)return;e7=t,(0,j.playSound)(j.WHOOSH,{gain:.5});let l=eE(R(t));tX!==l&&(e_.show(l),tX=l,typeof window!=="undefined"&&B&&B[l]&&(window.currentWorkSlug=B[l].slug)),E(l),a=++ti,r=B[l],to=-1,r&&p(r.cover,"high").then(t=>{if(eo||a!==ti)return;tl?.dispose();let r=new u.Texture(t);r.flipY=!1,r.colorSpace=u.NoColorSpace,r.wrapS=u.ClampToEdgeWrapping,r.wrapT=u.ClampToEdgeWrapping,r.minFilter=u.LinearMipmapLinearFilter,r.magFilter=u.LinearFilter,r.generateMipmaps=!0,r.anisotropy=e.capabilities.getMaxAnisotropy(),r.needsUpdate=!0,tl=r,to=l,tn=t.width/Math.max(1,t.height),ey.uHero.value=r}).catch(e=>console.warn("[open]",e.message)),t5(),U.current&&(U.current.textContent=`Opening ${B[l].title}.`);let o=ei.openTime;tt?.kill(),(tt=n.default.timeline({onComplete:()=>{eo||X.current?.(B[l],{left:eN.left,top:eN.top,width:ez,height:eB})}})).to(te,{f:1,duration:o,ease:"none"},0),tt.to(tr,{mix:1,duration:.3*o,ease:"power1.inOut"},0),tt.to([...tf(),...eX()],{opacity:0,duration:.35,ease:"power2.out"},0),H.current&&tt.to(H.current,{"--glow-on":0,duration:.35,ease:"power2.out"},0)},tx=()=>{tt?.kill(),tt=null,e7=-1,te.f=0,tr.mix=0,ti++,to=-1,ey.uHero.value=ex,tl?.dispose(),tl=null,n.default.set(tf(),{opacity:1}),e0&&(n.default.set(eX(),{opacity:1}),H.current&&n.default.set(H.current,{"--glow-on":1})),t5()},tg=e=>{e.persisted&&e7>=0&&tx()};window.addEventListener("pageshow",tg);let tw=e=>{if(!e0||e7>=0||tK<0)return;let t=tm(((tK+e)%eW+eW)%eW);t>=0&&tp(t,!1)},ty=e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;let t=e.target instanceof HTMLElement&&e.target.closest("a, button, input, textarea, select");"ArrowRight"===e.key||"ArrowDown"===e.key?(e.preventDefault(),tw(1)):"ArrowLeft"===e.key||"ArrowUp"===e.key?(e.preventDefault(),tw(-1)):"Enter"===e.key&&!t&&e0&&e7<0&&ta>=0&&tp(ta)};window.addEventListener("keydown",ty),K.current={open:e=>{if(!e0||e7>=0)return!1;let t=tm(e);return!(t<0)&&(th(),tp(t),!0)},openFront:()=>!!e0&&!(e7>=0)&&!(ta<0)&&(tp(ta),!0),frontRect:()=>{let e=tq[ta>=0?ta:0],t=ey.uSize.value,a=f.getBoundingClientRect();return{x:a.left+.5*ez+e.x-.5*t.x,y:a.top+.5*eB-e.y-.5*t.y,w:t.x,h:t.y}}},N&&(N.current=K.current);let tb={x:0,y:0,inside:!1,seeded:!1},tM={x:0,y:0,amt:0,wake:0},tk=!1,tS=!1,t_=0,tT=()=>{clearTimeout(t_),t_=0,tS=!1},tR=e=>{tk="touch"===e.pointerType,tb.x=e.clientX-eN.left-.5*ez,tb.y=.5*eB-(e.clientY-eN.top),tb.inside=!0,tb.seeded||(tb.seeded=!0,tM.x=tb.x,tM.y=tb.y)},tL=()=>{tb.inside=!1},tj=e=>{if(!e0||e7>=0)return;e.preventDefault();let t=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY,a=1===e.deltaMode?16*t:2===e.deltaMode?t*eB:t;th(),e4=!1,e1+=a*ei.scrollSpeed,e1=Math.max(-ei.maxSpeed,Math.min(ei.maxSpeed,e1))},tA=t=>{if(ts=0,tu=t.clientX,td=t.clientY,tR(t),e0&&!(e7>=0)){th(),tk&&(clearTimeout(t_),t_=setTimeout(()=>{tS=!0},1e3*ei.touchHold)),e2=!0,t5(),e4=!1,e1=0,e5=tc(t),e3=performance.now();try{e.domElement.setPointerCapture?.(t.pointerId)}catch{}}},tP=e=>{if(tR(e),ts+=Math.abs(e.clientX-tu)+Math.abs(e.clientY-td),tu=e.clientX,td=e.clientY,tk&&!tS&&ts>ei.touchSlop&&tT(),!e2)return;let t=tc(e),a=t-e5;a>Math.PI&&(a-=y),a<-Math.PI&&(a+=y);let r=a*ei.dragSpeed;em.spin+=r;let l=performance.now();e1=r/(Math.max(8,l-e3)/1e3),e5=t,e3=l},tC=t=>{if(tR(t),tT(),e2){e2=!1,t5();try{e.domElement.releasePointerCapture?.(t.pointerId)}catch{}tk&&(tb.inside=!1)}},tW=e=>{if(!e0||e7>=0||ts>=(tk?ei.touchSlop:5))return;let t=((e,t)=>{let a=Math.round(ei.count),r=ey.uSize.value.x,l=ey.uSize.value.y;for(let o=0;o<a;o++){let a=ey.uPos.value[o],i=ey.uScale.value[o],n=ey.uRot.value[o],s=e-a.x,u=t-a.y,d=Math.cos(n),c=Math.sin(n);if(Math.abs(s*d+u*c)<=.5*r*i.x&&Math.abs(-s*c+u*d)<=.5*l*i.y)return o}return -1})(e.clientX-eN.left-.5*ez,.5*eB-(e.clientY-eN.top));t>=0&&tp(t)};f.addEventListener("wheel",tj,{passive:!1}),f.addEventListener("pointerdown",tA),f.addEventListener("pointermove",tP),f.addEventListener("pointerup",tC),f.addEventListener("pointercancel",tC),f.addEventListener("pointerleave",tL),f.addEventListener("click",tW);let tE={shown:0},tz=new Float32Array(18),tB=new Float32Array(18),tN=[],tF=(e,t)=>R(e)-R(t),tq=Array.from({length:18},()=>new u.Vector2),t$=new Float32Array(18),tG=new Float32Array(18),tD=new Float32Array(18),tO=new Float32Array(18),tH=new Float32Array(18),tV=new Float32Array(18).fill(1),tU=new u.Vector2,tI=e=>Math.max(.05,1+ei.swell*t$[e]-ei.sideScale*tH[e]),tK=-1,tX=-1,tY=-1,tZ=-1,tJ={on:!1,r:0,v:0,hw:0,hv:0,tx:0,ty:0,word:0,card:-1,from:-1,ax:0,ay:0,s:0,held:!1},tQ={x:-1,y:-1},t0=0,t1=new Float32Array(18),t2=new Float32Array(18).fill(-1),t5=()=>{if(en){let e=!e0||e7>=0?null:e2?"":tZ>=0?"view":"drag";null===e?delete f.dataset.cursor:f.dataset.cursor=e;return}e.domElement.style.cursor=tJ.on?"none":!e0||e7>=0?"":e2?"grabbing":tZ>=0?"pointer":"grab"},t3=()=>{let e=H.current;e&&tK>=0&&eP[tK]&&e.style.setProperty("--glow",eP[tK])},t4=0;eK();let t6=null;en&&document.fonts?.load&&document.fonts.load(`40px ${ec}`).then(()=>{eo||(ey.uGlyph.value.dispose(),ey.uGlyph.value=P(ec),al=!0)}).catch(()=>{});let t8=()=>{eo||t6||(ep||ek.build(),eS.build(),eK(),t6=(()=>{tx(),e0=!1,t5(),tX=-1,e1=0,e2=!1,e4=!1,th();let e=++t4,t=()=>{e0=!0,t5()};if(ep){Object.assign(em,{progress:1,launch:1,spread:1,spin:ei.spinTurns*y,shift:1}),A&&n.default.set(A,{opacity:0}),n.default.set(f,{opacity:0}),n.default.set(eX(),{opacity:0});let a=n.default.timeline({paused:!0,onComplete:t});return a.to(f,{opacity:1,duration:.6,ease:"power2.out"},0),a.call(()=>Z.current?.(),[],.1),a.to(eX(),{opacity:1,duration:.6,ease:"power2.out"},.1),H.current&&a.fromTo(H.current,{"--glow-on":0},{"--glow-on":1,duration:.8,ease:"power2.out"},0),eA(()=>{eo||e!==t4||a.play()}),a}if(A&&n.default.set(A,{opacity:+!eL}),"viscose"===el.current){n.default.set(em,{progress:0,launch:1,spread:0,spin:ei.spinTurns*y,shift:1,slide:0});let a=n.default.timeline({delay:.25,onComplete:t});a.to({},{duration:.01}),a.addPause(">",()=>{eA(()=>{let t=()=>{!eo&&e===t4&&(a.resume(),A&&n.default.to(A,{opacity:0,duration:ei.loaderOut,ease:"power2.in"}))},r=Q.current?.();r?r.then(t,t):t()})}),a.to(em,{progress:1,duration:.5,ease:"power2.out"});let r=a.duration()+.35;a.to(em,{slide:1,duration:1.4,ease:"none"},r);let l=r+.8;a.to(em,{spread:1,duration:3.2,ease:"none"},l);let o=l+.5;a.call(()=>Z.current?.(),[],o);let i=eX();return i.length&&a.fromTo(i,{opacity:0},{opacity:1,duration:ei.textTime,ease:ei.textEase},o),H.current&&a.fromTo(H.current,{"--glow-on":0},{"--glow-on":1,duration:ei.textTime,ease:ei.textEase},o),a}let a=n.default.timeline({delay:.25,onComplete:t});a.fromTo(em,{progress:0,launch:0,spread:0,spin:0,shift:0},{progress:1,duration:1.2,ease:"power2.out"}),a.addPause(">",()=>{eA(()=>{let t=()=>n.default.delayedCall(ei.holdAfter,()=>{!eo&&e===t4&&(a.resume(),A&&n.default.to(A,{opacity:0,duration:ei.loaderOut,ease:"power2.in"}))}),r=Q.current?.();r?r.then(t,t):t()})}),a.to(em,{launch:1,duration:ei.launchTime,ease:"power2.inOut"});let r=a.duration()-.15;a.to(em,{spread:1,duration:ei.spreadTime,ease:ei.spreadEase},r);let l=r+ei.stageAt*ei.spreadTime;a.to(em,{spin:ei.spinTurns*y,duration:ei.spinTime,ease:ei.spinEase},l+ei.spinDelay),a.to(em,{shift:1,duration:ei.moveTime,ease:ei.moveEase},l+ei.moveDelay);let o=r+ei.textAt*ei.spreadTime;if(a.call(()=>Z.current?.(),[],o),ek.chars.length&&a.fromTo(ek.chars,{value:0},{value:1,duration:ei.textTime,ease:ei.textEase,stagger:ei.textStagger},o),ei.textOut&&ek.fades.length){let e=Math.max(l+ei.spinDelay+ei.spinTime,l+ei.moveDelay+ei.moveTime);a.fromTo(ek.fades,{value:1},{value:0,duration:ei.textOutTime,ease:ei.textOutEase,stagger:ei.textStagger},Math.max(0,e+ei.textOutAt))}let i=eX();return i.length&&a.fromTo(i,{opacity:0},{opacity:1,duration:ei.textTime,ease:ei.textEase},o),H.current&&a.fromTo(H.current,{"--glow-on":0},{"--glow-on":1,duration:ei.textTime,ease:ei.textEase},o),a})())},t9=setTimeout(t8,3e3);(document.fonts?.ready??Promise.resolve()).then(t8).catch(t8);let t7=performance.now(),ae=t7,at={cur:new Float64Array(4096),last:new Float64Array(4096)},aa=0,ar=-1,al=!0,ao=e=>{aa<at.cur.length&&(at.cur[aa++]=e)},ai=e=>{if("number"==typeof e)ao(e);else if("boolean"==typeof e)ao(+!!e);else if(e){if(e.isTexture)ao(e.id),ao(e.version);else if(e.isVector2)ao(e.x),ao(e.y);else if(e.isVector3)ao(e.x),ao(e.y),ao(e.z);else if(e.isVector4)ao(e.x),ao(e.y),ao(e.z),ao(e.w);else if(e.isColor)ao(e.r),ao(e.g),ao(e.b);else if(ArrayBuffer.isView(e)||Array.isArray(e))for(let t=0;t<e.length;t++)ai(e[t])}else ao(0)},an=Object.keys(ey).filter(e=>"uTime"!==e).map(e=>ey[e]);return e.setAnimationLoop(()=>{let t,a,r,l=performance.now(),o=Math.min(.05,(l-ae)/1e3);if(ae=l,ey.uTime.value=(l-t7)*.001,e0&&!e2&&!e9&&e7<0){em.spin+=e1*o,e1*=Math.pow(ei.damping,60*o);let e=0;if(ei.snap){let t=y/Math.round(ei.count),a=Math.max(.01,-(60*Math.log(ei.damping))),r=Math.max(ei.snapFrom,a*t*.5),l=4.8/Math.max(.05,ei.snapTime);if(!e4&&Math.abs(e1)<r){let e=em.spin+e1/a,r=ei.seed*M-eQ;e6=Math.round((e+r)/t)*t-r,e8=Math.max(Math.abs(e1),.5*t*l),e4=!0}if(e4){e=e6-em.spin;let t=Math.max(-e8,Math.min(e8,e*l));e1+=(t-e1)*k(l*o)}}else e4=!1;.0015>Math.abs(e1)&&8e-4>Math.abs(e)&&(e1=0,em.spin+=e)}let i=ep||es?eR:Math.min(eR,k(em.progress));tE.shown+=(i-tE.shown)*L(o,ei.loaderChase);let s=Math.min(100,Math.max(1,Math.round(100*tE.shown)));if(A&&!ep&&(A.textContent=String(s).padStart(3,"0")),!eL&&s>=100){for(let e of(eL=!0,ej))e();ej.length=0}t=ei.hover&&(tk?tS:tb.inside)&&tb.seeded&&e0&&e7<0,tM.amt+=(!!t-tM.amt)*L(o,.12),a=L(o,ei.lag),tM.x+=(tb.x-tM.x)*a,tM.y+=(tb.y-tM.y)*a,r=Math.hypot(tb.x-tM.x,tb.y-tM.y),tM.wake=Math.max(tM.wake*Math.pow(.94,60*o),k(r/(2600*Math.max(o,.001)))),ey.uMouse.value.set(tM.x,tM.y,tM.amt,ei.melt*eF),ey.uMelt.value.set(ei.meltReach*eF,ei.wave*eF*tM.wake*tM.amt,ei.waveFreq,ei.waveSpeed),(e=>{let t=Math.round(ei.count);ey.uCount.value=t;let a=y/t,r=k(em.spread),l=eU(),o=eO?eV:eD?ei.narrowPosX:ei.posX,i=k(em.shift),s=(1+(l-1)*i)*eF,u=o*ez*.5*i,d=ei.posY*eB*.5*i;eJ.x=.5*ez+u,eJ.y=.5*eB-d,eQ=0!==u||0!==d?Math.atan2(-d,-u):0;let c=ei.planeSize*eq*s,h=c/ei.aspect;ey.uSize.value.set(c,h),ey.uRadius.value=ei.radius*eq*s;let p=ei.radial?h:c,m=ei.radial?c:h,f=ei.ringRadius*e$*s,v=Math.max(1,2*f*Math.sin(a/2)-p),x=Math.max(1,Math.abs(R(t-1))),g=Math.max(.1,.94-ei.stagger);tB[0]=0;for(let e=1;e<=x;e++){let t=k((r-(.06+(e-1)/x*ei.stagger))/g),a=t*t*(3-2*t);tz[e]=a,tB[e]=tB[e-1]+a}let w=ei.seed*M,j=_(k(em.launch)),A=f*j;if(H.current){let e=.5*ez+Math.cos(eQ)*A+u,t=.5*eB-(Math.sin(eQ)*A+d);(Math.abs(e-tQ.x)>.5||Math.abs(t-tQ.y)>.5)&&(tQ.x=e,tQ.y=t,H.current.style.setProperty("--glow-x",`${e.toFixed(1)}px`),H.current.style.setProperty("--glow-y",`${t.toFixed(1)}px`))}tN.length=0;let P=tM.amt>.001,C=Math.max(1,ei.reach*c),W=Math.max(1,ei.sideReach*c),E=L(e,ei.grab),z=L(e,ei.release),B=-1,N=1e9,F=0,q=tb.inside&&tb.seeded&&e0,$=-1,D=P?tZ:-1,O=e7>=0?k(te.f):0,V=O>0?(n.default.parseEase(ei.openEase)||_)(O):0,U=_(k(O/.6)),I=Math.sin(Math.PI*k(O/.7)),K=1+(ez/c-1)*V,X=1+(eB/h-1)*V,Z=ei.aspect*K/X,J=e7>=0?eE(R(e7)):-1;ey.uHeroP.value.set(J,to===J?tr.mix:0,Math.min(1,Z/ei.aspect),Math.min(1,ei.aspect/Z)),ey.uHeroC.value.set(Math.min(1,Z/tn),Math.min(1,tn/Z)),t1.fill(1e9);for(let e=0;e<t;e++){let t=R(e),r=Math.abs(t),l=0===e?k(em.progress):tz[r],o=eE(t),i=w+Math.sign(t)*a*(es?r:tB[r])+em.spin,n=Math.cos(i)*A+u,s=Math.sin(i)*A+d;tq[e].set(n,s);let p=i-eQ,m=Math.abs(Math.atan2(Math.sin(p),Math.cos(p)));m<N&&(N=m,B=e,F=o),t1[o]=Math.min(t1[o],m/a);let f=0,v=0,x=0;if(P){let e=tM.x-n,t=tM.y-s,a=Math.hypot(e,t);if((f=T(C,.22*C,a)*tM.amt*l)>1e-4&&a>1e-4){let r=ei.pull*eF*f/a;v=e*r,x=t*r}}let g=f>t$[e]?E:z;t$[e]+=(f-t$[e])*g,tG[e]+=(v-tG[e])*g,tD[e]+=(x-tD[e])*g;let y=0;D>=0&&e!==D&&(y=T(W,.2*W,Math.hypot(tU.x-n,tU.y-s))*l),tH[e]+=(y-tH[e])*(y>tH[e]?E:z);let M=0,L=0;if(tH[e]>1e-4){let t=n-tU.x,a=s-tU.y,r=Math.hypot(t,a);if(r>1e-4){let l=ei.sidePush*eF*tH[e]/r;M=t*l,L=a*l}}let G=n+tG[e]+M,H=s+tD[e]+L,I=(ei.radial?i:i+b)*j;es&&(I+=.22*Math.sin(Math.PI*(0===e?k(em.slide):k(l)))*(t<0?-1:1));let Y=1;if(es){let t=_(0===e?k(em.slide):k(l)),a=ee.current?.current,r=a?a.x-.5*ez:eO?0:.25*ez,o=a?.5*eB-a.y:-.3*eB,i=a?Math.min(1,a.w/Math.max(1,c)):.2;G=r+(G-r)*t,H=o+(H-o)*t+.14*Math.sin(Math.PI*t)*eB,Y=i+(1-i)*t}let Z=1,J=1;if(O>0)if(e===e7)G+=(0-G)*V,H+=(0-H)*V,I+=Math.atan2(Math.sin(-I),Math.cos(-I))*V,Z=K,J=X;else{let e=n-tq[e7].x,t=s-tq[e7].y,a=Math.hypot(e,t);if(a>1e-4){let r=e/a,l=t/a,o=.5*Math.hypot(c,h)*(1-ei.openShrink)+(ei.goo*eq+ei.openMelt)*eF,i=1/0;r>.001?i=(.5*ez+o-n)/r:r<-.001&&(i=(-(.5*ez)-o-n)/r),l>.001?i=Math.min(i,(.5*eB+o-s)/l):l<-.001&&(i=Math.min(i,(-(.5*eB)-o-s)/l));let u=Math.max(ei.openPush*eF,i)*U;G+=r*u,H+=l*u}Z=J=1-ei.openShrink*U}tV[e]=ei.radial?J:Z,ey.uPos.value[e].set(G,H),ey.uRot.value[e]=I;let Q=0===e?S(k(l/.7)):S(k(l/.34)),et=0===e?S(k((l-.18)/.74)):S(k((l-.06)/.36)),ea=tI(e);if(ey.uScale.value[e].set(Q*ea*Z*Y,et*ea*J*Y,1-ei.sideDim*tH[e],o),q&&$<0&&e7<0){let t=tM.x-G,a=tM.y-H,r=Math.cos(I),l=Math.sin(I);Math.abs(t*r+a*l)<=.5*c*Q*ea*Z&&Math.abs(-t*l+a*r)<=.5*h*et*ea*J&&($=e)}tN.push(e)}for(let e=t;e<18;e++)ey.uScale.value[e].set(0,0,1,0);if(ta=B,en){let a=e2||e9||Math.abs(e1)>.6,r=ey.uBuild.value;for(let l=0;l<t;l++){let t=l===e7||e0&&!a&&l===B?1:0;r[l]=t>r[l]?Math.min(t,r[l]+e/1.1):Math.max(t,r[l]-e/.45)}}{let e=G.current,t=Math.max(.1,ei.listReach);for(let a=0;a<eW&&a<e.length;a++){let r=e[a];if(!r)continue;let l=k(1-t1[a]/t),o=ei.listDim+(1-ei.listDim)*l*l;Math.abs(o-t2[a])>.004&&(t2[a]=o,r.style.opacity=`${o.toFixed(3)}`,r.style.transform=`translateX(${(-(.45*l)).toFixed(3)}em)`)}}$!==tZ&&(tZ=$,t5());let Q=!en&&!tk&&e7<0;Q!==tJ.on&&(tJ.on=Q,t5());let et=Q&&tb.inside&&!e2&&e0&&tZ>=0,ea=et?tZ:-1;ea!==tJ.card&&(tJ.card>=0&&e7<0&&((e,t,a)=>{let r=ey.uPos.value[e],l=ey.uRot.value[e],o=ey.uScale.value[e],i=.5*t*o.x,n=.5*a*o.y,s=.5*ei.beadSize;if(i<=s||n<=s)return;let u=tb.x-r.x,d=tb.y-r.y,c=Math.cos(l),h=Math.sin(l),p=u*c+d*h,m=-u*h+d*c,f=Math.min(ey.uRadius.value,i,n),v=Math.max(f,s),x=Math.max(-(i-v),Math.min(i-v,p)),g=Math.max(-(n-v),Math.min(n-v,m)),w=p-x,y=m-g,b=Math.hypot(w,y),M=Math.max(0,f-s);b>M&&(w*=M/b,y*=M/b),p=x+w,m=g+y,tJ.from=e,tJ.ax=p/i,tJ.ay=m/n,tJ.s=1,tJ.held=!0})(tJ.card,c,h),tJ.card=ea);let er=Q&&tb.inside&&tb.seeded,el=Math.min(e,1/30),eo=er?et?ei.beadPillH:.5*ei.beadSize:0,eu=et?Math.max(eo,.5*eS.width+ei.beadPillPad):eo;tJ.v+=(eo-tJ.r)*320*el-22*tJ.v*el,tJ.r+=tJ.v*el,tJ.r<=0&&(tJ.r=0,tJ.v=Math.max(0,tJ.v)),tJ.hv+=(eu-tJ.hw)*240*el-15*tJ.hv*el,tJ.hw=Math.max(0,tJ.hw+tJ.hv*el);let ed=tb.x,ec=tb.y;if(er&&!et&&ei.beadReach>0){let e=ei.beadReach;for(let a=0;a<t;a++){let t=ey.uScale.value[a],r=.5*c*t.x,l=.5*h*t.y;if(r<1||l<1)continue;let o=ey.uPos.value[a],i=ey.uRot.value[a],n=Math.cos(i),s=Math.sin(i),u=tb.x-o.x,d=tb.y-o.y,p=u*n+d*s,m=-u*s+d*n,f=Math.min(ey.uRadius.value,r,l),v=Math.max(Math.abs(p)-(r-f),0),x=Math.max(Math.abs(m)-(l-f),0),g=Math.hypot(v,x),w=g-f;if(w<=0||w>=e)continue;e=w;let y=-Math.sign(p)*v/g,b=-Math.sign(m)*x/g,M=T(ei.beadReach,.2*ei.beadReach,w),k=Math.min(w,tJ.r*ei.beadStretch)*M;ed=tb.x+(y*n-b*s)*k,ec=tb.y+(y*s+b*n)*k}}let eh=L(e,ei.beadLag);tJ.tx+=(ed-tJ.tx)*eh,tJ.ty+=(ec-tJ.ty)*eh;{let e=tJ.tx-tb.x,t=tJ.ty-tb.y,a=Math.hypot(e,t),r=Math.max(tJ.r,tJ.hw)+tJ.r*(ei.beadStretch-1);if(a>r){let l=r/a;tJ.tx=tb.x+e*l,tJ.ty=tb.y+t*l}}ey.uBead.value.set(tb.x,tb.y,tJ.tx,tJ.ty),ey.uBeadR.value.set(tJ.r,tJ.r*ei.beadTail,ei.beadMelt,ei.beadInk),tJ.word+=(!!et-tJ.word)*L(e,et?.12:.3);let ep=tJ.word*tJ.word*(3-2*tJ.word),ef=ey.uBeadL.value;ef.x=ep,ef.y=Math.max(tJ.hw,tJ.r),ey.uBeadLP.value.z=ei.beadKnock;let ev=ey.uBeadT.value;if(ev.z=ev.w=-100,tJ.s>0&&tJ.from>=0&&tJ.from<t&&e7<0){let t=ey.uPos.value[tJ.from],a=ey.uRot.value[tJ.from],r=ey.uScale.value[tJ.from],l=tJ.ax*c*.5*r.x,o=tJ.ay*h*.5*r.y,i=Math.cos(a),n=Math.sin(a);ev.x=t.x+l*i-o*n,ev.y=t.y+l*n+o*i;let s=k(Math.hypot(tb.x-ev.x,tb.y-ev.y)/Math.max(1,ei.beadSnap)),u=tJ.s*(1-s*s);u<.2&&tJ.held&&(tJ.v+=2.5*ei.beadSize),tJ.held=u>=.2,tJ.s=Math.max(0,tJ.s-e*(u<.2?6:1/Math.max(.05,ei.beadHold)));let d=tJ.s*(1-s*s),p=Math.min(.85*tJ.r,.42*ei.beadSize*d);ev.z=p-ei.dissolve*(1-d),ev.w=ev.z*(1-(1-ei.pinch)*T(0,.6,s)),ef.z=ei.sag*s,ef.w=Math.min(.5*ei.beadMelt,1.5*Math.max(p,0))}else tJ.s=0;if(tZ>=0&&tU.copy(tq[tZ]),B>=0&&eW>0&&F!==tK){tK=F;let e=G.current;for(let t=0;t<e.length;t++){let a=e[t];a&&(t===tK?a.setAttribute("aria-current","true"):a.removeAttribute("aria-current"))}t3(),Y.current?.(tK);if(typeof window!=="undefined"&&B&&B[tK]){window.currentWorkSlug=B[tK].slug;}}tN.sort(tF);let ex=.5*m*ei.thread,eg=Math.min(r>.995&&t>2?t:t-1,18),ew=e=>{let t=ey.uPos.value[e],a=ey.uScale.value[e],r=Math.abs(Math.cos(ey.uRot.value[e])),l=Math.abs(Math.sin(ey.uRot.value[e])),o=.5*c*a.x,i=.5*h*a.y,n=Math.max(1,r*o+l*i),s=Math.max(1,l*o+r*i);return k(Math.max((Math.abs(t.x)+n-.5*ez)/(2*n),(Math.abs(t.y)+s-.5*eB)/(2*s)))},eb=1;for(let e=0;e<eg;e++){let a=tN[e],r=tN[(e+1)%t],l=ey.uPos.value[a],o=ey.uPos.value[r],i=ey.uScale.value[a],n=ey.uScale.value[r],u=(ei.radial?i.y:i.x)/(tI(a)*tV[a]),d=(ei.radial?n.y:n.x)/(tI(r)*tV[r]),h=k((tq[a].distanceTo(tq[r])-.5*p*(u+d))/v),m=0;if(P&&ei.web>1e-4){let e=(l.x+o.x)*.5,t=(l.y+o.y)*.5,a=Math.max(1,ei.webReach*c);m=T(a,.15*a,Math.hypot(tM.x-e,tM.y-t))*tM.amt}tO[e]+=(m-tO[e])*(m>tO[e]?E:z);let f=Math.max(Math.pow(1-h,ei.thin),ei.web*tO[e]);if(I>0&&(a===e7||r===e7)){let e=T(0,.35,ew(a===e7?r:a));eb=Math.min(eb,e),f=Math.max(f,(eO?ei.tightOpenWeb:ei.openWeb)*I*e)}let x=ex*f-ei.dissolve,g=x*(1-(1-ei.pinch)*T(0,.7,h));ey.uLinkA.value[e].copy(l),ey.uLinkB.value[e].copy(o),ey.uLinkPar.value[e].set(x,g,ei.sag*s*Math.pow(h,1.5),Math.min(ei.fillet*s*T(0,.35,h),1.5*Math.max(g,0)))}for(let e=eg;e<18;e++)ey.uLinkPar.value[e].set(-100,-100,0,0);ey.uLinkCount.value=en?0:eg;let eM=eO?1+(eH/ei.narrowEndScale-1)*i:1;ey.uK.value=ei.goo*eq*eF*eM+ei.openMelt*eF*I*eb,ey.uWobble.value=ei.wobble*eF*(1-T(.2,.95,em.progress))+ei.openWobble*eF*I,ey.uTextured.value=ei.textured&&eT?1:0,ey.uBlend.value=Math.max(.5,ei.blend*eq*s);let ek=ei.glass?1-V:0;ey.uBandTop.value=ei.bandTop*eB*ek,ey.uBandBottom.value=ei.bandBottom*eB*ek,ey.uGlass.value.set(ei.refract,ei.squeeze,ei.ripple,ei.rippleFreq),ey.uFringe.value=ei.fringe*ek,ey.uSheen.value=ei.sheen*ek})(o);let u=Math.max(-ei.titleLeanMax,Math.min(ei.titleLeanMax,e1*ei.titleLean));t0+=(u-t0)*L(o,.18),e_.lean(t0),e0&&!e2&&!e9&&0===e1&&tK>=0&&tK!==tX&&(tX=tK,e_.show(tK),E(tK));let d=0===e1||e4&&.01>Math.abs(e6-em.spin);for(let e of(e0&&!e2&&!e9&&e7<0&&d&&tK>=0&&tK!==tY&&(tY>=0&&(0,j.playSound)(j.CLICK,{rate:.8,gain:.35}),tY=tK),eM.children)){let t=e.material.uniforms;e.visible=t.uReveal.value>.001&&t.uOpacity.value>.001}let c=ey.uWobble.value>.001||ey.uMelt.value.y>.001;((()=>{for(let e of(aa=0,an))ai(e.value);for(let e of(ao(eM.scale.x),eM.children)){ao(+!!e.visible),ao(e.position.x),ao(e.position.y),ao(e.scale.x),ao(e.scale.y);let t=e.material.uniforms;for(let e in t)"uTime"!==e&&ai(t[e].value)}if(aa!==ar)return!0;for(let e=0;e<aa;e++)if(Math.abs(at.cur[e]-at.last[e])>.001)return!0;return!1})()||c||al)&&(e.render(ef,ev),at.last.set(at.cur.subarray(0,aa)),ar=aa,al=!1)}),()=>{eo=!0,K.current=null,N&&(N.current=null),clearTimeout(t_),clearTimeout(t9),e.setAnimationLoop(null),window.removeEventListener("resize",eZ),window.removeEventListener("pageshow",tg),window.removeEventListener("keydown",ty),f.removeEventListener("wheel",tj),f.removeEventListener("pointerdown",tA),f.removeEventListener("pointermove",tP),f.removeEventListener("pointerup",tC),f.removeEventListener("pointercancel",tC),f.removeEventListener("pointerleave",tL),f.removeEventListener("click",tW),t6?.kill(),tt?.kill(),n.default.killTweensOf([em,te,tr,f]),n.default.killTweensOf(ek.chars),n.default.killTweensOf(ek.fades),n.default.killTweensOf([...eX(),...tf(),C].filter(Boolean)),e_.dispose(),eS.dispose(),ek.dispose(),eb.geometry.dispose(),eb.material.dispose(),ey.uAtlas.value?.dispose(),tl?.dispose(),ex.dispose(),eg.dispose(),ew.dispose(),en&&ey.uGlyph.value.dispose(),e.dispose(),e.forceContextLoss(),e.domElement.remove()}},[]);let eo=(0,t.jsxs)("span",{className:C.default.row,children:[(0,t.jsx)("span",{}),(0,t.jsx)("span",{})]});return(0,t.jsxs)("div",{ref:F,className:C.default.stage,"data-bare":f?"":void 0,"data-look":v,"data-cursor-silent":"compile"===v?void 0:"",children:[(0,t.jsx)("div",{ref:q,className:C.default.canvas}),(0,t.jsx)("div",{ref:H,"aria-hidden":"true",className:C.default.room}),(0,t.jsx)("div",{ref:O,"aria-hidden":"true",className:C.default.count}),(0,t.jsx)("div",{"aria-hidden":"true",className:C.default.film,children:(0,t.jsx)("div",{ref:V,className:C.default.grain})}),(0,t.jsx)("nav",{"aria-label":"Projects",children:(0,t.jsx)("ul",{ref:$,className:C.default.list,children:e.map((e,a)=>(0,t.jsx)("li",{ref:e=>{G.current[a]=e},children:(0,t.jsx)("a",{href:e.href,onClick:e=>{0!==e.button||e.metaKey||e.ctrlKey||e.shiftKey||K.current?.open(a)&&e.preventDefault()},children:e.title})},e.slug))})}),[{side:"left",justify:"flex-start"},{side:"right",justify:"flex-end"}].map(({side:e,justify:a})=>(0,t.jsxs)("div",{ref:t=>{ea.current[e].box=t},"aria-hidden":"true","data-side":e,className:C.default.meta,children:[(0,t.jsx)("span",{ref:t=>{ea.current[e].goo=t},className:C.default.goo,children:[0,1].map(r=>(0,t.jsx)("span",{ref:t=>{ea.current[e].layers[r]=t},className:C.default.layer,style:{justifyContent:a},children:eo},r))}),(0,t.jsx)("span",{ref:t=>{ea.current[e].plain=t},className:C.default.layer,style:{justifyContent:a},children:eo})]},e)),(0,t.jsx)("div",{ref:D,"aria-hidden":"true",className:C.default.loader}),(0,t.jsx)("div",{ref:U,"aria-live":"polite",className:"sr-only"}),(0,t.jsx)("svg",{"aria-hidden":"true",className:C.default.defs,focusable:"false",children:(0,t.jsx)("defs",{children:(0,t.jsx)("filter",{id:"name-goo",x:"-20%",y:"-100%",width:"140%",height:"300%",colorInterpolationFilters:"sRGB",children:(0,t.jsx)("feColorMatrix",{ref:I,in:"SourceGraphic",type:"matrix",values:"1 0 0 0 0\n                      0 1 0 0 0\n                      0 0 1 0 0\n                      0 0 0 255 -140"})})})})]})}var N=e.i(36072),F=e.i(75056),q=e.i(94800),$=e.i(97017),G=e.i(48546),D=e.i(78140),O=e.i(82816),H=e.i(3768),V=e.i(81045),U=e.i(66680),I=e.i(65478),K=e.i(82441),X=e.i(4058),Y=e.i(10024);let Z="/models/desk2.glb",J=(0,H.versioned)("/models/anim/push.glb"),Q=(0,H.versioned)("/models/anim/listening.json"),ee=/(Hips|Leg|Foot|Toe)/,et=-Math.PI/2+.3,ea=e=>1-Math.pow(1-e,3),er=e=>Math.min(1,Math.max(0,e));function el({run:e,onArrived:r,screen:l,mark:o,gesture:i,gestureDrive:n}){let s=(0,D.useGLTF)("/models/sagar.glb"),d=(0,D.useGLTF)(Z),c=(0,D.useGLTF)(J),h=(0,D.useGLTF)((0,H.versioned)(`/models/anim/${i}`)),p=(0,$.useLoader)(u.FileLoader,Q),{camera:m,size:f,gl:v}=(0,G.useThree)(),x=(0,a.useMemo)(()=>{let e=(0,O.clone)((0,U.tuneNishanthMaterials)(s.scene));return e.traverse(e=>{e.isSkinnedMesh&&(e.frustumCulled=!1)}),e},[s.scene]),g=(0,a.useMemo)(()=>{let e=d.scene.clone(!0);return e.traverse(e=>{if(e.isMesh)for(let t of(e.frustumCulled=!1,Array.isArray(e.material)?e.material:[e.material]))t.isMeshStandardMaterial&&(t.emissiveMap||t.emissive.r+t.emissive.g+t.emissive.b>.05)&&(t.emissiveIntensity=2.4)}),e},[d.scene]),w=(0,a.useMemo)(()=>new u.AnimationMixer(x),[x]),y=(0,a.useMemo)(()=>{let e=s.parser.json.nodes??[],t=e.find(e=>/Hips$/.test(e.name??""))?.translation;return t?new u.Vector3(t[0],t[1],t[2]):new u.Vector3(0,.010773,26e-5)},[s]),b=(0,a.useRef)(null),M=(0,a.useRef)(null),k=(0,a.useRef)(null),S=(0,a.useRef)(null),_=(0,a.useRef)(null),T=(0,a.useRef)(null),[R,L]=(0,a.useState)(null),j=(0,a.useMemo)(()=>x.getObjectByName("mixamorigRightHand")??null,[x]),A=(0,a.useMemo)(()=>{let e=null;return g.traverse(t=>{!e&&/MY_SCREEN/.test(t.name)&&t.isMesh&&(e=t)}),e},[g]);(0,a.useEffect)(()=>{let e=w.clipAction(u.AnimationClip.parse(JSON.parse(p)));e.setLoop(u.LoopRepeat,1/0),e.setEffectiveWeight(0),e.play();let t=e.getClip().clone();t.name="lower",t.tracks=t.tracks.filter(e=>ee.test(e.name));let a=w.clipAction(t);a.setLoop(u.LoopRepeat,1/0),a.setEffectiveWeight(0),a.play();let r=c.animations[0].clone();r.name="push",r.tracks=r.tracks.filter(e=>!e.name.endsWith(".scale")&&!e.name.endsWith(".position"));let l=w.clipAction(r);return l.setLoop(u.LoopRepeat,1/0),l.setEffectiveWeight(1),l.play(),_.current={push:l,idle:e,lower:a},()=>{w.stopAllAction(),_.current=null}},[w,p,c,y]);let P=(0,a.useRef)(null);(0,a.useEffect)(()=>{let e=h.animations[0];if(!e)return;let t=(0,I.keptInPlace)(e,"gesture",y);t.tracks=t.tracks.filter(e=>!ee.test(e.name));let a=w.clipAction(t);return a.setLoop(u.LoopRepeat,1/0),a.setEffectiveTimeScale(0),a.setEffectiveWeight(0),a.play(),P.current=a,()=>{a.stop(),P.current=null}},[h,w,y]),(0,a.useEffect)(()=>{m.left=0,m.right=f.width,m.top=0,m.bottom=-f.height,m.near=-5e3,m.far=5e3,m.position.set(0,0,1e3),m.lookAt(0,0,0),m.updateProjectionMatrix()},[m,f]),(0,a.useEffect)(()=>{let e=b.current,t=M.current;if(!e||!t)return;let a={pos:e.position.clone(),scale:e.scale.clone(),desk:t.position.clone()};e.position.set(0,0,0),e.scale.setScalar(1);let r=_.current;r?.push.setEffectiveWeight(0),r?.idle.setEffectiveWeight(1),w.setTime(0),e.updateMatrixWorld(!0);let l=new u.Box3,o=new u.Vector3;x.traverse(e=>{let t=e.isSkinnedMesh?e.geometry.getAttribute("position"):null;if(t)for(let a=0;a<t.count;a+=3)l.expandByPoint(e.getVertexPosition(a,o).applyMatrix4(e.matrixWorld))});let i=l.max.y-l.min.y;t.scale.setScalar(1),t.position.set(0,0,0),t.updateMatrixWorld(!0);let n=new u.Box3().setFromObject(t);t.scale.setScalar(.36*i/Math.max(1e-6,n.max.y-n.min.y)),t.updateMatrixWorld(!0);let s=new u.Box3().setFromObject(t),d=s.max.x-s.min.x,c=.4*i,h=(s.min.z+s.max.z)/2;L({xs:[s.min.x+.07*d,s.max.x-.07*d],y:s.min.y-c/2,z:h,h:c,w:.022*i}),T.current={tall:i,deskRight:s.max.x,deskFloor:s.min.y,deskZ:h,deskW:d,lift:c},e.position.copy(a.pos),e.scale.copy(a.scale),t.position.copy(a.desk),r?.push.setEffectiveWeight(1),r?.idle.setEffectiveWeight(0)},[w,g,x]);let C=(0,a.useRef)({t:-1,start:-1,arrived:!1,shoveFrom:0}),W=(0,a.useMemo)(()=>({hand:new u.Vector3,box:new u.Box3,a:new u.Vector3,b:new u.Vector3,c:new u.Vector3}),[]);return(0,q.useFrame)((t,a)=>{let i=Math.min(a,.05),s=T.current,u=b.current,d=M.current,c=k.current,h=_.current;if(!s||!u||!d||!c||!h)return;let p=C.current;e&&p.start<0&&(p.start=performance.now()),p.start>=0&&(p.t=(performance.now()-p.start)/1e3);let x=f.width,g=f.height,y=x>=768,R=y?o.current:null,L=(y?.32:.24)*g/s.tall;u.scale.setScalar(L);let E=(s.deskW+.35*s.tall)*L,z=x+.2*E+.3*s.tall*L,B=R?R.x:-E-.4*s.tall*L,N=R?R.floor:.86*g,F=R?1.7:3.23,q=er(p.t/F),$=R?ea(q):q*q*(3-2*q)*.3+.7*q;u.position.set(z+(B-z)*$,-N,0);let G=R?er((p.t-F+.1)/.5):0,D=n.current,O=P.current?D.w:0;h.push.setEffectiveWeight(1-G),h.push.setEffectiveTimeScale(p.t<0?0:1.6),h.idle.setEffectiveWeight(G*(1-O)),h.lower.setEffectiveWeight(G*O),P.current&&(P.current.time=Math.min(D.t,.999)*P.current.getClip().duration,P.current.setEffectiveWeight(G*O)),w.update(i);let H=R?ea(er((p.t-F-.2)/.8)):0;if(c.rotation.y=et+(.95-et)*H,!p.arrived&&j)u.updateMatrixWorld(!0),j.getWorldPosition(W.hand),u.worldToLocal(W.hand),d.position.set(W.hand.x-s.deskRight,s.lift-s.deskFloor,-s.deskZ),p.shoveFrom=d.position.x;else if(p.arrived&&R){let e=(-80-u.position.x)/L-s.deskRight,t=er((p.t-F)/1.1);d.position.x=p.shoveFrom+(e-p.shoveFrom)*(t*t*(3-2*t))}if(S.current?.position.copy(d.position),!p.arrived&&p.t>=0&&(R?q>=1:(l.current?.x??x)<.62*x)&&(p.arrived=!0,r()),A){let e=W.box.setFromObject(A),t=v.domElement.getBoundingClientRect(),a=e.getCenter(W.a).project(m),r=(e.min.y+e.max.y)/2;W.b.set(e.min.x,r,e.max.z).project(m),W.c.set(e.max.x,r,e.max.z).project(m),l.current={x:t.left+(a.x+1)/2*t.width,y:t.top+(1-a.y)/2*t.height,w:Math.abs(W.c.x-W.b.x)/2*t.width}}}),(0,t.jsxs)("group",{ref:b,position:[2*f.width,0,0],children:[(0,t.jsx)("group",{ref:k,"rotation-y":et,scale:V.SAGAR_MODEL_SCALE,children:(0,t.jsx)("primitive",{object:x})}),R&&(0,t.jsx)("group",{ref:S,children:R.xs.map(e=>(0,t.jsxs)("mesh",{position:[e,R.y,R.z],frustumCulled:!1,children:[(0,t.jsx)("boxGeometry",{args:[R.w,R.h,6*R.w]}),(0,t.jsx)("meshStandardMaterial",{color:"#1c1c1c",roughness:.6,metalness:.3})]},e))}),(0,t.jsx)("group",{ref:M,children:(0,t.jsx)("group",{"rotation-y":-Math.PI/2+.35,children:(0,t.jsx)("primitive",{object:g})})})]})}function eo(e){return(0,K.useAfterPageTurn)()?(0,t.jsxs)(F.Canvas,{orthographic:!0,camera:{manual:!0},resize:{scroll:!1,offsetSize:!0},dpr:[1,(0,Y.isPhone)()?1.3:1.5],gl:{alpha:!0,antialias:!0},onCreated:({gl:e})=>{e.setClearColor(0,0),e.toneMapping=u.NeutralToneMapping,e.toneMappingExposure=1.6},style:{pointerEvents:"none"},children:[(0,t.jsx)("hemisphereLight",{args:["#ffffff","#c9c9c9",1.6]}),(0,t.jsx)("directionalLight",{position:[-1.6,2.8,2.6],intensity:2.6,color:"#fff1df"}),(0,t.jsx)("directionalLight",{position:[2,1.5,2],intensity:.8,color:"#dfe8ff"}),(0,t.jsxs)(a.Suspense,{fallback:null,children:[(0,t.jsx)(el,{...e}),(0,t.jsx)(X.WarmUp,{})]})]}):null}D.useGLTF.preload(Z),D.useGLTF.preload(J);var ei=e.i(92354),en=e.i(22364),es=e.i(66915);let eu=e=>String(e).padStart(2,"0"),ed=[{clip:"pointing.glb",from:.1,to:1.9,dur:2},{clip:"thumbsUp.glb",from:.4,to:2.2,dur:4},{clip:"waving.glb",from:.3,to:2.1,dur:5}],ec=(e,t,a)=>{let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)};function eh({projects:e,look:l="honey"}){let o=(0,r.useRouter)(),i=(0,a.useRef)(null),u=(0,a.useRef)(null),d=(0,a.useRef)(null),c=(0,a.useRef)({v:0}),[h,p]=(0,a.useState)(0),[m,f]=(0,a.useState)(!1),[v,x]=(0,a.useState)(0),[g,w]=(0,a.useState)(!1),y=e.length,b="viscose"===l,M=(0,a.useRef)({t:0,w:0}),[k,S]=(0,a.useState)(ed[0]),[_,T]=(0,a.useState)(!1),R=(0,a.useRef)(null),L=(0,a.useRef)(null),[j,A]=(0,a.useState)(!1);(0,a.useEffect)(()=>{if(!b)return;let e=window.matchMedia("(min-width: 768px)"),t=()=>A(e.matches);t(),e.addEventListener("change",t);let a=0,r="",l=()=>{a=requestAnimationFrame(l);let e=d.current?.frontRect?.(),t=i.current;if(!e||!t||e.w<2)return;let o=`${0|e.x},${0|e.y},${0|e.w},${0|e.h}`;o!==r&&(r=o,t.style.setProperty("--cap-x",`${e.x}px`),t.style.setProperty("--cap-y",`${e.y+e.h}px`),t.style.setProperty("--note-x",`${e.x+e.w}px`),t.style.setProperty("--note-y",`${e.y}px`),L.current={x:e.x-Math.min(140,.075*window.innerWidth),floor:e.y+e.h})};return l(),()=>{cancelAnimationFrame(a),e.removeEventListener("change",t)}},[b]);let P=(0,a.useRef)(null),C=(0,a.useCallback)(()=>P.current?.(),[]),[W,E]=(0,a.useState)(!1),[z,F]=(0,a.useState)(!1),q=(0,a.useRef)(!1),$=(0,a.useRef)(ed.length-1),G=(0,a.useRef)(null);(0,a.useEffect)(()=>{if(b)return(0,N.preloadNishanthClip)("listening.json"),ed.forEach(e=>(0,N.preloadNishanthClip)(e.clip)),()=>{G.current?.kill()}},[b]);let D=(0,a.useCallback)((e,t,a=0)=>{S(e),G.current?.kill();let r=e.to-e.from,l={s:0},o=!1;G.current=n.default.to(l,{s:r,duration:r,ease:"none",onUpdate:()=>{M.current.t=(e.from+l.s)/e.dur,M.current.w=ec(0,.35,l.s)*(1-ec(r-.35,r,l.s)),t&&!o&&l.s>=a&&(o=!0,t())},onComplete:()=>{M.current.w=0}})},[]),O=(0,a.useCallback)(()=>new Promise(e=>{let t=!1,a=()=>{t||(t=!0,q.current=!0,e())};if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return a();P.current=a,E(!0),T(!0),window.setTimeout(a,14e3)}),[]),H=(0,a.useRef)(0),V=(0,a.useCallback)(e=>{let t=(e-H.current)%y;t>y/2&&(t-=y),t<-y/2&&(t+=y),H.current=e,p(e),b&&q.current&&0!==t&&($.current=($.current+1)%ed.length,D(ed[$.current]));let a=window.matchMedia("(prefers-reduced-motion: reduce)").matches;n.default.to(c.current,{v:c.current.v+t,duration:.9*!a,ease:"power3.out",overwrite:!0,onUpdate:()=>{u.current?.style.setProperty("--at",`${(c.current.v%y+y)%y+y}`)}})},[y,b,D]),U=(0,a.useCallback)(()=>{f(!0),F(!0)},[]),I=(0,a.useCallback)(()=>{v<8?window.setTimeout(()=>x(e=>e+1),350):(w(!0),f(!0))},[v]),K=(0,a.useCallback)((e,t)=>{if(window.playVideoFullscreen&&window.playVideoFullscreen(e.slug))return;(0,s.handOverProjectTransition)({href:e.href,slug:e.slug,image:e.cover,rect:t,navigate:e=>{if(window.playActiveVideo){window.playActiveVideo()}}})},[o]);(0,a.useEffect)(()=>{let e=window.setTimeout(()=>f(!0),9e3);return()=>window.clearTimeout(e)},[]),(0,a.useEffect)(()=>{if(!m||!i.current)return;let e=n.default.utils.toArray("[data-rise]",i.current),t=n.default.fromTo(e,{yPercent:110},{yPercent:0,duration:1,ease:"power4.out",stagger:.03});return()=>{t.kill()}},[m]);let X=e[h]??e[0],Y=[...e,...e,...e],Z=eu(h+1).split(""),J=e=>t=>{t.preventDefault();t.stopPropagation();if(window.playActiveVideo){window.playActiveVideo()}else{e()}};return(0,t.jsxs)("div",{ref:i,className:es.default.root,"data-ready":m?"":void 0,"data-fallback":g?"":void 0,"data-own":b?"":void 0,"data-on-stage":W?"":void 0,"data-dealt":z?"":void 0,children:[!g&&(0,t.jsx)(B,{bare:!0,look:l,projects:e,api:d,onOpen:K,onFront:V,onReveal:U,onFail:I,beforeLaunch:b?O:void 0,dealFrom:b?R:void 0},v),b&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{className:es.default.me,"aria-hidden":"true",children:(0,t.jsx)(eo,{run:_,onArrived:C,screen:R,mark:L,gesture:k.clip,gestureDrive:M})}),(0,t.jsxs)("div",{className:es.default.reelWords,children:[(0,t.jsx)("p",{className:ei.default.selected,"aria-hidden":"true",children:"Selected work"}),(0,t.jsxs)("p",{className:ei.default.count,"aria-hidden":"true",children:[(0,t.jsx)("span",{className:ei.default.countLabel,children:"Selected work"}),(0,t.jsx)("span",{className:ei.default.countBig,children:eu(h+1)}),(0,t.jsxs)("span",{className:ei.default.countOf,children:["/",eu(y)]})]}),j&&m&&(0,t.jsxs)("div",{className:ei.default.notes,"aria-hidden":"true",children:[(0,t.jsx)(en.Drawn,{shape:"arrowDownLeft",delay:.9,className:ei.default.noteArrow}),(0,t.jsxs)("span",{className:ei.default.noteWords,children:[(0,t.jsxs)(en.Hand,{delay:.1,style:{color:"inherit"},className:"type-text",children:[X.year,", ",X.role?.toLowerCase()]}),(0,t.jsxs)(en.Hand,{delay:.4,style:{color:"inherit"},className:"type-text",children:["for ",X.client]}),(0,t.jsx)(en.Hand,{delay:.7,style:{color:"inherit"},className:"type-text",children:X.services})]})]},`note-${X.slug}`),(0,t.jsxs)("div",{className:ei.default.caption,children:[(0,t.jsx)("span",{className:ei.default.capName,children:X.title}),(0,t.jsx)("span",{className:ei.default.capKind,children:X.type}),(0,t.jsx)("a",{href:X.href,className:`${ei.default.capLink} link-swap`,onClick:J(()=>d.current?.openFront()),children:"Play video ▶"})]},`cap-${X.slug}`),(0,t.jsxs)("div",{className:ei.default.progress,"aria-hidden":"true",children:[(0,t.jsx)("span",{children:"Scroll"}),(0,t.jsx)("span",{className:ei.default.ticks,children:e.map((e,a)=>(0,t.jsx)("i",{"data-on":a===h?"":void 0},e.slug))}),(0,t.jsxs)("span",{children:[eu(h+1),"/",eu(y)]})]}),(0,t.jsxs)("div",{className:ei.default.info,children:[(0,t.jsxs)("a",{href:X.href,className:ei.default.current,onClick:J(()=>d.current?.openFront()),children:[(0,t.jsx)("span",{className:ei.default.kind,children:X.type}),(0,t.jsx)("span",{className:ei.default.name,children:X.title})]}),(0,t.jsx)("span",{className:ei.default.dash,"aria-hidden":"true",children:"—"}),(0,t.jsx)("p",{className:ei.default.line,children:X.summary})]},`i-${X.slug}`)]})]}),(0,t.jsxs)("div",{className:es.default.info,children:[(0,t.jsx)("p",{className:es.default.kind,children:(0,t.jsxs)("span",{className:es.default.blur,children:[X.type,", ",X.year]},`k${h}`)}),(0,t.jsx)("p",{className:es.default.summary,children:(0,t.jsx)("span",{className:es.default.blur,children:X.summary},`s${h}`)}),(0,t.jsx)("dl",{className:es.default.facts,children:[["Role",X.role],["Client",X.client],["Services",X.services]].map(([e,a])=>(0,t.jsxs)("div",{className:es.default.fact,children:[(0,t.jsx)("dt",{children:(0,t.jsx)("span",{"data-rise":!0,children:e})}),(0,t.jsx)("dd",{children:(0,t.jsx)("span",{className:es.default.blur,children:a},`${e}${h}`)})]},e))}),(0,t.jsx)("div",{className:es.default.swatches,"aria-hidden":"true",children:X.swatches.map((e,a)=>(0,t.jsx)("span",{style:{background:e}},`${h}${a}`))}),(0,t.jsxs)("p",{className:es.default.links,children:[(0,t.jsx)("span",{"data-rise":!0,children:(0,t.jsxs)("a",{href:X.href,className:"link-swap",onClick:J(()=>d.current?.openFront()),children:["Play video ▶ ",(0,t.jsx)("span",{"aria-hidden":"true",children:"→"})]})}),(0,t.jsx)("span",{"data-rise":!0,children:(0,t.jsx)("a",{href:"/contact",className:"link-swap",children:"Start a project"})})]})]}),(0,t.jsx)("nav",{className:es.default.listWrap,"aria-label":"Projects",children:(0,t.jsx)("ol",{ref:u,className:es.default.list,children:Y.map((e,a)=>{let r=a<y||a>=2*y;return(0,t.jsx)("li",{className:es.default.item,"data-on":a%y===h?"":void 0,"aria-hidden":r||void 0,children:(0,t.jsx)("a",{href:e.href,tabIndex:r?-1:0,onClick:J(()=>d.current?.open(a%y)),children:(0,t.jsx)("span",{className:es.default.itemName,children:e.title})})},a)})})}),(0,t.jsx)("p",{className:es.default.label,children:(0,t.jsx)("span",{"data-rise":!0,children:"Selected work"})}),(0,t.jsx)("p",{className:es.default.num,"aria-hidden":"true",children:Z.map((e,a)=>(0,t.jsx)("span",{className:es.default.digit,style:{animationDelay:`${60*a}ms`},children:e},`${h}-${a}`))}),(0,t.jsx)("p",{className:es.default.of,children:(0,t.jsxs)("span",{"data-rise":!0,children:["/",eu(y)]})}),(0,t.jsx)("p",{className:es.default.scroll,children:(0,t.jsx)("span",{"data-rise":!0,children:"Scroll"})}),(0,t.jsx)("div",{className:es.default.phoneCaption,children:(0,t.jsxs)("span",{className:es.default.blur,children:[(0,t.jsx)("span",{className:es.default.itemType,children:X.type}),(0,t.jsx)("span",{className:es.default.itemName,children:X.title})]},`t${h}`)}),(0,t.jsxs)("p",{className:"sr-only","aria-live":"polite",children:[X.title,", ",X.type,", ",X.year]})]})}var ep=e.i(70703),em=e.i(58141),ef=e.i(33965);let ev=9/16*4.3,ex=[4.3,2.1,5.1],eg=[-.0215,2.2884,.2884],ew=[20,12.1,16.6],ey=[-7,-2.1,1.3],eb=960/10.8,eM=[320,-40],ek=[-30,-20],eS=[{clip:"pointing.glb",from:.1,to:1.9,dur:2},{clip:"thumbsUp.glb",from:.4,to:2.2,dur:4},{clip:"waving.glb",from:.3,to:2.1,dur:5}],e_=(e,t,a)=>{let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)};n.default.registerPlugin(ef.Flip);let eT={about:"L",desc:"R",caption:"U",work:"TR",selected:"BL",flip:!1},eR=e=>{let t=[...e];for(let e=t.length-1;e>0;e--){let a=Math.floor(Math.random()*(e+1));[t[e],t[a]]=[t[a],t[e]]}return t},eL=(0,ep.default)(()=>e.A(1455).then(e=>e.WorkSitter),{loadableGenerated:{modules:[7875]},ssr:!1}),ej=`
  uniform float uIndex;
  uniform float uCount;
  uniform float uScroll;
  uniform float uSpeed;
  uniform float uMaxZ;
  uniform float uProgress;
  uniform float uSplit;
  uniform float uGap;
  uniform float uFocus;
  uniform float uLift;
  uniform vec3 uShear;
  uniform vec3 uUp;
  uniform vec3 uAcross;
  uniform float uGrow;
  uniform float uOpen;
  uniform float uDeal;
  uniform float uBend;
  uniform float uTime;
  uniform vec3 uDealFrom;
  uniform float uDrop;
  uniform float uFrom;
  uniform float uSideK;
  uniform vec3 uNudge;
  varying vec2 vUv;
  varying float vDist;
  varying float vLocal;
  varying float vF;

  const float PI = 3.14159265;
  // Rotations in the reference's convention (X and Y the transposes of the textbook ones).
  mat3 rotX(float a) { return mat3(1., 0., 0., 0., cos(a), -sin(a), 0., sin(a), cos(a)); }
  mat3 rotY(float a) { return mat3(cos(a), 0., sin(a), 0., 1., 0., -sin(a), 0., cos(a)); }
  mat3 rotZ(float a) { return mat3(cos(a), sin(a), 0., -sin(a), cos(a), 0., 0., 0., 1.); }
  float remap(float v, float a, float b) { return clamp((v - a) / (b - a), 0., 1.); }

  // THE PAPER CURL (ours, as the home page's turning sheet): the page rolls up off its lower right
  // corner round a cylinder, the roll's edge c of the way up the diagonal.
  vec3 curl(vec3 p, float c, float W, float H) {
    if (c < 0.001) return p;
    vec2 corner = vec2(W * 0.5, -H * 0.5);
    vec2 n = normalize(vec2(-W, H));
    float s = dot(p.xy - corner, n);
    float s0 = c * length(vec2(W, H)) * 0.6;
    float u = s0 - s;
    if (u <= 0.) return p;
    float R = 0.35;
    float a = u / R;
    float s1 = a < PI ? s0 - R * sin(a) : s0 + (u - PI * R);
    float lift = a < PI ? R * (1. - cos(a)) : 2. * R;
    p.xy += n * (s1 - s);
    p.z -= lift;
    return p;
  }

  void main() {
    float W = 4.3000;
    float H = ${ev.toFixed(4)};
    vec3 hinge = vec3(-W * 0.5, 0., 0.);
    // The page in the middle is a little bigger (the owner): grown about its own centre, in its plane.
    float signedZ = mod(-(uIndex - (uCount - 1.) * 0.5) - uScroll + uMaxZ, 2. * uMaxZ) - uMaxZ;
    float near = abs(signedZ);
    float nearF = smoothstep(0., 1., 1. - smoothstep(0., 0.8, near));
    float side = (1. - (signedZ >= 0. ? 0.450 : 0.320)) * uSideK;
    float grow = (1. + uGrow * nearF * uFocus * uOpen) * mix(1., side, (1. - nearF) * uFocus);
    // THE OPENING: every page starts in the middle, the whole deck there at once, a little smaller,
    // and is dealt out to its place at full size.
    float dealt = smoothstep(0., 1., clamp(uDeal, 0., 1.));
    float dropS = mix(uFrom, 1., dealt) * uDrop;
    vec3 p = position * vec3(grow * dropS, grow * dropS, 1.) - hinge;
    // THE SCREEN'S CURVE AND WAVE (Jesper Landberg's, the owner's pick, 2026-10-22): the page bent like a
    // wide monitor round its upright middle, its edges in a slow wave. None on /work as it is (uBend 0).
    float hx = (p.x - W * 0.5) / (W * grow * 0.5);
    // The upper stack bent the other way to the lower (the owner: mirrored).
    // Straight in the corners and at the middle; bent only on the way between (the owner, 2026-10-23).
    p.z += max(uBend, 0.90 * 4. * nearF * (1. - nearF)) * (signedZ >= 0. ? -1. : 1.) * (hx * hx - 1.) * W * 0.09;
    p.y += uBend * sin(hx * 2.6 + uTime * 1.1 + uIndex * 1.7) * 0.05 * (abs(p.y) / (H * grow * 0.5));

    // THE MAGAZINE OPENING (uProgress 0 to 1): the pages leaf over one after another off the spine,
    // spin at full speed, then settle stacked; then the stack splits into the loop (uSplit 0 to 1).
    float acc = remap(uProgress, 0., 0.3);
    float local = clamp(acc - uIndex / uCount, 0., 1.);
    float yA = -(position.x * 0.2 * smoothstep(0., 0.3, acc) - acc * 2. * PI - local * 2. * PI);
    yA += remap(uProgress, 0.3, 0.7) * 4.2 * PI;
    float stackA = remap(uProgress, 0.7, 1.);
    yA += position.x * 0.2 * stackA + (1. - local) * 2. * PI * stackA + 1.7 * PI * stackA;
    float centred = uIndex - (uCount - 1.) * 0.5;
    float settled = smoothstep(0.8, 1., stackA);
    p.z += centred * settled * ((W - p.x - 1.) * 0.01) * (1. - uSplit);
    float crumple = centred * settled * (-p.x * p.x * 0.002);
    yA += crumple * (1. - uSplit);
    p.z += (uCount - uIndex) * 0.01 * settled * (1. - uSplit);
    yA -= uSplit * PI * 0.4;
    float home = -centred;
    p.z += uSplit * home;

    // THE LOOP: its place wrapped round, pushed apart round the middle, bent by the scroll's speed.
    float z = mod(home - uScroll + uMaxZ, 2. * uMaxZ) - uMaxZ;
    float dist = abs(z);
    vDist = dist;
    // The stacks' curves (BEND_PX and on, mirrored in curvePx below), grown in with the opening: before
    // it the pages run as the reference's, one even ribbon down the deck.
    vec3 deckDir = vec3(1., 0., 0.) + uShear;
    vec2 deckPx = vec2(-dot(deckDir, uAcross), -dot(deckDir, uUp)) * ${eb.toFixed(4)};
    float bk = max(dist - 1., 0.);
    float sgn = z >= 0. ? 1. : -1.;
    float stepPx = 0.3 * length(deckPx);
    // (A phone has no curve: uAcross and uUp are nothing there, and atan(0, 0) is undefined.)
    float a0 = z >= 0. ? -2.18 : atan(-deckPx.y, -deckPx.x + 1e-6);
    float turn = z >= 0. ? 0.2 : 0.16;
    vec2 arc = stepPx / turn * vec2(sin(a0 + turn * bk) - sin(a0), cos(a0) - cos(a0 + turn * bk));
    vec2 base = z >= 0. ? vec2(${eM[0]}., ${eM[1]}.) : vec2(${ek[0]}., ${ek[1]}.);
    vec2 bend = step(0.001, stepPx) * (base + arc - sgn * 0.3 * bk * deckPx) * smoothstep(0.1, 0.9, dist) * uFocus / ${eb.toFixed(4)};
    // The pages on the upper side stand further off the middle than those below (the owner).
    // The pages either side closer together (SPACING, from the reference's 1 as the opening ends), the
    // gap round the middle at PACK.
    z = z * mix(1., 0.3, uFocus) + (z >= 0. ? 1.24 : -1.) * smoothstep(0.1, 0.9, dist) * uGap * 0.5;
    float along = z;
    p.z += z - home;

    vec3 r = rotY(yA) * p;
    r.z -= uSplit;
    float lean = remap(uProgress, 0., 0.15);
    r += hinge;
    r.x += lean * W * 0.5;
    r = rotX(-PI * 0.2 * lean + uSplit * PI * 0.2) * r;

    // The page in the middle turns to face us; another under the pointer lifts.
    float f = smoothstep(0., 1., 1. - smoothstep(0., 0.8, dist));
    vec3 pivot = vec3(W * 0.5, 0., 0.);
    r -= pivot;
    r = rotX(0.15842 * f * uFocus) * r;
    r = rotY(-0.29989 * f * uFocus) * r;
    r = rotZ(-0.72772 * f * uFocus) * r;
    r += pivot;
    r.y += uLift * smoothstep(0.05, 0.4, 1. - f) * 0.25;
    // Each page slid across the screen by its place along the deck (the owner's line: the deck from the
    // top left corner to the bottom right) - the whole page alike, so none is turned by it.
    r += uShear * along * uSplit;
    // A phone: the upper stack a little further left (the owner, 2026-10-22).
    r += uNudge * step(0., sgn) * smoothstep(0.1, 0.9, dist) * uFocus;
    // +x right on the mirrored screen is -across; +y down is -up.
    r -= uAcross * bend.x + uUp * bend.y;
    // Dealt: from the drop in the middle to its place, slowing as it lands.
    r += uDealFrom * pow(1. - clamp(uDeal, 0., 1.), 3.);

    vUv = uv;
    vLocal = local;
    vF = f;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(r, 1.);
  }
`,eA=`
  uniform sampler2D uTex;
  uniform float uAspect;
  uniform float uIndex;
  uniform float uLift;
  varying vec2 vUv;
  varying float vLocal;
  varying float vF;
  varying float vDist;
  uniform float uSplit;
  uniform float uFocus;
  uniform float uGoo;
  uniform float uTime;
  uniform float uDeal;
  uniform float uFlip;
  void main() {
    if (vLocal == 0. && uIndex != 0.) discard;
    // Three pages either side of the middle, no more (the owner), once the stack has opened.
    // (Before the opening ends, the whole ribbon, as the reference.)
    if (vDist > 5.5 + (1. - uFocus) * 20.) discard;
    float page = ${(4.3/ev).toFixed(4)};
    // The canvas is mirrored (the deck runs top left to bottom right), which turns the page's back
    // the right way round: the picture as it is. Turned back over (Mix), the picture is read reversed.
    vec2 uv = vUv;
    if (uFlip > 0.5) uv.x = 1. - uv.x;
    if (page < uAspect) uv.x = (uv.x - 0.5) * (page / uAspect) + 0.5;
    else uv.y = (uv.y - 0.5) * (uAspect / page) + 0.5;
    uv = (uv - 0.5) * (1. - uLift * smoothstep(0.65, 0.95, vF) * 0.156) + 0.5;
    // The picture runs a little, as liquid, while the reel moves (Viscose's, with uGoo below).
    uv += uGoo * 0.012 * vec2(sin(vUv.y * 14. + uTime * 3.), sin(vUv.x * 11. + uTime * 2.4));
    gl_FragColor = texture2D(uTex, uv);
  }
`,eP=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0., 1.);
  }
`,eC=`
  uniform sampler2D uTex;
  uniform vec2 uStep;
  varying vec2 vUv;
  void main() {
    vec4 acc = vec4(0.);
    float sum = 0.;
    for (int i = -4; i <= 4; i++) {
      float w = exp(-float(i * i) / 8.);
      acc += texture2D(uTex, vUv + uStep * float(i) / 4.) * w;
      sum += w;
    }
    gl_FragColor = acc / sum;
  }
`,eW=`
  uniform sampler2D uScene;
  uniform sampler2D uBlur;
  uniform float uGoo;
  varying vec2 vUv;
  void main() {
    vec4 s = texture2D(uScene, vUv);
    vec4 b = texture2D(uBlur, vUv);
    float g = smoothstep(0.28, 0.5, b.a) * uGoo;
    vec3 bc = b.rgb / max(b.a, 0.001);
    gl_FragColor = vec4(s.rgb + (1. - s.a) * bc * g, s.a + (1. - s.a) * g);
  }
`;function eE({projects:e,next:l=!1}){let o=(0,r.useRouter)(),i=(0,a.useRef)(null),c=(0,a.useRef)(null),[h,p]=(0,a.useState)(eT),m=(0,a.useRef)(null);(0,a.useLayoutEffect)(()=>{let e=m.current;e&&(m.current=null,ef.Flip.from(e,{duration:1.1,ease:"expo.inOut",stagger:.04}))},[h]);let[f,v]=(0,a.useState)(0),[x,g]=(0,a.useState)(0),[w,y]=(0,a.useState)(!1),[b,M]=(0,a.useState)(!1);(0,a.useEffect)(()=>{let e=window.setTimeout(()=>M(!0),1300);return()=>window.clearTimeout(e)},[]);let[k,S]=(0,a.useState)(!1),_=(0,a.useRef)({t:0,w:0}),T=(0,a.useRef)(()=>void 0),R=(0,a.useRef)(()=>void 0);(0,a.useEffect)(()=>{em.workJump.p=0,window.matchMedia("(min-width: 768px)").matches&&y(!0)},[]);let L=e.length;(0,a.useEffect)(()=>{var t;let a,r,h,p,m,f,x,w,y,b,M,k=i.current,j=c.current;if(!k||!j||!L)return;let A=window.matchMedia("(prefers-reduced-motion: reduce)").matches,P=L*Math.max(1,Math.ceil(30/L)),C=1.01*P*.5,W=(P-1)*.5,E=(e,t)=>((-(e-W)-t+C)%(2*C)+2*C)%(2*C)-C,z=e=>{let t=0;for(let a=1;a<P;a++)Math.abs(E(a,e))<Math.abs(E(t,e))&&(t=a);return t},B=e=>(-e%L+L)%L;try{a=new d.WebGLRenderer({antialias:!0,alpha:!0})}catch{return}a.setPixelRatio(Math.min(window.devicePixelRatio,2)),j.appendChild(a.domElement);let N=l?(t=a,r=new u.WebGLRenderTarget(1,1,{samples:4}),h=new u.WebGLRenderTarget(1,1),p=new u.WebGLRenderTarget(1,1),m=new u.OrthographicCamera(-1,1,1,-1,0,1),f=new u.Scene,x=new u.ShaderMaterial({uniforms:{uTex:{value:null},uStep:{value:new u.Vector2}},vertexShader:eP,fragmentShader:eC,blending:u.NoBlending,depthTest:!1,depthWrite:!1}),w=new u.ShaderMaterial({uniforms:{uScene:{value:r.texture},uBlur:{value:p.texture},uGoo:{value:0}},vertexShader:eP,fragmentShader:eW,blending:u.NoBlending,depthTest:!1,depthWrite:!1}),(y=new u.Mesh(new u.PlaneGeometry(2,2),x)).frustumCulled=!1,f.add(y),b=1,M=1,{setSize(e,a){let l=t.getPixelRatio();b=Math.max(1,Math.round(e*l)),M=Math.max(1,Math.round(a*l)),r.setSize(b,M),h.setSize(Math.max(1,b>>1),Math.max(1,M>>1)),p.setSize(Math.max(1,b>>1),Math.max(1,M>>1))},render(e,a,l){let o=60*l*t.getPixelRatio();t.setRenderTarget(r),t.render(e,a),y.material=x,x.uniforms.uTex.value=r.texture,x.uniforms.uStep.value.set(o/b,0),t.setRenderTarget(h),t.render(f,m),x.uniforms.uTex.value=h.texture,x.uniforms.uStep.value.set(0,o/M),t.setRenderTarget(p),t.render(f,m),y.material=w,w.uniforms.uGoo.value=l,t.setRenderTarget(null),t.render(f,m)},dispose(){r.dispose(),h.dispose(),p.dispose(),x.dispose(),w.dispose(),y.geometry.dispose()}}):null,F=new u.Scene,q=new u.OrthographicCamera(-1,1,1,-1,.1,1e3);q.position.set(...ew),q.lookAt(new u.Vector3(...ey));let $=new u.Group;$.position.set(...ex),$.rotation.set(...eg),F.add($);let G=new u.PlaneGeometry(4.3,ev,48,24),D=e.map(()=>16/9),O=new u.TextureLoader,H={uScroll:{value:0},uSpeed:{value:0},uProgress:{value:1},uSplit:{value:1},uGap:{value:10.6},uFocus:{value:1},uOpen:{value:+!!A},uShear:{value:new u.Vector3},uUp:{value:new u.Vector3},uAcross:{value:new u.Vector3},uGrow:{value:.45},uBend:{value:+!!l},uTime:{value:0},uGoo:{value:0},uDrop:{value:1},uSideK:{value:1},uNudge:{value:new u.Vector3},uFlip:{value:0}},V=0,U=!1,I=()=>{},K=()=>{++V===e.length&&I()},Y=e.map((e,t)=>{let a=O.load(e.cover,e=>{let a=e.image;D[t]=a.width/Math.max(1,a.height),Z.forEach((e,t)=>e.material.uniforms.uAspect.value=D[B(t)]),K()},void 0,K);return a.colorSpace=u.NoColorSpace,a}),Z=Array.from({length:P},(e,t)=>{let a=new u.Mesh(G,new u.ShaderMaterial({vertexShader:ej,fragmentShader:eA,side:u.DoubleSide,transparent:!0,uniforms:{...H,uIndex:{value:t},uCount:{value:P},uMaxZ:{value:C},uLift:{value:0},uDeal:{value:+!!A},uDealFrom:{value:new u.Vector3},uFrom:{value:1},uTex:{value:Y[B(t)]},uAspect:{value:D[B(t)]}}}));return a.frustumCulled=!1,$.add(a),a}),J=new u.Vector3(1,0,0).applyQuaternion(q.quaternion).applyQuaternion($.quaternion.clone().invert()),Q=new u.Vector3(0,1,0).applyQuaternion(q.quaternion).applyQuaternion($.quaternion.clone().invert()),ee=()=>{let e=j.clientWidth||window.innerWidth,t=j.clientHeight||window.innerHeight,r=10.8*(e<768?1.35:1),l=e/t;q.left=-r*l/2,q.right=r*l/2,q.top=r/2,q.bottom=-r/2,q.updateProjectionMatrix(),a.setSize(e,t),N?.setSize(e,t),H.uGrow.value=e<768?.05:.45,H.uGap.value=e<768?6:10.6,H.uSideK.value=e<768?.62:1,H.uNudge.value.copy(J).multiplyScalar(.9*(e<768)),H.uShear.value.copy(J).multiplyScalar(.95*(e<768?.42:1)),H.uAcross.value.copy(J).multiplyScalar(e<768?0:1),H.uUp.value.copy(Q).multiplyScalar(e<768?0:1)};ee(),window.addEventListener("resize",ee);let et=0+E(0,0),ea=et,er=0,el=0,eo=()=>{window.clearTimeout(el),el=window.setTimeout(()=>{let e,t;return e=z(et),et=(t=et)+E(e,t)},240)},ei=e=>{if(e.preventDefault(),!ep)return;let t=e.deltaY/260;et+=t,er+=t,eo()},en=0,es=0,eu=e=>{en=e.touches[0].clientY,es=0,window.clearTimeout(el)},ed=e=>{if(!ep)return;let t=e.touches[0].clientY;es+=Math.abs(en-t);let a=(en-t)/260*1.4;et+=a,er+=a,en=t},ec=e=>{let t,a;t=(z(et)+e+P)%P,et=(a=et)+E(t,a)},eh=e=>{ep&&(("ArrowDown"===e.key||"PageDown"===e.key||" "===e.key)&&ec(-1),("ArrowUp"===e.key||"PageUp"===e.key)&&ec(1))};window.addEventListener("wheel",ei,{passive:!1}),k.addEventListener("touchstart",eu,{passive:!0}),k.addEventListener("touchmove",ed,{passive:!0}),k.addEventListener("touchend",eo),window.addEventListener("keydown",eh);let ep=A;if(A&&(k.dataset.ready="",S(!0)),A)k.dataset.loaded="";else{let t=()=>{(0,X.warmUpScene)(a,F,q,()=>U).finally(()=>{let e,t,a,r,l,o,i,s,u,d;U||(k.dataset.loaded="",$.updateMatrixWorld(!0),q.updateMatrixWorld(),t=(e=j.getBoundingClientRect()).height/(q.top-q.bottom),l=(r=eT(a=z(et),et)).reduce((e,t)=>e+t.x,0)/4,o=r.reduce((e,t)=>e+t.y,0)/4,i=Math.hypot(e.width,e.height),s=Array.from({length:P},(e,t)=>t).filter(e=>e!==a&&5.5>Math.abs(E(e,et))).sort((e,t)=>Math.abs(E(e,et))-Math.abs(E(t,et))),(u=n.default.timeline({onComplete:()=>{Z.forEach(e=>e.material.uniforms.uDeal.value=1)}})).call(()=>{ep=!0,k.dataset.ready="",S(!0)},[],1.105),(d=Z[a].material.uniforms).uFrom.value=.08,d.uDealFrom.value.set(0,0,0),u.to(d.uDeal,{value:1,duration:1.3,ease:"expo.inOut"},.15),s.forEach((e,a)=>{let r=eT(e,et),n=r.reduce((e,t)=>e+t.x,0)/4,s=r.reduce((e,t)=>e+t.y,0)/4,d=Math.hypot(n-l,s-o)||1;Z[e].material.uniforms.uDealFrom.value.copy(J).multiplyScalar(-(n+(n-l)/d*i*.6-n)/t).addScaledVector(Q,-(s+(s-o)/d*i*.6-s)/t),u.to(Z[e].material.uniforms.uDeal,{value:1,duration:1.2,ease:"none"},.9750000000000001+.06*a)}),u.to(H.uOpen,{value:1,duration:.7,ease:"power3.inOut"},.78))})};I=t,V===e.length&&t()}let em=new u.Vector3,ef=new u.Vector3,eT=(e,t)=>{let a=E(e,t),r=Math.abs(a),l=.3*a+(a>=0?1.24:-1)*e_(.1,.9,r)*H.uGap.value*.5,o=e_(0,1,1-e_(0,.8,r)),i=j.getBoundingClientRect();return[[-4.3/2,-ev/2],[2.15,-ev/2],[2.15,ev/2],[-4.3/2,ev/2]].map(([e,t])=>{let n=(a>=0?.55:.68)*H.uSideK.value,s=(1+H.uGrow.value*o)*(1+(n-1)*(1-o)),u=l,d=t*s,c=-(e*s+2.15)-1;u-=2.15;let h=Math.cos(.15842*o),p=Math.sin(.15842*o);[d,c]=[h*d+p*c,-p*d+h*c],h=Math.cos(-.29989*o),p=Math.sin(-.29989*o),[u,c]=[h*u-p*c,p*u+h*c],h=Math.cos(-.72772*o),p=Math.sin(-.72772*o),[u,d]=[h*u-p*d,p*u+h*d];let[m,f]=((e,t)=>{ef.set(1,0,0).add(H.uShear.value);let a=-ef.dot(H.uAcross.value)*eb,r=-ef.dot(H.uUp.value)*eb,l=Math.max(t-1,0),o=e>=0,i=o?1:-1,n=.3*Math.hypot(a,r),s=o?-2.18:Math.atan2(-r,-a),u=o?.2:.16,[d,c]=o?eM:ek;return[d+n/u*(Math.sin(s+u*l)-Math.sin(s))-.3*i*l*a,c+n/u*(Math.cos(s)-Math.cos(s+u*l))-.3*i*l*r]})(a,r),v=e_(.1,.9,r)*H.uFocus.value/eb;em.set(u+2.15,d,c).addScaledVector(H.uShear.value,l).addScaledVector(H.uNudge.value,a>=0?e_(.1,.9,r)*H.uFocus.value:0).addScaledVector(H.uAcross.value,-m*v).addScaledVector(H.uUp.value,-f*v).applyMatrix4($.matrixWorld).project(q);let x=H.uFlip.value>.5?(1+em.x)/2:(1-em.x)/2;return{x:i.left+x*i.width,y:i.top+(1-em.y)/2*i.height}})},eR=(e,t,a)=>{let r=0;for(let l=0;l<4;l++){let o=e[l],i=e[(l+1)%4],n=(i.x-o.x)*(a-o.y)-(i.y-o.y)*(t-o.x);if(0!==n){if(r&&Math.sign(n)!==r)return!1;r=Math.sign(n)}}return!0},eL=(e,t)=>{for(let a of Array.from({length:P},(e,t)=>t).sort((e,t)=>Math.abs(E(e,ea))-Math.abs(E(t,ea))))if(5.5>Math.abs(E(a,ea))&&eR(eT(a,ea),e,t))return a;return -1},eE=-1,ez=e=>{if(!ep||"mouse"!==e.pointerType)return;let t=eL(e.clientX,e.clientY);t!==eE&&(eE>=0&&n.default.to(Z[eE].material.uniforms.uLift,{value:0,duration:.6,ease:"power3.out",overwrite:"auto"}),eE=t,t>=0&&n.default.to(Z[t].material.uniforms.uLift,{value:1,duration:1,ease:"power4.out",overwrite:"auto"}),k.style.cursor=t>=0?"pointer":"")};k.addEventListener("pointermove",ez);let eB=e=>{if(!ep||e.target.closest("a")||es>8)return;let t=eL(e.clientX,e.clientY);if(!(t<0)){if(t!==z(ea)){let e;et=(e=et)+E(t,e);return}eN(t)}},eN=t=>{let a=e[B(t)],r=eT(t,ea),l=r.map(e=>e.x),i=r.map(e=>e.y),n=document.createElement("div");Object.assign(n.style,{position:"fixed",left:`${Math.min(...l)}px`,top:`${Math.min(...i)}px`,width:`${Math.max(...l)-Math.min(...l)}px`,height:`${Math.max(...i)-Math.min(...i)}px`,pointerEvents:"none"}),document.body.appendChild(n);let u=new Image;u.src=a.cover,u.decode().catch(()=>void 0).then(()=>{let e=(0,s.startProjectTransition)({href:a.href,slug:a.slug,image:a.cover,origin:n,navigate:e=>o.push(e)});n.remove();if(window.playActiveVideo){window.playActiveVideo()}})};k.addEventListener("pointerup",eB),T.current=()=>{ep&&eN(z(ea))};let eF=!1,eq={x:-1},e$=()=>{a.domElement.style.transform=`scaleX(${eq.x})`};e$(),R.current=e=>{n.default.killTweensOf(eq),n.default.to(eq,{x:0,duration:.45,ease:"power3.in",onUpdate:e$,onComplete:()=>{H.uFlip.value=+!!e,eF=!1,n.default.to(eq,{x:e?1:-1,duration:.55,ease:"power3.out",onUpdate:e$})}})};let eG=()=>{eF=!1};window.addEventListener("resize",eG);let eD=-1,eO=-1,eH=eS.length-1,eV=(e,t)=>{let r=Math.min(.05,t/1e3);if(ea=A?et:ea+(et-ea)*(1-Math.pow(.953,60*r)),er*=Math.pow(.829,60*r),H.uScroll.value=ea,H.uSpeed.value=A?0:er,H.uTime.value+=r,N){let e=A?0:Math.min(1,1.3*Math.abs(et-ea));H.uGoo.value+=(e-H.uGoo.value)*(1-Math.exp(-(8*r)))}if(N&&H.uGoo.value>.01?N.render(F,q,H.uGoo.value):a.render(F,q),!eF){let e,t,a,r;eF=!0,t=[...e=eT(W,0)].sort((e,t)=>t.y-e.y).slice(0,2),k.style.setProperty("--cap-x",`${Math.min(...t.map(e=>e.x))-k.getBoundingClientRect().left}px`),k.style.setProperty("--cap-y",`${Math.max(...t.map(e=>e.y))-k.getBoundingClientRect().top}px`),k.style.setProperty("--cap-w",`${Math.abs(t[0].x-t[1].x)}px`),k.style.setProperty("--cap-t",`${Math.min(...e.map(e=>e.y))-k.getBoundingClientRect().top}px`),a=[...e].sort((e,t)=>e.x-t.x).slice(0,2),k.style.setProperty("--edge-x",`${(a[0].x+a[1].x)/2-k.getBoundingClientRect().left}px`),k.style.setProperty("--edge-y",`${Math.max(a[0].y,a[1].y)-k.getBoundingClientRect().top}px`),r=[...e].sort((e,t)=>e.y-t.y).slice(0,2).sort((e,t)=>t.x-e.x)[0],k.style.setProperty("--note-x",`${r.x-k.getBoundingClientRect().left}px`),k.style.setProperty("--note-y",`${r.y-k.getBoundingClientRect().top}px`)}let l=_.current;if(eO>=0){let e=eS[eH],t=e.to-e.from;eO+=r,l.t=(e.from+Math.min(eO,t))/e.dur,l.w=e_(0,.35,eO)*(1-e_(t-.35,t,eO)),eO>=t&&(eO=-1,l.w=0)}let o=B(z(ea));o!==eD&&(-1!==eD&&ep&&!A&&(g(eH=(eH+1)%eS.length),eO=0),eD=o,v(o))};return n.default.ticker.add(eV),()=>{U=!0,n.default.ticker.remove(eV),I=()=>{},n.default.killTweensOf([H.uOpen,...Z.map(e=>e.material.uniforms.uDeal)]),window.clearTimeout(el),window.removeEventListener("resize",ee),window.removeEventListener("resize",eG),window.removeEventListener("wheel",ei),k.removeEventListener("touchstart",eu),k.removeEventListener("touchmove",ed),k.removeEventListener("touchend",eo),window.removeEventListener("keydown",eh),k.removeEventListener("pointermove",ez),k.removeEventListener("pointerup",eB),Z.forEach(e=>e.material.dispose()),Y.forEach(e=>e.dispose()),G.dispose(),N?.dispose(),a.dispose(),a.forceContextLoss(),a.domElement.remove()}},[L]);let j=e[f]??e[0];return(0,t.jsxs)("section",{ref:i,className:ei.default.root,children:[(0,t.jsx)("div",{ref:c,className:ei.default.column,"aria-hidden":"true"}),(0,t.jsxs)("div",{className:ei.default.info,children:[(0,t.jsxs)("a",{href:j?.href,className:ei.default.current,children:[(0,t.jsx)("span",{className:ei.default.kind,children:j?.type}),(0,t.jsx)("span",{className:ei.default.name,children:j?.title})]}),(0,t.jsx)("span",{className:ei.default.dash,"aria-hidden":"true",children:"—"}),(0,t.jsx)("p",{className:ei.default.line,children:j?.summary}),(0,t.jsx)("a",{href:j?.href,className:`${ei.default.infoLink} link-swap`,onClick:e=>{e.preventDefault(),T.current()},children:"Play video ▶"}),(0,t.jsxs)("dl",{className:ei.default.details,children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("dt",{children:"Role"}),(0,t.jsx)("dd",{children:j?.role})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("dt",{children:"Client"}),(0,t.jsx)("dd",{children:j?.client})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("dt",{children:"Launch"}),(0,t.jsx)("dd",{children:j?.year})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("dt",{children:"Services"}),(0,t.jsx)("dd",{children:j?.services})]})]})]},j?.slug),w&&(0,t.jsxs)("div",{className:ei.default.workWord,"aria-hidden":"true","data-slot":h.work,children:[(0,t.jsx)("span",{children:"Work"}),(0,t.jsx)("span",{className:ei.default.workSitter,children:b&&(0,t.jsx)(eL,{active:!0})})]}),w&&k&&j&&(0,t.jsx)("dl",{className:ei.default.about,"data-slot":h.about,children:[["Role",j.role],["Client",j.client],["Services",j.services],["Year",j.year]].map(([e,a])=>(0,t.jsxs)("div",{children:[(0,t.jsx)("dt",{children:e}),(0,t.jsx)("dd",{children:a})]},e))},`about-${j.slug}`),w&&k&&j&&(0,t.jsx)("p",{className:ei.default.desc,"data-slot":h.desc,children:j.summary},`desc-${j.slug}`),(0,t.jsx)("p",{className:ei.default.selected,"aria-hidden":"true","data-slot":h.selected,children:"SELECTED"}),(0,t.jsxs)("div",{className:ei.default.caption,"data-slot":h.caption,children:[(0,t.jsx)("span",{className:ei.default.capName,children:j?.title}),(0,t.jsx)("a",{href:j?.href,className:`${ei.default.capLink} link-swap`,onClick:e=>{e.preventDefault(),T.current()},children:"Play video ▶"})]},`cap-${j?.slug}`),(0,t.jsxs)("button",{type:"button",className:`btn ${ei.default.mix}`,"data-plain":!0,onClick:()=>{let e=i.current;if(!e)return;m.current=ef.Flip.getState(e.querySelectorAll("[data-slot]"));let t=(e=>{for(;;){let[t,a,r]=eR(["L","R","A","U"]),l=.5>Math.random()?!e.flip:e.flip,o=l?["TL","BR"]:["TR","BL"],i=.5>Math.random(),n={about:t,desc:a,caption:r,work:o[+!!i],selected:o[+!i],flip:l};if(Object.keys(n).some(t=>n[t]!==e[t]))return n}})(h);t.flip!==h.flip&&R.current(t.flip),p(t)},children:[(0,t.jsx)("span",{"aria-hidden":"true",children:"↻"})," Mix"]})]})}e.s(["WorkPage",0,function({projects:e,look:n}){let s=(0,r.useRouter)(),u="honey"===n||"compile"===n||"viscose"===n;return(0,i.useScrollLock)(!0),(0,a.useEffect)(()=>{let e=document.documentElement;e.dataset.sky="white";let t=e.style.overflow;return e.style.overflow="hidden",()=>{delete e.dataset.sky,e.style.overflow=t}},[]),(0,a.useEffect)(()=>{for(let t of e){}},[e,s]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.CustomCursor,{}),(0,t.jsx)(l.NavBar,{visible:!0}),(0,t.jsxs)("main",{id:"main-content","data-surface":"paper","data-no-parallax":!0,children:[(0,t.jsx)("h1",{className:"sr-only",children:"Selected work"}),(0,t.jsx)("nav",{className:"sr-only","aria-label":"All projects",children:(0,t.jsx)("ul",{children:e.map(e=>(0,t.jsx)("li",{children:(0,t.jsxs)("a",{href:e.href,children:[e.title,": ",e.type,", ",e.year]})},e.slug))})}),"arc"===n?(0,t.jsx)(eE,{projects:e,next:!0}):u?(0,t.jsx)(eh,{projects:e,look:n}):(0,t.jsx)(eE,{projects:e})]})]})}],15957)},92354,e=>{e.v({about:"WorkReel-module__olH-9q__about",capKind:"WorkReel-module__olH-9q__capKind",capLink:"WorkReel-module__olH-9q__capLink",capName:"WorkReel-module__olH-9q__capName",caption:"WorkReel-module__olH-9q__caption",column:"WorkReel-module__olH-9q__column",count:"WorkReel-module__olH-9q__count",countBig:"WorkReel-module__olH-9q__countBig",countLabel:"WorkReel-module__olH-9q__countLabel",countOf:"WorkReel-module__olH-9q__countOf",current:"WorkReel-module__olH-9q__current",dash:"WorkReel-module__olH-9q__dash",desc:"WorkReel-module__olH-9q__desc",details:"WorkReel-module__olH-9q__details",fadeUp:"WorkReel-module__olH-9q__fadeUp",info:"WorkReel-module__olH-9q__info",infoLink:"WorkReel-module__olH-9q__infoLink",kind:"WorkReel-module__olH-9q__kind",line:"WorkReel-module__olH-9q__line",lineUp:"WorkReel-module__olH-9q__lineUp",me:"WorkReel-module__olH-9q__me",mix:"WorkReel-module__olH-9q__mix",name:"WorkReel-module__olH-9q__name",noteArrow:"WorkReel-module__olH-9q__noteArrow",noteWords:"WorkReel-module__olH-9q__noteWords",notes:"WorkReel-module__olH-9q__notes",progress:"WorkReel-module__olH-9q__progress",root:"WorkReel-module__olH-9q__root",scroll:"WorkReel-module__olH-9q__scroll",selected:"WorkReel-module__olH-9q__selected",sitterIn:"WorkReel-module__olH-9q__sitterIn",ticks:"WorkReel-module__olH-9q__ticks",workSitter:"WorkReel-module__olH-9q__workSitter",workWord:"WorkReel-module__olH-9q__workWord"})},66915,e=>{e.v({blur:"WorkStream-module__a7KMwG__blur",blurIn:"WorkStream-module__a7KMwG__blurIn",digit:"WorkStream-module__a7KMwG__digit",dim:"WorkStream-module__a7KMwG__dim",fact:"WorkStream-module__a7KMwG__fact",facts:"WorkStream-module__a7KMwG__facts",info:"WorkStream-module__a7KMwG__info",inquiries:"WorkStream-module__a7KMwG__inquiries",item:"WorkStream-module__a7KMwG__item",itemName:"WorkStream-module__a7KMwG__itemName",itemType:"WorkStream-module__a7KMwG__itemType",kind:"WorkStream-module__a7KMwG__kind",label:"WorkStream-module__a7KMwG__label",links:"WorkStream-module__a7KMwG__links",list:"WorkStream-module__a7KMwG__list",listWrap:"WorkStream-module__a7KMwG__listWrap",me:"WorkStream-module__a7KMwG__me",num:"WorkStream-module__a7KMwG__num",of:"WorkStream-module__a7KMwG__of",phoneCaption:"WorkStream-module__a7KMwG__phoneCaption",reelWords:"WorkStream-module__a7KMwG__reelWords",root:"WorkStream-module__a7KMwG__root",scroll:"WorkStream-module__a7KMwG__scroll",start:"WorkStream-module__a7KMwG__start",summary:"WorkStream-module__a7KMwG__summary",swatches:"WorkStream-module__a7KMwG__swatches",where:"WorkStream-module__a7KMwG__where"})},79422,e=>{e.v({canvas:"WorkRing-module__KP5grq__canvas",count:"WorkRing-module__KP5grq__count",defs:"WorkRing-module__KP5grq__defs",film:"WorkRing-module__KP5grq__film",goo:"WorkRing-module__KP5grq__goo",grain:"WorkRing-module__KP5grq__grain",layer:"WorkRing-module__KP5grq__layer",list:"WorkRing-module__KP5grq__list",loader:"WorkRing-module__KP5grq__loader",meta:"WorkRing-module__KP5grq__meta",room:"WorkRing-module__KP5grq__room",row:"WorkRing-module__KP5grq__row",stage:"WorkRing-module__KP5grq__stage"})}]);