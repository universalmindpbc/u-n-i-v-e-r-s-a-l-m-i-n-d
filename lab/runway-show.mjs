import {loadCastMember} from './festival-cast.mjs?v=20261105activity3';
import {walkingRoute} from './visitor-groups.mjs?v=20261105activity3';
import {fitCouture} from './runway-couture.mjs';

const collections={
  iris:['pearl-lantern','filament-fan','pleated-wings'],
  nagnata:['black-maillot','indigo-bike','panelled-set','azure-legging']
};
export function createShowRunway(THREE,requestFrame){
  const group=new THREE.Group();group.name='First Nations-led runway proposal';group.visible=false;
  const route=walkingRoute(0,8.95,0,37.05,.96);
  const shows=new Map();
  let selected='iris',currentTime=0,startedAt=0,lastTick=-1;
  function sync(){
    const chosen=shows.get(selected);
    for(const [name,show] of shows)show.group.visible=name===selected&&chosen.models.some(Boolean);
    requestFrame();
  }
  function start(name){
    if(shows.has(name))return;
    const root=new THREE.Group();root.name=name+' visitors';group.add(root);
    const ids=collections[name],show={group:root,models:Array(ids.length).fill(null)};
    shows.set(name,show);
    ids.forEach(async(id,index)=>{
      try{
        const {scene:model,animations}=await loadCastMember(id);
        const mixer=new THREE.AnimationMixer(model);mixer.clipAction(animations[0]).play();mixer.setTime(index*.31);
        model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
        if(name==='iris')fitCouture(THREE,model,id);
        const anchor=new THREE.Group();anchor.name=id+' runway look';anchor.add(model);root.add(anchor);
        const item={anchor,mixer,offset:24.6+index*route.length/ids.length,phase:index*.31};
        show.models[index]=item;pose(item,currentTime-startedAt);sync();
      }catch(error){console.error('Loading runway look',id,error);}
    });
  }
  function pose(item,seconds){
    route.place(item.anchor,item.offset+seconds*.91);
    item.mixer.setTime(seconds+item.phase);
  }
  return {group,select(name){
    if(!Object.hasOwn(collections,name)||name===selected)return;
    selected=name;startedAt=currentTime;lastTick=-1;
    if(group.visible)start(name);
    sync();
  },update(time,moving){
    if(!group.visible)return false;
    currentTime=time;start(selected);
    const tick=Math.floor((moving?Math.max(0,time-startedAt):0)*16);
    if(tick===lastTick)return false;
    lastTick=tick;
    for(const item of shows.get(selected).models)if(item)pose(item,tick/16);
    return true;
  }};
}
