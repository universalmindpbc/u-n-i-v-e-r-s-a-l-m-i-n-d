<?php
declare(strict_types=1);
require_once __DIR__.'/study-lib.php';
require_once dirname(__DIR__).'/apple-wallet/happiness-apple-lib.php';
header('Cache-Control: no-store, max-age=0');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
ini_set('session.use_strict_mode','1');session_name('iam_study');session_start();
try {
    if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){http_response_code(405);header('Allow: GET');exit;}
    study_require(isset($_SESSION['participant_id'],$_SESSION['last_seen'])&&$_SESSION['last_seen']>=time()-28800,'Please sign in to your study.');
    $ledger=study_store(function(array &$data):array {
        $p=$data['participants'][$_SESSION['participant_id']]??null;
        study_require($p!==null&&$p['consent']!==null&&!$p['withdrawn'],'Please sign in to your study.');
        return study_reward_apple_ledger($p,isset($_SESSION['preview']));
    },$_SESSION['preview']??null);
    session_write_close();
    $path=happiness_apple_build_pass($ledger);
    header('Content-Type: application/vnd.apple.pkpass');
    header('Content-Disposition: attachment; filename="Universal-Mind-Reward.pkpass"');
    header('Content-Length: '.filesize($path));readfile($path);
    $directory=dirname($path);foreach(glob($directory.'/*')?:[] as $file)@unlink($file);@rmdir($directory);
} catch(Throwable $e) {
    http_response_code($e instanceof InvalidArgumentException?401:503);
    header('Content-Type: application/json');echo json_encode(['error'=>$e instanceof InvalidArgumentException?$e->getMessage():'Your Apple Wallet card could not be prepared. Please try again.']);
}
