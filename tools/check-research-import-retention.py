"""Regression check for PDF records without clickable hyperlink annotations."""
import json, os, shutil, subprocess, tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='research-import-check-') as directory:
    isolated=Path(directory)
    (isolated/'tools').mkdir()
    (isolated/'research/informatics/library').mkdir(parents=True)
    shutil.copy(root/'tools/build-informatics-library.py',isolated/'tools')
    subprocess.run(['python3',str(isolated/'tools/build-informatics-library.py')],check=True,stdout=subprocess.DEVNULL)
    records=json.loads((isolated/'Informatics/library-data/archive-records.json').read_text())
    language=[r for r in records if 'language' in r['collections']]
    assert len(language)==299,len(language)
    expected={'Pilot Study on Epigenetic Response to A Mind-Body Treatment':9,'Genomic counter-stress changes induced by the relaxation response':355,'Loving-kindness and compassion meditation: Potential for psychological interventions':880,'The provision of mental health services for asylum seekers and refugees':None}
    for title,count in expected.items():
        matches=[r for r in language if r['title']==title]
        assert len(matches)==1,title
        paper=matches[0]
        assert paper['originalNote'],title
        assert paper['historicalCitationCount']==('citations: '+str(count) if count is not None else 'citations:'),title
        if title.startswith('The provision'):assert paper['urls'][0].endswith('mental-health-services-for-asylum')
    print('299 Language entries retained, including all four records without PDF hyperlink annotations.')
