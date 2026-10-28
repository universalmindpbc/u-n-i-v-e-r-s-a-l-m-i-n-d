<?php
require_once __DIR__.'/gate.php';patent_require_auth();
require_once __DIR__.'/knowledge.php';
header('Content-Type: application/json; charset=utf-8');
function patent_reply(array $value,int $code=200): void {http_response_code($code);echo json_encode($value,JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
try {
 if(($_SERVER['REQUEST_METHOD']??'')==='GET')patent_reply(['ready'=>patent_ai_key()!=='','catalogue'=>patent_catalogue()]);
 if(($_SERVER['REQUEST_METHOD']??'')!=='POST'||!patent_same_origin())patent_reply(['error'=>'Open the patent portal to continue.'],403);
 $raw=file_get_contents('php://input',false,null,0,50001);if(!is_string($raw)||strlen($raw)>50000)patent_reply(['error'=>'The question is too long.'],413);
 $body=json_decode($raw,true);if(!is_array($body)||!is_string($body['csrf']??null)||!hash_equals((string)($_SESSION['patent_csrf']??''),$body['csrf'])||empty($_SESSION['patent_csrf']))patent_reply(['error'=>'Refresh the patent page and sign in again.'],403);
 $action=$body['action']??'research';$question=is_string($body['question']??null)?trim($body['question']):'';
 if(!in_array($action,['research','search','voice-session'],true))patent_reply(['error'=>'Unknown operation.'],400);
 if($action!=='voice-session'&&($question===''||strlen($question)>12000))patent_reply(['error'=>'Enter a question of up to 4,000 characters.'],400);
 if($action==='search')patent_reply(['matches'=>patent_search($question,is_string($body['section']??null)?$body['section']:'')]);
 // Bound paid requests across new sessions from the same visitor address.
 $rateFile=sys_get_temp_dir().'/um-patent-ai-'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown')).'.json';
 $h=fopen($rateFile,'c+');if(!$h||!flock($h,LOCK_EX))throw new RuntimeException('The research service is busy. Please retry.');
 $times=json_decode(stream_get_contents($h)?:'[]',true);$times=array_values(array_filter(is_array($times)?$times:[],static fn($t)=>is_int($t)&&$t>time()-3600));
 if(count($times)>=40){flock($h,LOCK_UN);fclose($h);patent_reply(['error'=>'This connection has reached its hourly research limit. Please return later.'],429);}
 $times[]=time();ftruncate($h,0);rewind($h);fwrite($h,json_encode($times));flock($h,LOCK_UN);fclose($h);
 session_write_close();set_time_limit(240);
 if($action==='voice-session'){
  $session=['type'=>'realtime','model'=>'gpt-realtime-2.1','output_modalities'=>['audio'],'reasoning'=>['effort'=>'low'],'max_output_tokens'=>1600,'instructions'=>patent_scope().' Every substantive question and follow-up MUST call ask_research before speaking. Answer only from its result. Only greetings, thanks and voice controls bypass it. Do not read source markers or URLs aloud; they appear in the transcript. Speak warmly and concisely with Marin. Ignore background music and unclear audio.','tools'=>[['type'=>'function','name'=>'ask_research','description'=>'Retrieve and cite the complete filed patent, all chapters, appendices, code listings and drawings. Required before every substantive answer.','parameters'=>['type'=>'object','properties'=>['question'=>['type'=>'string']],'required'=>['question'],'additionalProperties'=>false]]],'tool_choice'=>'auto','audio'=>['input'=>['noise_reduction'=>['type'=>'near_field'],'transcription'=>['model'=>'gpt-4o-mini-transcribe'],'turn_detection'=>['type'=>'server_vad','threshold'=>0.72,'prefix_padding_ms'=>300,'silence_duration_ms'=>800,'create_response'=>false,'interrupt_response'=>false]],'output'=>['voice'=>'marin','speed'=>1.0]],'tracing'=>null];
  $v=patent_openai('realtime/client_secrets',['expires_after'=>['anchor'=>'created_at','seconds'=>120],'session'=>$session]);
  if(empty($v['value']))throw new RuntimeException('The patent voice session is unavailable.');
  patent_reply(['value'=>$v['value'],'expires_at'=>$v['expires_at'],'routingCatalogue'=>['patent','chapter','drawing','claim','appendix']]);
 }
 $sources=[];$images=[];$history=[];
 foreach(array_slice(is_array($body['history']??null)?$body['history']:[],-8) as $m){if(is_array($m)&&in_array($m['role']??'',['user','assistant'],true)&&is_string($m['content']??null))$history[]=['role'=>$m['role'],'content'=>substr($m['content'],0,3000)];}
 $query=$question;
 if(preg_match('/\b(it|that|those|these|they|them|more|same)\b/i',$question)){foreach(array_reverse($history) as $m){if($m['role']==='user'){$query.=' '.$m['content'];break;}}}
 $initial=patent_read_pages(array_column(patent_search($query),'page'),$sources,$images);
 $content=[['type'=>'input_text','text'=>json_encode(['question'=>$question,'catalogue'=>patent_catalogue(),'retrieved_pages'=>$initial],JSON_INVALID_UTF8_SUBSTITUTE)]];
 foreach($images as $page=>$im){$content[]=['type'=>'input_text','text'=>'Drawing on PDF page '.$page.' ['.$sources[$page]['label'].']'];$content[]=$im;}
 $input=$history;$input[]=['role'=>'user','content'=>$content];
 $tools=[['type'=>'function','name'=>'search_patent','description'=>'Search every page, chapter, appendix, software listing and drawing description. Use separate queries for comparisons.','strict'=>true,'parameters'=>['type'=>'object','properties'=>['query'=>['type'=>'string'],'section'=>['type'=>'string','description'=>'Section title fragment, or empty for the complete patent.']],'required'=>['query','section'],'additionalProperties'=>false]],['type'=>'function','name'=>'read_patent_pages','description'=>'Read up to eight exact PDF pages, including images for drawing sheets at pages 300-390. Source image N is on page 299+N.','strict'=>true,'parameters'=>['type'=>'object','properties'=>['pages'=>['type'=>'array','items'=>['type'=>'integer'],'maxItems'=>8]],'required'=>['pages'],'additionalProperties'=>false]]];
 $answer='';$tokens=0;$rounds=0;$imagePages=array_keys($images);
 for($turn=0;$turn<5;$turn++){
  $response=patent_openai('responses',['model'=>'gpt-6-astra','instructions'=>patent_scope(),'input'=>$input,'tools'=>$tools,'tool_choice'=>$turn===4?'none':'auto','parallel_tool_calls'=>false,'store'=>false,'max_output_tokens'=>2600,'reasoning'=>['effort'=>'low']]);$rounds++;$tokens+=(int)($response['usage']['total_tokens']??0);
  if(($response['status']??'')==='incomplete')throw new RuntimeException('This answer reached its length limit. Please ask a narrower question.');
  $calls=array_values(array_filter($response['output']??[],static fn($o)=>($o['type']??'')==='function_call'));
  if(!$calls){foreach($response['output']??[] as $o)foreach($o['content']??[] as $c)if(($c['type']??'')==='output_text')$answer.=$c['text']."\n";break;}
  $input=array_merge($input,$response['output']);
  foreach($calls as $call){$args=json_decode($call['arguments'],true)??[];$images=[];
   if($call['name']==='search_patent')$result=patent_read_pages(array_column(patent_search((string)($args['query']??''),(string)($args['section']??'')),'page'),$sources,$images);
   elseif($call['name']==='read_patent_pages')$result=patent_read_pages(is_array($args['pages']??null)?$args['pages']:[],$sources,$images);
   else $result=['error'=>'Unknown read operation.'];
   $input[]=['type'=>'function_call_output','call_id'=>$call['call_id'],'output'=>json_encode($result,JSON_INVALID_UTF8_SUBSTITUTE)];
   $imageContent=[];foreach($images as $page=>$im){if(in_array($page,$imagePages,true))continue;$imagePages[]=$page;$imageContent[]=['type'=>'input_text','text'=>'Drawing on PDF page '.$page.' ['.$sources[$page]['label'].']'];$imageContent[]=$im;}
   if($imageContent)$input[]=['role'=>'user','content'=>$imageContent];
  }
 }
 $answer=trim($answer);if($answer==='')throw new RuntimeException('No complete answer was returned. Please retry.');
 $answer=preg_replace_callback('/\[(S\d+(?:\s*,\s*S\d+)*)\]/',static function($m){preg_match_all('/S\d+/',$m[1],$ids);return implode('',array_map(static fn($id)=>'['.$id.']',$ids[0]));},$answer);
 preg_match_all('/\[(S\d+)\]/',$answer,$matches);$labels=array_unique($matches[1]);$available=array_column($sources,null,'label');
 foreach($labels as $label)if(!isset($available[$label]))throw new RuntimeException('A page reference failed validation. Please retry.');
 $cited=array_values(array_map(static fn($label)=>$available[$label],$labels));
 patent_reply(['answer'=>$answer,'sources'=>$cited,'model'=>'gpt-6-astra','version'=>patent_document()['sha256'],'usage'=>['totalTokens'=>$tokens],'retrieval'=>['pages_available'=>953,'sections_available'=>35,'drawings_available'=>count(patent_drawings()),'pages_read'=>array_keys($sources),'images_read'=>$imagePages,'rounds'=>$rounds]]);
}catch(Throwable $e){patent_reply(['error'=>$e instanceof RuntimeException?$e->getMessage():'The patent research service is temporarily unavailable. Please retry.'],503);}
