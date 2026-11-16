(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60262,e=>{"use strict";var t=e.i(43476),a=e.i(10024),o=e.i(71645),s=e.i(75056),i=e.i(94800),r=e.i(48546),n=e.i(47658),h=e.i(89970),l=e.i(90072);let d=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,c=`
  const float fov = 1.3;
  const vec3 CAM_RO = vec3(-3.5, -1.71, -4.0);
  /**
   * Time of day. THE theme control - see setSun below.
   *
   * Declared here rather than in either pass because both call setSun() and a
   * sun the two passes disagreed about would show up as water reflecting a sky
   * that is not there.
   */
  uniform float uToD;

  /**
   * 1 on a phone, 0 otherwise. Declared here with uToD because both passes
   * include this chunk and a uniform one of them lacks is a link error.
   *
   * The frame is the reason it exists. The camera's height is fixed - 8.3 world
   * units at any aspect - but its WIDTH falls to under four on a phone, so
   * anything measured in angle keeps its size while the frame around it shrinks
   * by three and a half times. The aurora is the thing that shows it: the same
   * curtains that read as distant on a laptop fill a phone.
   */
  uniform float uMobile;

  vec3 lgt;

  mat3 rot_x(float a){float sa = sin(a); float ca = cos(a); return mat3(1.,.0,.0, .0,ca,sa, .0,-sa,ca);}
  mat3 rot_y(float a){float sa = sin(a); float ca = cos(a); return mat3(ca,.0,sa, .0,1.,.0, -sa,.0,ca);}

  // Fixed framing. The original orbits on the pointer; behind a hero that reads
  // as the page tipping rather than as an effect.
  // PITCH is a direct trade between seeing the sun and seeing the water, and
  // there is no value that maximises both.
  //
  // It decides which elevations are on screen. At the original's 0.15 the
  // horizon sits about two thirds down - plenty of water - but the top of
  // frame is only around +12 degrees, and a sun bright enough to be worth
  // showing sits above that, so its glow is simply outside the picture. At
  // 0.30 the sun is comfortably in and the water is a sliver at the bottom.
  //
  // 0.22 keeps the sun in frame with the horizon around four fifths down.
  // Raise it for more sky and more sun, lower it for more water.
  mat3 camMatrix() {
    return rot_y(-0.2) * rot_x(0.22);
  }

  /**
   * Time of day.
   *
   * -1.12 is what the original's default mouse position works out to once its
   * clamp is applied, and it is the low sun that gives the sunset. Refactoring
   * the camera lost it and the sky went to midday, which is a much duller
   * picture: a high sun means short atmospheric path lengths, so the Rayleigh
   * term never reddens and the cloud highlight never warms.
   *
   * Raise toward 0 for midday, lower for dusk.
   */
  void setSun() {
    // Time of day, and it is a three-way compromise rather than a preference.
    //
    // It sets the atmosphere: sunPos drives everything, and a HIGH sun means
    // short path lengths, so the Rayleigh term stops reddening, the sky goes
    // blue and the cloud highlight goes white. The pink was never a colour
    // choice in this shader - it was dusk.
    //
    // But it also sets whether the sun is IN FRAME. This camera sees from
    // about -30 to +12 degrees of elevation. At -1.12 the sun sits at 9
    // degrees: visible, and pink. At 0.25 it climbs to 73: bright and white,
    // and completely outside the frame, which is why the glow could not be
    // seen no matter how it was written.
    //
    // -0.83 puts it near 20 degrees - mid-morning. Sky still blue, clouds
    // still white, and the sun where the glow can actually be seen.
    //
    // THAT IS NOW A UNIFORM, and it is the whole of the theme system. Nothing
    // else changes between day, sunset and night: the sky gradient, the warmth
    // of the cloud rims, the twilight band and the colour the water reflects
    // are all consequences of this one direction, so moving it moves all of
    // them in agreement. See skyTimes.ts for the three values.
    // fract(), so uToD may run off the bottom and keep going.
    //
    // sunPos turns this argument into a full revolution, which means the sky
    // already contained a whole day - the three hours just happen to sit at
    // 0.3055, 0.2470 and 0.1300 of one, all inside its first third. Sweeping
    // from night back UP to day therefore retraced that arc and replayed the
    // sunset backwards, which is the one thing time never does.
    //
    // Going forward now means going DOWN without limit: out of the bottom of
    // the circle, round the far side through dawn and noon, and back to
    // morning having been all the way round. fract() is what lets the value
    // leave [0,1] to do it. GLSL's fract is x - floor(x), so it is already
    // correct for the negatives this now produces.
    lgt = sunPos(fract(0.43 + uToD * 0.15), 0.5);
    // The yaw here is where the sun sits ACROSS the frame, and it has a hard
    // limit: at fov 1.3 the horizontal half-angle is about 34 degrees, so past
    // that the sun leaves the frame and takes its glow with it. 1.35 put it at
    // 49 degrees and the sky went flat. 0.85 lands it around 24 degrees right
    // of the view axis - clear of the character, still in shot.
    // Re-aimed for this time of day. The sun's own azimuth moves with sunPos,
    // so a yaw that put it right at one elevation does not at another - which
    // is why it drifted back to the left when the hour changed. At 0.75 it
    // sits about 23 degrees right of the view axis and 24 above the horizon:
    // inside the frame on both axes, and clear of the character.
    lgt *= rot_y(-0.75);
  }

  vec3 rayFor(vec2 p) {
    return camMatrix() * normalize(vec3(p, -fov));
  }

  /**
   * The moon, defined by where it should sit ON SCREEN rather than by a world
   * azimuth.
   *
   * Placing it by azimuth and elevation is how the sun is done, and it is the
   * wrong tool here: the sun has to be where the physics puts it because every
   * colour in the frame is derived from it, whereas the moon only has to be
   * somewhere good. Running the screen position back through the same ray
   * construction the pixels use lands it exactly there at any aspect.
   *
   * Upper LEFT, because the sun lives on the right and the character sits
   * centre-right. Nothing else is competing for that corner.
   */
  vec3 moonDir() {
    return camMatrix() * normalize(vec3(-0.45, 0.22, -fov));
  }

  /**
   * Deep-blue night grade.
   *
   * The atmosphere model does not go blue on its own once the sun is under the
   * horizon - it goes DIM, and what little is left is the warm residue of the
   * last scattering, so an unattended night came out grey-brown. Real night
   * vision is the opposite: almost no chroma, and what there is reads cold.
   *
   * So this drops the hue, keeps the luminance - which is where all the cloud
   * structure lives - and puts a blue cast back on top.
   */
  vec3 nightGrade(vec3 c, float night) {
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    return mix(c, vec3(l) * vec3(0.58, 0.80, 1.34), night);
  }

  /**
   * How far into night the sun is. 0 while it is up, 1 once it is well under.
   *
   * The WIDTH of this window is what makes dusk read as dusk. It was 0.03 to
   * -0.13, a sixth of the sun's travel from sunset to night, so the whole
   * change from gold to dark happened in a fraction of the sweep and the rest
   * was two static skies with a jump between them.
   *
   * It still starts at zero rather than above it: the sunset sits at +0.03 and
   * has to come out completely ungraded, or golden hour arrives already blue.
   */
  float nightAmount() {
    return smoothstep(0.02, -0.34, lgt.y);
  }

  /**
   * The inverse of rayFor: a world direction back to a screen uv.
   *
   * This is what replaces the original's 23-sample march. The camera basis is
   * a rotation, so its inverse is three dot products - no matrix inverse, no
   * transpose() (which GLSL ES 1.00 does not have).
   */
  vec2 uvForDir(vec3 l, float aspect) {
    mat3 cam = camMatrix();
    vec3 e = vec3(dot(l, cam[0]), dot(l, cam[1]), dot(l, cam[2]));
    vec2 p = e.xy * (-fov / e.z);
    p.x /= aspect;
    return p + 0.5;
  }

  vec3 intcPlane(vec3 ro, vec3 rd, float plH)
  {
      ro.y += plH;
      float t = -ro.y/rd.y;
      if (t < 0.) return vec3(1e6);
      return vec3(t, ro.x + rd.x*t, ro.z + rd.z*t);
  }
`,u=`
  // Sun position for latitude 35: toD is time of day, toY time of year. Cheap
  // and not quite accurate, which does not matter - what matters is that the
  // whole atmosphere is driven by this one direction, so the sky, the cloud
  // lighting, the highlight colour and the twilight agree by construction.
  vec3 sunPos(float toD, float toY)
  {
      toY = 1.0 - abs(fract(toY)-0.5)*2.0;
      float mid = 1.0-abs(toY-0.5)*2.0;
      float k = mix(0.68, 1.5, toY);
      float xk = pow(toD, k);
      toD = xk/(xk + pow(1.0-toD, k));
      toD = -toD*6.283853 - 1.5708 + 0.1;
      return normalize(vec3(sin(toD)*mix(0.4,0.7, mid) + mix(0.1, -0.1, toY),
                            sin(toD) + mix(-.7, 0.69, toY), cos(toD)));
  }
`,f=`
  #define atmoDepth 8228.
  #define earthRadius 6371000.
  #define mieDepth 1800
  #define sunColor vec3( .95, 0.96, 1.2 )
  #define ozoneHeight 30000.
  #define ozoneCoefficient (vec3(3.426, 8.298, .356) * 6e-5 / 100.)
  #define mieCoefficient 16e-6
  #define rayleighCoefficient vec3(5.6e-6, 1.25e-5, 2.9e-5)

  vec3 getThickness(vec3 rd)
  {
      const vec4 cns = earthRadius + vec4(atmoDepth, mieDepth, ozoneHeight, ozoneHeight + atmoDepth);
      const float r2 = earthRadius * earthRadius;
      float b = -rd.y*earthRadius;
      vec4 z = sqrt( cns*cns + (b*b - r2) );
      return vec3(b + z.xy, z.w - z.z);
  }

  // Rayleigh, Mie and ozone in one evaluation. The horizon gradient and the
  // warm band near the sun are not painted - they fall out of the path length
  // through each layer.
  vec4 getSky(vec3 rd, vec3 lgt, float addDepth)
  {
      const vec3 addCol = vec3(1.,1.,1.);
      const mat3 coeffs = mat3(rayleighCoefficient, vec3(mieCoefficient), ozoneCoefficient)/0.693147;
      vec3 thickness = getThickness(rd) + addDepth*addCol;
      float rdl = max(dot(rd, lgt), 0.0);

      vec3 rayleighScatter = (thickness.x * (0.4*rdl*rdl + 1.12))* rayleighCoefficient;
      float g = 0.8 - lgt.y*0.15 - mieCoefficient*1500.;
      float g2 = g*g;
      float a = inversesqrt(g2 - (2.0*g*rdl - 1.0));
      float phaseMie = (0.4 + lgt.y*0.1 + mieCoefficient*7000.)*(1.0 - g2)*a*a*a;
      float mieScatter = thickness.y * phaseMie * mieCoefficient;

      vec3 sunCoeff = coeffs*(getThickness(lgt) + addDepth*addCol);
      vec3 viewCoeff = coeffs*thickness;
      vec3 absorption = (exp2(-viewCoeff) - exp2(-sunCoeff))/((sunCoeff - viewCoeff)*0.693147);

      return vec4(clamp(sunColor*(rayleighScatter + mieScatter)*absorption*(0.6 + lgt.y*0.3), 0., 100.5), sunCoeff);
  }
`;function p(e,t){return`
  vec4 ${e}(vec3 p, float time)
  {
      p.xz += vec2(-time*1.0, time*0.25);
      time *= 0.25;
      p.y -= 9.0;
      p *= vec3(0.19,0.3,0.19)*0.45;
      float rz = 0.;
      vec3 drv = vec3(0);

      float z = 0.5;
      float trk= 0.9;
      float dspAmp = 0.2;

      float att = clamp(1.31-abs(p.y - 5.5)*0.095,0.,1.);
      float off = dot(sin(p*.52)*0.7+0.3, cos(p.yzx*0.6)*0.7+0.3)*0.75 - 0.2;
      float ofst = 12.1 - time*0.1;

      for (int i = 0; i<${t}; i++)
      {
          p += sin(p.yzx*trk - trk*2.0)*dspAmp;

          vec3 c = cos(p);
          vec3 s = sin(p);
          vec3 cs = cos(p.yzx + s.xyz + ofst);
          vec3 ss = sin(p.yzx + s.xyz + ofst);
          vec3 s2 = sin(p + s.zxy + ofst);
          vec3 cdrv = (c*(cs - s*ss) - s*ss.yzx - s.zxy*s2)*z;

          rz += (dot(s, cs) + off - 0.1)*z;
          rz *= att;
          drv += cdrv;

          p += cdrv*0.05;
          p.xz += time*0.1;

          dspAmp *= 0.7;
          z *= 0.57;
          trk *= 2.1;
          p *= m3x;
      }

      return vec4(rz, drv);
  }
`}let m=`
  precision highp float;
  varying vec2 vUv;

  /** The WHOLE sky's size, both fields together - see uField. */
  uniform vec2  iResolution;
  /**
   * Which half of the columns this draw is: 0 the even ones, 1 the odd.
   *
   * The sky is marched as two interleaved fields, each half the width of the
   * whole, one field a frame. SkyBackdrop explains why; all this pass needs to
   * know is which column of the whole sky each of its pixels stands for.
   */
  uniform float uField;
  uniform float iTime;
  /** The cloud field's position in time, accumulated on the CPU. */
  uniform float uCloudTime;

  ${u}
  ${c}
  ${f}

  // "Cyclic" noise: instead of hashing a lattice it folds space with sin/cos
  // repeatedly. It needs no texture and gives the curled, wispy structure that
  // lattice noise cannot - and it returns its own DERIVATIVE in yzw, which the
  // lighting below uses as a normal.
  /**
   * The clouds' own clock, accumulated on the CPU rather than derived here.
   *
   * It used to be iTime * 2.2. That cannot be sped up on the fly: multiplying
   * a running clock by a new factor jumps the field to a different place
   * instantly, so a scroll would tear the sky rather than accelerate it.
   * Accumulating the offset a frame at a time means the rate can change
   * whenever it likes and the position stays continuous.
   *
   * Still separate from iTime, which the water ripples use: the two want
   * different paces and looked wrong tied to one number.
   */
  float cloudTime() { return uCloudTime; }

  const mat3 m3x = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339)*2.01;

  // cloudMap, the field the march reads, at its full six octaves...
  ${p("cloudMap",6)}
  // ...and cloudShade, the SAME field without its two finest octaves, for the
  // two self-shadow taps toward the sun. Those taps were a third of the whole
  // sky's cost, and all they ask is how much cloud lies between here and the
  // sun - a question the two finest octaves (under a twentieth of the field's
  // amplitude) cannot change the answer to. Measured against the six-octave
  // taps: a mean difference of 0.4 in 255 per pixel, 13% less time.
  ${p("cloudShade",4)}

  // NO getMoon. The moon is gone from the frame - see the note in main().
  // moonDir survives because the cloud lighting still uses it at dusk, when
  // there is still cloud to light.

  vec3 getSun(vec3 rd, float sunCoeff)
  {
      float rdl = max(dot(rd, lgt), 0.0);
      float dcy = smoothstep(-0.05,0.2,lgt.y);
      vec3 sun = 50.0*vec3(1.,1.,.4)*pow(rdl, 10000.)*clamp(1.0 - dcy*.7, 0.,1.);
      sun += 10.0*vec3(1.,0.7,.2)*pow(rdl, 3500.);
      sun *= clamp(1.0 - dcy*.6, 0.,1.);
      sun *= exp2(-sunCoeff*0.45);
      return sun;
  }

  vec4 getClouds( in vec3 ro, in vec3 rd, vec3 skyCol )
  {
      vec4 rez = vec4(0.);
      float t = min(intcPlane(ro, rd, -12.).x, 175.);

      float updl = dot(lgt, vec3(0, 1, 0));
      float sunUp = max(updl, 0.);
      float sunUp3 = clamp(sunUp*sunUp*sunUp*6., 0.0, 1.0);
      float sunDw = 1.0 - sunUp;
      sunDw = pow(sunDw, 6.0);

      float bsd = dot(lgt.xz, rd.xz);
      float sd = max(bsd, 0.0);
      float sd2 = max(bsd*0.55 + 0.53,0.);

      vec3 topSky = clamp(getSky(vec3(0, 1, 0), lgt, 0.).xyz, 0.,1.);
      vec3 baseCol = mix(topSky, vec3(0.05, 0.066, 0.09), clamp(sunUp3,0.0, 0.6))*0.2;

      // Extra optical depth for the highlight lookup: light that has travelled
      // further through atmosphere before reaching the cloud. This is what
      // turns the rim orange near sunset rather than merely brighter.
      float extraDepth = 14e4*((1.0-bsd)*0.2 + 0.9)*pow(1.0 - sunUp, 4.0);
      vec3 hlitCol = clamp(getSky(normalize((lgt-vec3(0,0.001,0))*rot_y(0.15)), lgt, extraDepth).xyz ,0.0, 1.0);
      hlitCol = hlitCol*sd2*mix(sunDw, sunDw*sunDw, sd)*8.;

      vec3 bSkyCol = getSky(rd, lgt, extraDepth*5.0*(sunUp*0.8 + 0.2)).xyz;
      vec3 sunLCol = mix(vec3(1.0, 0.8, 0.75), vec3(.5), sunUp);
      vec3 atmoCol = mix(bSkyCol*(sunUp*0.3+0.7), sunLCol*dot(bSkyCol, vec3(0.38)), sunUp3)*0.25;

      // ---- night ------------------------------------------------------------
      //
      // Every colour above is derived from the sun, so once it is under the
      // horizon they all collapse to a dim warm residue and the clouds come out
      // grey-brown. Two corrections, and only these two:
      //
      //   1. Grade what the sun still contributes to cold blue.
      //   2. Give the moon its own light, because otherwise nothing is lighting
      //      the clouds at all and they read as holes rather than as cloud.
      //
      // The moon term is scaled by the same night factor, so at noon it is
      // exactly zero and the daytime look is bit-for-bit unchanged.
      float night = nightAmount();
      vec3 mdir = moonDir();
      baseCol = nightGrade(baseCol, night);
      atmoCol = nightGrade(atmoCol, night);
      hlitCol = nightGrade(hlitCol, night);

      // Moonlight is a few thousand times weaker than sunlight, so this is not
      // a second sun - it is a rim, enough to say which side the light is on.
      vec3 moonCol = vec3(0.58, 0.68, 0.92)*night*0.5;
      baseCol += vec3(0.012, 0.018, 0.034)*night;

      // 64, down from 85. The loop already breaks on saturation and on
      // distance, so the last steps were mostly spent on rays that had nothing
      // left to accumulate - and every step inside cloud costs three field
      // evaluations: the six-octave cloudMap and two four-octave cloudShades.
      for(int i=0; i<64; i++)
      {
          vec3 pos = ro + t*rd;
          if(rez.a > 0.99 || t > 300. || pos.y > 150.)break;
          vec4 cld = cloudMap(pos, cloudTime());
          float den = clamp(cld.x, 0., 1.)*1.02;
          float dn = clamp((cld.x + 1.9),0.0 , 3.0);

          vec4 col = vec4(0);

          if (cld.x > 0.6)
          {
              col = vec4(baseCol, 0.1);
              float nl = max(dot(cld.yzw, -lgt), -1.2);
              // Two taps toward the sun at different distances: cheap
              // multi-scale self-shadowing, and the reason these clouds have
              // depth rather than merely a lit side. Through cloudShade, the
              // field without its finest octaves - see its note.
              float dif = clamp((cld.x - cloudShade(pos + lgt*8., cloudTime()).x)*0.4 + 0.2, 0.11, 2.0 )*2.5;
              dif += clamp((cld.x - cloudShade(pos + lgt*15., cloudTime()).x)*0.2 - 0.03, -0.02, 1. )*4.0;

              col.rgb += atmoCol*((nl*0.25 + 0.7)*dif*0.65);

              // The moon lights the cloud from its own direction, using the
              // same field derivative the sun does. Without this the night
              // clouds have a lit side that points at a sun nobody can see.
              float nlM = max(dot(cld.yzw, -mdir), 0.0);

              float den2 = den*den;
              float den4 = den2*den2;
              col *= den4*den4;
              col.rgb += col.a*clamp((nl*0.8 + 0.1)*dif,0.,1.)*hlitCol;
              col.rgb += col.a*nlM*nlM*moonCol;
          }

          float fogC = exp2(t*0.012/(rd.y + 0.35) - 11.7);
          col.rgba += vec4(skyCol, 1.0)*clamp(fogC, 0.0, 1.0);
          rez = rez + col*(1.0 - rez.a);
          // Steps shorten where the field is dense: detail where it is needed,
          // long strides through empty sky.
          t += clamp(7. - dn*dn*.85, 1.2, 7.);
      }
      return clamp(rez, 0.0, 1.0);
  }

  // ---- terrain (NOT CURRENTLY DRAWN) ---------------------------------------
  //
  // The original's cyclic terrain, kept because the shape functions are right
  // and the next attempt should start from them rather than from scratch.
  //
  // It does not draw. The height field puts its surface around y=-1 while the
  // camera sits at y=-1.71, so at close range the camera is INSIDE the terrain:
  // the first sample is negative, the march walks backwards, and starting it
  // further out instead means rays in the horizon band climb over the surface
  // without ever crossing it. Fixing it properly means moving the terrain down
  // relative to the camera - or the camera up - so there is a real surface
  // below the horizon to hit, and that is a framing change, not a tweak.
  //
  // The cost story, for when it is picked up again: what makes terrain
  // affordable here is not simplifying it but only LOOKING for it where it can
  // be. Distant hills occupy a narrow band just above the water's horizon;
  // rays outside that band skip the march entirely, which turns a full-screen
  // cost into a few percent of one.
  const mat3 m3 = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339)*2.1;

  void cyclicOctave(inout vec3 p, inout float rz, inout float z, inout float trk, inout float dspAmp)
  {
      p += sin(p.yzx*0.25*trk - trk*6.1 + cos(p*0.1 + 0.5)*1.0)*dspAmp;
      float ofst = 4.6;
      vec3 s = sin(p*1.3);
      rz += smoothstep(-1.1, 0.5, dot(s, cos(p.yzx*0.95 + s.xyz + ofst)))*z;

      dspAmp *= 0.65;
      z *= 0.45;
      trk *= 1.45;
      p *= m3;
  }

  // Six octaves, the original's "simp" variant. The full eleven are for
  // close-up ground; at this range the extra five are below a pixel.
  float cyclic3DSimp(vec3 p)
  {
      float rz = 0.;
      float z = 1.44;
      float trk = 1.0;
      float dspAmp = 1.;
      for (int i = 0; i<=5; i++) cyclicOctave(p, rz, z, trk, dspAmp);
      return rz - 1.1;
  }

  float terrainMap(vec3 p)
  {
      float d = p.y;
      d -= sin(p.z*0.2 + 1.0 - cos(p.x*0.25))*0.35;
      float att = clamp(p.y*0.3 + 1.3, 0., 1.);
      d += cyclic3DSimp(p*0.3)*att + 1.;
      return d;
  }

  /**
   * Starts at 14, not at the camera - and that is the fix, not an optimisation.
   *
   * This height field puts its surface around y=-1 and the camera sits at
   * y=-1.71, so at close range the camera is INSIDE the terrain. A march
   * beginning there reads a negative distance on the first sample and either
   * walks backwards or immediately "hits" solid ground across the whole band,
   * which is why the first attempt drew nothing usable.
   *
   * Only distant hills are wanted, so skipping the near range removes the
   * problem instead of working around it.
   *
   * Under-relaxed at 0.8: the field is not a true distance function, so a full
   * step overshoots and the march punches through a ridge.
   */
  float marchTerrain(vec3 ro, vec3 rd)
  {
      float t = 14.0;
      for (int i = 0; i < 40; i++)
      {
          float h = terrainMap(ro + rd*t);
          if (abs(h) < 0.004*t || t > 60.) break;
          t += h*0.8;
      }
      return t;
  }

  // ---- THE AURORA --------------------------------------------------------
  //
  // After nimitz's "Auroras" (Shadertoy XtGGRt), adapted rather than dropped
  // in. Three things had to change.
  //
  //   1. GLSL ES 1.00. The original's star hash is built on uvec3 and bitwise
  //      shifts, which need ES 3.00. That function is not here - the stars are
  //      drawn at full resolution in the grade pass and were tuned once
  //      already. The aurora itself is pure float maths and ports as-is.
  //
  //   2. Twenty-four layers, not fifty. This is by far the most expensive
  //      thing in the frame when it runs: every layer evaluates a five-octave
  //      noise, so fifty layers is two hundred and fifty evaluations PER PIXEL
  //      on top of a sixty-four step cloud march. The loop index is scaled by
  //      a span derived from the layer count, so the band spans the same heights and
  //      exponential falloff, and the accumulation is scaled by it too so the
  //      result is the same brightness rather than half of it.
  //
  //   3. It only exists at night. The caller skips it entirely while the sun
  //      is up, and that branch is coherent across the whole screen - night is
  //      a function of the sun alone - so during the day this costs nothing at
  //      all, not merely little.
  // How strong it reads once the grade pass has tonemapped it. THE number to
  // turn if the aurora is too shy or too much; nothing else here is a taste
  // decision.
  // The scene is the sky now rather than a wash over it, so this is an exposure
  // rather than a veil strength. Turn it if night is too dark or too lit.
  #define AURORA_GAIN 1.0
  // The loop BOUND, which GLSL ES 1.00 requires to be constant. How many of
  // those steps actually run is decided per device inside aurora() - fewer on a
  // phone - by breaking out early, which is the one way to vary a loop there.
  #define AURORA_STEPS 24

  mat2 auroraRot(float a){ float c = cos(a), s = sin(a); return mat2(c,s,-s,c); }
  float auroraTri(float x){ return clamp(abs(fract(x)-0.5), 0.01, 0.49); }
  vec2 auroraTri2(vec2 p){
    return vec2(auroraTri(p.x)+auroraTri(p.y), auroraTri(p.y+auroraTri(p.x)));
  }

  /**
   * The reference's background.
   *
   * Its STAR function is not here. It was, briefly, and it doubled the field:
   * the grade pass already draws stars at full resolution and they were tuned
   * once already, so the reference's were a second set laid over the first.
   * Its nmzHash33 went with them - it is built on uvec3 and bitwise shifts,
   * which are GLSL ES 3.00 and would not have compiled here anyway.
   */
  vec3 auroraBg(vec3 rd)
  {
      float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd)*0.5 + 0.5;
      sd = pow(sd, 5.0);
      vec3 col = mix(vec3(0.05, 0.1, 0.2), vec3(0.1, 0.05, 0.2), sd);
      return col*0.63;
  }

  float auroraNoise(vec2 p, float spd, float t)
  {
      const mat2 M2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);
      float z  = 1.8;
      float z2 = 2.5;
      float rz = 0.0;
      p *= auroraRot(p.x*0.06);
      vec2 bp = p;
      for (int i = 0; i < 5; i++)
      {
          vec2 dg = auroraTri2(bp*1.85)*0.75;
          dg *= auroraRot(t*spd);
          p -= dg/z2;
          bp *= 1.3;
          z2 *= 0.45;
          z  *= 0.42;
          p  *= 1.21 + (rz-1.0)*0.02;
          rz += auroraTri(p.x + auroraTri(p.y))*z;
          p  *= -M2;
      }
      return clamp(1.0/pow(rz*29.0, 1.3), 0.0, 0.55);
  }

  vec4 aurora(vec3 ro, vec3 rd, float t)
  {
      vec4 col = vec4(0.0);
      vec4 avgCol = vec4(0.0);
      // FOURTEEN layers on a phone, twenty-four elsewhere. Every layer is a
      // five-octave noise, so this is the aurora's whole cost, and a phone is
      // both the device least able to pay it and the one showing it smallest.
      // The span is derived from the count rather than fixed, so fewer layers
      // still cover the same heights and add up to the same brightness.
      float steps = mix(float(AURORA_STEPS), 14.0, uMobile);
      float span = 50.0/steps;
      for (int i = 0; i < AURORA_STEPS; i++)
      {
          if (float(i) >= steps) break;
          // fi, not i. Every constant below was fitted against a loop that ran
          // to fifty, so the index is stretched back onto that range - the
          // layer heights, the colour cycle and the falloff all key off it.
          float fi = float(i)*span;
          // NO per-pixel jitter. The reference offsets every layer by a white
          // noise hash of the pixel to break up banding between layers, which
          // at full resolution is invisible. This pass is NOT full resolution:
          // it is marched at a fifth to a quarter of the canvas and magnified,
          // so each noise pixel became a soft blotch several screen pixels
          // across - the aurora looked grainy, and the grain crawled. The
          // running average over layers already smooths the steps, and the
          // B-spline read in the grade pass does the rest.
          float pt = ((0.8 + pow(fi, 1.4)*0.002) - ro.y)/(rd.y*2.0 + 0.4);
          vec3 bpos = ro + pt*rd;
          // 0.18, not the reference's 0.06. That value is tuned for a camera
          // looking up into a whole sky, where slow is majestic; this camera
          // sees a band about twelve degrees tall and at 0.06 the curtains
          // barely moved inside it - it read as a painted backdrop.
          // FINER ON A PHONE. Scaling the sample position up shrinks the
          // features, which is the only honest way to make an aurora "smaller"
          // - it has no size of its own, only a scale of detail, and a narrower
          // frame wants more of it rather than a bigger version of less.
          float rzt = auroraNoise(bpos.zx*mix(1.0, 1.6, uMobile), 0.18, t);
          vec4 col2 = vec4(0.0, 0.0, 0.0, rzt);
          col2.rgb = (sin(1.0 - vec3(2.15, -0.5, 1.2) + fi*0.043)*0.5 + 0.5)*rzt;
          avgCol = mix(avgCol, col2, 0.5);
          // ...and the sum is scaled by the span as well, because half as many
          // terms are being added.
          col += avgCol*exp2(-fi*0.065 - 2.5)*smoothstep(0.0, 5.0, fi)*span;
      }
      // Gone by the horizon. An aurora is a hundred kilometres up; seeing one
      // lying along the ground is what makes a fake one look painted on.
      //
      // The reference floors this at 0.4, which is fine for a camera that looks
      // up into open sky. THIS one sees from about -30 degrees to +12, so a
      // floor of 0.4 put aurora across the entire frame, ground included. A
      // smoothstep from the horizon instead: nothing at the line, full by about
      // seven degrees, which is most of the sky this shot actually has.
      col *= smoothstep(0.0, 0.13, rd.y);
      return col*1.8;
  }

  void main()
  {
      // The column of the WHOLE sky this pixel stands for. This draw is one
      // field, half the width: its pixel x is column 2x of the sky for the
      // even field and 2x+1 for the odd one.
      vec2 uv = vec2((2.0*floor(gl_FragCoord.x) + uField + 0.5)/iResolution.x,
                     gl_FragCoord.y/iResolution.y);
      vec2 p = uv - 0.5;
      p.x *= iResolution.x/iResolution.y;

      setSun();
      vec3 rd = rayFor(p);
      float night = nightAmount();

      vec4 skyCol = getSky(rd, lgt, 0.);
      vec3 col = skyCol.rgb;
      col += getSun(rd, skyCol.w);

      // ---- sun glow --------------------------------------------------------
      // getSun alone is nearly invisible at midday, and deliberately so: its
      // dcy term scales the whole thing by smoothstep(-0.05, 0.2, lgt.y), which
      // is a dusk effect - the original only ever shows the sun low. With the
      // sun raised for daylight that factor sits at its minimum and there is
      // almost nothing left.
      //
      // Three widths, because a real glow is not one falloff: a broad wash of
      // scattered light, a tighter halo, and a small hard disc. One exponent
      // gives either a smear or a dot.
      float rdl = max(dot(rd, lgt), 0.0);
      col += vec3(1.00, 0.93, 0.80) * pow(rdl,    7.0) * 0.30;
      col += vec3(1.00, 0.96, 0.88) * pow(rdl,  110.0) * 0.85;
      col += vec3(1.00, 0.99, 0.95) * pow(rdl, 3000.0) * 4.00;

      // ---- below the horizon ------------------------------------------------
      //
      // There is nothing down there any more - the water is gone - so for a
      // downward ray the atmosphere model is being asked about a path that goes
      // through the planet, and it answers with an enormously long one. At
      // midday that reads as harmless pale haze. At SUNSET it reads as a muddy
      // orange-brown wash across the bottom of the frame, because a long path
      // near a low sun is exactly the condition the Mie term reddens hardest.
      //
      // So fold the ray back up to the horizon and ask about THAT instead, then
      // desaturate toward the luminance as it goes down. Distance haze loses
      // its colour before it loses its brightness, and that is what the bottom
      // of an open sky actually looks like.
      // Weighted by which way the ray is FACING, not only by how far down it
      // points. The warm band near the sun IS the sunset and has to survive
      // untouched; the brown on the opposite side is the same long path with
      // nothing lighting it, and that is the part that reads as dirt. It also
      // starts slightly ABOVE the horizon, because the worst of the muddiness
      // sits just above the line rather than under it.
      float toSun = dot(normalize(rd.xz), normalize(lgt.xz + vec2(1e-4)));
      float away = 0.5 - 0.5*toSun;
      float below = smoothstep(0.20, -0.18, rd.y)*mix(0.22, 1.0, away);
      if (below > 0.001)
      {
          vec3 rdH = normalize(vec3(rd.x, 0.004, rd.z));
          vec3 hz = getSky(rdH, lgt, 0.0).xyz;
          // Toward a COOL grey, not a neutral one. Pulling an orange toward
          // its own luminance gives khaki, which is the dirty olive cast this
          // was supposed to be fixing; real distance haze is air, and air is
          // blue, so the grey it settles into has to be faintly blue too.
          float hl = dot(hz, vec3(0.299, 0.587, 0.114));
          vec3 hazeGrey = vec3(hl)*vec3(0.93, 0.975, 1.10);
          col = mix(col, mix(hz, hazeGrey, 0.78)*1.04, below);
      }

      // Cold-grade the SKY here, before anything is laid on top of it, so the
      // moon and the stars keep their own colour instead of being washed blue
      // along with everything else.
      col = nightGrade(col, night);

      // ---- NIGHT IS THE AURORA SCENE, whole ---------------------------------
      //
      // Not a veil laid over the atmospheric sky - that was the first attempt
      // and it was neither thing: the atmosphere kept its pale twilight, the
      // aurora sat on top of it, and the result read as green fog rather than
      // as a night. This is the reference's own scene, assembled the way the
      // reference assembles it - its background gradient, its stars, its aurora
      // composited over them by alpha - and then crossfaded in as the sun goes
      // under.
      //
      // The crossfade is what keeps the sunset intact. At golden hour the night
      // factor is zero and none of this is evaluated at all; by the time it is
      // dark the atmosphere has nothing left to say anyway.
      if (night > 0.01)
      {
          vec3 nsky = auroraBg(rd);
          if (rd.y > 0.0)
          {
              vec4 aur = smoothstep(0.0, 1.5, aurora(vec3(0.0), rd, iTime));
              nsky = nsky*(1.0 - aur.a) + aur.rgb;
          }
          // A STEEPER ramp than nightAmount itself for the swap.
          //
          // nightAmount is a wide, gentle curve because it grades colour, and
          // it is only about a half at the moment the hour becomes night - so
          // mixing on it directly left half the daytime atmosphere underneath
          // and the aurora sat in pale teal instead of in the dark. Dusk still
          // wants the gentle curve; the SCENE SWAP wants to be finished by the
          // time it is properly dark.
          float nmix = smoothstep(0.05, 0.5, night);
          // LINEARISED before it is handed on, and this is the whole reason
          // night looked like pale teal instead of like night.
          //
          // The reference is a Shadertoy: its colours are DISPLAY-REFERRED, so
          // its background really is the dark navy it looks like on screen.
          // This pipeline is SCENE-REFERRED - the grade pass raises exposure to
          // 2.9 once the sun is under, then sRGB-encodes - and sRGB encoding
          // lifts the bottom of the range hard: a linear 0.05 leaves as 0.29, a
          // mid grey. Handing display values straight in meant the reference's
          // black was being brightened by roughly six times.
          //
          // pow(2.2) undoes the encode the values already carry, putting them
          // back into the linear light this pass is supposed to be writing. The
          // curtains survive it - a bright 0.8 is still 0.61 - because the
          // curve only crushes the dark end, which is exactly the end that was
          // wrong.
          vec3 nlin = pow(max(nsky, 0.0), vec3(2.2))*AURORA_GAIN;
          // And a touch quieter there, because at that scale it is also closer
          // to the type it sits behind.
          col = mix(col, nlin*mix(1.0, 0.82, uMobile), nmix);
      }

      // NO stars here. They used to be, and they came out as soft blobs: this
      // pass marches at a third of canvas resolution and is magnified, so a
      // one-pixel point becomes a three-pixel smudge. They are drawn at full
      // resolution in the grade pass instead, and the alpha channel written
      // below is what lets the clouds still occlude them when they get there.
      //
      // NO MOON. It was here so marched cloud could pass in front of it, and
      // both halves of that are gone: the cloud dissolves at night now, and the
      // reference night this hands over to has no moon in it. A bright disc
      // sitting over an aurora reads as two pictures at once.

      // NO hills. See the note above terrainMap: the march is written and
      // correct in isolation, but it is not finding a surface from this camera,
      // and a march that returns nothing still costs every pixel in its band.
      // Left out rather than left running.

      // NO CLOUD AT NIGHT. They are faded out by the same number that fades
      // the aurora scene in, so the two hand over to each other rather than
      // both being present: cloud over an aurora reads as neither, and the
      // reference has an open sky for a reason - the curtains need something
      // empty to hang in.
      //
      // Faded rather than branched, so dusk has thinning cloud in it instead of
      // cloud that vanishes the instant some threshold is crossed.
      //
      // BRANCHED at the far end, though, and that is the expensive part. This
      // used to march the full sixty-four steps on every pixel and THEN scale
      // the result by zero once night had fully taken over - so all night, the
      // single most expensive loop in the frame ran to produce nothing. The
      // branch is coherent across the whole screen (night depends only on the
      // sun), so skipping it costs nothing and saves the entire march; the fade
      // above is untouched, because the branch only closes once it is at zero.
      float cloudKeep = 1.0 - smoothstep(0.05, 0.5, night);
      vec4 cld = vec4(0.0);
      if (cloudKeep > 0.001)
      {
          cld = getClouds(CAM_RO, rd, col)*cloudKeep;
      }
      col = col*(1.0-cld.w) + cld.xyz;

      // NO tonemap here. The target is half-float and the grade pass wants the
      // range: tonemapping now would clip the sun before it is ever seen.
      //
      // ALPHA carries how much of the background survives the cloud, which was
      // being thrown away. The grade pass draws the stars and needs to know
      // which of them are behind cloud; this is that, for free, in a channel
      // that was already being written.
      gl_FragColor = vec4(col, 1.0 - cld.w);
  }
`,g=`
  precision highp float;
  varying vec2 vUv;

  // The pointer melts the sky where it passes (pointerTrail).
  ${n.POINTER_MELT}

  uniform vec2      iResolution;
  /** Seconds since load. Only the stars use it, and only to twinkle. */
  uniform float     uTime;
  /**
   * The marched sky, as its two fields: uSkyA holds the even columns of the
   * whole sky and uSkyB the odd ones, each half its width. The sky pass fills
   * one of them a frame - see SkyBackdrop - and skyAt() below knits them back.
   */
  uniform sampler2D uSkyA;
  uniform sampler2D uSkyB;
  /**
   * The page turn, 0 flat to 1 fully turned away.
   *
   * This is done HERE, in the shader, rather than as a CSS rotation of the
   * canvas - and that is not a detail. A rotation is rigid: the sheet stays
   * dead flat and pivots, which reads as a panel on a hinge. Paper CURVES, and
   * a curve needs the image itself resampled, which only the shader can do.
   */
  uniform float     uCurl;
  /**
   * While the page turns: the flat, finished sky, drawn once as the turn
   * begins (SkyBackdrop). The sheet's face is read from it instead of being
   * graded again every frame - the full grade on most of a phone's screen
   * was what made the first part of the turn lag (the owner's phone: laggy
   * until the sheet was about 60% over, smooth after).
   */
  uniform sampler2D uFlat;
  uniform float     uUseFlat;
  /**
   * ON A PHONE THE HERO IS PRINTED ON THE SHEET. The flat picture the turn
   * reads holds the hero's last frame too (uSnap - Sagar, the hands and the
   * headline - drawn in over the top uSnapFrac of the sky while the flat
   * picture is made), so the sheet carries them over itself and the hero's
   * own layer is hidden for the turn. It used to be cut to the curl by a
   * clip-path redrawn every frame, which is what lagged on the owner's phone.
   */
  uniform sampler2D uSnap;
  uniform float     uUseSnap;
  uniform float     uSnapFrac;
  /** The WHOLE sky's size in texels, both fields together. */
  uniform vec2      uSkySize;

  ${u}
  ${c}

  // ---- stars -------------------------------------------------------------

  float hash31(vec3 p)
  {
      p = fract(p*0.3183099 + vec3(0.11, 0.17, 0.13));
      p *= 17.0;
      return fract(p.x*p.y*p.z*(p.x + p.y + p.z));
  }

  /**
   * Stars, at FULL canvas resolution.
   *
   * They were drawn in the sky pass, which marches at a third of resolution and
   * is then magnified - every point came out a soft three-pixel blob, and no
   * amount of tightening the falloff could fix that because the blur is in the
   * upscale, not in the star. Here a point can actually be a point.
   *
   * Three things make a field of dots read as a sky rather than as noise:
   *
   *   SIZE VARIES, and with brightness. A real sky is mostly faint stars with a
   *   few bright ones, and the bright ones are bigger because they bloom. One
   *   hash drives both, so they can never disagree.
   *   THE LATTICE IS FINE and only a small fraction of cells are occupied, so
   *   the spacing is irregular. A dense lattice reads as a regular grid however
   *   much the positions are jittered inside it.
   *   TWINKLE IS SLOW AND SHALLOW. Fast flicker looks like a broken shader.
   *
   * Keyed off the ray direction, so the field is fixed to the sky. Faded near
   * the horizon, where a real sky has too much air in the way.
   */
  vec3 stars(vec3 rd, float amt, float clouds, float time)
  {
      if (amt <= 0.001) return vec3(0.0);

      vec3 q  = rd*320.0;
      vec3 id = floor(q);
      vec3 f  = fract(q) - 0.5;

      float h = hash31(id);
      // Roughly one cell in TWO hundred and twenty, down from one in a
      // hundred. The field was tuned against a night sky that also had cloud
      // across it and a moon to look at; with both gone and an aurora behind
      // it, the same density read as static.
      if (h < 0.99545) return vec3(0.0);

      // Re-spread the surviving hashes back over 0..1 so brightness is not all
      // bunched at one end of the range the threshold left behind.
      float b = (h - 0.99545)/0.00455;
      // Squared: most stars faint, a few bright. A linear spread gives a sky of
      // identical medium dots, which is the giveaway; cubed put so much of the
      // field near zero that the sky looked empty.
      float mag = 0.16 + 0.84*b*b;

      // Jitter inside the cell, or the lattice shows through as rows.
      vec2 j = vec2(hash31(id + 11.0), hash31(id + 23.0)) - 0.5;
      vec2 d = f.xy - j*0.6;

      // Bright stars bloom wider.
      //
      // A cell here is about three and a half screen pixels, so these are
      // fractions of that: the first attempt used 0.055, which is a QUARTER of
      // a pixel, and the whole field rendered as invisible specks. 0.18 to 0.32
      // is roughly two thirds of a pixel up to one, plus the Gaussian tail.
      float r = mix(0.18, 0.32, mag);
      float s = exp(-dot(d, d)/(r*r));

      s *= 0.78 + 0.22*sin(time*1.1 + h*512.0);
      s *= smoothstep(-0.01, 0.24, rd.y);

      // Slightly blue, and slightly warm for the brightest - real stars are not
      // all one colour, and the variation is most of what stops them looking
      // printed on.
      vec3 tint = mix(vec3(0.78, 0.86, 1.00), vec3(1.00, 0.94, 0.84),
                      hash31(id + 37.0));

      return tint*s*mag*amt*clouds*2.2;
  }

  /**
   * The sky texture read through a cubic B-spline instead of bilinear: four
   * bilinear taps placed so that together they are the sixteen-tap cubic.
   *
   * The sky is marched at a fraction of the canvas and magnified, and bilinear
   * magnification has visible texel structure - soft diamonds with a seam at
   * every texel boundary. Cloud hides that, because cloud has no fine structure
   * of its own. The aurora does: long thin curtains with bright edges, and read
   * bilinearly those edges came out stepped and blotchy. A B-spline has a
   * continuous slope across texel boundaries, so there is no seam to see.
   *
   * It is softer than bilinear, which is why main() only uses it at night. By
   * day the sun is a small hard disc and the cloud rims are what the eye goes
   * to, and both want the sharper read.
   */
  vec4 cubicWeights(float v)
  {
      vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
      vec4 c = n*n*n;
      float x = c.x;
      float y = c.y - 4.0*c.x;
      float z = c.z - 4.0*c.y + 6.0*c.x;
      float w = 6.0 - x - y - z;
      return vec4(x, y, z, w)*(1.0/6.0);
  }

  // One field through the B-spline: size is that field's own texel size.
  vec4 fieldBSpline(sampler2D field, vec2 size, vec2 uv)
  {
      vec2 inv = 1.0/size;
      vec2 st = uv*size - 0.5;
      vec2 f = fract(st);
      st -= f;
      vec4 xw = cubicWeights(f.x);
      vec4 yw = cubicWeights(f.y);
      vec4 c = st.xxyy + vec4(-0.5, 1.5, -0.5, 1.5);
      vec4 sums = vec4(xw.x + xw.y, xw.z + xw.w, yw.x + yw.y, yw.z + yw.w);
      vec4 o = (c + vec4(xw.y, xw.w, yw.y, yw.w)/sums)*vec4(inv.x, inv.x, inv.y, inv.y);
      vec4 t0 = texture2D(field, o.xz);
      vec4 t1 = texture2D(field, o.yz);
      vec4 t2 = texture2D(field, o.xw);
      vec4 t3 = texture2D(field, o.yw);
      float sx = sums.x/(sums.x + sums.y);
      float sy = sums.z/(sums.z + sums.w);
      return mix(mix(t3, t2, sx), mix(t1, t0, sx), sy);
  }

  // ---- the two fields, knitted back into one sky -------------------------
  //
  // Column c of the whole sky is texel c/2 of uSkyA when it is even and texel
  // (c-1)/2 of uSkyB when odd. In texture coordinates, a whole-sky u lands on
  // uSkyA at u + half a texel and on uSkyB at u - half a texel.
  //
  // AVERAGED, not interleaved back column for column. Interleaving rebuilds
  // the sky texel for texel, but the two fields were marched a frame apart:
  // while the clouds race - the intro, any scroll - neighbouring columns show
  // them in two places and the sky combs into vertical stripes that flicker as
  // the fields take turns. Averaging blends each column with its neighbour
  // instead, which on cloud in fast motion reads as motion blur, and at rest
  // measured the same as interleaving: 0.02 in 255 apart.
  vec4 skyAt(vec2 uv)
  {
      uv = pointerMelt(uv, iResolution.x/iResolution.y, 0.08, 0.3, uTime);
      vec2 h = vec2(0.5/uSkySize.x, 0.0);
      return 0.5*(texture2D(uSkyA, uv + h) + texture2D(uSkyB, uv - h));
  }

  /** The night read: each field through its own B-spline, averaged. */
  vec4 skyBSpline(vec2 uv)
  {
      vec2 size = vec2(uSkySize.x*0.5, uSkySize.y);
      vec2 h = vec2(0.5/uSkySize.x, 0.0);
      return 0.5*(fieldBSpline(uSkyA, size, uv + h) + fieldBSpline(uSkyB, size, uv - h));
  }

  // Whether a point in curl space (x across 0..aspect, y up 0..1) is on the sheet.
  bool onSheet(vec2 q, float aspect)
  {
      return q.x >= 0.0 && q.x <= aspect && q.y >= 0.0 && q.y <= 1.0;
  }


  void main()
  {
      float aspect = iResolution.x/iResolution.y;


      // ---- the page curl ----------------------------------------------------
      //
      // A ROLL, not a fold. The sheet lifts from the bottom-right corner and
      // bends round a cylinder of radius R lying along the crease, and past the
      // top of the cylinder it runs back flat over the page, face down - the
      // way a real sheet curls when it is peeled up from one corner. The axis
      // sweeps up the top-left/bottom-right diagonal, so the corner goes first.
      //
      // A point of the sheet s past the axis sits, rolled, at angle s/R round
      // the cylinder: over the page at d = R sin(s/R) while it climbs the first
      // half turn, then flat and face down at d = PI R - s. So each pixel works
      // back to the sheet point that lands on it:
      //
      //   d <= 0     the flat page - or the rolled-back sheet lying over it
      //   0 < d < R  over the roll: its top (the back of the sheet) where that
      //              part of the sheet exists, else its underside (the front,
      //              bending up into the roll), else nothing
      //   d >= R     uncovered: the page underneath, in the roll's shadow
      //
      // A surface exists only where its sheet point is on the sheet, so the
      // rolled-back part keeps the sheet's own corner shape as it grows.
      //
      // foldGeometry.ts solves the same curl for the hero's DOM on a phone. Its
      // CURL_R and CURL_END must match R and END here.
      vec2 uv = vUv;
      float back = -1.0;
      float frontShade = 1.0;

      if (uCurl > 0.0001)
      {
          // Fully turned: nothing of the sheet is left on screen.
          if (uCurl >= 0.9999)
          {
              gl_FragColor = vec4(0.0);
              return;
          }

          const float R = 0.12;
          // How far past the last corner the axis travels, so the roll and its
          // shadow have left the frame by the end of the turn.
          const float END = 0.42;
          const float HALF_TURN = 3.14159265;

          vec2 p     = vec2(vUv.x*aspect, vUv.y);
          vec2 dir   = normalize(vec2(aspect, -1.0));
          float sMin = dot(vec2(0.0, 1.0), dir);
          float sMax = dot(vec2(aspect, 0.0), dir);

          float axis = mix(sMax, sMin - END, uCurl);
          float d = dot(p, dir) - axis;

          if (d <= 0.0)
          {
              // The sheet, rolled over and lying back across the page face down.
              vec2 q = p + dir*(HALF_TURN*R - 2.0*d);
              if (onSheet(q, aspect))
              {
                  uv = vec2(q.x/aspect, q.y);
                  // Brightest where it comes off the crown of the roll,
                  // settling a little darker as it lies flat.
                  back = 0.84 + 0.16*exp(d/(2.0*R));
              }
          }
          else if (d < R)
          {
              float a = asin(d/R);
              // The top of the roll: the back of the sheet, lit from above, so
              // brightest along the crown and falling off to the silhouette.
              vec2 top = p + dir*(R*(HALF_TURN - a) - d);
              if (onSheet(top, aspect))
              {
                  uv = vec2(top.x/aspect, top.y);
                  back = 0.52 + 0.48*cos(a) + 0.10*exp(-pow((a - 0.45)*3.5, 2.0));
              }
              else
              {
                  // The underside: the front of the sheet bending up into the
                  // roll, turning away from the light as it climbs.
                  vec2 under = p + dir*(R*a - d);
                  if (onSheet(under, aspect))
                  {
                      uv = vec2(under.x/aspect, under.y);
                      frontShade = 0.3 + 0.7*cos(a);
                  }
                  else
                  {
                      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.3);
                      return;
                  }
              }
          }
          else
          {
              // Uncovered, in the roll's shadow: soft and close to the roll,
              // not a grey band across the page. Black with alpha, which is
              // premultiplied as it should be.
              gl_FragColor = vec4(0.0, 0.0, 0.0, 0.3*exp(-(d - R)/0.05));
              return;
          }
      }

      if (back >= 0.0)
      {
          // The BACK of the sheet: light paper whatever the hour, with the
          // print on the other face showing faintly through, mirrored, the way
          // thin paper does. It was keyed to the sky's brightness, which turned
          // it into a slab of dark grey all night.
          vec3 through = 1.0 - exp(-skyAt(uv).rgb*2.1);
          vec3 paper = mix(vec3(0.94), through, 0.14)*back;
          gl_FragColor = vec4(paper, 1.0);
          return;
      }

      if (uUseFlat > 0.5)
      {
          gl_FragColor = vec4(texture2D(uFlat, uv).rgb*frontShade, 1.0);
          return;
      }

      vec2 p = uv - 0.5;
      p.x *= aspect;

      setSun();
      vec3 rd = rayFor(p);

      // Through the B-spline once it is dark enough for the aurora to be the
      // picture, bilinear by day - see skyBSpline. Blended on the same ramp the
      // night scene arrives on in the sky pass, so the handover has no seam.
      vec4 sky = skyAt(uv);
      float soft = smoothstep(0.05, 0.5, nightAmount());
      if (soft > 0.001) sky = mix(sky, skyBSpline(uv), soft);
      vec3 col = sky.rgb;

      // Stars, at this pass's full resolution. sky.a is how much of the
      // background survives the cloud in front of it, written by the sky pass,
      // so a star behind cloud is hidden by the cloud that is actually there
      // rather than by a guess.
      //
      // Read through the CURLED uv like everything else, so they travel with
      // the sheet instead of sitting on the glass in front of it.
      col += stars(rd, smoothstep(-0.03, -0.30, lgt.y), sky.a, uTime);

      // Tonemap and grade, from the original's Image pass. No grain and no
      // dither: nothing here is jittered, so there is no noise to hide.
      //
      // Exposure opens a little as the sun goes down, which is not a cheat - it
      // is what an eye and a camera both do. Held at 2.1 while the sun is up so
      // day and sunset are graded exactly as before.
      //
      // The lift is SMALL on purpose. At 4.6 it cancelled the darkness it was
      // supposed to be compensating for and night came out as a slightly bluer
      // dusk. Night should be dark; this only stops it being a black rectangle.
      float exposure = mix(2.1, 2.9, smoothstep(0.0, -0.34, lgt.y));
      col = 1.0 - exp(-col * exposure);
      col = pow(clamp(col,0.,1.), vec3(0.416667))*1.055 - 0.055;
      col *= pow( 32.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.1)*0.35 + 0.65;
      col *= frontShade;

      // The hero's last frame over the sky, only while the flat picture a
      // phone's turn reads is being made.
      if (uUseSnap > 0.5)
      {
          vec2 suv = vec2(vUv.x, (vUv.y - (1.0 - uSnapFrac)) / uSnapFrac);
          if (suv.y >= 0.0 && suv.y <= 1.0)
          {
              vec4 snap = texture2D(uSnap, suv);
              col = mix(col, snap.rgb, snap.a);
          }
      }

      gl_FragColor = vec4(col, 1.0);
  }
`;var v=e.i(67850),y=e.i(85499),w=e.i(58215),b=e.i(94389);let k=1/45;function x(e,t){return new l.WebGLRenderTarget(e,t,{type:l.HalfFloatType,format:l.RGBAFormat,depthBuffer:!1,stencilBuffer:!1,minFilter:l.LinearFilter,magFilter:l.LinearFilter})}function T({active:e,scroll:a,onReady:s,curl:h=b.skyCurl,rush:c=b.skyRush,drive:u,firstRung:f=0}){var p;let S,{gl:C,size:R}=(0,r.useThree)(),[E,A]=(0,o.useState)(f),D=(p=R.width,(S=p<700?[.2,.16]:[.28,.23,.19])[Math.min(E,S.length-1)]),F=Math.max(2,2*Math.round(R.width*D/2)),M=Math.max(2,Math.round(R.height*D)),I=(0,o.useMemo)(()=>[x(F/2,M),x(F/2,M)],[F,M]);(0,o.useEffect)(()=>(V.current=!0,()=>I.forEach(e=>e.dispose())),[I]);let U=(0,o.useMemo)(()=>({iResolution:{value:new l.Vector2(1,1)},uField:{value:0},iTime:{value:0},uCloudTime:{value:0},uToD:{value:w.SKY_TIMES.day.toD},uMobile:{value:0}}),[]),N=(0,o.useMemo)(()=>{let e=new l.Scene,t=new l.OrthographicCamera(-1,1,1,-1,0,1),a=new l.Mesh(new l.PlaneGeometry(2,2),new l.ShaderMaterial({vertexShader:d,fragmentShader:m,uniforms:U,depthTest:!1,depthWrite:!1}));return a.frustumCulled=!1,e.add(a),{scene:e,camera:t}},[U]),O=(0,o.useMemo)(()=>new l.ShaderMaterial({vertexShader:d,fragmentShader:g,uniforms:{uSkyA:{value:null},uSkyB:{value:null},uSkySize:{value:new l.Vector2(1,1)},iResolution:{value:new l.Vector2(1,1)},uTime:{value:0},uCurl:{value:0},uFlat:{value:null},uUseFlat:{value:0},uSnap:{value:null},uUseSnap:{value:0},uSnapFrac:{value:1},uToD:{value:w.SKY_TIMES.day.toD},uMobile:{value:0},uMeltTrail:{value:(0,n.trailArray)()}},depthTest:!1,depthWrite:!1}),[]),L=(0,o.useRef)(0),H=(0,o.useMemo)(()=>{let e=new l.WebGLRenderTarget(1,1,{depthBuffer:!1});return e.texture.wrapS=e.texture.wrapT=l.RepeatWrapping,e},[]),B=(0,o.useMemo)(()=>new l.CanvasTexture(document.createElement("canvas")),[]);(0,o.useEffect)(()=>()=>B.dispose(),[B]);let G=(0,o.useRef)(-1);(0,o.useEffect)(()=>()=>H.dispose(),[H]);let _=(0,o.useRef)(-1),P=(0,o.useRef)(0),W=(0,o.useRef)(!1),q=(0,o.useRef)(0),Y=(0,o.useRef)(!1),[j,K]=(0,o.useState)(!1);(0,o.useEffect)(()=>{let e=!0,t=C.getRenderTarget(),a=new l.Mesh(new l.PlaneGeometry(2,2),O);C.setRenderTarget(I[0]);let o=[C.compileAsync(N.scene,N.camera)];return C.setRenderTarget(null),o.push(C.compileAsync(a,N.camera)),u||(C.setRenderTarget(H),o.push(C.compileAsync(a,N.camera))),C.setRenderTarget(t),Promise.all(o).then(()=>{a.geometry.dispose(),e&&K(!0)}),()=>{e=!1}},[C,N,O,I,H,u]);let $=(0,o.useRef)(0),V=(0,o.useRef)(!0),X=(0,o.useRef)([]);return((0,i.useFrame)((t,o)=>{let i,r;if(!j)return;let l=Math.min(o,1/30);if(u)i={current:(0,w.toDForClock)(u.u)},r=!1;else{let e=null!==w.skyClock.rushTo;if(e){let e=w.skyClock.rushTo;w.skyClock.rushFor!==e&&(w.skyClock.rushFor=e,w.skyClock.rushFrom=w.skyClock.u,w.skyClock.rushT=0),w.skyClock.rushT+=o;let t=w.skyClock.rushT/w.SKY_RUSH_SECONDS;w.skyClock.u=w.skyClock.rushFrom+(e-w.skyClock.rushFrom)*(0,w.skyEase)(t),t>=1&&(w.skyClock.u=e,w.skyClock.rushTo=null,w.skyClock.rushFor=null)}else w.skyClock.u+=o/w.SKY_TURN_SECONDS;w.skyClock.toD=(0,w.toDForClock)(w.skyClock.u),i={current:w.skyClock.toD},r=e}if(!e&&!r)return;L.current+=l;let d=Math.min(a?.current??0,70);h.value<=.001&&(q.current+=l*(2.2+d+45*c.value)),U.iTime.value=L.current,U.uCloudTime.value=q.current,U.uToD.value=i.current;let f=+(R.width<700);U.uMobile.value=f,O.uniforms.uMobile.value=f,U.iResolution.value.set(F,M),O.uniforms.uSkyA.value=I[0].texture,O.uniforms.uSkyB.value=I[1].texture,O.uniforms.uSkySize.value.set(F,M),O.uniforms.uTime.value=L.current,O.uniforms.uCurl.value=h.value;let p=!u&&b.skyBake.on;v.heroSnap.version!==G.current&&(G.current=v.heroSnap.version,v.heroSnap.canvas&&(B.dispose(),B.image=v.heroSnap.canvas,B.needsUpdate=!0),_.current=-1);let m=!u&&!W.current&&$.current>3,g=p&&h.value<=.001&&!!v.heroSnap.canvas&&v.heroSnap.baked!==v.heroSnap.version;if(h.value>.001||m||g){let e=h.value===P.current;if(m||g||_.current<0||_.current>=z&&e){W.current=!0;let e=C.domElement.width,a=C.domElement.height;(H.width!==e||H.height!==a)&&H.setSize(e,a),O.uniforms.uCurl.value=0,O.uniforms.uUseFlat.value=0,O.uniforms.uFlat.value=null;let o=p&&!!v.heroSnap.canvas;if(O.uniforms.uUseSnap.value=+!!o,O.uniforms.uSnap.value=o?B:null,o){let e=document.getElementById(y.HERO_STAGE_ID)?.clientHeight||0,t=C.domElement.clientHeight||1;O.uniforms.uSnapFrac.value=e>0?Math.min(1,e/t):1}let s=C.getRenderTarget();C.setRenderTarget(H),C.render(t.scene,t.camera),C.setRenderTarget(s),O.uniforms.uUseSnap.value=0,v.heroSnap.baked=o?v.heroSnap.version:-1,O.uniforms.uCurl.value=h.value,_.current=0}h.value>.001?(_.current+=1,O.uniforms.uFlat.value=H.texture,O.uniforms.uUseFlat.value=1):(_.current=g?0:-1,O.uniforms.uUseFlat.value=0)}else p&&v.heroSnap.canvas&&v.heroSnap.baked===v.heroSnap.version||(_.current=-1),O.uniforms.uUseFlat.value=0;O.uniforms.uToD.value=i.current,O.uniforms.iResolution.value.set(R.width,R.height);let x=O.uniforms.uMeltTrail.value;(0,n.trailLive)()?(0,n.fillTrail)(x,(0,n.trailBox)(C.domElement)):0!==x[2]&&(0,n.clearTrail)(x);let T=h.value>.001;if(P.current=h.value,!T&&E<2){let e=X.current;if(e.push(o),e.length>=120){e.sort((e,t)=>e-t);let t=e[e.length>>1],a=e[Math.floor(.05*e.length)];e.length=0,t>Math.min(k,1.5*a)&&A(e=>Math.min(e+1,2))}}if($.current+=1,V.current||!T){let e=V.current?0:$.current%2,t=V.current?1:e;V.current=!1;let a=C.getRenderTarget();for(let a=e;a<=t;a++)U.uField.value=a,C.setRenderTarget(I[a]),C.render(N.scene,N.camera);C.setRenderTarget(a)}Y.current||(Y.current=!0,s?.())}),j)?(0,t.jsx)("mesh",{frustumCulled:!1,material:O,children:(0,t.jsx)("planeGeometry",{args:[2,2]})}):null}function S({onChange:e}){let t=(0,r.useThree)(e=>e.setFrameloop);return(0,o.useEffect)(()=>{let a=!1,o=()=>{let t=b.skyCurl.value>=.9999&&null===w.skyClock.rushTo;t!==a&&(a=t,e(t))};return h.default.ticker.add(o),()=>{h.default.ticker.remove(o),t("always")}},[t,e]),null}let z=30;function C(){let e=(0,r.useThree)(e=>e.invalidate);return(0,o.useEffect)(()=>{e(6);let t=window.scrollY,a=b.skyCurl.value,o=()=>{(window.scrollY!==t||b.skyCurl.value!==a||null!==w.skyClock.rushTo)&&(t=window.scrollY,a=b.skyCurl.value,e())},s=()=>e();return h.default.ticker.add(o),window.addEventListener("pointermove",s,{passive:!0}),()=>{h.default.ticker.remove(o),window.removeEventListener("pointermove",s)}},[e]),null}e.s(["Sky",0,T,"SkyBackdrop",0,function(){let[e,i]=(0,o.useState)(!0),[r,n]=(0,o.useState)(!1),[h,l]=(0,o.useState)(!1);(0,o.useEffect)(()=>{if(!r)return;let e=window.setTimeout(()=>l(!0),700);return()=>window.clearTimeout(e)},[r]);let[d,c]=(0,o.useState)(!1),u=(0,o.useRef)(0);return(0,o.useEffect)(()=>{let e=window.scrollY,t=()=>{let t=window.scrollY;u.current+=.16*Math.abs(t-e),e=t},a=window.setInterval(()=>{u.current*=.82},32);return window.addEventListener("scroll",t,{passive:!0}),()=>{window.removeEventListener("scroll",t),window.clearInterval(a)}},[]),(0,o.useEffect)(()=>{let e=document.getElementById("hero");if(!e)return;let t=new IntersectionObserver(([e])=>i(e.isIntersecting),{threshold:0});return t.observe(e),()=>{t.disconnect(),i(!0)}},[]),(0,t.jsx)("div",{"data-sky-backdrop":!0,className:"screen-tallest pointer-events-none z-[5]",style:{background:h?"none":"linear-gradient(to bottom, #a7c3e2 0%, #c6d6e8 44%, #d6dee7 66%, #dde1e5 100%)",visibility:d?"hidden":"visible"},"aria-hidden":!0,children:(0,t.jsxs)(s.Canvas,{onCreated:({gl:e})=>{e.debug.checkShaderErrors=!1},dpr:1,frameloop:d?"never":(0,a.isSoftwareGL)()?"demand":"always",resize:{scroll:!1},gl:{alpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"},style:{opacity:+!!r,transition:"opacity 600ms ease-out"},children:[(0,t.jsx)(S,{onChange:c}),(0,a.isSoftwareGL)()&&(0,t.jsx)(C,{}),(0,t.jsx)(T,{active:e,scroll:u,onReady:()=>n(!0),firstRung:(0,a.isSoftwareGL)()||(0,a.isWeakGPU)()?2:+!!(0,a.isLowEnd)()})]})})}],60262)}]);