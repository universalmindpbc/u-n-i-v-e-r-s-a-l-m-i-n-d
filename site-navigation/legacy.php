<?php
// Only published navigation entries can be redirect destinations.
$config = json_decode(file_get_contents(__DIR__ . '/portals.json'), true);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_GET;
$target = null;
$fragment = '';
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
if (isset($query['section'])) {
    $section = json_decode($query['section'], true);
    if (is_array($section) && isset($section['search'])) { parse_str(ltrim($section['search'], '?'), $forwarded); $query = array_merge($forwarded, $query); if (isset($section['hash']) && is_string($section['hash'])) $fragment = '#' . rawurlencode(ltrim($section['hash'], '#')); }
}
foreach (['entry','area','atlas','about','embedded','adaptiveFrame','musicTelevisionFrame','navigationShell','v','aboutTopLevel','section'] as $key) unset($query[$key]);
$destination = $target['url'] . (count($query) ? '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986) : '');
header('Location: ' . $destination . $fragment, true, 301);
exit;
