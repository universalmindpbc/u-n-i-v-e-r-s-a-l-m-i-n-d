// Shared by the research service and voice turn controller. The catalogue is
// generated from the public library metadata; it contains no article passages.
export const normaliseResearchText=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/(\d)(hz|hertz)\b/gi,'$1 $2').replace(/[–—−-]/g,' ').replace(/[^\p{L}\p{N}.+]+/gu,' ').trim().replace(/\s+/g,' ');
export function needsResearch(question,catalogue=[],history=[]){
 const text=' '+normaliseResearchText(question)+' ';
 if(/\b(?:library|repository|informatics|atlas|publications?|studies|papers|citations?|evidence|research findings|m\s?\d{1,4})\b/.test(text))return true;
 if(catalogue.some(term=>text.includes(' '+term+' ')))return true;
 // Resolve a short evidence follow-up against the preceding visitor question,
 // without treating greetings or a new unrelated concept as research requests.
 if(/\b(?:those|these|that|this|which genes|what genes|how many|tell me more|what about|what else)\b/.test(text)){
  const previous=history.filter(m=>m.role==='user'&&normaliseResearchText(m.content)!==text.trim()).at(-1);
  return !!previous&&needsResearch(previous.content,catalogue);
 }
 return false;
}
