// Shared reading preference, with the existing film retained by its parent.
(() => {
 const key='informatics-library-background',modes=['video','black','white'],root=document.documentElement;
 const read=()=>{try{return localStorage.getItem(key);}catch{return null;}};
 let mode=modes.includes(read())?read():'video';root.dataset.readingBackground=mode;
 function parentTheme(){try{if(parent===window)return;parent.document.documentElement.dataset.quantumReading=mode;if(!parent.document.getElementById('quantum-reading-theme')){const link=parent.document.createElement('link');link.id='quantum-reading-theme';link.rel='stylesheet';link.href=new URL('reading-theme.css?v=1',document.baseURI).href;parent.document.head.append(link);}}catch{}}
 function apply(value,persist=true){mode=modes.includes(value)?value:'video';root.dataset.readingBackground=mode;if(persist)try{localStorage.setItem(key,mode);}catch{};for(const b of document.querySelectorAll('[data-quantum-background]'))b.setAttribute('aria-pressed',String(b.dataset.quantumBackground===mode));parentTheme();}
 document.addEventListener('DOMContentLoaded',()=>{const group=document.createElement('div');group.className='quantum-reading-options';group.setAttribute('role','group');group.setAttribute('aria-label','Reading background');for(const name of modes){const b=document.createElement('button');b.type='button';b.dataset.quantumBackground=name;b.textContent=name[0].toUpperCase()+name.slice(1);b.onclick=()=>apply(name);group.append(b);}document.querySelector('.masthead').append(group);apply(mode,false);},{once:true});
 window.addEventListener('storage',e=>{if(e.key===key||e.key===null)apply(read(),false);});
 parentTheme();
})();
