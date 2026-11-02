<?php
// Only published navigation entries can be redirect destinations.
$config = json_decode(file_get_contents(__DIR__ . '/portals.json'), true);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_GET;
$target = null;
$fragment = '';
$parsePairs = static function ($search) {
    $pairs = [];
    foreach (explode('&', ltrim($search, '?')) as $part) {
        if ($part === '') continue;
        $values = explode('=', $part, 2);
        $pairs[] = [urldecode($values[0]), urldecode($values[1] ?? '')];
    }
    return $pairs;
};
$pairs = $parsePairs($_SERVER['QUERY_STRING'] ?? '');
$normalize = static function ($value) { return rtrim(preg_replace('~/index\.html$~', '/', $value), '/'); };
foreach ($config['portals'] as $portal) {
    foreach ($portal['entries'] as $entry) {
        foreach (array_merge([$entry], $entry['children'] ?? []) as $item) {
            if (empty($item['source'])) continue;
            $legacy = ($portal['id'] === 'iam' ? '/vogue/iam/' : '/informatics/') . $item['source'];
            if ($normalize($path) === $normalize($legacy) && !($portal['id'] === 'informatics' && $item['source'] === 'index.html')) $target = $item;
            if ($portal['id'] === 'informatics' && in_array($normalize($path), ['/informatics'], true)) {
                $area = isset($query['about']) ? 'about' : ($query['area'] ?? (isset($query['atlas']) ? 'geometry' : ''));
                if ($item['id'] === $area) $target = $item;
            }
        }
    }
}
if (!$target) { http_response_code(404); exit('Page not found.'); }
if (isset($query['section']) && is_string($query['section'])) {
    $section = json_decode($query['section'], true);
    if (is_array($section) && isset($section['search']) && is_string($section['search'])) {
        $present = array_column($pairs, 0);
        foreach ($parsePairs($section['search']) as $pair) if (!in_array($pair[0], $present, true)) $pairs[] = $pair;
        if (isset($section['hash']) && is_string($section['hash'])) $fragment = '#' . rawurlencode(ltrim($section['hash'], '#'));
    }
}
$controls = ['entry','area','atlas','about','embedded','adaptiveFrame','musicTelevisionFrame','navigationShell','v','aboutTopLevel','section'];
$kept = [];
foreach ($pairs as [$key, $value]) if (!in_array($key, $controls, true)) $kept[] = rawurlencode($key) . '=' . rawurlencode($value);
$destination = $target['url'] . (count($kept) ? '?' . implode('&', $kept) : '');
header('Location: ' . $destination . $fragment, true, 301);
exit;
