<?php
declare(strict_types=1);

/** Exploratory 60-second pulse-interval spectrum. No imputed beats and no HeartMath score. */
function study_spectrum($beats): array {
    $base = ['method' => 'ibi-linear4hz-detrend-hann-periodogram-v1', 'status' => 'unavailable',
        'power_0_1_ms2' => null, 'peak_hz' => null, 'band_hz' => [0.085,0.115], 'duration_seconds' => null,
        'frequency_resolution_hz' => null, 'points' => [], 'reason' => 'Beat intervals unavailable'];
    if (!is_array($beats) || count($beats) < 25 || count($beats) > 250) return $base;
    $times = []; $intervals = []; $previousEnd = null;
    foreach ($beats as $beat) {
        if (!is_array($beat)) return $base;
        $start = $beat['start_location_sec'] ?? null; $end = $beat['end_location_sec'] ?? null; $duration = $beat['duration_ms'] ?? null;
        foreach ([$start,$end,$duration] as $v) if (!(is_int($v) || is_float($v)) || !is_finite((float) $v)) return $base;
        if ($start < 0 || $end <= $start || $end > 180 || $duration < 250 || $duration > 2400
            || abs(($end-$start)*1000-$duration) > 30
            || ($previousEnd !== null && abs($start-$previousEnd) > 0.06)) {
            $base['reason'] = 'Interrupted or inconsistent beat intervals'; return $base;
        }
        $times[] = ($start+$end)/2; $intervals[] = (float) $duration; $previousEnd = $end;
    }
    $span = end($times)-$times[0]; $base['duration_seconds'] = round($span,3);
    // A 60-second capture loses at most the first/last half interval. Require at least 55 usable seconds.
    if ($span < 55 || $span > 65) { $base['reason'] = 'Requires one continuous minute of usable beat intervals'; return $base; }
    $sorted = $intervals; sort($sorted); $median = $sorted[intdiv(count($sorted),2)];
    $outliers = array_filter($intervals, static fn($v): bool => abs($v-$median) > $median*0.3);
    if (count($outliers) > count($intervals)*0.05) { $base['reason'] = 'Interval quality requires review'; return $base; }
    $fs = 4; $samples = []; $index = 0; $last = count($times)-1;
    for ($t = $times[0]; $t <= end($times); $t += 1/$fs) {
        while ($index < $last-1 && $times[$index+1] < $t) $index++;
        $weight = ($t-$times[$index])/($times[$index+1]-$times[$index]);
        $samples[] = $intervals[$index]+$weight*($intervals[$index+1]-$intervals[$index]);
    }
    $n = count($samples); $mean = array_sum($samples)/$n; $middle = ($n-1)/2; $sxy = 0; $sxx = 0;
    foreach ($samples as $i => $v) { $sxy += ($i-$middle)*($v-$mean); $sxx += ($i-$middle)**2; }
    $windowEnergy = 0;
    foreach ($samples as $i => $v) { $w = 0.5*(1-cos(2*M_PI*$i/($n-1))); $samples[$i] = ($v-$mean-($sxy/$sxx)*($i-$middle))*$w; $windowEnergy += $w*$w; }
    $df = $fs/$n; $power = 0; $total = 0; $peakPower = -1; $peak = null;
    for ($k = 1; $k <= (int) floor(0.4/$df); $k++) {
        $real = 0; $imaginary = 0;
        foreach ($samples as $i => $v) { $angle = 2*M_PI*$k*$i/$n; $real += $v*cos($angle); $imaginary -= $v*sin($angle); }
        $psd = 2*($real*$real+$imaginary*$imaginary)/($fs*$windowEnergy); $f = $k*$df;
        $base['points'][] = ['hz' => round($f,6), 'ms2_per_hz' => round($psd,6)];
        // Fractional-bin integration avoids changing the band simply because the recording contains a partial beat.
        $overlap = max(0, min($f+$df/2,0.115)-max($f-$df/2,0.085)); $power += $psd*$overlap;
        if ($f >= 0.04 && $f <= 0.26 && $psd > $peakPower) { $peakPower = $psd; $peak = $f; }
        $total += $psd*$df;
    }
    if ($total < 0.000001) { $base['reason'] = 'Insufficient interval variation'; return $base; }
    $base['status'] = 'exploratory'; $base['reason'] = null; $base['power_0_1_ms2'] = round($power,6);
    $base['peak_hz'] = round($peak,6); $base['frequency_resolution_hz'] = round($df,6);
    $base['usable_beats'] = count($beats); $base['beat_intervals'] = $beats;
    return $base;
}
