(function () {
  const state = {
    active: false,
    canvas: null,
    gl: null,
    program: null,
    frame: 0,
    startedAt: 0,
    analyser: null,
    audioData: null,
    audioTimeData: null,
    audioContext: null,
    sources: new WeakMap(),
    routedSources: new WeakSet(),
    maskingTaps: new WeakMap(),
    sourceErrors: new WeakMap(),
    sourceAttempts: new WeakMap(),
    lastResumeAt: -Infinity,
    reactionEnabled: false,
    reactionPrimed: false,
    style: 5,
    intensity: 0.8,
    audio: new Float32Array([0.18, 0.14, 0.1, 0.14]),
    rhythm: new Float32Array([0, 0, 0, 0]),
    previousBass: 0,
    previousMid: 0,
    previousSnareBand: 0,
    previousHatBand: 0,
    previousTreble: 0,
    lastKickAt: 0,
    lastSnareAt: 0,
    lastAccentAt: 0,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)"),
    uniforms: {},
    diagnosticFrame: 0,
    timelineSource: { media: null, bpm: 112, firstDownbeatSeconds: 0, fallbackBpm: 112 },
    visualTimeline: { seconds: 0, beatPosition: 0, source: "fallback", bpm: 112 },
  };

  const vertexSource = `#version 300 es
    in vec2 a_position;
    out vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    in vec2 v_uv;
    out vec4 outColor;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec4 u_audio;
    uniform vec4 u_rhythm;
    uniform float u_motion;
    uniform float u_style;
    uniform float u_intensity;

    #define PI 3.14159265359
    #define TAU 6.28318530718

    mat2 rot(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
    float sat(float x) { return clamp(x,0.0,1.0); }
    float hash21(vec2 p) {
      p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y);
    }
    vec3 palette(float t) {
      vec3 a=vec3(.52,.48,.54), b=vec3(.48,.43,.46);
      vec3 c=vec3(1.0,.86,.72), d=vec3(.02,.18,.42);
      return a+b*cos(TAU*(c*t+d));
    }
    float polygonRadius(vec2 p,float sides) {
      float a=atan(p.y,p.x)+PI;
      float r=TAU/sides;
      return cos(floor(.5+a/r)*r-a)*length(p);
    }
    float polygonLine(vec2 p,float radius,float sides,float width) {
      return 1.0-smoothstep(width,width+1.5/max(u_resolution.y,500.0),abs(polygonRadius(p,sides)-radius));
    }
    float segment(vec2 p,vec2 a,vec2 b,float w) {
      vec2 pa=p-a, ba=b-a;
      float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
      return 1.0-smoothstep(w,w+1.5/max(u_resolution.y,500.0),length(pa-ba*h));
    }
    float starLine(vec2 p,float radius,float width) {
      float a=polygonLine(p, radius,3.0,width);
      float b=polygonLine(vec2(-p.x,p.y),radius,3.0,width);
      return max(a,b);
    }
    float ring(vec2 p,float r,float w) {
      return 1.0-smoothstep(w,w+1.5/max(u_resolution.y,500.0),abs(length(p)-r));
    }
    float smile(vec2 p,float scale) {
      p/=scale;
      float face=ring(p,.34,.035);
      float eyes=max(1.0-smoothstep(.04,.065,length(p-vec2(-.12,.08))),1.0-smoothstep(.04,.065,length(p-vec2(.12,.08))));
      float mouth=ring(p-vec2(0.0,.02),.19,.028)*step(-.22,p.y)*step(.01,-p.y);
      return max(face,max(eyes,mouth));
    }
    float daisy(vec2 p,float scale,float phase) {
      p/=scale;
      float v=1.0-smoothstep(.11,.15,length(p));
      for(int i=0;i<8;i++){
        float a=float(i)*TAU/8.0+phase;
        vec2 q=(p-vec2(cos(a),sin(a))*.29)*rot(-a);
        float petal=1.0-smoothstep(.10,.14,length(q*vec2(1.0,1.7)));
        v=max(v,petal);
      }
      return v;
    }

    vec4 tunnel(vec2 p,float t,float sides,float variation) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float bass=u_rhythm.x, kick=u_rhythm.y, snare=u_rhythm.z;
      float growth=sat((u_intensity-.18)/.59);
      float activeLayers=1.0+floor(growth*8.0+.001);
      float travel=t*(.12+u_intensity*.72);
      for(int i=0;i<12;i++) {
        float fi=float(i);
        if(fi>=activeLayers) continue;
        float z=fract(fi/12.0+travel*.085);
        float depth=pow(z,1.65);
      float radius=mix(.055,1.32,depth)*(1.0+bass*.018+kick*.026);
        vec2 q=p*rot(t*(.012+u_intensity*.09)*variation*(mod(fi,2.0)*2.0-1.0)+fi*.11*variation);
        q+=vec2(sin(fi*2.1+t*.31),cos(fi*1.7-t*.27))*.026*u_intensity;
        float width=mix(.0045,.014,depth)*(1.0+snare*.18+u_intensity*.25);
        float line=polygonLine(q,radius,sides,width);
        float spoke=0.0;
        if(i<7) {
          for(int j=0;j<6;j++) {
            if(float(j)>=sides) break;
            float a=float(j)*TAU/sides+t*.025*(mod(fi,2.0)*2.0-1.0);
            spoke=max(spoke,segment(q,vec2(cos(a),sin(a))*radius*.25,vec2(cos(a),sin(a))*radius,width*.55));
          }
        }
        float glow=line+spoke*.42;
        vec3 c=palette(fi*.097+t*(.012+u_intensity*.045)+variation*.18+snare*.025);
        color+=c*glow*(.32+depth*.85);
        alpha=max(alpha,glow*(.30+depth*.62));
      }
      return vec4(color,alpha);
    }

    vec4 polyhedra(vec2 p,float t) {
      vec4 base=u_intensity>.24?tunnel(p,t,6.0,.55):vec4(0.0);
      vec3 color=base.rgb; float alpha=base.a;
      float beat=1.0+u_rhythm.x*.035+u_rhythm.y*(.018+u_intensity*.045);
      float growth=sat((u_intensity-.18)/.59);
      float activeShapes=1.0+floor(growth*3.0+.001);
      for(int i=0;i<5;i++) {
        float fi=float(i); if(fi>=activeShapes) continue;
        vec2 q=p*rot(t*(.032+u_intensity*(.085+fi*.014))*(mod(fi,2.0)*2.0-1.0));
        float sides=3.0+fi;
        float r=(i==0?.24:.15+fi*.09)*beat;
        float l=polygonLine(q,r,sides,.006+u_rhythm.z*.0015);
        color+=palette(.12*fi+t*.025)*l*(i==0?1.38:.85); alpha=max(alpha,l*(i==0?.9:.78));
      }
      return vec4(color,alpha);
    }

    vec4 orbit(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float growth=sat((u_intensity-.18)/.59);
      float activeShapes=1.0+floor(growth*6.0+.001);
      for(int i=0;i<10;i++) {
        float fi=float(i); if(fi>=activeShapes) continue;
        float phase=t*(.045+u_intensity*.3)*(mod(fi,2.0)*2.0-1.0)+fi*.63;
        vec2 centre=i==0?vec2(0.0):vec2(cos(phase*1.13),sin(phase*.91))*(.10+fi*.035);
        vec2 q=(p-centre)*rot(-phase*.72);
        float r=(i==0?.22:.075+fi*.028)*(1.0+u_rhythm.y*(.012+u_intensity*.05));
        float sides=3.0+mod(fi,3.0);
        float l=polygonLine(q,r,sides,.006+u_rhythm.z*.0015);
        color+=palette(fi*.14+t*.04)*l*(i==0?1.36:1.0); alpha=max(alpha,l*(i==0?.9:.82));
      }
      if(u_intensity>.34){float halo=ring(p,.3+u_intensity*.18+u_rhythm.x*.012,.008+u_rhythm.z*.001);color+=palette(t*.03)*halo*.55;alpha=max(alpha,halo*.48);}
      return vec4(color,alpha);
    }

    vec4 stellar(vec2 p,float t) {
      vec4 base=u_intensity>.28?tunnel(p,t*.82,3.0,.85):vec4(0.0);
      vec3 color=base.rgb*.72; float alpha=base.a*.75;
      float growth=sat((u_intensity-.18)/.59);
      float activeShapes=1.0+floor(growth*4.0+.001);
      for(int i=0;i<7;i++) {
        float fi=float(i); if(fi>=activeShapes) continue;
        float z=i==0?.28:fract(fi/7.0+t*(.02+u_intensity*.09));
        vec2 q=p*rot(t*(.025+u_intensity*.28)*(mod(fi,2.0)*2.0-1.0)+fi*.3);
        float radius=(i==0?.3:mix(.08,.78,z))*(1.0+u_rhythm.x*.025+u_rhythm.y*u_intensity*.045);
        float l=starLine(q,radius,.006+z*.006+u_rhythm.z*.0015);
        color+=palette(.55+fi*.11-t*.025)*l*(.4+z*.72)*(i==0?1.45:1.0); alpha=max(alpha,l*(i==0?.9:.38+z*.55));
      }
      return vec4(color,alpha);
    }

    vec4 prism(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float pulse=1.0+u_rhythm.x*.025+u_rhythm.y*(.015+u_intensity*.045);
      float growth=sat((u_intensity-.18)/.59);
      float activeShapes=1.0+floor(growth*7.0+.001);
      for(int i=0;i<11;i++) {
        float fi=float(i); if(fi>=activeShapes) continue;
        float z=i==0?.42:fract(fi/11.0+t*(.012+u_intensity*.09));
        vec2 q=p*rot((mod(fi,2.0)*2.0-1.0)*t*(.018+u_intensity*.16));
        if(i>0) q.y+=mix(.42,-.42,z);
        float size=(i==0?.3:mix(.06,.62,z))*pulse;
        float tri=polygonLine(q,size,3.0,.006+z*.008+u_rhythm.z*.0015);
        vec3 c=palette(z*.78+t*.025);
        color+=c*tri*(.32+z*.9)*(i==0?1.4:1.0); alpha=max(alpha,tri*(i==0?.9:.34+z*.58));
      }
      return vec4(color,alpha);
    }

    vec4 rave(vec2 p,float t) {
      vec4 base=u_intensity>.25?tunnel(p,t*1.28,5.0,1.0):vec4(0.0);
      vec3 color=base.rgb*1.28; float alpha=base.a;
      float hero=smile(p*rot(t*(.012+u_intensity*.2)),.34*(1.0+u_rhythm.y*u_intensity*.045));
      color+=palette(.12+t*.035)*hero*(1.32+u_rhythm.z*.16);alpha=max(alpha,hero*.92);
      if(u_intensity>.2){
        float growth=sat((u_intensity-.18)/.59);
        float cell=2.0+floor(growth*3.0);
        vec2 id=floor((p+.8)*cell), q=fract((p+.8)*cell)-.5;
        float seed=hash21(id);
        float population=smoothstep(seed-.08,seed+.08,growth);
        float appear=smoothstep(.42,.7,.5+.5*sin(t*(.25+u_intensity*1.25)+seed*TAU));
        float icon=seed>.52?smile(q*rot(t*(.03+u_intensity*.28)*(seed-.5)),.54):daisy(q,.55,t*(.02+u_intensity*.18)*(seed-.5));
        icon*=population*appear*(.48+u_rhythm.z*.12);
        color+=palette(seed+t*.08)*icon*1.2;alpha=max(alpha,icon*.68);
      }
      return vec4(color,alpha);
    }

    vec3 rotateX(vec3 p,float a) {
      float c=cos(a),s=sin(a); return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);
    }
    vec3 rotateY(vec3 p,float a) {
      float c=cos(a),s=sin(a); return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);
    }
    vec2 perspective(vec3 p) {
      float camera=3.15; return p.xy/(camera-p.z)*1.72;
    }
    vec3 tetraVertex(int index,float inversion) {
      if(index==0) return vec3(0.0,.96*inversion,0.0);
      float a=float(index-1)*TAU/3.0-PI*.5;
      return vec3(cos(a)*.91,-.32*inversion,sin(a)*.91);
    }
    vec4 stellated3d(vec2 p,float t) {
      vec2 q=p-vec2(0.0,-.335);
      q*=rot(.08+sin(t*.12)*.025);
      q.y*=3.15;
      float bass=u_audio.x, treble=u_audio.z;
      float radius=.125+bass*.012;
      float shadow=ring(q,radius,.0045+treble*.0025);
      for(int i=0;i<6;i++) {
        float a=float(i)*TAU/6.0+t*.018;
        vec2 centre=vec2(cos(a),sin(a))*radius;
        shadow=max(shadow,ring(q-centre,radius,.0045+treble*.0025));
      }
      float pool=exp(-dot(q*vec2(.72,1.0),q*vec2(.72,1.0))*7.2);
      float phrase=.72+.28*sin(t*.31+u_audio.w*4.0);
      vec3 gold=vec3(1.0,.68,.2), cyan=vec3(.12,.76,.92);
      vec3 color=mix(gold,cyan,.5+.5*sin(t*.13))*shadow*(.68+treble*.9);
      color+=mix(vec3(.18,.08,.02),vec3(.02,.18,.24),.5+.5*sin(t*.09))*pool*.25;
      float alpha=shadow*(.33+u_intensity*.34)*phrase+pool*(.025+u_intensity*.035);
      return vec4(color,alpha);
    }

    float vectorCircle(vec2 p,float radius) {
      float aa=1.75/max(u_resolution.y,500.0);
      return 1.0-smoothstep(radius,radius+aa,length(p));
    }
    float vectorEllipse(vec2 p,vec2 radius) {
      float aa=2.0/max(u_resolution.y,500.0)/max(min(radius.x,radius.y),.02);
      return 1.0-smoothstep(1.0,1.0+aa,length(p/radius));
    }
    float vectorPolygon(vec2 p,float radius,float sides) {
      float aa=1.75/max(u_resolution.y,500.0);
      return 1.0-smoothstep(radius,radius+aa,polygonRadius(p,sides));
    }
    void vectorPaint(inout vec3 color,inout float alpha,vec3 ink,float mask) {
      mask=sat(mask);
      color=mix(color,ink,mask);
      alpha=max(alpha,mask);
    }
    void vectorComposite(inout vec3 color,inout float alpha,vec4 layer) {
      float amount=sat(layer.a);
      color=mix(color,layer.rgb,amount);
      alpha=max(alpha,amount);
    }
    vec3 vectorColor(float seed,float family) {
      float wave=.5+.5*sin(seed*2.173+family*.71);
      if(family<.5) return mix(vec3(1.0,.71,.17),vec3(.16,.84,.92),wave);
      if(family<1.5) return mix(vec3(.13,.42,1.0),vec3(1.0,.31,.28),wave);
      if(family<2.5) return mix(vec3(.18,.25,1.0),vec3(1.0,.79,.18),wave);
      if(family<3.5) return mix(vec3(1.0,.12,.55),vec3(.04,.89,1.0),wave);
      return mix(vec3(1.0,.08,.46),vec3(.78,1.0,.05),wave);
    }
    vec4 vectorFlower(vec2 p,float scale,float phase,vec3 petal,vec3 centreColor) {
      p/=max(scale,.001);
      p*=rot(phase);
      vec3 color=vec3(0.0); float alpha=0.0;
      vec3 outline=vec3(.018,.012,.025);
      float petalOuter=0.0,petalInner=0.0;
      for(int i=0;i<8;i++) {
        float a=float(i)*TAU/8.0;
        vec2 direction=vec2(cos(a),sin(a));
        vec2 q=(p-direction*.36)*rot(-a);
        petalOuter=max(petalOuter,vectorEllipse(q,vec2(.18,.29)));
        petalInner=max(petalInner,vectorEllipse(q,vec2(.135,.235)));
      }
      vectorPaint(color,alpha,outline,petalOuter);
      vectorPaint(color,alpha,petal,petalInner);
      vectorPaint(color,alpha,outline,vectorCircle(p,.205));
      vectorPaint(color,alpha,centreColor,vectorCircle(p,.16));
      float eyes=max(vectorCircle(p-vec2(-.055,.035),.021),vectorCircle(p-vec2(.055,.035),.021));
      float mouth=1.0-smoothstep(.014,.026,abs(length(p-vec2(0.0,.015))-.077));
      mouth*=step(-.075,p.y)*step(.005,-p.y);
      vectorPaint(color,alpha,outline,max(eyes,mouth));
      return vec4(color,alpha*.9);
    }
    vec4 vectorCharacter(vec2 p,float scale,float phase,vec3 body,vec3 accent) {
      p/=max(scale,.001);
      p*=rot(sin(phase*.73)*.12);
      vec3 color=vec3(0.0); float alpha=0.0;
      vec3 outline=vec3(.018,.012,.025);
      float ears=max(vectorCircle(p-vec2(-.37,.15),.18),vectorCircle(p-vec2(.37,.15),.18));
      float bodyOuter=max(ears,vectorEllipse(p-vec2(0.0,-.03),vec2(.47,.55)));
      float bodyInner=vectorEllipse(p-vec2(0.0,-.03),vec2(.405,.485));
      vectorPaint(color,alpha,outline,bodyOuter);
      vectorPaint(color,alpha,body,bodyInner);
      float belly=vectorEllipse(p-vec2(.03,-.18),vec2(.27,.24));
      vectorPaint(color,alpha,accent,belly);
      vectorPaint(color,alpha,vec3(1.0),max(vectorCircle(p-vec2(-.14,.12),.082),vectorCircle(p-vec2(.14,.12),.082)));
      vectorPaint(color,alpha,outline,max(vectorCircle(p-vec2(-.14,.12),.034),vectorCircle(p-vec2(.14,.12),.034)));
      float mouth=1.0-smoothstep(.018,.032,abs(length(p-vec2(.01,.01))-.16));
      mouth*=step(-.155,p.y)*step(-.01,-p.y);
      vectorPaint(color,alpha,outline,mouth);
      return vec4(color,alpha*.92);
    }
    vec4 vectorRecord(vec2 p,float scale,float phase,vec3 labelColor) {
      p/=max(scale,.001);
      p*=rot(phase);
      vec3 color=vec3(0.0); float alpha=0.0;
      float outer=vectorCircle(p,.5);
      vectorPaint(color,alpha,vec3(.02,.018,.035),outer);
      vectorPaint(color,alpha,vec3(.14,.16,.25),vectorCircle(p,.43));
      vectorPaint(color,alpha,vec3(.02,.018,.035),vectorCircle(p,.34));
      vectorPaint(color,alpha,labelColor,vectorCircle(p,.19));
      vectorPaint(color,alpha,vec3(1.0,.93,.72),vectorCircle(p,.055));
      float shine=segment(p,vec2(-.31,.12),vec2(-.08,.31),.018);
      vectorPaint(color,alpha,vec3(.65,.91,1.0),shine*.7);
      return vec4(color,alpha*.88);
    }
    vec4 vectorDragon(vec2 p,float scale,float phase,vec3 body,vec3 accent) {
      p/=max(scale,.001);
      vec3 color=vec3(0.0); float alpha=0.0;
      vec3 outline=vec3(.018,.012,.025);
      float bodyOuter=0.0,bodyInner=0.0;
      for(int i=0;i<8;i++) {
        float fi=float(i);
        vec2 centre=vec2(-.64+fi*.17,sin(fi*.78+phase)*.14);
        bodyOuter=max(bodyOuter,vectorCircle(p-centre,.165));
        bodyInner=max(bodyInner,vectorCircle(p-centre,.125));
      }
      float headOuter=vectorEllipse(p-vec2(.66,.06),vec2(.31,.25));
      float headInner=vectorEllipse(p-vec2(.66,.06),vec2(.255,.2));
      float hornA=vectorPolygon((p-vec2(.56,.29))*rot(.28),.13,3.0);
      float hornB=vectorPolygon((p-vec2(.76,.28))*rot(-.25),.13,3.0);
      vectorPaint(color,alpha,outline,max(max(bodyOuter,headOuter),max(hornA,hornB)));
      vectorPaint(color,alpha,body,max(bodyInner,headInner));
      vectorPaint(color,alpha,accent,vectorEllipse(p-vec2(.69,-.015),vec2(.17,.105)));
      vectorPaint(color,alpha,vec3(1.0),vectorCircle(p-vec2(.73,.105),.062));
      vectorPaint(color,alpha,outline,vectorCircle(p-vec2(.745,.105),.027));
      float tail=segment(p,vec2(-.72,.02),vec2(-.96,.24),.055);
      vectorPaint(color,alpha,outline,tail);
      vectorPaint(color,alpha,accent,tail*.7);
      return vec4(color,alpha*.9);
    }
    float vectorSpark(vec2 p,float scale,float phase) {
      p/=max(scale,.001);
      p*=rot(phase);
      float vertical=vectorEllipse(p,vec2(.075,.5));
      float horizontal=vectorEllipse(p,vec2(.5,.075));
      return max(vertical,horizontal);
    }
    vec4 templeWorld(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float halo=max(ring(p*vec2(1.0,1.55),.48,.004),ring(p*vec2(1.0,1.55),.64,.003));
      vectorPaint(color,alpha,vec3(1.0,.72,.22),halo*.28);
      for(int i=0;i<9;i++) {
        float fi=float(i);
        float a=fi*TAU/9.0+t*(.025+u_intensity*.055)*(mod(fi,2.0)*2.0-1.0);
        vec2 centre=vec2(cos(a)*(.61+mod(fi,2.0)*.12),sin(a)*(.34+mod(fi,3.0)*.035));
        float scale=.105+mod(fi,3.0)*.018+u_rhythm.y*.008;
        vec3 primary=vectorColor(fi,0.0);
        vec4 sprite=mod(fi,3.0)<1.0
          ?vectorFlower(p-centre,scale,a*.3,primary,vec3(1.0,.78,.12))
          :vectorCharacter(p-centre,scale*.9,a,primary,vec3(1.0,.77,.5));
        vectorComposite(color,alpha,sprite);
      }
      vectorComposite(color,alpha,vectorDragon(p-vec2(-.48,.02+sin(t*.17)*.045),.26,t*.22,vec3(.12,.78,.8),vec3(1.0,.66,.16)));
      vectorComposite(color,alpha,vectorFlower(p-vec2(.55,-.17),.22,-t*.08,vec3(1.0,.24,.48),vec3(1.0,.78,.08)));
      return vec4(color,alpha);
    }
    vec4 orbitWorld(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float trailA=ring(p*vec2(1.0,1.8),.55,.003);
      float trailB=ring((p-vec2(.08,-.025))*vec2(1.0,2.35),.42,.003);
      vectorPaint(color,alpha,vec3(.34,.65,1.0),max(trailA,trailB)*.2);
      for(int i=0;i<11;i++) {
        float fi=float(i);
        float speed=.055+mod(fi,3.0)*.018+u_intensity*.075;
        float a=fi*2.19+t*speed*(mod(fi,2.0)*2.0-1.0);
        float radius=.22+mod(fi,4.0)*.13;
        vec2 centre=vec2(cos(a)*radius*1.42,sin(a)*radius*.72);
        float scale=.09+mod(fi,4.0)*.017;
        vec3 primary=vectorColor(fi,1.0);
        vec4 sprite;
        if(mod(fi,3.0)<1.0) sprite=vectorRecord(p-centre,scale,a,primary);
        else if(mod(fi,3.0)<2.0) sprite=vectorFlower(p-centre,scale,a*.4,primary,vec3(1.0,.8,.13));
        else sprite=vectorCharacter(p-centre,scale*.92,a,primary,vec3(.84,1.0,.62));
        vectorComposite(color,alpha,sprite);
      }
      return vec4(color,alpha);
    }
    vec4 stellarWorld(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      for(int i=0;i<17;i++) {
        float fi=float(i);
        vec2 centre=vec2(sin(fi*12.73)*.82,cos(fi*8.31)*.43);
        centre+=vec2(sin(t*.07+fi)*.035,cos(t*.055+fi*.7)*.025);
        float sparkle=vectorSpark(p-centre,.025+mod(fi,4.0)*.009,t*.11+fi);
        vectorPaint(color,alpha,vectorColor(fi,2.0),sparkle*(.32+mod(fi,3.0)*.16));
      }
      vectorComposite(color,alpha,vectorDragon(p-vec2(-.32,.04+sin(t*.12)*.05),.36,t*.17,vec3(.2,.29,1.0),vec3(1.0,.76,.12)));
      vectorComposite(color,alpha,vectorFlower(p-vec2(.61,.25),.25,t*.06,vec3(1.0,.26,.52),vec3(1.0,.82,.12)));
      vectorComposite(color,alpha,vectorCharacter(p-vec2(.58,-.2),.19,-t*.09,vec3(.16,.82,1.0),vec3(1.0,.77,.3)));
      return vec4(color,alpha);
    }
    vec4 prismWorld(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      for(int i=0;i<4;i++) {
        float fi=float(i);
        vec2 q=(p-vec2((fi-1.5)*.17,sin(fi*1.7+t*.08)*.055))*rot(t*(.018+fi*.006)*(mod(fi,2.0)*2.0-1.0)+fi*.21);
        float outer=vectorPolygon(q,.52-fi*.055,3.0);
        float inner=vectorPolygon(q,.43-fi*.055,3.0);
        float band=max(0.0,outer-inner);
        vectorPaint(color,alpha,vectorColor(fi,3.0),band*(.28+fi*.08));
      }
      vectorComposite(color,alpha,vectorCharacter(p-vec2(-.55,.12),.22,t*.08,vec3(1.0,.15,.52),vec3(.06,.9,1.0)));
      vectorComposite(color,alpha,vectorFlower(p-vec2(.54,.24),.2,-t*.07,vec3(.06,.88,1.0),vec3(1.0,.82,.08)));
      vectorComposite(color,alpha,vectorRecord(p-vec2(.5,-.22),.17,t*.13,vec3(1.0,.19,.57)));
      vectorComposite(color,alpha,vectorFlower(p-vec2(-.48,-.28),.13,t*.1,vec3(1.0,.74,.05),vec3(1.0,.2,.5)));
      return vec4(color,alpha);
    }
    vec4 raveWorld(vec2 p,float t) {
      vec3 color=vec3(0.0); float alpha=0.0;
      float kick=1.0+u_rhythm.y*(.04+u_intensity*.08);
      for(int i=0;i<18;i++) {
        float fi=float(i);
        float a=fi*2.39996+t*(.055+mod(fi,3.0)*.025)*(mod(fi,2.0)*2.0-1.0);
        float radius=.26+mod(fi,6.0)*.085;
        vec2 centre=vec2(cos(a)*radius*1.38,sin(a)*radius*.72);
        centre+=vec2(sin(fi*7.3)*.06,cos(fi*4.9)*.035);
        float scale=(.075+mod(fi,5.0)*.014)*kick;
        vec3 primary=vectorColor(fi,4.0);
        vec4 sprite;
        if(mod(fi,4.0)<1.0) sprite=vectorFlower(p-centre,scale,a,primary,vec3(1.0,.8,.04));
        else if(mod(fi,4.0)<2.0) sprite=vectorCharacter(p-centre,scale*.94,a,primary,vec3(.99,.72,.18));
        else if(mod(fi,4.0)<3.0) sprite=vectorRecord(p-centre,scale*.9,a,primary);
        else sprite=vec4(primary,vectorSpark(p-centre,scale*.42,a)*.72);
        vectorComposite(color,alpha,sprite);
      }
      vectorComposite(color,alpha,vectorDragon(p-vec2(-.5,-.08+sin(t*.2)*.055),.3,t*.27,vec3(1.0,.18,.52),vec3(.16,.88,1.0)));
      vectorComposite(color,alpha,vectorFlower(p-vec2(.57,.08),.3,-t*.1,vec3(1.0,.08,.47),vec3(1.0,.83,.02)));
      return vec4(color,alpha);
    }

    void main() {
      vec2 p=v_uv-.5;
      p.x*=u_resolution.x/max(u_resolution.y,1.0);
      float expansion=1.0+u_rhythm.x*.006+u_rhythm.y*u_intensity*.024;
      p/=expansion;
      float t=u_time*u_motion;
      vec4 scene;
      if(u_style<.5) scene=vec4(0.0);
      else if(u_style<1.5) scene=orbitWorld(p,t);
      else if(u_style<2.5) scene=vec4(0.0);
      else if(u_style<3.5) {
        vec2 prismP=rot(t*(.035+u_intensity*.18))*p;
        scene=vec4(0.0);
        for(int i=0;i<7;i++){
          float fi=float(i);
          vec2 q=rot(t*(.025+u_intensity*.16)*(mod(fi,2.0)-.5))*(prismP-vec2(sin(t*.13+fi)*.12,cos(t*.11+fi*1.7)*.08)*u_intensity);
          float radius=.22+fi*.095;
          float triangle=max(abs(q.x)*.866025+q.y*.5,-q.y)-radius;
          float edge=1.0-smoothstep(.006,.026,abs(triangle));
          float fill=1.0-smoothstep(-.08,.015,triangle);
          vec3 hue=mix(vec3(1.0,.18,.55),vec3(.08,.86,.94),fract(fi*.37+t*.025));
          scene.rgb+=hue*(edge*(.52+u_intensity*.36)+fill*.035);
          scene.a=max(scene.a,edge*(.48+u_intensity*.34)+fill*.055);
        }
      }
      else if(u_style<4.5) scene=raveWorld(p,t);
      else if(u_style<5.5) scene=stellated3d(p,t);
      else scene=vec4(0.0);
      if(u_style<4.5) {
        scene.rgb*=1.08;
        scene.a=min(.9,scene.a*1.25);
      }
      float vignette=smoothstep(1.08,.18,length(p));
      float energy=1.02+u_intensity*.65+u_rhythm.y*.08+u_rhythm.z*.12;
      vec3 color=pow(max(scene.rgb,vec3(0.0)),vec3(.76))*energy*1.2;
      float alpha=scene.a*(.82+u_intensity*.1+u_rhythm.z*.025)*vignette;
      if(u_style<4.5) alpha=min(.9,max(alpha,scene.a*.9));
      alpha=clamp(alpha,0.0,.92);
      outColor=vec4(color,alpha);
    }
  `;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
    }
    return shader;
  }

  function createProgram(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Shader linking failed");
    }
    return program;
  }

  function initCanvas(canvas) {
    if (state.gl || !canvas) return Boolean(state.gl);
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) return false;
    const program = createProgram(gl);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    state.canvas = canvas;
    state.gl = gl;
    state.program = program;
    ["u_resolution", "u_time", "u_audio", "u_rhythm", "u_motion", "u_style", "u_intensity"].forEach((name) => {
      state.uniforms[name] = gl.getUniformLocation(program, name);
    });
    return true;
  }

  function connectAudio(media) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!media || !AudioContextClass || state.routedSources.has(media)) return;
    const now = performance.now();
    if (now - (state.sourceAttempts.get(media) ?? -Infinity) < 1000) return;
    state.sourceAttempts.set(media, now);
    try {
      if (!state.audioContext) state.audioContext = new AudioContextClass();
      if (!state.analyser) {
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 1024;
        state.analyser.smoothingTimeConstant = 0.58;
        state.analyser.connect(state.audioContext.destination);
        state.audioData = new Uint8Array(state.analyser.frequencyBinCount);
        state.audioTimeData = new Float32Array(state.analyser.fftSize);
      }
      const source = state.sources.get(media) || state.audioContext.createMediaElementSource(media);
      // Retain ownership immediately: a failed connection must never cause a
      // second createMediaElementSource call for this element.
      state.sources.set(media, source);
      source.connect(state.analyser);
      state.routedSources.add(media);
      state.sourceErrors.delete(media);
    } catch (error) {
      state.sourceErrors.set(media, error?.name || "AudioConnectionError");
    }
  }

  function resumeProgrammeAnalysis(gesture = false) {
    const context = state.audioContext;
    if (!context || context.state === "running" || context.state === "closed" || document.hidden) return;
    const now = performance.now();
    if (!gesture && now - state.lastResumeAt < 1000) return;
    state.lastResumeAt = now;
    // Safari can interrupt the context independently of HTML media playback.
    // Retry on recovery and within the next real gesture, even if an earlier
    // resume promise is still waiting for browser permission.
    context.resume().catch(() => {});
  }

  function programmeAnalysisState(media) {
    return { connected: Boolean(media && state.routedSources.has(media)),
      contextState: state.audioContext?.state || "unavailable",
      error: media ? state.sourceErrors.get(media) || "" : "",
      supported: Boolean(window.AudioContext || window.webkitAudioContext) };
  }

  // A silent, per-programme speech-band tap; never mixes research audio into
  // its own masking measurement or changes the existing programme route.
  function programmeMaskingLevel(media) {
    // Playback may start before this module is ready, or switch to a new media
    // element. The live measurement owns recovery, not opening the Sound panel.
    if (media && !document.hidden) { connectAudio(media); resumeProgrammeAnalysis(); }
    if (!media || !state.routedSources.has(media) || state.audioContext?.state !== "running") return null;
    try {
      let tap = state.maskingTaps.get(media);
      if (!tap) {
        const context = state.audioContext;
        const high = context.createBiquadFilter();
        high.type = "highpass";
        high.frequency.value = 300;
        high.Q.value = 0.707;
        const low = context.createBiquadFilter();
        low.type = "lowpass";
        low.frequency.value = 4000;
        low.Q.value = 0.707;
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0;
        const silent = context.createGain();
        silent.gain.value = 0;
        state.sources.get(media).connect(high);
        high.connect(low).connect(analyser).connect(silent).connect(context.destination);
        tap = { analyser, data: new Float32Array(analyser.fftSize), high, low, silent };
        state.maskingTaps.set(media, tap);
      }
      tap.analyser.getFloatTimeDomainData(tap.data);
      let energy = 0;
      for (const sample of tap.data) energy += sample * sample;
      state.sourceErrors.delete(media);
      return { speechRms: Math.sqrt(energy / tap.data.length), contextTime: state.audioContext.currentTime };
    } catch (error) {
      state.sourceErrors.set(media, error?.name || "AudioAnalysisError");
      return null;
    }
  }

  function averageRange(from, to) {
    let total = 0;
    const end = Math.min(to, state.audioData.length);
    for (let index = from; index < end; index += 1) total += state.audioData[index];
    return total / Math.max(1, (end - from) * 255);
  }

  function currentAudioLevel() {
    if (!state.analyser || !state.audioTimeData) return null;
    try {
      state.analyser.getFloatTimeDomainData(state.audioTimeData);
      let mean = 0;
      for (let index = 0; index < state.audioTimeData.length; index += 1) mean += state.audioTimeData[index];
      mean /= Math.max(1, state.audioTimeData.length);
      let energy = 0;
      for (let index = 0; index < state.audioTimeData.length; index += 1) {
        const sample = state.audioTimeData[index] - mean;
        energy += sample * sample;
      }
      return Math.sqrt(energy / Math.max(1, state.audioTimeData.length));
    } catch (_) {
      return null;
    }
  }

  function updateAudio() {
    if (!state.reactionEnabled) {
      state.rhythm.fill(0);
      return;
    }
    if (state.analyser && state.audioData) {
      state.analyser.getByteFrequencyData(state.audioData);
      const targets = [averageRange(1, 5), averageRange(5, 36), averageRange(36, 160)];
      targets.push(targets[0] * .42 + targets[1] * .38 + targets[2] * .2);
      for (let i = 0; i < 4; i += 1) state.audio[i] += (targets[i] - state.audio[i]) * (targets[i] > state.audio[i] ? .28 : .075);
      const now = performance.now();
      const bassDelta = targets[0] - state.previousBass;
      const midDelta = targets[1] - state.previousMid;
      const snareBand = averageRange(24, 96);
      const snareDelta = snareBand - state.previousSnareBand;
      const hatBand = averageRange(96, 190);
      const hatDelta = hatBand - state.previousHatBand;
      if (!state.reactionPrimed) {
        state.previousBass = targets[0];
        state.previousMid = targets[1];
        state.previousSnareBand = snareBand;
        state.previousHatBand = hatBand;
        state.previousTreble = targets[2];
        state.rhythm.fill(0);
        state.reactionPrimed = true;
        return;
      }
      if (bassDelta > .018 && targets[0] > .075 && bassDelta > Math.max(.008, midDelta * .75) && now - state.lastKickAt > 110) {
        state.rhythm[1] = Math.min(1, .34 + bassDelta * 7.2 + targets[0] * .38);
        state.lastKickAt = now;
      } else {
        state.rhythm[1] *= .76;
      }
      if (snareDelta > .014 && snareBand > .06 && (hatDelta > .007 || snareDelta > Math.max(.006, midDelta * .42)) && now - state.lastSnareAt > 95) {
        state.rhythm[2] = Math.min(1, .32 + snareDelta * 8.2 + hatBand * .34);
        state.lastSnareAt = now;
      } else {
        state.rhythm[2] *= .72;
      }
      state.rhythm[0] += (targets[0] - state.rhythm[0]) * (targets[0] > state.rhythm[0] ? .2 : .055);
      const spectralAccent = Math.max(0, bassDelta) * .55 + Math.max(0, snareDelta) * 1.1 + Math.max(0, hatDelta) * .8;
      let accentImpulse = 0;
      if (spectralAccent > .018 && now - state.lastAccentAt > 82) {
        accentImpulse = Math.min(1, .3 + spectralAccent * 7.5);
        state.lastAccentAt = now;
      }
      const percussion = Math.max(state.rhythm[1], state.rhythm[2], accentImpulse);
      state.rhythm[3] += (percussion - state.rhythm[3]) * (percussion > state.rhythm[3] ? .62 : .14);
      state.previousBass = targets[0];
      state.previousMid = targets[1];
      state.previousSnareBand = snareBand;
      state.previousHatBand = hatBand;
      state.previousTreble = targets[2];
    } else {
      const t = performance.now() * .001;
      const fallback = [.18+.08*Math.sin(t*2.1), .15+.06*Math.sin(t*1.37), .12+.05*Math.sin(t*3.4), .16];
      for (let i = 0; i < 4; i += 1) state.audio[i] += (fallback[i] - state.audio[i]) * .04;
      state.rhythm[0] *= .92;
      state.rhythm[1] *= .86;
      state.rhythm[2] *= .8;
      state.rhythm[3] *= .92;
    }
  }

  function resize() {
    const canvas = state.canvas;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }

  function setTimelineSource(source = {}) {
    const bpm = Math.max(1, Number(source.bpm) || Number(source.fallbackBpm) || 112);
    const fallbackBpm = Math.max(1, Number(source.fallbackBpm) || bpm || 112);
    const firstDownbeatSeconds = Number.isFinite(Number(source.firstDownbeatSeconds))
      ? Number(source.firstDownbeatSeconds)
      : 0;
    const media = source.media && Number.isFinite(Number(source.media.currentTime)) ? source.media : null;
    state.timelineSource = { media, bpm, firstDownbeatSeconds, fallbackBpm };
    return {
      source: media ? "media_bpm_downbeat" : "fallback",
      bpm: media ? bpm : fallbackBpm,
      firstDownbeatSeconds: media ? firstDownbeatSeconds : 0,
    };
  }

  function resolveVisualTimeline(elapsed) {
    const mediaSeconds = Number(state.timelineSource.media?.currentTime);
    const mediaHasStarted = Number.isFinite(mediaSeconds) && (mediaSeconds > .05 || !state.timelineSource.media?.paused);
    const usingMedia = Boolean(state.timelineSource.media) && mediaHasStarted;
    const seconds = usingMedia ? Math.max(0, mediaSeconds) : Math.max(0, elapsed);
    const bpm = usingMedia ? state.timelineSource.bpm : state.timelineSource.fallbackBpm;
    const downbeat = usingMedia ? state.timelineSource.firstDownbeatSeconds : 0;
    state.visualTimeline = {
      seconds,
      beatPosition: (seconds - downbeat) * bpm / 60,
      source: usingMedia ? "media_bpm_downbeat" : "fallback",
      bpm,
    };
    return state.visualTimeline;
  }

  function render(now) {
    if (!state.active || !state.gl) return;
    resize(); updateAudio();
    const elapsed = (now - state.startedAt) / 1000;
    const visualTimeline = resolveVisualTimeline(elapsed);
    if (state.reactionEnabled) {
      const beatPhase = ((visualTimeline.beatPosition % 1) + 1) % 1;
      const beatIndex = ((Math.floor(visualTimeline.beatPosition) % 4) + 4) % 4;
      const beatWeight = beatIndex === 0 ? .58 : (beatIndex % 2 === 1 ? .48 : .42);
      const beatPulse = Math.exp(-beatPhase * 11) * beatWeight;
      state.rhythm[3] = Math.max(state.rhythm[3], beatPulse);
    }
    state.diagnosticFrame += 1;
    if (state.diagnosticFrame % 30 === 0) {
      const diagnostic = Array.from(state.audio).map((value) => value.toFixed(4)).join(",");
      const rhythmDiagnostic = Array.from(state.rhythm).map((value) => value.toFixed(4)).join(",");
      state.canvas.dataset.emdrAudioBands = diagnostic;
      state.canvas.dataset.emdrRhythm = rhythmDiagnostic;
      state.canvas.dataset.emdrBeatPosition = visualTimeline.beatPosition.toFixed(3);
      state.canvas.dataset.emdrTimelineSource = visualTimeline.source;
      const threeCanvas = document.querySelector("[data-emdr-three-canvas]");
      if (threeCanvas) {
        threeCanvas.dataset.emdrAudioBands = diagnostic;
        threeCanvas.dataset.emdrRhythm = rhythmDiagnostic;
      }
      const vectorWorld = document.querySelector("[data-emdr-vector-world]");
      if (vectorWorld) {
        vectorWorld.dataset.emdrBeatPosition = visualTimeline.beatPosition.toFixed(3);
        vectorWorld.dataset.emdrTimelineSource = visualTimeline.source;
      }
    }
    const effectiveIntensity = state.intensity;
    window.IAMVectorWorlds?.render?.({
      time: visualTimeline.seconds,
      beatPosition: visualTimeline.beatPosition,
      rhythm: state.rhythm,
      intensity: effectiveIntensity,
      motion: state.reducedMotion.matches ? .18 : 1,
    });
    if (state.style >= 4.5 && state.style < 5.5) {
      window.IAMEMDRThree?.render?.({
        time: elapsed,
        audio: state.audio,
        rhythm: state.rhythm,
        intensity: state.intensity * .77,
        motion: state.reducedMotion.matches ? .18 : 1,
        automated: document.querySelector("[data-emdr-automate]")?.getAttribute("aria-pressed") === "true",
        beatPosition: visualTimeline.beatPosition,
      });
      state.frame = window.requestAnimationFrame(render);
      return;
    }
    const gl = state.gl;
    gl.viewport(0, 0, state.canvas.width, state.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.DEPTH_TEST); gl.useProgram(state.program);
    gl.uniform2f(state.uniforms.u_resolution, state.canvas.width, state.canvas.height);
    gl.uniform1f(state.uniforms.u_time, elapsed);
    gl.uniform4fv(state.uniforms.u_audio, state.audio);
    gl.uniform4fv(state.uniforms.u_rhythm, state.rhythm);
    gl.uniform1f(state.uniforms.u_motion, state.reducedMotion.matches ? 0.18 : 1.0);
    gl.uniform1f(state.uniforms.u_style, state.style);
    gl.uniform1f(state.uniforms.u_intensity, effectiveIntensity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.frame = window.requestAnimationFrame(render);
  }

  function setActive(active, options) {
    const canvas = options?.canvas || state.canvas;
    if (active && !initCanvas(canvas)) return false;
    state.active = Boolean(active);
    state.canvas?.classList.toggle("is-active", state.active && state.style < 4.5);
    window.IAMVectorWorlds?.setActive?.(state.active && state.style < 4.5);
    window.IAMEMDRThree?.setActive?.(state.active && state.style >= 4.5 && state.style < 5.5);
    window.IAMEMDRGif?.setActive?.(state.active && state.style >= 6.5 && state.style < 7.5);
    if (!state.active) {
      window.cancelAnimationFrame(state.frame); state.frame = 0;
      if (state.gl) { state.gl.clearColor(0,0,0,0); state.gl.clear(state.gl.COLOR_BUFFER_BIT); }
      return false;
    }
    // Audio sources are connected explicitly before playback starts. Never
    // rebuild or resume the media graph as a side effect of an EMDR click:
    // rerouting a live element can audibly interrupt otherwise smooth audio.
    state.startedAt = window.performance.now();
    window.cancelAnimationFrame(state.frame);
    state.frame = window.requestAnimationFrame(render);
    return true;
  }

  window.IAMEMDR = {
    get active() { return state.active; },
    get style() { return state.style; },
    get intensity() { return state.intensity; },
    get reactionEnabled() { return state.reactionEnabled; },
    get threeSceneReady() { return Boolean(window.IAMEMDRThree?.ready); },
    setActive,
    setStyle(value) {
      state.style = Math.max(0, Math.min(7, Number(value) || 0));
      state.canvas?.classList.toggle("is-active", state.active && state.style < 4.5);
      window.IAMVectorWorlds?.setStyle?.(state.style);
      window.IAMVectorWorlds?.setActive?.(state.active && state.style < 4.5);
      window.IAMEMDRThree?.setActive?.(state.active && state.style >= 4.5 && state.style < 5.5);
      window.IAMEMDRGif?.setActive?.(state.active && state.style >= 6.5 && state.style < 7.5);
      return state.style;
    },
    setIntensity(value) { state.intensity = Math.max(0, Math.min(1, Number(value) || 0)); window.IAMVectorWorlds?.setIntensity?.(state.intensity); return state.intensity; },
    setReactionEnabled(value) {
      state.reactionEnabled = Boolean(value);
      state.reactionPrimed = false;
      state.rhythm.fill(0);
      return state.reactionEnabled;
    },
    setTimelineSource,
    setAudioSource(media) { connectAudio(media); resumeProgrammeAnalysis(true); return Boolean(media && state.sources.has(media)); },
    resumeProgrammeAnalysis,
    getProgrammeAnalysisState: programmeAnalysisState,
    getAudioLevel() { return currentAudioLevel(); },
    getProgrammeMaskingLevel: programmeMaskingLevel,
    diagnostics() {
      return {
        active: state.active,
        style: state.style,
        intensity: state.intensity,
        reactionEnabled: state.reactionEnabled,
        analyserConnected: Boolean(state.analyser && state.audioData),
        audioContextState: state.audioContext?.state || "unavailable",
        audioRms: currentAudioLevel(),
        audioBands: Array.from(state.audio),
        rhythm: Array.from(state.rhythm),
        visualTimeline: { ...state.visualTimeline },
        mediaSourceCountAvailable: Boolean(state.sources),
      };
    },
    toggle(options) { return setActive(!state.active, options); },
  };
  for (const name of ["pointerdown", "keydown"]) {
    document.addEventListener(name, event => { if (event.isTrusted) resumeProgrammeAnalysis(true); }, true);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) resumeProgrammeAnalysis(); });
  window.addEventListener("pageshow", () => resumeProgrammeAnalysis());
})();
