<?php
declare(strict_types=1);

// Cash entitlement, the Apple pass and the ERC20 receipt share one private reward record.
function study_reward_new(): array {
    return ['id'=>bin2hex(random_bytes(16)), 'claim_code'=>bin2hex(random_bytes(24)), 'pass_auth'=>bin2hex(random_bytes(32)),
        'wallet_address'=>null, 'redemption_requested_at'=>null, 'token_issue'=>null, 'token_redemption'=>null];
}
function study_reward_public(array $p): array {
    $r=$p['reward'] ?? []; $eligible=study_earned($p)===100.0;
    $paid=array_sum(array_column($p['payments'] ?? [],'amount_aud'))>=100;
    return ['id'=>$r['id']??null,'display_id'=>isset($r['id'])?'UM · '.strtoupper(substr($r['id'],0,8)):'',
        'amount_aud'=>$eligible?100:0,'status'=>$paid?'paid':($eligible?'eligible':'locked'),
        'redemption_requested'=>!empty($r['redemption_requested_at']), 'wallet_address'=>$r['wallet_address']??null,
        'token_issue'=>study_reward_transaction_public($r['token_issue']??null),'token_redemption'=>study_reward_transaction_public($r['token_redemption']??null)];
}
function study_reward_transaction_public(?array $tx): ?array {
    return $tx===null?null:array_intersect_key($tx,array_flip(['state','tx_hash','error']));
}
function study_reward_idempotency(string $seed): string {
    $h=hash('sha256',$seed);return substr($h,0,8).'-'.substr($h,8,4).'-4'.substr($h,13,3).'-8'.substr($h,17,3).'-'.substr($h,20,12);
}
function study_reward_apple_ledger(array $p, bool $preview): array {
    $r=$p['reward'];$public=study_reward_public($p);$count=count(array_filter($p['sessions'],static fn($s)=>$s['state']==='complete'));
    $available=$public['status']==='eligible'?100:0;
    $status=$preview?'Preview':($public['status']==='paid'?'Redeemed':($available?'Ready to redeem':'In progress'));
    $fields=['primaryFields'=>[['key'=>'reward','label'=>'RESEARCH REWARD','value'=>$available,'currencyCode'=>'AUD']],
        'secondaryFields'=>[['key'=>'status','label'=>'STATUS','value'=>$status]],
        'auxiliaryFields'=>[['key'=>'sessions','label'=>'SESSIONS','value'=>$count.' / 3'],['key'=>'reference','label'=>'REFERENCE','value'=>$public['display_id']]],
        'backFields'=>[['key'=>'terms','label'=>'Research reward','value'=>$preview?'Preview card. No payment or tokens are issued.':'A$100 on completion of all three sessions. Redeem once with the study organiser.'],
        ['key'=>'payment','label'=>'Payment','value'=>$public['status']==='paid'?'A$100 payment recorded.':'Payment not yet recorded.']]];
    foreach(['token_issue'=>'ERC20 receipt','token_redemption'=>'ERC20 redemption'] as $key=>$label)if(!empty($r[$key]['tx_hash']))$fields['backFields'][]=['key'=>$key,'label'=>$label,'value'=>'Polygon Amoy · '.$r[$key]['tx_hash']];
    return ['member'=>['pass_serial'=>'UM-STUDY-'.$r['id'],'display_id'=>$public['display_id'],'apple_authentication_token'=>$r['pass_auth']],
        'balance'=>['available_display'=>(string)$available],
        'study_pass'=>['description'=>'Universal Mind research reward','logoText'=>'HAPPINESS','storeCard'=>$fields,
            'barcodes'=>[['format'=>'PKBarcodeFormatQR','message'=>'UMR:'.$r['claim_code'],'messageEncoding'=>'iso-8859-1','altText'=>$public['display_id']]],
            'userInfo'=>['reward_reference'=>$r['id'],'preview'=>$preview]]];
}
function study_reward_sync_token(array &$p): array {
    study_require(study_earned($p)===100.0,'Complete all three sessions before issuing the reward receipt.');
    $r=&$p['reward'];$address=$r['wallet_address']??'';
    study_require(is_string($address)&&preg_match('/\A0x[a-fA-F0-9]{40}\z/',$address)===1,'Set this participant’s wallet address first.');
    if(!defined('HAPPINESS_LIBRARY_ONLY'))define('HAPPINESS_LIBRARY_ONLY',true);
    require_once __DIR__.'/happiness-automation.php';
    study_require(happiness_environment_ready()['ready'],'The existing wallet connection is not ready.');
    $paid=array_sum(array_column($p['payments'],'amount_aud'))>=100;
    $key=$paid&&($r['token_issue']['state']??'')==='confirmed'?'token_redemption':'token_issue';
    if(($r[$key]['state']??'')==='confirmed')return ['ok'=>true,'reward'=>study_reward_public($p)];
    $r[$key]??=['state'=>'pending','operation_id'=>'0x'.hash('sha256',$r['id'].'|'.$key),'idempotency_key'=>study_reward_idempotency($r['id'].'|'.$key),
        'intent_id'=>'study-'.$r['id'].'-'.$key,'address'=>$address,'action'=>$key==='token_issue'?'issue':'redeem','units'=>'100000000',
        'purpose_hash'=>'0x'.hash('sha256','universal-mind-research-reward-receipt'),'created_at'=>gmdate('c')];
    try {
        if(empty($r[$key]['circle_transaction_id'])) {
            $transaction=happiness_circle_submit($r[$key]);$r[$key]['circle_transaction_id']=$transaction['id'];
        } else $transaction=happiness_circle_transaction($r[$key]['circle_transaction_id']);
        $chainState=strtoupper($transaction['state']??'INITIATED');
        $r[$key]['circle_state']=$chainState;$r[$key]['tx_hash']=$transaction['txHash']??null;
        $r[$key]['state']=$chainState==='CONFIRMED'?'confirmed':(in_array($chainState,['FAILED','CANCELLED','DENIED'],true)?'failed':'pending');
        $r[$key]['updated_at']=gmdate('c');unset($r[$key]['error']);
    } catch(Throwable $e) {
        // Retain the same idempotency key for an uncertain submission; never mint again under a new key.
        $r[$key]['error']='Wallet service unavailable; retry the same request.';
    }
    return ['ok'=>true,'reward'=>study_reward_public($p)];
}
