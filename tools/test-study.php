<?php
declare(strict_types=1);
require __DIR__ . '/../i  a m/api/study-lib.php';
require __DIR__ . '/../i  a m/api/study-spectrum.php';
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function beats(float $frequency, float $amplitude = 60): array {
    $beats = []; $time = 0;
    while ($time < 60) {
        $duration = 1000 + $amplitude*sin(2*M_PI*$frequency*$time);
        $beats[] = ['start_location_sec'=>$time,'end_location_sec'=>$time+$duration/1000,'duration_ms'=>$duration];
        $time += $duration/1000;
    }
    return $beats;
}
check(study_protocol()['scale']['emojis'][6] === '😇' && study_protocol()['scale']['emojis'][9] === '😍', 'Supplied emoji ordering changed');
$missing = study_vitals(['unavailable_reason'=>'licence_unavailable','heart_rate_bpm'=>70],false);
check($missing['heart_rate_bpm'] === null && $missing['systolic_blood_pressure_mmhg'] === null,'Missing readings became numbers');
$partial = study_vitals(['heart_rate_bpm'=>70,'measurement_duration_seconds'=>10],false);
check($partial['heart_rate_bpm'] === 70.0 && $partial['hrv_sdnn_ms'] === null,'Partially licensed scan rejected or imputed');
try { study_vitals(['heart_rate_bpm'=>70,'measurement_duration_seconds'=>60],false); throw new RuntimeException('Wrong duration accepted'); }
catch (InvalidArgumentException $expected) {}
$spectrum = study_spectrum(beats(.1)); $higher = study_spectrum(beats(.1,120)); $outside = study_spectrum(beats(.2));
check($spectrum['status']==='exploratory' && abs($spectrum['peak_hz']-.1)<.018,'Known 0.1 Hz oscillation not recovered');
check($spectrum['power_0_1_ms2']>500 && $spectrum['power_0_1_ms2']<1900,'Spectral power normalization incorrect');
check($higher['power_0_1_ms2']/$spectrum['power_0_1_ms2']>3.5 && $higher['power_0_1_ms2']/$spectrum['power_0_1_ms2']<4.5,'Doubling amplitude must approximately quadruple power');
check($outside['power_0_1_ms2']<$spectrum['power_0_1_ms2']*.05,'Out-of-band peak leaked into 0.1 Hz measure');
check(study_spectrum(array_slice(beats(.1),0,30))['status']==='unavailable','Short record accepted');
$gap=beats(.1);$gap[20]['start_location_sec']+=.3;
check(study_spectrum($gap)['status']==='unavailable','Discontinuous record accepted');
check(study_spectrum(beats(.1,0))['status']==='unavailable','Flat recording treated as a meaningful spectrum');
$a=study_new_participant('P01');$b=study_new_participant('P02');
$session=['id'=>'test','number'=>1,'state'=>'complete','window'=>'morning','created_at'=>gmdate('c'),'created_at_epoch'=>time(),
 'timezone'=>'Australia/Sydney','exposure_seconds'=>600,'interruptions'=>0,'before_vitals'=>$partial,'after_vitals'=>$partial,
 'before_report'=>['happiness'=>3,'stress'=>7,'connection'=>4,'text'=>'before'],'after_report'=>['happiness'=>5,'stress'=>5,'connection'=>6,'text'=>'after']];
$a['sessions']=[$session,$session,$session];$session['after_report']['happiness']=9;$b['sessions']=[$session];
$summary=study_summary([$a,$b]);
check($summary['statistics']['happiness']['n']===2,'Repeated sessions counted as independent participants');
check($summary['statistics']['happiness']['mean']===4,'Participant weighting is incorrect');
check($summary['statistics']['hrv_sdnn_ms']['n']===0,'Missing HRV included in denominator');
check($summary['happiness_distribution']['increased']===4,'Session distribution is incorrect');
$data=study_defaults();$data['participants']=['P01'=>$a,'P02'=>$b];
check(!isset(study_aggregate($data)['summary']['rows']),'Stakeholder aggregate leaked individual records');
check(count(study_dataset($data,'P01')['participants'])===1,'Personal dataset contains other participants');
check(!isset(study_participant_public($a)['access_hash']),'Access hash exposed');
check(study_readiness(study_defaults()['config'])['open']===false,'Enrolment is open before preparation');
check(study_earned($a) === 100.0 && study_earned($b) === 0.0, 'Reward must be all three sessions or zero');
check(abs(study_percent_change(5,8)-60)<0.0001, 'Percentage change is incorrect');
check(study_percent_change(0,5) === null && study_percent_change(null,5) === null, 'Invalid baseline gave a percentage');
check(abs($summary['rows'][0]['percent_changes']['happiness']-66.6666667)<0.001, 'Per-session percent not exported');
$passA=study_reward_apple_ledger($a,false);$passB=study_reward_apple_ledger($b,false);
check($passA['member']['pass_serial']!==$passB['member']['pass_serial'],'Participant passes share a serial');
check($passA['study_pass']['storeCard']['primaryFields'][0]['value']===100 && $passB['study_pass']['storeCard']['primaryFields'][0]['value']===0,'Pass reward does not match completed sessions');
check($passA['study_pass']['barcodes'][0]['message']==='UMR:'.$a['reward']['claim_code'],'Pass cannot resolve its private reward');
check(!isset(study_participant_public($a)['reward']['claim_code']),'Reward claim code leaked into participant dataset');
check(study_reward_idempotency('one')===study_reward_idempotency('one')&&study_reward_idempotency('one')!==study_reward_idempotency('two'),'Wallet idempotency not stable per operation');
check(preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/',study_reward_idempotency('one'))===1,'Circle idempotency is not UUID-shaped');
echo json_encode(['passed'=>24,'spectrum_0_1_hz'=>$spectrum['peak_hz'],'power_ms2'=>$spectrum['power_0_1_ms2'],'amplitude_doubling_ratio'=>$higher['power_0_1_ms2']/$spectrum['power_0_1_ms2']],JSON_PRETTY_PRINT),"\n";
