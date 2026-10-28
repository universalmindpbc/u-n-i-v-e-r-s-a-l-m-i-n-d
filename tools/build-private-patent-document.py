"""Create private portal data from a reviewed PDF and its generated contents index."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('--package', required=True, type=Path)
parser.add_argument('--runtime', required=True, type=Path)
parser.add_argument('--filing-record', type=Path)
args = parser.parse_args()
pdf = args.package / 'Australian-Provisional-Specification.pdf'
sections = json.loads((args.package / 'specification-index.json').read_text())
titles = [s['title'] for s in sections]
ordered = ['15. Proposed claims, part 1', '16. Proposed claims, part 2',
           '17. Abstract', 'Drawings and figure descriptions', 'Drawing sheets',
           'Appendix A. Universal Light algorithm and research architecture']
positions = [titles.index(t) for t in ordered]
assert positions == sorted(positions), 'The main patent must precede supplementary appendices.'
assert all(t.startswith('Appendix') for t in titles[positions[-1]:])
reader = PdfReader(pdf)
pages = []
section_index = -1
for number, page in enumerate(reader.pages, 1):
    while section_index + 1 < len(sections) and sections[section_index + 1]['page'] <= number:
        section_index += 1
    title = sections[section_index]['title'] if section_index >= 0 else 'Title and contents'
    material = 'description'
    if title.startswith('Appendix L'): material = 'implementation'
    elif title.startswith('Appendix'): material = 'appendix'
    elif 'Proposed claims' in title: material = 'claims'
    elif title == '17. Abstract': material = 'abstract'
    elif title.startswith('Drawing'): material = 'drawing'
    raw = page.extract_text()
    text, count = re.subn(r'^\d+(?:/\d+)?\nReturn to contents\n', '', raw, count=1)
    assert count == 1, f'Unexpected page header on page {number}'
    pages.append({'page': number, 'section': title, 'material': material, 'text': text.strip()})
document = {'title': str(reader.metadata.title), 'status': 'private-pre-filing',
            'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
            'sections': sections, 'pages': pages,
            'document_order': 'Main description, claims, abstract, drawings and figures, supplementary appendices'}
if args.filing_record:
    filing = json.loads(args.filing_record.read_text())
    assert filing.get('application_number') and filing.get('transaction_reference')
    assert filing.get('receipt_verified') is True
    document.update(status='private-filed', filing=filing)
args.runtime.mkdir(parents=True, exist_ok=True, mode=0o700)
for name, content in [('document.json', json.dumps(document, ensure_ascii=False).encode()),
                      ('specification.pdf', pdf.read_bytes())]:
    path = args.runtime / name
    path.write_bytes(content)
    path.chmod(0o600)
(args.package / 'Australian-Provisional-Specification.txt').write_text('\n\n'.join(p['text'] for p in pages))
print(json.dumps({'pages': len(pages), 'sha256': document['sha256'], 'section_order_verified': True}))
