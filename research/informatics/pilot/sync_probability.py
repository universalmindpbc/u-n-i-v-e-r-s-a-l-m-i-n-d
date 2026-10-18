"""Publish the approved M9 P24 probability with its native alignment preserved.

Run after geometry/literature generation and before export_csv.py.
Only the M9 record receives a probability. Other records await calculation.
"""
import argparse
import importlib.util
import json
from pathlib import Path


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def sync(data_dir, calculator):
    spec = importlib.util.spec_from_file_location('m9_probability', calculator)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    audit = module.calculate(data_dir / 'm9.json')
    native = json.loads((data_dir / 'm9.json').read_text())
    result = audit['probabilities']['joint_exact_gamma_fixed_beta_phase']
    assert result['exact_fraction'] == '263/51305410956800'
    numerator, denominator = result['exact_fraction'].split('/')
    counts = audit['counts']
    probability = {
        'schema_version': '1.0.0',
        'id': 'm9p24-fixed-gamma-beta-shuffle-v1',
        'record_id': native['id'],
        'calculated_on': audit['date'],
        'status': 'Calculated',
        'heading': 'Probability',
        'display': audit['selected_comparison']['display'],
        'summary': audit['selected_comparison']['explanation'],
        'research_insight': {
            'status': 'Open research',
            'quote': 'We are exploring equilateral triangles, honeycomb theorem, and carbon structures in relationship to this Atlas for useful directions for computation in OXTR research.',
        },
        'method': {
            'id': 'uniform-alpha-shuffle-original-alignment-v1',
            'comparison_rule': "Preserve each record's original Gamma values, positions and Beta alignment.",
            'sampling': audit['model']['sampling'],
            'coordinate_system': audit['model']['positions'],
            'alpha_frequencies': {str(v): native['alpha']['residues'].count(v) for v in sorted(set(native['alpha']['residues']))},
            'gamma_indices': native['gamma']['alpha_indices'],
            'gamma_clock_positions': native['gamma']['clock_positions'],
            'gamma_values': native['gamma']['clockwise_values'],
            'beta_values': native['beta']['interval_residues'],
            'beta_start_interval_clock_positions': native['beta']['start_interval_clock_positions'],
            'beta_interior_indices': [gap['interior_indices'] for gap in native['beta']['intervals']],
            'beta_rule': audit['model']['beta_rule'],
            'allow_rotated_gamma_positions': False,
            'allow_reordered_gamma_values': False,
            'allow_rotated_beta_cycle': False,
            'allow_reversed_beta_cycle': False,
        },
        # Counts are strings so JavaScript consumers retain exact integers.
        'counts': {
            'all_arrangements': str(counts['all_distinct_alpha_arrangements']),
            'arrangements_given_gamma': str(counts['arrangements_given_exact_gamma']),
            'matching_arrangements': str(counts['exact_gamma_and_fixed_beta_phase']),
            'qualifying_triple_combinations': counts['qualifying_six_triple_combinations'],
        },
        'result': {
            'numerator': numerator, 'denominator': denominator,
            'fraction': result['exact_fraction'],
            'value': result['decimal'], 'one_in_approx': result['one_in_approx'],
        },
        'calculation': {
            'steps': [
                'Shuffle the same 24 Alpha values, keeping every value and its frequency.',
                'Place Gamma values 9, 3, 3, 9, 6, 6 at clock positions 24, 4, 8, 12, 16, 20.',
                'Sum the three Alpha values between each pair of Gamma nodes, excluding the endpoints, and reduce each sum modulo 9.',
                'Match Beta to 4, 8, 7, 5, 1, 2, starting with the interval from clock position 24 to 4.',
            ],
            'formula': '1,725,543 / 336,614,801,287,564,800 = 263 / 51,305,410,956,800',
            'counting_note': 'For the six Beta intervals, 198 combinations of three-value groups use exactly the available values. Counting the possible orders within each group gives 1,725,543 matching arrangements.',
            'verification_note': 'Three exact counting methods agree: remaining-value enumeration, complete three-value-group enumeration, and a separate count treating each card individually.',
        },
        'verification': {
            'calculation_version': audit['calculation_version'],
            'mathematical_input_sha256': audit['mathematical_input_sha256'],
            'checks': audit['verification'],
        },
        'interpretation': {
            'type': 'exact_configuration_shuffle_probability',
            'selection_adjustment_applied': False,
            'statistical_significance_status': native['research']['statistical_significance_status'],
            'biological_significance_status': native['research']['biological_significance_status'],
        },
        'files': {
            'data': 'm9-probability.json',
            'code': 'm9-probability.py',
        },
    }
    dataset = json.loads((data_dir / 'dataset.json').read_text())
    matching = [r for r in dataset['records'] if r['id'] == native['id']]
    assert len(matching) == 1
    aggregate = matching[0]
    for key in ('alpha', 'gamma', 'beta'):
        assert aggregate[key] == native[key]
    aggregate['probability'] = probability
    native['probability'] = probability
    write_json(data_dir / 'dataset.json', dataset)
    write_json(data_dir / 'm9.json', native)
    write_json(data_dir / 'm9-probability.json', probability)
    (data_dir / 'm9-probability.py').write_text(calculator.read_text())
    return probability


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, required=True)
    parser.add_argument('--calculator', type=Path, default=Path(__file__).resolve().parents[1] / 'probability/m9p24_exact_shuffle.py')
    args = parser.parse_args()
    result = sync(args.data_dir, args.calculator)
    print(f"M9 P24: {result['display']}; original Gamma and Beta alignment preserved.")
