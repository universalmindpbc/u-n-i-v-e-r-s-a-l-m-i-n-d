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
$partial = study_vitals(['heart_rate_bpm'=>70,'measurement_duration_seconds'=>60],false);
check($partial['heart_rate_bpm'] === 70.0 && $partial['hrv_sdnn_ms'] === null,'Partially licensed scan rejected or imputed');
try { study_vitals(['heart_rate_bpm'=>70,'measurement_duration_seconds'=>10],false); throw new RuntimeException('Short scan accepted'); }
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
echo json_encode(['passed'=>18,'spectrum_0_1_hz'=>$spectrum['peak_hz'],'power_ms2'=>$spectrum['power_0_1_ms2'],'amplitude_doubling_ratio'=>$higher['power_0_1_ms2']/$spectrum['power_0_1_ms2']],JSON_PRETTY_PRINT),"\n";
