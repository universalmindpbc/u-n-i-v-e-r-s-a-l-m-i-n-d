// Two visual sources share the stage. Only the music video carries audio.
export function createStageVisuals(THREE,performanceVideo,geometryVideo){
  const videoMap=new THREE.VideoTexture(performanceVideo);videoMap.colorSpace=THREE.SRGBColorSpace;
  const geometryMap=new THREE.VideoTexture(geometryVideo);geometryMap.colorSpace=THREE.SRGBColorSpace;
  const uniforms={labGeometry:{value:geometryMap},labBlend:{value:1}};
  const material=new THREE.MeshBasicMaterial({map:videoMap,toneMapped:false,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.fragmentShader='uniform sampler2D labGeometry; uniform float labBlend;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 patternUV=vec2(fract(vMapUv.x*3.45),vMapUv.y);
      vec4 geometryColour=texture2D(labGeometry,patternUV);
      geometryColour.rgb=mix(pow(geometryColour.rgb*0.9478672986+vec3(0.0521327014),vec3(2.4)),geometryColour.rgb*0.0773993808,vec3(lessThanEqual(geometryColour.rgb,vec3(0.04045))));
      diffuseColor.rgb=mix(diffuseColor.rgb,geometryColour.rgb,labBlend);`);
  };
  material.customProgramCacheKey=()=> 'lab-hexeosis-video-mix-v1';
  return {material,videoMap,update(){
    const time=performanceVideo.currentTime||0;
    const blend=geometryVideo.readyState>=2?(performanceVideo.readyState>=2?.5+.5*Math.sin(time*.25):1):0;
    uniforms.labBlend.value=blend;
    document.body.dataset.stageVisualBlend=blend.toFixed(3);
    document.body.dataset.stageGeometryTime=geometryVideo.currentTime.toFixed(3);
  }};
}
