export const sunsetLevels=[
  {name:'Gold',glass:'#f4c568',horizon:'#ffba54',sky:'#96b8cd'},
  {name:'Amber',glass:'#eba344',horizon:'#ffa33c',sky:'#bba1ad'},
  {name:'Apricot',glass:'#fc8b53',horizon:'#ff9a69',sky:'#ab93ad'},
  {name:'Coral',glass:'#e96455',horizon:'#ff795c',sky:'#847fa1'},
  {name:'Crimson',glass:'#c64752',horizon:'#ff7152',sky:'#656b95'}
];
export const levelHeight=3.05;
export function createElevation(THREE,venue,make){
  const tower=venue('elevation','Elevation Bar');
  const frame=make('#706d68',{metalness:.51,roughness:.40}),deck=make('#e8d8be'),wood=make('#ad7752');
  const radius=3.42, segments=24, tau=2*Math.PI;
  for(const [level,tint] of sunsetLevels.entries()){
    const y=.12+level*levelHeight,top=level===4;
    tower.cylinder(deck,0,y,0,top?radius:2.02,top?radius:2.02,.12,64);
    const glass=make(tint.glass,{transparent:true,opacity:.31,depthWrite:false,side:THREE.DoubleSide,roughness:.32,emissive:tint.glass,emissiveIntensity:.11});
    glass.forceSinglePass=true;
    for(let i=0;i<segments;i++){
      const angle=tau*i/segments,x=radius*Math.sin(angle),z=radius*Math.cos(angle);
      // The entrance interrupts the lowest glazing bay at the spiral foot.
      if(level===0&&(i===0||i===segments-1))continue;
      tower.add(new THREE.PlaneGeometry(2*radius*Math.tan(Math.PI/segments)-.035,levelHeight-.22),glass,x,y+levelHeight*.5,z,1,1,1,0,angle);
      if(i%2===0)tower.cylinder(frame,x,y+levelHeight*.50,z,.031,.031,levelHeight);
    }
    for(const edge of [y+.08,y+levelHeight-.08]){
      tower.add(new THREE.TorusGeometry(radius,.045,6,72),frame,0,edge,0,1,1,1,Math.PI/2);
    }
    if(!top){
      const verts=[],rails=[];
      for(let j=0;j<=72;j++){
        const f=j/72,a=tau*f,h=y+.061+f*levelHeight;
        const v=r=>[r*Math.sin(a),h,r*Math.cos(a)];
        if(j){const b=tau*(j-1)/72,prev=h-levelHeight/72;
          const p=r=>[r*Math.sin(b),prev,r*Math.cos(b)];
          verts.push(...p(2),...v(2),...p(3.23),...p(3.23),...v(2),...v(3.23));
        }
        rails.push(new THREE.Vector3(2.02*Math.sin(a),h+.98,2.02*Math.cos(a)));
        if(j%6===0)tower.cylinder(frame,2.02*Math.sin(a),h+.49,2.02*Math.cos(a),.022,.022,.98);
      }
      const ramp=new THREE.BufferGeometry();ramp.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));ramp.computeVertexNormals();deck.side=THREE.DoubleSide;tower.add(ramp,deck,0,0,0);
      tower.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rails),72,.033,6,false),frame,0,0,0);
    }
  }
  const top=.12+4*levelHeight;
  tower.box(wood,-.06,top+.60,-1.19,2.75,1.04,.72);
  tower.box(deck,-.06,top+1.17,-1.19,2.88,.10,.85);
  for(let i=0;i<5;i++)tower.cylinder(i%2?wood:frame,-.70+i*.32,top+1.33,-1.28,.064,.072,.22);
  for(const x of [-.9,.9]){tower.cylinder(frame,x,top+.44,-.02,.05,.11,.66);tower.cylinder(wood,x,top+.79,-.02,.24,.21,.09);}
  tower.sign('Elevation Bar',3.05,.51,0,top+2.19,2.55,'#5b3a37','#fff1cd');
  tower.sign('Elevation Bar',2.05,.37,0,2.45,3.32,'#5b3a37','#fff1cd');
  tower.finish();
  return tower;
}

// An inward-facing sky supplies a distinct simulated sunset while a visitor is
// on a landing. Opaque festival geometry in front of it keeps the real site view.
export function createSunsetSky(THREE,scene){
  const uniforms={horizon:{value:new THREE.Color()},sky:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()}};
  const material=new THREE.ShaderMaterial({uniforms,side:THREE.BackSide,depthWrite:false,
    vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 dir;uniform vec3 horizon,sky,sunDir;
      void main(){vec3 d=normalize(dir);float h=smoothstep(-.02,.65,d.y);
        vec3 col=mix(horizon,sky,h);float a=length(d-sunDir);
        col+=vec3(1.,.59,.18)*.32*exp(-a*7.);
        col=mix(col,vec3(1.,.91,.65),1.-smoothstep(.025,.030,a));gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`});
  const shell=new THREE.Mesh(new THREE.SphereGeometry(400,60,32),material);
  shell.name='Elevation simulated sunset';shell.visible=false;shell.renderOrder=-10;scene.add(shell);
  return {show(index,position,azimuth){
    shell.visible=index>=0;if(index<0)return;
    const tint=sunsetLevels[index];
    shell.position.copy(position);uniforms.sky.value.set(tint.sky);uniforms.horizon.value.set(tint.horizon);
    uniforms.sunDir.value.set(Math.sin(azimuth),.18-.023*index,Math.cos(azimuth)).normalize();
  }};
}
