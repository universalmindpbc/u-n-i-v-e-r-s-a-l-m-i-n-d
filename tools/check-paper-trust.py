import unittest
from research_paper_trust import assess_paper

class PaperTrustTests(unittest.TestCase):
    def test_no_inherited_topic_rating(self):
        self.assertIsNone(assess_paper({'title':'Unverified source','sourceGrade':3,'archiveEntries':[{'sectionGrade':3}]})['score'])
    def test_rct_without_blinding(self):
        r=assess_paper({'title':'A randomized controlled trial','publicationTypes':['Randomized Controlled Trial','Journal Article']})
        self.assertEqual(r['score'],2)
        self.assertEqual(r['blinding'],'not-confirmed')
    def test_review_of_randomized_trials(self):
        r=assess_paper({'title':'Systematic review of randomized controlled trials','kind':'Journal article'})
        self.assertEqual(r['score'],1)
        self.assertIsNot(r['randomizedControlledTrial'],True)
    def test_protocol_and_unresolved_identity(self):
        for r in [{'title':'Study protocol for a double-blind randomized controlled trial','kind':'Journal article'}, {'title':'Double-blind randomized controlled trial','identityConflict':{'unresolved':True}}]:
            self.assertIsNone(assess_paper(r)['score'])
    def test_nonrandomized_title_is_not_a_randomized_trial(self):
        r=assess_paper({'title':'Open, Non-Randomised Trial of Acceptability','kind':'Journal article'})
        self.assertEqual(r['score'],1)
        self.assertIsNot(r['randomizedControlledTrial'],True)
    def test_mendelian_randomization_is_not_a_clinical_rct(self):
        r=assess_paper({'title':'Mendelian randomization analysis','design':'Mendelian randomization','kind':'Journal article'})
        self.assertEqual(r['score'],1)
    def test_publication_specific_indexing_fills_missing_display_design(self):
        for stars,blind in [(2,'single'),(3,'double')]:
            r=assess_paper({'title':'Clinical outcomes','stars':stars,'ratingBasis':'Indexed randomized trial with explicit masking.'})
            self.assertEqual((r['score'],r['blinding']),(stars,blind))
    def test_reclassified_rct_never_becomes_single_blind_on_rebuild(self):
        r={'title':'A randomized controlled trial','legacyArticleStars':1,'stars':2,'kind':'Journal article'}
        self.assertEqual(assess_paper(r)['blinding'],'not-confirmed')
    def test_structured_modality_review_overrides_legacy_double_blinding(self):
        r={'title':'Randomized comparison','stars':3,'studyDesignAssessment':{'category':'single-blind-rct','peerReviewed':True,'basis':'Only outcome assessors were blinded for psychotherapy.'}}
        self.assertEqual(assess_paper(r)['score'],2)

if __name__=='__main__': unittest.main()
