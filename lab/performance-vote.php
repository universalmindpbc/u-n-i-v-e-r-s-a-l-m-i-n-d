<?php
declare(strict_types=1);

header('Cache-Control: private, no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'");

$options = [
    'cox-prodigy' => 'Carl Cox (live) vs The Prodigy',
    'villalobos-luciano-vath' => 'Ricardo Villalobos vs Luciano vs Sven Väth',
    'hawtin-letyago' => 'Richie Hawtin vs Anfisa Letyago',
    'massive-attack' => 'Massive Attack (live)',
];
function escape($text): string { return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'HEAD', 'POST'], true)) {
    header('Allow: GET, HEAD, POST');
    http_response_code(405);
    exit;
}
$cookie = 'um_lab_ballot';
$id = $_COOKIE[$cookie] ?? '';
if (!is_string($id) || !preg_match('/^[a-f0-9]{64}$/D', $id)) {
    if ($method === 'POST') {
        http_response_code(403);
        exit('Please enable cookies and reopen the ballot.');
    }
    $id = bin2hex(random_bytes(32));
    setcookie($cookie, $id, ['expires'=>time()+86400*90, 'path'=>'/lab/', 'secure'=>true, 'httponly'=>true, 'samesite'=>'Strict']);
}
$token = hash('sha256', 'performance-vote:' . $id);
$dir = __DIR__ . '/ballots-private';
$file = $dir . '/' . hash('sha256', $id) . '.json';
$previous = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
$choice = $previous['choice'] ?? '';
$nomination = $previous['nomination'] ?? '';
$error = '';
if ($method === 'POST') {
    $submitted = $_POST['token'] ?? null;
    if (!is_string($submitted) || !hash_equals($token, $submitted) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') === 'cross-site') {
        http_response_code(403);
        exit('Please reopen the ballot and try again.');
    }
    $choice = is_string($_POST['choice'] ?? null) ? $_POST['choice'] : '';
    $nomination = $choice === 'nominate' && is_string($_POST['nomination'] ?? null) ? trim($_POST['nomination']) : '';
    if (!isset($options[$choice]) && $choice !== 'nominate') $error = 'Choose a performance or nominate your own.';
    if ($choice === 'nominate' && !preg_match('/\A[^\p{C}]{1,160}\z/u', $nomination)) $error = 'Enter an artist or collaboration in 1–160 characters.';
    if ($error === '') {
        $record = json_encode(['choice'=>$choice, 'nomination'=>$nomination], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $tmp = tempnam($dir, '.vote-');
        if ($tmp === false || dirname($tmp) !== realpath($dir) || file_put_contents($tmp, $record) !== strlen($record) || !rename($tmp, $file)) {
            if ($tmp !== false && is_file($tmp)) unlink($tmp);
            http_response_code(503);
            $error = 'Your vote hasn’t been saved. Please try again.';
        } else {
            header('Location: ./performance-vote.php?saved=1', true, 303);
            exit;
        }
    } else http_response_code(422);
}
?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Money Can’t Buy Performance — Universal Mind Lab</title><link rel="icon" href="./assets/favicon.png"><link rel="stylesheet" href="./performance-vote.css?v=1"></head>
<body><main>
<header><a href="/home/" aria-label="Universal Mind home"><img src="./assets/landing-flower.png" alt="" width="32" height="32"></a><a href="./">universalmind[lab]</a></header>
<h1>What Money Can’t Buy Performance do you want to see?</h1>
<?php if ($previous && isset($_GET['saved'])): ?><p class="confirmation" role="status"><?= $previous['choice'] === 'nominate' ? 'Your nomination is saved.' : 'Your vote is saved.' ?></p><?php endif; ?>
<?php if ($error !== ''): ?><p role="alert"><?= escape($error) ?></p><?php endif; ?>
<form method="post" action="./performance-vote.php">
<input type="hidden" name="token" value="<?= escape($token) ?>">
<fieldset><legend>Proposed performances</legend>
<?php foreach ($options as $value => $label): ?>
<label class="choice"><input type="radio" name="choice" value="<?= escape($value) ?>" required <?= $choice === $value ? 'checked' : '' ?>><span><?= escape($label) ?></span></label>
<?php endforeach; ?>
<label class="choice nominate"><input type="radio" id="nominate" name="choice" value="nominate" required <?= $choice === 'nominate' ? 'checked' : '' ?>><span>Nominate my own performance or collaboration</span></label>
<div class="write-in"><label for="nomination">Artist or collaboration</label><input type="text" id="nomination" name="nomination" maxlength="160" value="<?= escape($nomination) ?>"></div>
</fieldset><button type="submit"><?= $previous ? 'Update my vote' : 'Submit my vote' ?></button>
</form></main></body></html>
