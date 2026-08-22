#!/usr/bin/env python3
"""Assert that Gemini's approved Research copy appears verbatim and in order."""

from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "i  a m" / "research.html"


class MainTextParser(HTMLParser):
    BLOCKS = {
        "article", "blockquote", "dd", "div", "dl", "dt", "footer", "h1",
        "h2", "h3", "h4", "h5", "header", "li", "main", "p", "section",
        "span", "table", "tbody", "td", "th", "thead", "tr", "ul",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.in_main = True
            self.depth = 1
        elif self.in_main:
            self.depth += 1
        if self.in_main and tag in self.BLOCKS:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if self.in_main and tag in self.BLOCKS:
            self.parts.append(" ")
        if self.in_main:
            self.depth -= 1
            if tag == "main" and self.depth == 0:
                self.in_main = False

    def handle_data(self, data):
        if self.in_main:
            self.parts.append(data)


EXPECTED_IN_ORDER = [
    "RCT Title & Platform Identification",
    "Trial Title: The modul8 infinity Study: A 4-Arm Randomized Controlled Trial of Adaptive Sound and Visual Interventions for Rapid Stress Reduction",
    "Platform Lead: Universal Mind",
    "Vision Statement: modul8 infinity represents our underlying platform capability—exploring the frontier of real-time targeted gene expression and epigenetic modulation through prescription digital sound, visual bilateral stimulation, and neural entrainment.",
    "THE modul8 infinity STUDY",
    "A Double-Blind Randomized Controlled Trial Evaluating Non-Invasive Digital Neuro-Interventions",
    "Developed by Universal Mind",
    "Executive Summary & Clinical Mission",
    "The modul8 infinity trial evaluates a scalable, non-pharmacological digital intervention—combining 10-minute electronic music streams with embedded bilateral stimulation (EMDR), isochronic brain entrainment, and silent mantra—to measure immediate physiological and transcriptomic stress reduction.",
    "Our Mission",
    "To provide free, accessible, and evidence-backed digital support for individuals navigating anxiety and PTSD. Designed specifically to serve as an immediate bridge between scheduled therapy appointments and to complement existing medication regimens, this platform aims to increase equitable access to care and establish direct referral pathways to clinical support—ideally through strategic integration with national youth mental health networks such as Headspace Australia.",
    "1. Trial Architecture & Arm Design",
    "A 4-arm, double-blind, randomized controlled trial delivered seamlessly via the Universal Mind online platform. Automated platform routing ensures participants and researchers remain blinded to arm allocation.",
    "Arm A (Full Active modul8 infinity): Livestream Electronic Music + Active EMDR + Active Isochronic Entrainment + Silent Mantra",
    "Arm B (Visual Sham): Livestream Electronic Music + Static Visual (No EMDR) + Active Isochronic Entrainment + Silent Mantra",
    "Arm C (Auditory Sham): Livestream Electronic Music + Active EMDR + Flat Audio (No Entrainment) + Silent Mantra",
    "Arm D (Full Control Sham): Standard Livestream Music + Static Visual + Flat Audio (No active features)",
    "1.1 Phased Study Execution & Stage-Gated Rollout",
    "To optimize capital efficiency, ensure participant safety, and de-risk technical pipelines early, the study is structured across three adaptive, stage-gated phases. Advancement to each subsequent phase requires meeting defined operational and statistical milestones.",
    "Phase 1: Proof-of-Concept & Technical Validation (N=10)",
    "Focus: Validate digital platform delivery, rPPG signal integrity, buccal RNA extraction quality (Fisher Biotech), and local Python TELiS bioinformatic pipelines.",
    "Exploratory Sub-Study: Conduct the initial UNSW FabiLab scRNA-seq optical feasibility protocol on a subset (N=5–10).",
    "Gate Criteria: 100% pipeline completion, zero safety/adverse events, and confirmed RNA data quality.",
    "Phase 2: Signal Detection & Parameter Refinement (N=50)",
    "Focus: Evaluate initial statistical trends across all 4 arms for psychometric, autonomic (HRV), and candidate gene transcriptional shifts (OXTR, DRD2, NR3C1, etc.).",
    "Gate Criteria: Demonstrable effect-size or directional significance (p<0.05) in post-session autonomic parameters or target transcript shifts in Active Arm A versus Shams.",
    "Phase 3: Definitive Efficacy & Clinical Translation (N=100)",
    "Focus: Execute the fully powered double-blind RCT to establish definitive clinical efficacy for journal publication (Frontiers in Psychiatry / Nature Digital Medicine) and present data for Headspace AU integration.",
    "2. Target Cohorts",
    "Focusing on populations experiencing acute or elevated stress:",
    "Young Veterans: PTSD / acute anxiety screening",
    "Young Indigenous Australians: Community-guided support frameworks",
    "General Cohort: Presenting with elevated state anxiety",
    "3. Biometric Capture Engine (rPPG Integration)",
    "To ensure frictionless remote data collection, biometrics are captured non-invasively via contact-free remote Photoplethysmography (rPPG) integrated into the platform stream (licensed via the SaMD-certified Shen.AI engine).",
    "Capture Windows: Baseline pre-session (T minus 2 mins to T0), continuous passive stream during the 10-minute session, and immediate post-session (T plus 10 mins).",
    "Validated Biomarker Outputs:",
    "Cardiovascular: Heart Rate (HR), Blood Pressure (BP) estimation",
    "Autonomic Nervous System: Heart Rate Variability (HRV parameters: RMSSD, SDNN, LF/HF ratio) to track immediate parasympathetic activation (vagal tone)",
    "Hemodynamics & Respiratory: Oxygen Saturation (SpO2) and Baroreflex Sensitivity estimates",
    "4. Transcriptomic Protocol & mRNA Seq",
    "Primary Non-Invasive Specimen Collection: Buccal swab sampling using kits sourced from Fisher Biotech for simple, self-administered cellular collection without requiring invasive phlebotomy.",
    "Pipeline Optimization: Active exploration of lollipop-based microfluidic collection (such as CandyCollect) pending initial assay validation and feasibility prototyping with Garvan’s Kinghorn Centre for Clinical Genomics.",
    "Sampling Timeline & Gene Panel: Matched baseline (T0) and post-session (T plus 30 mins to T plus 60 mins) buccal swabs to capture immediate-early transcriptional responses and TFBS activity across candidate targets:",
    "Neuropeptides & Neurotransmitters: OXTR, DRD2, SLC6A4, NMDAR",
    "Immune & Stress Markers: IL6, DOCK2, NR3C1, CD38",
    "4.1 Downstream Bioinformatics: TELiS Promoter Mapping",
    "To determine the upstream cellular signaling pathways driven by the modul8 infinity intervention, raw transcriptomic data will undergo TELiS (Transcription Element Listening System) bioinformatic analysis.",
    "Mechanism: Rather than assessing gene expression in isolation, the TELiS computational pipeline scans the upstream promoter regions of differentially expressed genes against transcription factor binding motif (TFBM) databases (JASPAR/TRANSFAC).",
    "Time-Domain Profiling: Evaluates temporal waves of transcription factor activation (e.g., CREB, NF-κB, GR) controlling candidate neurotransmitter, neuropeptide, and immune targets across the T0 to T+30m window.",
    "Pipeline Architecture: Dry-lab execution via local Python bioinformatic pipelines developed in collaboration with Garvan’s Kinghorn Centre for Clinical Genomics, with potential academic cross-validation alongside UCLA Social Genomics Core research frameworks.",
    "4.2 Exploratory Sub-Study: Optical & Single-Cell Genomics (UNSW Collaboration)",
    "To establish proof-of-concept for non-invasive, computer-vision-based gene expression tracking, a nested exploratory sub-cohort (N=5–10) will evaluate single-cell transcriptomic dynamics alongside facial optical flow.",
    "Single-Cell Profiling (scRNA-seq): High-resolution single-cell transcriptomic profiling targeting OXTR expression and autofluorescence dynamics, executed via the UNSW FabiLab HyperSeq protocol.",
    "Optical & Hyperspectral Alignment: Synchronized alignment of facial region-of-interest (ROI) blood flow dynamics—captured via rPPG during the 10-minute intervention—against scRNA-seq ground truth.",
    "R&D Objective: To train downstream machine learning algorithms capable of detecting acute OXTRtranscriptional shifts through contact-free facial optical analysis.",
    "Hyperspectral CV Extraction Architecture: Passive facial frame recording during the stream is processed asynchronously via offline spectral reconstruction algorithms (extracting 31 hyperspectral bands from standard RGB optical frames) to train non-invasive ML models against UNSW single-cell transcriptomic ground truth without impacting stream performance.",
    "5. Intervention Technical Specifications",
    "Visual Bilateral Stimulation (EMDR): Grid layout featuring 10 or more animated GIFs combining high-contrast fashion-style animations by Xaviera Lopez with complex hexagonal geometry by Hexeosis, driven by controlled horizontal bilateral oscillation.",
    "Isochronic Acoustic Architecture: 7.38088 Hz Isochronic beat frequency paired with a 111.01 Hz carrier tone and a 528.088 Hz constant sine wave overlay.",
    "Silent Mantra: Contemplative silent mantra curated by Saajz Azura (Bless My Life), delivered via integrated on-screen visual/rhythmic cues.",
    "6. Media, Storytelling & Participant Engagement (Vogue Campaign)",
    "To capture the lived experience of trial participants and share the human narrative behind the research (for potential media features such as Vogue), the platform implements an optional, ethically isolated video journal pathway.",
    "Dual-Consent Model: Participation in the RCT clinical trial and participation in the media/video journal are entirely decoupled. Declining the video journal has zero impact on trial eligibility or clinical care.",
    "Media Production Compensation: Participants who opt to record short video entries (e.g., vertical short-form/reel updates) are compensated specifically for their time and creative production efforts, managed separately from clinical data collection.",
    "Editorial Authority & Trial Integrity: Participants retain final approval rights over any video footage prior to public release. Video recording actions occur strictly outside the immediate 10-minute intervention window to preserve double-blind parameters.",
    "7. Governance & Institutional Partners",
    "Institutional Status Note: The original 2019 trial framework was designed in discussion with key institutional leads (primarily Garvan Institute and early partnership discussions with Professor McGorry of Orygen). The protocol specifications below represent the updated 2026 digital and transcriptomic architecture currently being presented to partner institutions for formal re-engagement, HREC ethics approval, and operational onboarding.",
    "Platform & Protocol Lead: Universal Mind",
    "Principal Research & Genomics Lead (Proposed): Garvan Institute of Medical Research / Kinghorn Centre for Clinical Genomics (mRNA sequencing, local TELiS Python bioinformatic pipelines, TFBS analysis)",
    "Clinical & Youth Mental Health Alignment (Proposed): Orygen / Center of Excellence in Youth Mental Health (Clinical framework oversight and cohort-specific guidance)",
    "Single-Cell Genomics & Systems Biology Lead (Proposed): UNSW Sydney / FabiLab (scRNA-seq protocol execution and optical exploratory sub-study)",
    "Veterans Mental Health Advisory (Proposed): Phoenix Australia",
    "Ethics & Governance Oversight: The Ethics Centre / Designated HREC",
    "8. Budget Estimates & Capital Allocation",
    "In-Kind Platform Contribution: The modul8 infinity digital streaming engine, automated 4-arm sham delivery architecture, and web interface are 100% built and fully funded by Universal Mind ($0 software development cost to the trial).",
    "Garvan Trial Management Fee (15% trial operations & oversight) ~$4,000 AUD ~$10,000 AUD ~$18,000 AUD",
    "Shen.AI SaMD License (Full HRV, BP, SpO₂ unlock: €1,000/mo) ~$1,650 AUD (1 mo) ~$3,300 AUD (2 mos) ~$4,950 AUD (3 mos)",
    "mRNA Sequencing & Swab Kits (Fisher Biotech / Garvan chemistry) ~$10,000 AUD ~$50,000 AUD ~$100,000 AUD",
    "scRNA-seq Sub-Study (UNSW HyperSeq FabiLab protocol, N=5–10) ~$8,000 AUD (Integrated) (Integrated)",
    "Downstream TELiS Bioinformatics (Local Python / Garvan execution) ~$1,500 AUD ~$3,000 AUD ~$5,000 AUD",
    "Partner Research Contributions (Philanthropic allocations to Orygen/Phoenix) ~$2,500 AUD ~$5,000 AUD ~$10,000 AUD",
    "Music Broadcast Licensing (APRA AMCOS / PPCA digital stream) ~$1,500 AUD ~$2,500 AUD ~$4,000 AUD",
    "Ethics (HREC) & Governance (The Ethics Centre / Institutional review) ~$5,000 AUD ~$2,500 AUD ~$2,500 AUD",
    "Participant Honorariums / Incentives (Including optional video journals) ~$1,000 AUD ~$5,000 AUD ~$10,000 AUD",
    "ESTIMATED TOTAL DIRECT COSTS ~$35,150 AUD ~$81,300 AUD ~$154,450 AUD",
    "Note: Phase advancement is strictly contingent upon meeting defined safety, technical, and signal-detection milestones at each stage.",
    "8.1 Advanced R&D Add-On: Computer Vision & Hyperspectral ML Pipeline",
    "Funding Optionality: Funders may choose to support the core Clinical Trial (Module A) alone or include the Biophysical AI Add-On (Module B) to advance non-invasive, computer-vision-based gene expression tracking.",
    "Dual-Camera & Spectral Reconstruction Architecture (N=5–10 Sub-Cohort)",
    "Camera 1 (Consumer Baseline): Standard RGB camera capturing rPPG and facial ROI blood flow dynamics via Shen.AI.",
    "Camera 2 (Ground-Truth Calibration): High-resolution research hyperspectral camera (400–1000 nm continuous spectrum) capturing deep micro-capillary absorption profiles.",
    "Cross-Domain Time Calibration: Synchronized alignment of continuous optical absorption spectra, rPPG autonomic parameters, and UNSW scRNA-seq OXTR expression data across the 10-minute session.",
    "Module B Capital Budget (Exploratory AI Pipeline)",
    "Research Hyperspectral Camera Hardware ~$25,000 AUD Dual-camera research setup (400–1000 nm facial ROI capture)",
    "Spectral Reconstruction SDK / API Access ~$8,000 AUD Voyage81 / RGB-to-31-band hyperspectral translation licensing",
    "Computer Vision & ML Pipeline Engineering ~$15,000 AUD Asynchronous model training: Optical spectra ↔ scRNA OXTR ground truth",
    "TOTAL MODULE B R&D ADD-ON ~$48,000 AUD Unlocks proprietary IP for contact-free gene transcription inference via hyperspectral camera — and horizon to gene transcription inference via standard RGB smartphone camera",
    "Total Program Funding Summary",
    "Module A (Core Clinical RCT - Phase 1): ~$35,150 AUD | $22,350 USD",
    "Module B (Hyperspectral AI Add-On - Phase 1): ~$48,000 AUD | $34,500 USD",
    "Combined Phase 1 Launch Total: ~$83,150 AUD | $60,000 USD",
    "Founder & Operational Time: Platform engineering, clinical trial coordination, and data architecture provided by Universal Mind are contributed in-kind ($0 direct charge to the trial budget).",
]


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


parser = MainTextParser()
parser.feed(PAGE.read_text(encoding="utf-8"))
visible = normalize("".join(parser.parts))

cursor = 0
for expected in EXPECTED_IN_ORDER:
    needle = normalize(expected)
    position = visible.find(needle, cursor)
    if position < 0:
        raise SystemExit(f"Research copy mismatch after offset {cursor}: {needle}")
    cursor = position + len(needle)

print(f"Research copy fidelity: {len(EXPECTED_IN_ORDER)} exact fragments in approved order")
