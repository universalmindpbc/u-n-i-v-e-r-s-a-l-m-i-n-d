import unittest
from research_topic_trust import assess_topic


def paper(number, category, trial=None, peer_reviewed=True):
    return {'id': str(number), 'doi': f'10.test/{number}',
            'studyDesignAssessment': {'category': category, 'peerReviewed': peer_reviewed},
            'evidence': {'trialId': trial}}


class TopicTrustTests(unittest.TestCase):
    def test_three_qualifying_studies(self):
        for category, score in [('double-blind-rct', 3), ('single-blind-rct', 2), ('peer-reviewed', 1)]:
            self.assertEqual(assess_topic([paper(i, category) for i in range(3)])['score'], score)

    def test_highest_threshold_reached(self):
        records = [paper(i, 'double-blind-rct') for i in range(2)]
        records += [paper(i, 'single-blind-rct') for i in range(2, 7)]
        self.assertEqual(assess_topic(records)['score'], 2)
        records.append(paper(7, 'double-blind-rct'))
        self.assertEqual(assess_topic(records)['score'], 3)

    def test_mixed_randomized_trials_reach_two_crosses(self):
        records = [paper(1, 'double-blind-rct'), paper(2, 'single-blind-rct'), paper(3, 'rct-open-label')]
        result = assess_topic(records)
        self.assertEqual(result['score'], 2)
        self.assertEqual(result['counts']['rct'], 3)

    def test_small_collection_ungraded(self):
        self.assertIsNone(assess_topic([paper(i, 'peer-reviewed') for i in range(2)])['score'])
        self.assertIsNone(assess_topic([])['score'])

    def test_repeated_papers_and_trials(self):
        one = paper(1, 'double-blind-rct')
        self.assertIsNone(assess_topic([one, one, one])['score'])
        repeated_trial = [paper(i, 'double-blind-rct', trial='NCT-SAME') for i in range(3)]
        assessment = assess_topic(repeated_trial)
        self.assertIsNone(assessment['score'])
        self.assertEqual(assessment['counts']['double-blind-rct'], 1)

    def test_unconfirmed_material_does_not_reach_minimum(self):
        for category in ['peer-reviewed', 'protocol', 'context']:
            records = [paper(i, category, peer_reviewed=False) for i in range(3)]
            self.assertIsNone(assess_topic(records)['score'])


if __name__ == '__main__':
    unittest.main()
