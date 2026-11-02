"""Resolve this repository's public sitemap index without network access."""
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

def sitemap_urls(root, path='sitemap.xml', seen=None):
 root=Path(root);seen=set()if seen is None else seen
 if path in seen:return set()
 seen.add(path);doc=ET.parse(root/path).getroot();ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
 if doc.tag==ns+'urlset':return {node.text for node in doc.findall(ns+'url/'+ns+'loc')}
 assert doc.tag==ns+'sitemapindex',path
 urls=set()
 for node in doc.findall(ns+'sitemap/'+ns+'loc'):
  url=urlsplit(node.text);assert url.netloc=='universalmind.tv' and url.path.startswith('/sitemaps/')
  urls.update(sitemap_urls(root,url.path.lstrip('/'),seen))
 return urls
