"""Check exact-count publication, export parity, and unchanged other records."""
import csv
import importlib.util
import json
import subprocess
import sys
import tempfile
import zipfile
from fractions import Fraction
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / 'Informatics/pilot-v1'
baseline = sys.argv[1] if len(sys.argv) > 1 else 'de3b34f0ed9abdd5ac2e7c1778b16320e2876b7b'
dataset = json.loads((data / 'dataset.json').read_text())
publication = json.loads((data / 'm9-probability.json').read_text())
native = json.loads((data / 'm9.json').read_text())
assert publication == native['probability']
assert publication['method']['gamma_values'] == [9, 3, 3, 9, 6, 6]
assert publication['method']['beta_values'] == [4, 8, 7, 5, 1, 2]
assert publication['method']['beta_start_interval_clock_positions'] == [24, 4]
assert all(publication['method'][k] is False for k in (
    'allow_rotated_gamma_positions', 'allow_reordered_gamma_values',
    'allow_rotated_beta_cycle', 'allow_reversed_beta_cycle'))
assert isinstance(publication['counts']['all_arrangements'], str)
assert Fraction(int(publication['counts']['matching_arrangements']), int(publication['counts']['all_arrangements'])) == Fraction(publication['result']['fraction']) == Fraction(263, 51305410956800)
assert publication['display'] == 'Approximately 1 in 195.1 billion'
assert publication['result']['one_in_approx'] == float(Fraction(51305410956800, 263))
assert publication['interpretation']['selection_adjustment_applied'] is False
for record in dataset['records']:
    before = json.loads(subprocess.check_output(['git', 'show', f"{baseline}:Informatics/pilot-v1/m{record['modulus']}.json"], cwd=root))
    current = json.loads((data / f"m{record['modulus']}.json").read_text())
    aggregate = dict(current)
    aggregate.pop('research_register')
    assert aggregate == record
    if record['modulus'] == 9:
        assert current.pop('probability') == publication
    else:
        assert 'probability' not in current
    assert current == before, f"M{record['modulus']}: pre-existing data changed"
rows = list(csv.DictReader((data / 'records.csv').open(encoding='utf-8-sig')))
assert len([r for r in rows if r['probability']]) == 1
row = next(r for r in rows if r['modulus'] == '9')
assert row['probability_exact'] == publication['result']['fraction']
assert row['probability_method'] == publication['method']['id']
assert float(row['probability_one_in']) == publication['result']['one_in_approx']
with zipfile.ZipFile(data / 'm1-m48-data.zip') as bundle:
    for name in ('dataset.json', 'm9.json', 'm9-probability.json', 'm9-probability.py', 'records.csv'):
        assert bundle.read(name) == (data / name).read_bytes()
    with tempfile.TemporaryDirectory(prefix='m9-probability-check-') as temp:
        for name in ('m9.json', 'm9-probability.py'):
            Path(temp, name).write_bytes(bundle.read(name))
        audit = json.loads(subprocess.check_output([sys.executable, str(Path(temp, 'm9-probability.py'))], cwd=temp))
        assert audit['probabilities']['joint_exact_gamma_fixed_beta_phase']['exact_fraction'] == publication['result']['fraction']
        assert audit['mathematical_input_sha256'] == publication['verification']['mathematical_input_sha256']
        assert audit['verification'] == publication['verification']['checks']
assert (data / 'm9-probability.py').read_bytes() == (root / 'research/informatics/probability/m9p24_exact_shuffle.py').read_bytes()
print(json.dumps({'passed': True, 'exact_count_checks': 3, 'original_alignment': True,
                  'probability_records': ['M9 P24'], 'unchanged_other_records': 47,
                  'existing_data_unchanged': True, 'json_csv_zip_consistent': True,
                  'calculation_runs_from_download_bundle': True}, indent=2))
