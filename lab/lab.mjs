import {createHospitality,venueLocations} from './hospitality.mjs?v=20261105fit2';
import {sunsetLevels,levelHeight,createSunsetSky} from './elevation.mjs?v=20261105grounds1';
import {createGroundWalkers,createSeatedVisitors} from './visitor-groups.mjs?v=20261105activity3';
import {createShowRunway} from './runway-show.mjs?v=20261105fit2';
import { createPortal } from './portal.mjs?v=20261105activity3';
import { createFestivalCast } from './festival-cast.mjs?v=20261105activity3';
import { portalZones } from './portal-geometry.mjs?v=20261104emdr1';
import { orbitPose, closingPose, mobileOverviewPose, overviewPose } from './orbit.mjs?v=20261105closing1';
import { createActivities } from './activities.mjs?v=20261105activity3';
import { createPerformance } from './performance.mjs?v=20261103orbit1';
import { initMedia } from './media.mjs?v=20261105venues1';
import { createStory, ORBIT_START, STORY_END } from './story.mjs?v=20261105closing1';
const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = matchMedia('(max-width: 800px), (max-width: 1000px) and (pointer: coarse)');
const mobile = () => compactLayout.matches;
const portraitMobile = () => mobile() && $('world').clientHeight > $('world').clientWidth;
const status = (message) => { $('scene-status').textContent = message; };
const places = {
  checking:{number:'12 · HARM REDUCTION',title:'Pill testing',copy:'A proposed NSW Government drug checking service for people aged 18 and over. Volunteers welcome visitors at a private entrance. NSW Health chemists test samples, and trained NUAA peer workers explain the results in confidence. Testing can miss harmful substances.'},
  'first-aid':{number:'13 · EVENT MEDICAL',title:'First aid',copy:'For overheating, injuries or feeling unwell, come to the first aid geodome. The proposed St John Ambulance NSW and Médecins Sans Frontières team has treatment and cooling space beside the ambulance access lane.'},
  elevation:{number:'14 · SUNSET TOWER',title:'Elevation Bar',copy:'We propose licensing SPECTRA by NEWSUBSTANCE as a mental health facility to explore how colour affects mood. Follow the spiral from gold to crimson through four lookouts to the Blue Lotus bar on level five. Ten people per level.'},
  bar: {number:'09 · NON-ALCOHOLIC BAR',title:'Non-alcoholic bar',copy:'Follow the short path from the main pavilion for the full Heaps Normal beer range, sparkling wines, L-theanine drinks, kombucha and spring water.'},
  vip: {number:'11 · VIP ARENA',title:'James Bondage VIP',copy:'Two interlocking circles form a Vesica Piscis. The DJ plays on the black dance floor. Across the white carpet, the Adaptogen Cocktail Bar serves non-alcoholic cocktails with functional mushrooms and botanicals. Capacity 22 people.'},
  tea: {number:'10 · TEA HOUSE',title:'Tea house',copy:'Follow the path downstream to a stone circle with cushions for 33 guests. Asian tea ceremony hosts gather around a low tea table, away from the sound of the main arena.'},
  portal: { number: '08 · I AM PORTAL', title: 'I Am Portal', copy: 'Seven small workshop spaces for education, intervention and interactivity. Explore electronic music, fashion, communication and creative technology in groups of ten.' },
  overview: { number: '', title: 'Overview', copy: 'An open green space for creative learning, emotional awareness and connection. Music, fashion and mindfulness bring people together, with support close at hand.' },
  truck: { number: '01 · LINFOX TRUCK', title: 'Linfox truck', copy: 'The road train carries the Lab from community to community. Two video-wrapped trailers bring fashion and moving artwork into the site.' },
  main: { number: '02 · MAIN PAVILION', title: 'Main pavilion', copy: 'Music, fashion and collective experiences gather beneath a single vaulted shell, opening onto the lawn. An open dance floor sits among Moroso Tropicália lounges by Patricia Urquiola and hanging seats.' },
  food: { number: '03 · INTERNATIONAL FOOD FAIR', title: 'International Food Fair', copy: 'Food from around the world, cooking workshops and a shared dining experience bring people together beneath the food pavilion.' },
  play: { number: '04 · MOBILE MUSIC MAKING', title: 'Mobile music making', copy: 'Make electronic music together on mobile devices. Shared waveforms connect each phone, while a central 360-degree speaker brings the group’s beats to life beneath the sculptural pavilion.' },
  river: { number: '05 · APPLE LISTENING PODS', title: 'Apple listening pods', copy: 'Transparent tubular listening pylons, Moroso Tropicália furniture by Patricia Urquiola and AKG K812 headphones create space for focused listening, reflection and mindfulness by the water.' },
  fashion: { number: '07 · FASHION', title: 'Fashion runway', copy: 'Two First Nations-led shows are proposed in partnership with the Australian Indigenous Mentoring Experience (AIME). Billie-Jean Hamlet and Cindy Rostron are casting references. The opening show explores sculptural dresses, followed by Nagnata movement wear.' },
  support: { number: '06 · SUPPORT AREA', title: 'Support & connection', copy: 'A shared support space bringing together headspace, Médecins Sans Frontières (MSF), and the Australian Association of Buddhist Counsellors and Psychotherapists (AABCAP). School nominations and headspace referrals connect participants with a welcome conversation, optional support and onward care.' }
};
for(const zone of portalZones)places['portal-'+zone.id]={number:'I AM PORTAL',title:zone.title,copy:zone.copy};
let sceneAPI = null;
let entered=false,buildStage='site',rain=false,layoutVisible=false,tourTimer=0,storyState=null;
let autoTourCancelled=false,lastAutoView=null;
const footline=document.querySelector('.footline');
const landscapeFooter=footline.parentElement;
const landingFooter=document.querySelector('.landing-footer');
function placeFooter(){
  const parent=entered?landscapeFooter:landingFooter;
  if(footline.parentElement!==parent)parent.append(footline);
}
placeFooter();
const story=createStory(applyStory);
$('world').inert=true;$('world').setAttribute('aria-hidden','true');
const media = initMedia(state => sceneAPI?.setMusicMotion(state));
let night = false;
function syncNight(value){night=value;document.body.dataset.night=String(value);$('night-toggle').setAttribute('aria-pressed',String(value));$('night-toggle').setAttribute('aria-label',value?'Switch to day':'Switch to night');$('day-label').textContent=value?'Night':'Day';}
$('night-toggle').addEventListener('click',()=>{const value=night?0:1;story.setNight(value);syncNight(!!value);sceneAPI?.setNight(value);document.body.dataset.nightProgress=String(value);});
let mode = '3d';
let selected = 'overview';
let labelPreviewUntil=0,labelPreviewTimer=0,labelsDismissed=false;
function syncSceneLabels(){
  const touring=Boolean(tourTimer)||(!autoTourCancelled&&['tour','orbit'].includes(storyState?.phase));
  const briefOverview=storyState?.seconds>=31&&storyState.seconds<36&&!labelsDismissed;
  const visible=entered&&mode==='3d'&&selected==='overview'&&!touring&&$('emotion-panel').hidden&&storyState?.navigation&&(briefOverview||performance.now()<labelPreviewUntil);
  $('labels').style.visibility=visible?'visible':'hidden';
  $('labels-toggle').setAttribute('aria-pressed',String(Boolean(visible)));
}
function dismissSceneLabels(){labelsDismissed=true;labelPreviewUntil=0;clearTimeout(labelPreviewTimer);syncSceneLabels();}
function previewSceneLabels(){
  clearTimeout(labelPreviewTimer);labelPreviewUntil=performance.now()+5000;
  labelPreviewTimer=setTimeout(()=>{labelPreviewUntil=0;syncSceneLabels();},5000);syncSceneLabels();
}
function selectPlace(key, show = true, automated = false) {
  if(!automated)stopTour();
  selected = key;media.setQuiet(key==='tea');syncLineup();
  if(key==='overview'&&!automated)previewSceneLabels();else{labelPreviewUntil=0;clearTimeout(labelPreviewTimer);}syncSceneLabels();
  document.body.dataset.cameraView = key;
  const info = places[key];
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === key || b.dataset.view === 'portal' && key.startsWith('portal-'))));
  $('place-number').textContent = info.number;
  $('place-title').textContent = info.title;
  $('place-copy').textContent = info.copy;
  if(key!=='overview')emotionPanel(false);
  const isVenue=Boolean($(key+'-menu'));
  $('checking-guide').hidden=key!=='checking';
  $('spectra-link').hidden=key!=='elevation';
  $('elevation-levels').hidden=key!=='elevation'||mode!=='3d';
  $('venue-menu-open').hidden=!isVenue;
  $('vip-lineup-open').hidden=key!=='vip';
  if(isVenue)$('venue-menu-open').setAttribute('aria-controls',key+'-menu');
  $('arena-bar').hidden=key!=='main';
  $('interior-view').hidden=key!=='main';$('learn-main').hidden=key!=='main';
  $('portal-rooms').hidden=!key.startsWith('portal');
  document.querySelectorAll('[data-portal-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.portalRoom===key)));
  $('place-card').hidden = !show || key === 'overview' || (automated && mobile());
  if (mode === '3d') sceneAPI?.go(key);
  status(info.title + ' ' + info.copy);
}
function setMode(next) {
  mode = next;syncLineup();
  document.body.dataset.mode = mode;
  $('plan').hidden = mode !== 'plan';
  $('scene').hidden = mode === 'plan';
  $('labels-toggle').disabled = mode === 'plan';
  $('navigation-hint').textContent = mode === 'plan' ? 'Select a place for details' : mobile() ? 'Drag to orbit · pinch to zoom' : 'Drag to look around · scroll to move closer';
  $('elevation-levels').hidden=selected!=='elevation'||mode!=='3d';
  syncSceneLabels();sceneAPI?.setVisible(mode === '3d' && entered);
  if (mode === '3d') sceneAPI?.go(selected, true);
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => selectPlace(b.dataset.view)));
function visitVenue(key){
  if(!storyState?.navigation)story.start(31);
  selectPlace(key);($('venue-menu-open').hidden?$('place-close'):$('venue-menu-open')).focus({preventScroll:true});
}
for(const button of document.querySelectorAll('[data-elevation]'))button.addEventListener('click',()=>{
  stopTour();const index=Number(button.dataset.elevation);
  if(index<0)sceneAPI?.go('elevation');else sceneAPI?.viewElevation(index);
});
const mobilePlaces=document.querySelector('.mobile-places');
const mobileList=mobilePlaces.querySelector('[role="group"]');
for(const place of $('place-list').querySelectorAll('[data-view]')){
  const item=document.createElement('button');
  item.type='button';item.dataset.mobilePlace=place.dataset.view;
  item.textContent=place.querySelector('.place-name').textContent;
  mobileList.append(item);
}
mobileList.addEventListener('click',event=>{
  const item=event.target.closest('button[data-mobile-place]');if(!item)return;
  mobilePlaces.open=false;
  if(!storyState?.navigation)story.start(31);
  selectPlace(item.dataset.mobilePlace);
  const nextFocus=item.dataset.mobilePlace==='fashion'&&mode==='3d'
    ? $('runway-shows').querySelector('[aria-pressed="true"]') : $('place-close');
  nextFocus.focus({preventScroll:true});
});
mobilePlaces.addEventListener('toggle',()=>{
  sceneAPI?.setVisible(!mobilePlaces.open&&entered&&mode==='3d');
  if(mobilePlaces.open){
    for(const item of mobileList.children)item.setAttribute('aria-pressed',String(item.dataset.mobilePlace===selected));
  }
});
document.addEventListener('pointerdown',event=>{if(mobilePlaces.open&&!mobilePlaces.contains(event.target))mobilePlaces.open=false;});
mobilePlaces.addEventListener('keydown',event=>{if(event.key==='Escape'){mobilePlaces.open=false;mobilePlaces.querySelector('summary').focus();}});
$('arena-bar').addEventListener('click',()=>visitVenue('bar'));
$('venue-menu-open').addEventListener('click',()=>{stopTour();$(selected+'-menu').showModal();});
$('vip-lineup-open').addEventListener('click',()=>{stopTour();$('vip-lineup').showModal();});
for(const menu of document.querySelectorAll('.venue-menu')){
  menu.querySelector('[data-menu-close]').addEventListener('click',()=>menu.close());
  menu.addEventListener('click',event=>{if(event.target!==menu)return;const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)menu.close();});
}
$('interior-view').addEventListener('click',()=>{stopTour();sceneAPI?.go('interior');$('place-card').hidden=true;});
document.querySelectorAll('[data-portal-room]').forEach(b=>b.addEventListener('click',()=>selectPlace(b.dataset.portalRoom)));
$('watch-runway').addEventListener('click',()=>{
  $('vision').close();if(!entered)launchFestival();
  if(!storyState?.navigation)story.start(31);
  selectPlace('fashion');
});
for(const button of document.querySelectorAll('[data-runway-show]')){
  button.addEventListener('click',()=>{
    stopTour();
    for(const option of document.querySelectorAll('[data-runway-show]'))option.setAttribute('aria-pressed',String(option===button));
    sceneAPI?.setRunwayShow(button.dataset.runwayShow);
    status(button.textContent+' runway show selected.');
  });
}
$('portal-about').addEventListener('click',()=>{$('vision').close();if(!entered)launchFestival();selectPlace('portal');});
$('place-close').addEventListener('click', () => { $('place-card').hidden = true; (mobile() ? $('emotion-toggle') : (document.querySelector(`[data-view="${selected}"]`)||document.querySelector('[data-view="portal"]'))).focus(); });
$('reset-view').addEventListener('click', () => selectPlace('overview', false));
$('labels-toggle').addEventListener('click', () => {
  if($('labels-toggle').getAttribute('aria-pressed')==='true'){
    dismissSceneLabels();
  }else if(selected==='overview'&&$('emotion-panel').hidden){labelsDismissed=false;previewSceneLabels();}
});
document.querySelector('.landing-name').addEventListener('click',()=>$('vision').showModal());
$('about-open').addEventListener('click', () => $('vision').showModal());
$('vision').addEventListener('close', () => {
  $('about-lineup').open = false;
});
const aboutArtists = document.querySelector('.about-lineup-artists');
aboutArtists.append($('artist-lineup').querySelector('.artist-marks').cloneNode(true));
$('about-close').addEventListener('click', () => $('vision').close());
let learningFromAbout=false;
for(const id of ['learn-main','learn-about'])$(id).addEventListener('click',()=>{stopTour();learningFromAbout=$('vision').open;if(learningFromAbout)$('vision').close();$('learning').showModal();});
$('learning').addEventListener('close',()=>{if(learningFromAbout){learningFromAbout=false;$('vision').showModal();$('learn-about').focus();}});
$('learn-close').addEventListener('click',()=>$('learning').close());
$('learning').addEventListener('click',e=>{if(e.target===$('learning')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

$('vision').addEventListener('click', (e) => { if (e.target === $('vision')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });

// Both fullscreen and playback begin synchronously in the Explore gesture.
const fullscreenButton = $('fullscreen-toggle');
let entryShell=null,fullscreenOwner=document;
try {if(parent!==window&&parent.UniversalMindEntry){entryShell=parent.UniversalMindEntry;let owner=window;while(owner.parent!==owner&&owner.parent.UniversalMindEntry===entryShell)owner=owner.parent;fullscreenOwner=owner.document;}}catch{}
const fullscreenRoot = fullscreenOwner.documentElement;
const fullscreenActive = () => Boolean(fullscreenOwner.fullscreenElement || fullscreenOwner.webkitFullscreenElement);
const fullscreenSupported = () => Boolean(
  (fullscreenRoot.requestFullscreen && fullscreenOwner.fullscreenEnabled !== false) ||
  (fullscreenRoot.webkitRequestFullscreen && fullscreenOwner.webkitFullscreenEnabled !== false)
);
function syncFullscreen() {
  const active = fullscreenActive();
  fullscreenButton.hidden = active || !fullscreenSupported();
  fullscreenButton.setAttribute('aria-pressed', String(active));
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.title = label;
  $('fullscreen-status').hidden = true;
}
async function changeFullscreen(enterOnly=false){
  if(!fullscreenSupported())return;
  fullscreenButton.disabled=true;
  try{
    if(fullscreenActive()){
      if(!enterOnly){const leave=fullscreenOwner.exitFullscreen||fullscreenOwner.webkitExitFullscreen;await leave.call(fullscreenOwner);}
    }else{const enter=fullscreenRoot.requestFullscreen||fullscreenRoot.webkitRequestFullscreen;await enter.call(fullscreenRoot);}
    syncFullscreen();
  }catch{syncFullscreen();if(!enterOnly&&!fullscreenActive()){$('fullscreen-status').textContent='Continue exploring in this window.';$('fullscreen-status').hidden=false;setTimeout(()=>{$('fullscreen-status').hidden=true;},4000);}}
  finally{fullscreenButton.disabled=false;}
}
fullscreenButton.addEventListener('click',()=>changeFullscreen());
function launchFestival(){
  if(entered)return;entered=true;placeFooter();document.body.dataset.entered='true';
  $('landing').hidden=true;$('world').inert=false;$('world').removeAttribute('aria-hidden');
  sceneAPI?.setVisible(mode==='3d');media.start();changeFullscreen(true);if(document.body.dataset.ready)startStory();$('scene').focus({preventScroll:true});
}
$('explore-enter').addEventListener('click',launchFestival);
// Events calls this synchronously from its launch tap, before any scene loading.
window.UniversalMindLab={launch:launchFestival};
let resumeMusic=false;
document.addEventListener('um:entry-visibility',event=>{
  const covered=event.detail.covered;
  if(covered){
    resumeMusic=!$('music-video').paused;
    stopTour();sceneAPI?.setVisible(false);
    document.querySelectorAll('video,audio').forEach(el=>el.pause());
  }else{
    sceneAPI?.setVisible(entered&&mode==='3d');
    if(resumeMusic)media.start();
    (entered?document.querySelector('.wordmark'):document.querySelector('.access-home')).focus({preventScroll:true});
  }
});
try{if(parent!==window)parent.dispatchEvent(new Event('um:lab-ready'));}catch{}
function syncLineup(){
 const touring=Boolean(tourTimer)||(!autoTourCancelled&&['tour','orbit'].includes(storyState?.phase));
 const automatic=selected==='overview';
 const show=entered&&mode==='3d'&&!touring&&automatic;
 document.body.dataset.lineupVisible=String(show);$('artist-lineup').setAttribute('aria-hidden',String(!show));
}
function openLineup(){
  const lineup=$('about-lineup');
  lineup.open=true;
  $('vision').showModal();
  lineup.querySelector('summary').focus({preventScroll:true});
  lineup.scrollIntoView({block:'start'});
}
$('lineup-toggle').addEventListener('click',openLineup);
$('lineup-more-open').addEventListener('click',openLineup);
function applyStory(state){
  storyState=state;buildStage=state.phase;
  document.body.dataset.closingView=String(state.seconds>=STORY_END&&!autoTourCancelled);
  document.body.dataset.buildStage=state.phase==='night'||state.phase==='dusk'||state.phase==='tour'||state.phase==='orbit'?'open':state.phase;
  document.body.dataset.story=state.seconds>=STORY_END?'complete':state.phase;
  document.body.dataset.storyTime=state.seconds.toFixed(1);
  document.body.dataset.siteReady=String(state.navigation);
  document.body.dataset.nightProgress=state.night.toFixed(3);
  const descriptions={site:'The open site.',arrival:'The road train arrives.',assembly:'The pavilion is being built.',fitout:'Facilities and furnishings are being added.',open:'The Lab is open.',dusk:'Daylight fades and the light show begins.',tour:'Explore the Lab.',orbit:'A continuous journey around the festival.',night:'The site is illuminated.'};
  if($('story-status').dataset.phase!==state.phase){$('story-status').dataset.phase=state.phase;$('story-status').textContent=descriptions[state.phase];}
  syncNight(state.night>.65);sceneAPI?.setStory(state);
  const orbitActive=state.phase==='orbit'&&!autoTourCancelled&&!reduced.matches&&mode==='3d';
  document.body.dataset.cinematic=String(orbitActive);
  if(orbitActive){if(!lastAutoView?.startsWith('orbit')){emotionPanel(false);$('place-card').hidden=true;lastAutoView='orbit';}sceneAPI?.orbit(state.seconds-ORBIT_START);}
  if(state.tourView&&!autoTourCancelled&&state.tourView!==lastAutoView){lastAutoView=state.tourView;selectPlace(state.tourView,true,true);if(state.tourView==='overview'){dismissSceneLabels();if(innerWidth>=1100)emotionPanel(true);}}
  const autoActive=!autoTourCancelled&&(state.phase==='tour'||orbitActive);document.body.dataset.tourActive=String(autoActive);if(!tourTimer){$('tour-toggle').textContent=autoActive?'Stop tour':'Tour';$('tour-toggle').setAttribute('aria-pressed',String(autoActive));}
  document.body.dataset.tourStep=state.tourView||'';syncLineup();syncSceneLabels();
}
function startStory(){stopTour();labelsDismissed=false;labelPreviewUntil=0;clearTimeout(labelPreviewTimer);autoTourCancelled=false;lastAutoView=null;emotionPanel(false);$('place-card').hidden=true;story.start();selectPlace('overview',false,true);}
$('replay-story').addEventListener('click',()=>{media.start();startStory();});
function stopTour(){autoTourCancelled=true;document.body.dataset.closingView='false';document.body.dataset.cinematic='false';document.body.dataset.tourActive='false';clearTimeout(tourTimer);tourTimer=0;$('tour-toggle').setAttribute('aria-pressed','false');$('tour-toggle').textContent='Tour';syncSceneLabels();}
$('tour-toggle').addEventListener('click',()=>{
  if(tourTimer||(!autoTourCancelled&&['tour','orbit'].includes(storyState?.phase))){stopTour();return;}
  stopTour();let n=0;const route=['truck','main','bar','vip','food','play','river','support','checking','first-aid','fashion','elevation','portal','tea'];
  $('tour-toggle').setAttribute('aria-pressed','true');$('tour-toggle').textContent='Stop tour';
  const next=()=>{if(n>=route.length){stopTour();selectPlace('overview',false,true);return;}tourTimer=setTimeout(next,n+1===route.length?10000:5000);selectPlace(route[n++],true,true);};next();
});
function emotionPanel(open){$('emotion-panel').hidden=!open;$('emotion-toggle').setAttribute('aria-expanded',String(open));document.body.dataset.emotionPanel=String(open);if(open){labelPreviewUntil=0;clearTimeout(labelPreviewTimer);}syncSceneLabels();}
$('emotion-toggle').addEventListener('click',()=>{stopTour();emotionPanel($('emotion-panel').hidden);});
$('emotion-close').addEventListener('click',()=>{emotionPanel(false);$('emotion-toggle').focus();});
const performanceDialog = $('performance-dialog');
$('performance-open').addEventListener('click', () => { stopTour(); performanceDialog.showModal(); });
$('performance-close').addEventListener('click', () => performanceDialog.close());
performanceDialog.addEventListener('click', event => {
  if (event.target !== performanceDialog) return;
  const box = performanceDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) performanceDialog.close();
});
document.addEventListener('keydown',event=>{if(!document.querySelector('dialog[open]')&&event.key==='Escape'&&!$('emotion-panel').hidden)emotionPanel(false);});
$('support-pathway').addEventListener('click',()=>{emotionPanel(false);selectPlace('support');});
const connectionSteps=[
  {key:'earth',label:'Connection to our earth',cue:'Feel your feet on the ground, or feel the support beneath you as you sit.'},
  {key:'self',label:'Connection to self',cue:'Feel your breath. Feel your body.'},
  {key:'others',label:'Connection to each other',cue:''}
];
function updateConnection(){
  stopTour();const value=Number($('response-range').value)/100,step=connectionSteps[value<.34?0:value<.67?1:2];
  $('response-state').textContent=step.label;
  const cue=$('connection-cue');
  cue.textContent=step.cue;
  cue.hidden=!step.cue;
  document.querySelectorAll('[data-connection]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.connection===step.key)));
  sceneAPI?.setResponse(value);media.setResponse(value);document.body.dataset.responseLevel=value.toFixed(2);document.body.dataset.connectionStep=step.key;
}
$('response-range').addEventListener('input',updateConnection);
document.querySelectorAll('[data-connection]').forEach(button=>button.addEventListener('click',()=>{$('response-range').value=button.dataset.response;updateConnection();}));
$('rain-toggle').addEventListener('click',()=>{rain=!rain;$('rain-toggle').setAttribute('aria-pressed',String(rain));document.body.dataset.rain=String(rain);sceneAPI?.setRain(rain);});
addEventListener('pagehide',stopTour);
fullscreenOwner.addEventListener('fullscreenchange', syncFullscreen);
fullscreenOwner.addEventListener('webkitfullscreenchange', syncFullscreen);
addEventListener('pagehide',()=>{fullscreenOwner.removeEventListener('fullscreenchange',syncFullscreen);fullscreenOwner.removeEventListener('webkitfullscreenchange',syncFullscreen);});
syncFullscreen();

async function buildWorld() {
  const THREE = await import('three');
  const [{OrbitControls},{createArchitecture},{createSiteFeatures},{createCrowd},{createLightShow},{createRunway}]=await Promise.all([import('./vendor/OrbitControls.js'),import('./architecture.mjs?v=20261103purpose1'),import('./site-features.mjs?v=20261105floor1'),import('./crowd.mjs?v=20261105activity3'),import('./light-show.mjs?v=20261105floor1'),import('./runway.mjs?v=20261103orbit1')]);
  const architecture=createArchitecture(THREE);
  let seed = 1947;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9ece2');
  scene.fog = new THREE.Fog('#e9ece2', mobile() ? 205 : 115, mobile() ? 390 : 255);
  const sunsetSky=createSunsetSky(THREE,scene);
  const camera = new THREE.PerspectiveCamera(mobile() ? 50 : 41, innerWidth / innerHeight, 0.2, 550);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.6 : 2));
  renderer.setSize(innerWidth, $('world').clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.localClippingEnabled=true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D landscape. Drag to orbit, pinch or scroll to zoom. Arrow keys rotate; plus and minus zoom. Use the place buttons for preset views.');
  $('scene').append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = 0.08;
  controls.minDistance = 12;
  controls.maxDistance = portraitMobile() ? 310 : mobile() ? 240 : 155;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.maxTargetRadius = 100;
  controls.enablePan = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;
  const skyLight=new THREE.HemisphereLight('#f4f6ed', '#718360', 2.3);scene.add(skyLight);
  const sun = new THREE.DirectionalLight('#fff1d9', 3.4);
  sun.position.set(-48, 78, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile() ? 1024 : 2048, mobile() ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -83, right: 83, top: 75, bottom: -75, near: 1, far: 180 });
  sun.shadow.normalBias = 0.05;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  const mats = {
    shell: new THREE.MeshStandardMaterial({ color: '#cdb18c', roughness: 0.91, side: THREE.DoubleSide }),
    stone: new THREE.MeshStandardMaterial({ color: '#c7c1a5', roughness: 1 }),
    timber: new THREE.MeshStandardMaterial({ color: '#937a59', roughness: 1 }),
    sand: new THREE.MeshStandardMaterial({ color: '#b7b999', roughness: 1 })
  };
  function mesh(geometry, material, parent = scene) { const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  function riverX(z) { return 44 + Math.sin(z * 0.025) * 7 + Math.sin(z * 0.059) * 2.4; }

  // The land is a broad clearing. Trees and uneven ground stay at its edges.
  const groundGeo = new THREE.PlaneGeometry(340, 300, 100, 90);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const grassColors = [];
  const baseGrass = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const perimeter = Math.min(1, Math.max(0, (-z - 36) / 35, (-x - 48) / 30));
    const h = perimeter * (1.3 + 1.1 * Math.sin(x * .06) * Math.cos(z * .04));
    pos.setY(i, (Math.abs(x-riverX(z)) < 16 ? 0 : h) - .12);
    const n = Math.sin(x * .12 + Math.cos(z * .06)) * Math.cos(z * .11) * .025 + random() * .012;
    baseGrass.setHSL(.25 + n * .25, .28 + n, .39 + n);
    grassColors.push(baseGrass.r, baseGrass.g, baseGrass.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(grassColors, 3));
  groundGeo.computeVertexNormals();
  const grass = mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  grass.castShadow = false;
  const texCanvas = document.createElement('canvas'); texCanvas.width = texCanvas.height = 256;
  const ctx = texCanvas.getContext('2d');
  ctx.fillStyle = '#b3bda0'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16000; i++) { const s = random() > .5 ? 230 : 75; ctx.fillStyle = `rgba(${s},${s},${s},.07)`; ctx.fillRect(random()*256, random()*256, .5, 2); }
  const groundTexture = new THREE.CanvasTexture(texCanvas); groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping; groundTexture.repeat.set(65,55); groundTexture.colorSpace = THREE.SRGBColorSpace;
  grass.material.map = groundTexture;
  grass.material.needsUpdate = true;

  function riverStrip(width, elevation, material) {
    const verts = [], index = [], uv = [];
    for (let i = 0; i <= 150; i++) { const z = -150 + i * 2; const x = riverX(z),bankWidth=width*(1+.045*Math.sin(z*.15)+.025*Math.sin(z*.4)); verts.push(x-bankWidth, elevation, z, x+bankWidth, elevation, z); uv.push(0,i/150,1,i/150); if(i<150){const a=i*2;index.push(a,a+2,a+1,a+1,a+2,a+3);} }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    const m=mesh(geo,material);m.castShadow=false;return m;
  }
  riverStrip(10.8,-.015,mats.sand);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { time:{value:0}, waterA:{value:new THREE.Color('#367f86')}, waterB:{value:new THREE.Color('#a1d4c5')} },
    vertexShader: `varying vec3 vWorld; varying vec2 vFlow;
      void main(){vFlow=uv;vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float time; uniform vec3 waterA; uniform vec3 waterB; varying vec3 vWorld; varying vec2 vFlow;
      void main(){
        float across=(vFlow.x-.5)*18.8;
        float downstream=vWorld.z-time*1.35;
        float bend=sin(across*.43+downstream*.11)*1.7+sin(across*.91-downstream*.27)*.8;
        float waves=.5+.5*sin(downstream*1.8+bend+sin(across*1.3+downstream*.21)*.7);
        float ribbons=.5+.5*sin(across*3.7+sin(downstream*.28)*1.3+sin(across*1.1+downstream*.47)*1.3);
        float glints=pow(waves,16.)*pow(ribbons,2.)*(.5+.5*sin(across*.37+downstream*.41));
        float current=pow(.5+.5*sin(downstream*.72+across*.6+sin(across*.9)),9.);
        float drift=current*smoothstep(.15,.85,.5+.5*sin(across*.8-downstream*.25));
        float shore=pow(abs(vFlow.x-.5)*2.,5.);
        vec3 c=mix(waterA,waterB,.14+.1*ribbons+.2*shore);
        c=mix(c,waterB,min(.85,glints*.52+drift*.3));
        c+=vec3(.1,.14,.13)*glints;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side:THREE.DoubleSide
  });
  riverStrip(9.4,.025,waterMat);
  document.body.dataset.riverFlow='downstream';
  // Shared, low-detail geometry keeps the forest light enough for phones.
  const treeList=[];
  for(let i=0;i<170;i++) { const x=-87+random()*131,z=-39-random()*42; if(x<riverX(z)-16)treeList.push({x,z,s: .78+random()*.85}); }
  for(let i=0;i<110;i++){const x=-48-random()*35,z=-35+random()*100;treeList.push({x:z>0?Math.min(x,-71-random()*12):x,z,s:.8+random()*.75});}
  for(let i=0;i<90;i++){const z=-130+random()*255;treeList.push({x:riverX(z)+19+random()*26,z,s:.8+random()*.65});}
  const dummy=new THREE.Object3D();
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.27,1,5),new THREE.MeshStandardMaterial({color:'#8e8d76',roughness:1}),treeList.length);
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#6f8858',roughness:1}),treeList.length*5);
  trunks.castShadow=true;trunks.receiveShadow=true;crowns.castShadow=true;crowns.receiveShadow=true;
  const foliageColor=new THREE.Color();
  treeList.forEach((t,i)=>{
    const edgeH=Math.min(1,Math.max(0,(-t.z-36)/35,(-t.x-48)/30))*(1.3+1.1*Math.sin(t.x*.06)*Math.cos(t.z*.04));
    dummy.position.set(t.x,edgeH+3.4*t.s,t.z);dummy.scale.set(t.s,6.8*t.s,t.s);dummy.rotation.set(0,random()*6.28,.035);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<5;j++){
      const a=j*2.39+random();
      dummy.position.set(t.x+Math.sin(a)*(j?2:0)*t.s,edgeH+(6.7+(j===0?2.3:random()*2))*t.s,t.z+Math.cos(a)*(j?2:0)*t.s);
      dummy.scale.set((2.1+random())*t.s,(2.6+random()*1.5)*t.s,(2+random())*t.s);dummy.rotation.set(random(),random(),random());dummy.updateMatrix();crowns.setMatrixAt(i*5+j,dummy.matrix);
      foliageColor.setHSL(.24+random()*.055,.18+random()*.13,.23+random()*.11);crowns.setColorAt(i*5+j,foliageColor);
    }
  });scene.add(trunks,crowns);
  const crownMatrices=crowns.instanceMatrix.array.slice();
  const animatedFlags=[];

  const paths=new THREE.Group();scene.add(paths);
  function path(points,width=2.4){
    const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.055,p[1])));
    const verts=[],ind=[];
    for(let i=0;i<=80;i++){const p=c.getPoint(i/80),t=c.getTangent(i/80);verts.push(p.x-t.z*width/2,p.y,p.z+t.x*width/2,p.x+t.z*width/2,p.y,p.z-t.x*width/2);if(i<80){const a=i*2;ind.push(a,a+2,a+1,a+1,a+2,a+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ind);g.computeVertexNormals();const m=mesh(g,mats.stone,paths);m.castShadow=false;
  }
  path([[2,62],[1,38],[0,21],[1,6],[0,-6]],3.3);
  path([[0,8],[-8,0],[-19,-7],[-25,-8]]);
  path([[0,21],[-10,23],[-24,19]]);
  path([[0,14],[10,15],[20,10],[25,0]],1.8);
  path([[-25,-8],[-31,-14],[-35,-24]],1.8);
  path([[-4,4],[-5.8,6],[-8.1,7.25],[-10,6.84]],1.75);
  path([[11,14],[14,9],[16,3],[18,-2],[18,-8.04]],1.65);
  path([[1,48],[7,54],[11,62],[15,66.9],[18.5,66],[19,64.9]],1.8);
  path([[1,48],[-9,53],[-20,54],[-29,52],[-34,56]],2.4);

  path([[-31,-14],[-36.5,-12],[-40,-8],[-41.1,-8]],1.55);
  path([[-31,-14],[-27,-18.5],[-24,-24.5],[-23,-27.85]],2.1);
  path([[-28,-38],[-19,-36.8],[-18,-32],[-18.2,-28]],2.95);
  path([[1,38],[7,39],[13,40],[18,39.7],[19,38.3]],1.85);
  const architectureGroup=new THREE.Group();scene.add(architectureGroup);
  const buildings={};
  const main=architecture.mainVault();main.position.set(0,.08,-12);architectureGroup.add(main);buildings.main=main;
  const platform=mesh(new THREE.BoxGeometry(24,.16,20),mats.stone,main);platform.position.y=-.08;
  const activityDecks=[];
  for(const [key,x,z,scale,rotation] of [['food',-24,-9,1,-.35],['park',-23,20,.88,-1.1],['support',-34,-24,.78,.35]]){
    const g=architecture.satellite({scale});g.position.set(x,.08,z);g.rotation.y=rotation;architectureGroup.add(g);buildings[key]=g;
    const deck=mesh(new THREE.CylinderGeometry(6.4,6.4,.15,64),mats.stone,g);deck.scale.z=.85;deck.position.y=-.08;
    if(key==='park'||key==='support')activityDecks.push(deck);
  }
  const playground=architecture.playground({rainbow:true});playground.position.set(-17,.08,31);playground.rotation.y=.35;architectureGroup.add(playground);buildings.playground=playground;
  const buildPlanes={};
  for(const [key,g] of Object.entries(buildings)){
    const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),0);buildPlanes[key]=plane;
    const cloned=new Map();g.traverse(o=>{if(!o.isMesh)return;const clone=m=>{if(!cloned.has(m)){const n=m.clone();n.clippingPlanes=[plane];n.clipShadows=true;cloned.set(m,n);}return cloned.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});
  }
  const lightShow=createLightShow(THREE,scene,Object.values(buildings),architecture);
  const features=createSiteFeatures(THREE,scene,$('music-video'),architecture,$('stage-geometry-video'));
  // Seat the nearby spectators on the actual deck surface, including its rotation and scale.
  for(const surface of [...activityDecks,...paths.children])surface.updateWorldMatrix(true,false);
  const floorProbe=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  const footSurfaces=[...activityDecks,...paths.children];
  function activityFloorHeight(x,z){
    floorProbe.set(new THREE.Vector3(x,1,z),down);
    return floorProbe.intersectObjects(footSurfaces,false)[0]?.point.y??-.12;
  }
  const crowd=createCrowd(THREE,()=>{needsFrame=true;requestFrame();},activityFloorHeight),runwayCrowd=createShowRunway(THREE,()=>{needsFrame=true;requestFrame();}),runway=createRunway(THREE,scene,features.videoMap);scene.add(crowd.builders,crowd.visitors,runwayCrowd.group);
  const performanceStage=createPerformance(THREE);scene.add(performanceStage.group);
  const activities=createActivities(THREE,architecture,requestFrame);scene.add(activities.group);
  const festivalCast=createFestivalCast(THREE,()=>{needsFrame=true;requestFrame();});
  const seatedVisitors=createSeatedVisitors(THREE,()=>{needsFrame=true;requestFrame();});
  const walkers=createGroundWalkers(THREE,()=>{needsFrame=true;requestFrame();});
  scene.add(festivalCast.group,walkers.group,seatedVisitors.group);
  const hospitality=createHospitality(THREE,()=>{needsFrame=true;requestFrame();});scene.add(hospitality.group);
  const venueRay=new THREE.Raycaster(),pointerStart=new THREE.Vector2();
  canvas.addEventListener('pointerdown',e=>pointerStart.set(e.clientX,e.clientY));
  canvas.addEventListener('pointerup',e=>{
    if(!storyState?.navigation||!hospitality.group.visible||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;
    const rect=canvas.getBoundingClientRect();
    venueRay.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
    const hit=venueRay.intersectObjects([hospitality.group,architectureGroup],true)[0];
    let part=hit?.object;
    while(part&&!part.userData.venue)part=part.parent;
    if(part)visitVenue(part.userData.venue);
  });
  const contextStart=scene.children.length;
  // Contextual proposal identities: physical flags and a support vehicle.
  const images = Object.fromEntries(await Promise.all([
    ['flower','universal-mind-flower.png'],['headspace','headspace.svg'],['msf','msf.svg'],['education','nsw-government.svg'],['apple','apple-music.svg'],['vogue','vogue.png'],['un','un-flag.png']
  ].map(async ([key,file]) => {
    const image = new Image(); image.src = new URL('./assets/'+file,import.meta.url).href;
    await image.decode(); return [key,image];
  })));
  function monochrome(image,width,height) {
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const context=c.getContext('2d');context.drawImage(image,0,0,width,height);
    context.globalCompositeOperation='source-in';context.fillStyle='#293b35';context.fillRect(0,0,width,height);return c;
  }
  function brandTexture(key,flag=false) {
    const c=document.createElement('canvas');c.width=1024;c.height=flag?768:384;
    const context=c.getContext('2d');
    if(flag){context.fillStyle='#f3f0e7';context.fillRect(0,0,c.width,c.height);context.globalAlpha=.72;context.drawImage(images.flower,24,70,620,620);context.globalAlpha=1;}
    const img=images[key],ratio=img.naturalWidth/img.naturalHeight;
    const w=flag?(key==='flower'?530:key==='education'?170:490):900,h=w/ratio;
    if(key==='flower'){context.clearRect(0,0,c.width,c.height);context.fillStyle='#f3f0e7';context.fillRect(0,0,c.width,c.height);context.drawImage(img,70,(c.height-h)/2,w,h);}else context.drawImage(monochrome(img,Math.round(w),Math.round(h)),flag?72:62,(c.height-h)/2,w,h);
    if(key==='education'){context.fillStyle='#293b35';context.font='500 43px Arial';context.fillText('Education',260,400);}
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  const brandMaps=Object.fromEntries(['headspace','msf','education','apple'].map(key=>[key,brandTexture(key)]));
  const poleMat=new THREE.MeshStandardMaterial({color:'#7a8278',metalness:.6,roughness:.42});
  function flag(key,x,z,angle=.55){
    const group=new THREE.Group();group.name=key+' triangular proposal flag';group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);
    const pole=mesh(new THREE.CylinderGeometry(.055,.075,6.8,10),poleMat,group);pole.position.y=3.4;
    const base=mesh(new THREE.CylinderGeometry(.45,.55,.18,24),mats.stone,group);base.position.y=.09;
    const geometry=new THREE.PlaneGeometry(1,1,24,14),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const u=positions.getX(i)+.5,v=positions.getY(i)+.5;positions.setXYZ(i,.09+u*4.1,4.9+(v-.5)*(1-u)*3.1,.17*Math.sin(u*7+v*1.6)*u);}
    geometry.computeVertexNormals();
    animatedFlags.push({geometry,base:positions.array.slice()});
    mesh(geometry,new THREE.MeshStandardMaterial({map:brandTexture(key,true),roughness:.96,side:THREE.DoubleSide}),group);
    return group;
  }
  flag('headspace',-28.5,-26.5,.55);flag('msf',-40,-22,2.65);flag('flower',12.6,-1,.55);flag('education',-7.6,30,.6);flag('apple',25,5);flag('vogue',7.6,30,-.6);
  // Rectangular cultural flags keep their own proportions and colours.
  function foodFlag(name,x,z,angle,aspect,paint){
    const canvas=document.createElement('canvas');canvas.width=900;canvas.height=Math.round(900/aspect);paint(canvas.getContext('2d'),canvas.width,canvas.height);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const g=new THREE.Group();g.name=name+' · International Food Fair';g.position.set(x,0,z);g.rotation.y=angle;g.scale.setScalar(.43);scene.add(g);
    const pole=mesh(new THREE.CylinderGeometry(.055,.075,6.8,10),poleMat,g);pole.position.y=3.4;
    const base=mesh(new THREE.CylinderGeometry(.4,.5,.15,24),mats.stone,g);base.position.y=.075;
    const geo=new THREE.PlaneGeometry(1,1,24,14),a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const u=a.getX(i)+.5,v=a.getY(i)+.5;a.setXYZ(i,.09+u*4.1,5.05+(v-.5)*4.1/aspect,.12*Math.sin(u*7+v*1.6)*u);}
    geo.computeVertexNormals();animatedFlags.push({geometry:geo,base:a.array.slice()});
    mesh(geo,new THREE.MeshStandardMaterial({map,roughness:.96,side:THREE.DoubleSide}),g);return g;
  }
  foodFlag('United Nations flag',-29.2,-3.8,.15,1.5,(c,w,h)=>c.drawImage(images.un,0,0,w,h));
  foodFlag('Australian Aboriginal flag',-32.2,-8.3,.15,2,(c,w,h)=>{c.fillStyle='#111111';c.fillRect(0,0,w,h/2);c.fillStyle='#d52626';c.fillRect(0,h/2,w,h/2);c.fillStyle='#ffd52c';c.beginPath();c.arc(w/2,h/2,h/4,0,Math.PI*2);c.fill();});
  foodFlag('Japan flag',-30.5,-13.5,.15,1.5,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.fillStyle='#bc002d';c.beginPath();c.arc(w/2,h/2,h*.3,0,Math.PI*2);c.fill();});
  foodFlag('France flag',-19.1,-6,.15,1.5,(c,w,h)=>{['#002654','#ffffff','#ed2939'].forEach((colour,i)=>{c.fillStyle=colour;c.fillRect(i*w/3,0,w/3,h);});});
  foodFlag('Italy flag',-19.3,-14,.15,1.5,(c,w,h)=>{['#009246','#ffffff','#ce2b37'].forEach((colour,i)=>{c.fillStyle=colour;c.fillRect(i*w/3,0,w/3,h);});});
  document.body.dataset.foodFlags='United Nations|Australian Aboriginal|Japan|France|Italy';
  const messagePalette=['#5ab8f5','#f7da59','#f486c3','#8edcb0'];
  const messagePlacements=[['Peace',-10,40,.4],['Love',16,31,-.5],['Unity',-14,16,.3],['Respect',29,18,-.5],['PLUR',-18,-17,.4],['This Too Shall Pass',18,-30,.3],['Kindness',-28,-30,.4],['Namaste',30,-4,-.45]];
  for(const [i,[text,x,z,angle]] of messagePlacements.entries()){
    const g=flag('flower',x,z,angle);g.name=text+' message flag';g.scale.setScalar(.72);
    const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d');
    ctx.fillStyle=messagePalette[i%4];ctx.fillRect(0,0,1024,768);ctx.globalAlpha=.25;ctx.drawImage(images.flower,30,125,500,500);ctx.globalAlpha=1;
    ctx.fillStyle='#142c38';ctx.textAlign='left';ctx.font='800 italic 104px Arial';
    const words=text==='This Too Shall Pass'?['This too','shall pass']: [text];if(words.length>1)ctx.font='700 italic 73px Arial';words.forEach((word,j)=>ctx.fillText(word,55,words.length===1?425:352+j*90));
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    g.children[2].material.map.dispose();g.children[2].material.map=texture;g.children[2].material.needsUpdate=true;
  }
  document.body.dataset.messageFlags=messagePlacements.map(x=>x[0]).join('|');
  function decal(key,w,h,parent,x,y,z,rotation=0){
    const mark=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:brandMaps[key],transparent:true,depthWrite:false,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),parent);
    mark.position.set(x,y,z);mark.rotation.y=rotation;mark.castShadow=false;return mark;
  }
  const booth=new THREE.Group();booth.name='Proposed headspace welcome booth';booth.position.set(-36.8,0,-23.4);booth.rotation.y=.45;scene.add(booth);
  const counter=mesh(new THREE.BoxGeometry(2.6,1.05,.85),mats.timber,booth);counter.position.y=.525;
  const sign=mesh(new THREE.BoxGeometry(1.7,.38,.05),new THREE.MeshStandardMaterial({color:'#f5f4eb',roughness:1}),booth);sign.position.set(0,.63,.45);decal('headspace',1.5,.34,booth,0,.63,.48);
  const vehicle=new THREE.Group();vehicle.name='Illustrative MSF support vehicle';vehicle.position.set(-36,.12,-15);vehicle.rotation.y=.55;scene.add(vehicle);
  const paint=new THREE.MeshStandardMaterial({color:'#f0f1e9',roughness:.38,metalness:.12}),rubber=new THREE.MeshStandardMaterial({color:'#303531',roughness:.95}),glass=new THREE.MeshStandardMaterial({color:'#6f898b',roughness:.18,metalness:.28});
  function vehicleBox(w,h,d,material,x,y,z){const part=mesh(new THREE.BoxGeometry(w,h,d),material,vehicle);part.position.set(x,y,z);return part;}
  vehicleBox(2.05,.85,4.5,paint,0,.8,0);vehicleBox(1.92,1,2.55,paint,0,1.63,-.52);vehicleBox(1.98,.14,2.65,paint,0,2.17,-.52);vehicleBox(1.7,.69,.035,glass,0,1.7,.77);
  for(const side of [-1,1]){
    vehicleBox(.035,.63,1.92,glass,side*.977,1.72,-.5);
    for(const z of [-1.45,1.42]){const tire=mesh(new THREE.CylinderGeometry(.47,.47,.3,24),rubber,vehicle);tire.rotation.z=Math.PI/2;tire.position.set(side*1.04,.47,z);const hub=mesh(new THREE.CylinderGeometry(.24,.24,.315,16),poleMat,vehicle);hub.rotation.z=Math.PI/2;hub.position.copy(tire.position);}
    decal('msf',1.38,.53,vehicle,side*1.035,1.02,-.2,side*Math.PI/2);
    vehicleBox(.4,.16,.04,new THREE.MeshStandardMaterial({color:'#ece4b5',roughness:.3}),side*.65,.99,2.27);
  }
  vehicleBox(2.16,.17,.22,rubber,0,.52,2.27);vehicleBox(2.16,.17,.22,rubber,0,.52,-2.27);
  document.body.dataset.brandAssets='ready';
  const contextDecor=new THREE.Group();const contextObjects=scene.children.slice(contextStart);contextObjects.forEach(o=>contextDecor.add(o));scene.add(contextDecor);
  const portal=createPortal(THREE,()=>{needsFrame=true;requestFrame();});scene.add(portal.group);
  const anchorData=[['main','Main pavilion',[0,8.4,-12]],['food','International Food Fair',[-24,6.5,-9]],['play','Mobile music making',[-26,2.9,18]],['river','Apple listening pods',[22,1.3,8]],['support','Support',[-32,3,-20]],['fashion','Fashion runway',[0,2.2,24]],['portal','I Am Portal',[-34,6,66]]];
  for(const [key,[x,z]] of Object.entries(venueLocations))anchorData.push([key,places[key].title,[x,key==='elevation'?15.65:3.45,z]]);
  const anchors=anchorData.map(([key,label,p])=>{
    const el=document.createElement('button');el.className='scene-label';el.dataset.key=key;el.tabIndex=-1;el.innerHTML='<i></i>'+label;el.addEventListener('click',()=>selectPlace(key));$('labels').append(el);return {el,p:new THREE.Vector3(...p)};
  });
  const presets={
    bar:{pos:[-6,3.15,15.8],target:[-10,1.5,5]},
    vip:{pos:[18,9.3,-.1],target:[18,.60,-11]},
    tea:{pos:[23,4.9,71.8],target:[19,1,59]},
    overview:{pos:[65,51,82],target:[-1,0,0]},
    truck:{pos:[-62,4.8,28],target:[-40,2.5,27]},
    main:{pos:[0,3.2,12],target:[2.5,2,-12]},
    interior:{pos:[0,3.2,-1],target:[0,3.1,-18.9]},
    food:{pos:[-14,5,4],target:[-25,2,-10]},
    play:{pos:[-31,3.7,24],target:[-25.4,1.2,18]},
    river:{pos:[32,5,23],target:[23,1.7,10]},
    checking:{pos:[-38.5,4.6,1.3],target:[-42,1.12,-10]},
    'first-aid':{pos:[-17.3,5.8,-19.5],target:[-21.8,1.18,-31]},
    elevation:{pos:[13,15,62],target:[19,7.5,35]},
    support:{pos:[-25,7,-12],target:[-33.7,1.1,-23.2]},
    fashion:{pos:[2.4,2.1,40.8],target:[0,1,30]}
  };
  presets.portal=portal.camera();for(const zone of portalZones)presets['portal-'+zone.id]=portal.camera(zone.id);
  const nightLights=[];
  for(const [x,z,colour] of [[-9,-8,'#d98bff'],[9,-8,'#67c8e4'],[-24,-9,'#ffc798'],[-23,20,'#b2a0ff'],[25,5,'#70dfcb']]){
    const light=new THREE.PointLight(colour,0,24,1.3);light.position.set(x,2,z);scene.add(light);nightLights.push(light);
  }
  let cinematicCamera=false,tween=null,visible=true,raf=0,needsFrame=true,lastT=0,musicMotion=false,motionTime=0,waterTime=0,peopleTime=0,lastWaterFrame=0;
  let currentStory={seconds:0,construction:0,programme:0,night:0,navigation:false};
  let responseLevel=.7;
  const goldSky=new THREE.Color('#efc284'),peachSky=new THREE.Color('#c4868d'),goldSun=new THREE.Color('#ffc474');
  const daySky=new THREE.Color('#e9ece2'),nightSky=new THREE.Color('#101f30'),daySun=new THREE.Color('#fff1d9'),nightSun=new THREE.Color('#a5c0e2');
  const dayWaterA=new THREE.Color('#367f86'),nightWaterA=new THREE.Color('#123d48'),dayWaterB=new THREE.Color('#a1d4c5'),nightWaterB=new THREE.Color('#397280');
  function setNight(value){
    currentStory.night=Number(value);portal.setNight(value);features.setNight(value);hospitality.setNight(value);lightShow.set(Number(value),currentStory.programme>0);
    const v=Number(value);if(v<.3)scene.background.lerpColors(daySky,goldSky,v/.3);else if(v<.58)scene.background.lerpColors(goldSky,peachSky,(v-.3)/.28);else scene.background.lerpColors(peachSky,nightSky,(v-.58)/.42);scene.fog.color.copy(scene.background);
    skyLight.intensity=2.3-1.75*value;sun.intensity=3.4-3.16*value;
    if(v<.5)sun.color.lerpColors(daySun,goldSun,v*2);else sun.color.lerpColors(goldSun,nightSun,(v-.5)*2);sun.position.y=78-96*v;renderer.toneMappingExposure=1.15+.2*value;
    nightLights.forEach((light,i)=>light.intensity=currentStory.programme>0?Math.max(0,Math.min(1,(value-i*.09)/.45))*32:0);
    waterMat.uniforms.waterA.value.lerpColors(dayWaterA,nightWaterA,Number(value));waterMat.uniforms.waterB.value.lerpColors(dayWaterB,nightWaterB,Number(value));
    needsFrame=true;requestFrame();
  }
  function setResponse(value){responseLevel=value;lightShow.setResponse(value);nightLights.forEach((light,i)=>{light.color.setHSL(.48+value*.3+i*.04,.6,.65);light.intensity=currentStory.programme>0?currentStory.night*(12+value*24):0;});document.body.dataset.sceneResponse=value.toFixed(2);needsFrame=true;requestFrame();}
  function setStory(value){
    currentStory={...value};
    for(const [key,g] of Object.entries(buildings)){const p=value[key]||0;g.visible=p>0;buildPlanes[key].constant=p>=1?100:Math.max(.1,p*8.7);}
    hospitality.group.visible=value.furniture>0;contextDecor.visible=value.programme>0;paths.visible=value.seconds>=16;runway.setVisible(value.furniture>0);runwayCrowd.group.visible=value.programme>0;
    walkers.group.visible=seatedVisitors.group.visible=value.programme>0;festivalCast.setStory(value);portal.setStory(value);features.setStory(value);activities.setStory(value);setNight(value.night);setResponse(responseLevel);crowd.builders.visible=value.seconds>6&&value.seconds<29;crowd.visitors.visible=value.programme>0;performanceStage.group.visible=value.programme>=1;
    crowd.setProgramme(value.programme);
    document.body.dataset.revealed=Object.keys(buildings).filter(k=>value[k]>=1).join(',');
    document.querySelectorAll('#place-list,.view-tools').forEach(e=>e.inert=!value.navigation);
    if(value.seconds<32)renderer.shadowMap.needsUpdate=true;needsFrame=true;requestFrame();
  }
  function setRain(value){features.setRain(value);needsFrame=true;renderer.shadowMap.needsUpdate=true;requestFrame();}
  function setLayout(value){features.setLayout(value);needsFrame=true;requestFrame();}
  function animateMusic(t){
    for(const {geometry,base} of animatedFlags){const a=geometry.attributes.position;for(let i=0;i<a.count;i++){const u=(base[i*3]-.09)/4.1;a.setZ(i,base[i*3+2]+Math.sin(t*2.3+u*7+base[i*3+1])*u*.24);}a.needsUpdate=true;geometry.computeVertexNormals();}
    const a=crowns.instanceMatrix.array;for(let i=0;i<crowns.count;i++){const n=i*16;a[n+12]=crownMatrices[n+12]+Math.sin(t*.75+crownMatrices[n+14]*.07)*.28;a[n+14]=crownMatrices[n+14]+Math.cos(t*.6+crownMatrices[n+12]*.06)*.16;}crowns.instanceMatrix.needsUpdate=true;
    document.body.dataset.motionFrame=String(Math.round(t*100));
  }
  function setMusicMotion(value){musicMotion=value;document.body.dataset.musicMotion=String(value);needsFrame=true;requestFrame();}

  function markLanding(index){
    document.body.dataset.elevationLevel=String(index+1);
    for(const b of document.querySelectorAll('[data-elevation]'))b.setAttribute('aria-pressed',String(Number(b.dataset.elevation)===index));
  }
  function viewElevation(index){
    if(selected!=='elevation'||!sunsetLevels[index])return;
    const angle=1.09+index*.21,[x,z]=venueLocations.elevation,y=.18+index*levelHeight+1.55;
    cinematicCamera=false;tween=null;controls.minDistance=.75;controls.maxPolarAngle=Math.PI*.54;
    camera.position.set(x+1.35*Math.sin(angle),y,z+1.35*Math.cos(angle));
    controls.target.set(camera.position.x+5.4*Math.sin(angle),y+.24,camera.position.z+5.4*Math.cos(angle));
    controls.update();sunsetSky.show(index,camera.position,angle);markLanding(index);
    status('Elevation Bar · Level '+(index+1)+' · '+sunsetLevels[index].name);
    needsFrame=true;requestFrame();
  }
  function go(key,instant=false){
    sunsetSky.show(-1);markLanding(-1);controls.maxPolarAngle=Math.PI*.485;
    cinematicCamera=false;
    controls.minDistance=key==='fashion'?3:key.startsWith('portal')?4:12;
    const p=presets[key];const end=new THREE.Vector3(...p.pos),target=new THREE.Vector3(...p.target);
    if(key==='overview'){const pose=storyState?.seconds>=STORY_END?closingPose(portraitMobile()):mobile()?mobileOverviewPose(portraitMobile(),$('world').clientHeight):overviewPose();end.fromArray(pose.position);target.fromArray(pose.target);}else if(mobile()){end.sub(target).multiplyScalar(key==='fashion'?1.08:1.5).add(target);if(key.startsWith('portal-'))target.y-=1.7;}
    if(instant||reduced.matches){camera.position.copy(end);controls.target.copy(target);controls.update();tween=null;}else{tween={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:end,target};}
    needsFrame=true;requestFrame();
  }
  let orbitEntryPose=null;
  function orbit(seconds){
    if(!cinematicCamera)orbitEntryPose={position:camera.position.toArray(),target:controls.target.toArray()};
    const pose=orbitPose(seconds,mobile(),portraitMobile(),$('world').clientHeight,orbitEntryPose);tween=null;cinematicCamera=true;
    camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);camera.lookAt(controls.target);
    document.body.dataset.orbitShot=pose.shot;document.body.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(2)).join(',');
    needsFrame=true;requestFrame();
  }
  function resize(){const w=$('world').clientWidth,h=$('world').clientHeight;camera.aspect=w/h;camera.fov=mobile()?50:41;controls.maxDistance=portraitMobile()?310:mobile()?240:155;scene.fog.near=mobile()?205:115;scene.fog.far=mobile()?390:255;camera.updateProjectionMatrix();renderer.setSize(w,h);needsFrame=true;if(selected==='overview'&&!cinematicCamera)go('overview',true);requestFrame();}
  addEventListener('resize',resize);
  controls.addEventListener('start',()=>{cinematicCamera=false;tween=null;dismissSceneLabels();stopTour();syncLineup();});
  controls.addEventListener('change',()=>{needsFrame=true;requestFrame();});
  canvas.addEventListener('keydown',(e)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;
    e.preventDefault();cinematicCamera=false;dismissSceneLabels();stopTour();syncLineup();tween=null;const sph=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi=Math.max(.1,sph.phi-.1);if(e.key==='ArrowDown')sph.phi=Math.min(controls.maxPolarAngle,sph.phi+.1);
    if(e.key==='+'||e.key==='=')sph.radius=Math.max(controls.minDistance,sph.radius*.9);if(e.key==='-')sph.radius=Math.min(controls.maxDistance,sph.radius*1.1);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));controls.update();needsFrame=true;requestFrame();
  });
  const visitorFrustum=new THREE.Frustum(),projectionView=new THREE.Matrix4();
  function requestFrame(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  function frame(t){
    raf=0;if(!visible||document.hidden)return;
    const elapsed=lastWaterFrame?Math.min(.5,Math.max(0,(t-lastWaterFrame)/1000)):0;
    const waterMoving=entered&&media.motionEnabled();
    const peopleMoving=waterMoving&&!reduced.matches;
    if(waterMoving)waterTime+=Math.min(.05,elapsed);
    if(peopleMoving)peopleTime+=elapsed;
    lastWaterFrame=t;
    if(features.update(motionTime,t)){needsFrame=true;}
    if(walkers.group.visible){
      walkers.start();seatedVisitors.start();
      if(walkers.update(peopleTime,peopleMoving))needsFrame=true;
      if(seatedVisitors.update(peopleTime,peopleMoving))needsFrame=true;
    }
    camera.updateMatrixWorld();
    visitorFrustum.setFromProjectionMatrix(projectionView.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    if(hospitality.update(camera,peopleTime,peopleMoving))needsFrame=true;
    if(activities.update(peopleTime,peopleMoving,camera,visitorFrustum))needsFrame=true;
    if(festivalCast.update(camera,peopleTime,peopleMoving,visitorFrustum))needsFrame=true;
    if(portal.update(peopleTime,peopleMoving,camera,visitorFrustum))needsFrame=true;
    crowd.update(peopleTime,{construction:currentStory.construction,dancing:peopleMoving,visible:currentStory.seconds>6,night:currentStory.night,frustum:visitorFrustum});performanceStage.update(peopleTime,peopleMoving);lightShow.update(motionTime,peopleTime);
    if(runwayCrowd.update(peopleTime,peopleMoving))needsFrame=true;
    if(tween){const a=Math.min(1,(t-tween.start)/1250),ease=a*a*(3-2*a);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);if(a===1)tween=null;needsFrame=true;}
    if(!cinematicCamera)controls.update();
    const videoActive=!$('music-video').paused&&$('music-video').readyState>=2;
    if(!reduced.matches||musicMotion||needsFrame||videoActive||waterMoving){
      // Cap render work at approximately 30fps.
      if(t-lastT>30||needsFrame){if(musicMotion){motionTime+=Math.min(.05,Math.max(0,(t-lastT)/1000));animateMusic(motionTime);}waterMat.uniforms.time.value=waterTime;document.body.dataset.riverTime=waterTime.toFixed(3);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;lastT=t;needsFrame=false;
        const w=$('world').clientWidth,h=$('world').clientHeight,placed=[];
        for(const a of anchors){
          const p=a.p.clone().project(camera),x=(p.x*.5+.5)*w;let y=(-p.y*.5+.5)*h;
          const width=a.el.offsetWidth||120;
          for(let attempt=0;attempt<6&&placed.some(b=>Math.abs(x-b.x)<(width+b.width)/2+5&&Math.abs(y-b.y)<34);attempt++)y-=34;
          const hidden=p.z>1||p.z<-1||x<20||x>w-20||y<80||y>h-200;
          a.el.style.display=hidden?'none':'';a.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
          if(!hidden)placed.push({x,y,width});
        }
        document.body.dataset.rendered='true';document.body.dataset.renderCalls=String(renderer.info.render.calls);document.body.dataset.renderTriangles=String(renderer.info.render.triangles);
      }
    }
    if(!reduced.matches||musicMotion||tween||needsFrame||videoActive||waterMoving)requestFrame();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastWaterFrame=0;}else{needsFrame=true;requestFrame();}});
  reduced.addEventListener('change',()=>{controls.enableDamping=!reduced.matches;needsFrame=true;requestFrame();});
  canvas.addEventListener('webglcontextlost',(e)=>{e.preventDefault();setMode('plan');status('The 3D view paused. The 2D site plan remains available.');});
  go('overview',true);resize();
  runwayCrowd.select(document.querySelector('[data-runway-show][aria-pressed="true"]').dataset.runwayShow);
  return {go,orbit,viewElevation,setRunwayShow:runwayCrowd.select,setNight,setStory,setResponse,setRain,setLayout,setMusicMotion,setVisible(v){visible=v;if(!v){cancelAnimationFrame(raf);raf=0;}else{needsFrame=true;requestFrame();}},stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,trees:treeList.length,...features.stats,...activities.stats,...hospitality.stats,portal:portal.stats};}};
}

try {
  sceneAPI=await buildWorld();$('watch-runway').disabled=false;
  sceneAPI.setNight(0);sceneAPI.setMusicMotion(media.isAnimating());sceneAPI.setStory(storyState||{seconds:0,phase:'site',main:0,food:0,park:0,support:0,apple:0,playground:0,furniture:0,programme:0,truck:0,construction:0,night:0,navigation:false});sceneAPI.setRain(rain);sceneAPI.setLayout(layoutVisible);
  $('loading').hidden=true;$('explore-enter').disabled=false;
  document.body.dataset.ready='true';
  setMode('3d');
  status(mobile()?'The landscape is ready. Drag to orbit and pinch to zoom.':'The landscape is ready. Explore with the place buttons or drag the scene.');
  if(entered){sceneAPI?.setVisible(mode==='3d');startStory();}else if(document.documentElement.dataset.autoLaunch==='true')launchFestival();
} catch(error) {
  console.error('Lab landscape:',error);
  $('loading').hidden=true;$('explore-enter').disabled=false;
  document.body.dataset.ready='fallback';
  setMode('plan');
  $('navigation-hint').textContent='3D unavailable · explore the site plan';
  status('3D is unavailable on this device. The site plan and all place descriptions are available.');
}

if(document.documentElement.dataset.autoLaunch==='true'&&!entered)launchFestival();

// The essential header actions remain available at every viewport size.
function syncCompactLayout(){
  if(mobile())$('place-card').hidden=true;
  $('navigation-hint').textContent=mobile()?'Drag to orbit · pinch to zoom':'Drag to look around · scroll to move closer';
}
compactLayout.addEventListener('change',syncCompactLayout);
syncCompactLayout();
const requestedVenue=new URLSearchParams(location.search).get('place');
if(entered&&Object.hasOwn(venueLocations,requestedVenue))visitVenue(requestedVenue);
new ResizeObserver(([entry])=>{document.documentElement.style.setProperty('--lab-footer-height',`${entry.target.offsetHeight}px`);}).observe(document.querySelector('.explore-bar'));
