'use strict';
// Reuse the deployed Universal One component and general research service.
// The private PDF, page text and access key are never supplied as context.
window.UniversalOneHelpersReady=Promise.all([
 import('/informatics/universal-one-routing.js?v=3'),
 import('/informatics/universal-one-context.js?v=1')
]).then(([routing,context])=>{
 window.UniversalOneNeedsResearch=routing.needsResearch;
 window.UniversalOneContext=context;
});
document.addEventListener('DOMContentLoaded',()=>{
 const assistant=document.querySelector('.uo');
 if(!assistant)return;
 assistant.querySelector('.uo-header p').textContent='General research · Patent document not connected';
 const welcome=assistant.querySelector('.uo-welcome');
 if(welcome)welcome.textContent='Ask a general research question. The private patent document will be connected after filing.';
 document.querySelector('#open-assistant')?.addEventListener('click',()=>window.UniversalOneResearch?.open());
});
