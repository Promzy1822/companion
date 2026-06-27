#!/usr/bin/env python3
"""
JAMB Past Questions Extractor
Extracts Biology (2010-2018) and Government (2010-2018) questions
from PDF text dumps and loads them into Vercel KV via the API.

Usage: python3 scripts/extract_questions.py
"""

import re
import json
import os
import sys
import urllib.request
import urllib.parse

# ── Configuration ─────────────────────────────────────────────────────────────
BIOLOGY_FILE    = os.path.expanduser("~/pq1.txt")
GOVERNMENT_FILE = os.path.expanduser("~/pq2.txt")

# These come from your .env.local
KV_REST_API_URL   = os.environ.get("KV_REST_API_URL", "")
KV_REST_API_TOKEN = os.environ.get("KV_REST_API_TOKEN", "")

# ── KV helpers ────────────────────────────────────────────────────────────────
def kv_set(key: str, value: dict) -> bool:
    """Store a value in Vercel KV via REST API"""
    if not KV_REST_API_URL or not KV_REST_API_TOKEN:
        print("ERROR: KV_REST_API_URL and KV_REST_API_TOKEN must be set")
        sys.exit(1)
    try:
        url     = f"{KV_REST_API_URL}/set/{urllib.parse.quote(key)}"
        payload = json.dumps(value).encode("utf-8")
        req     = urllib.request.Request(
            url,
            data    = payload,
            headers = {
                "Authorization": f"Bearer {KV_REST_API_TOKEN}",
                "Content-Type":  "application/json",
            },
            method  = "POST",
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status == 200
    except Exception as e:
        print(f"  KV error for {key}: {e}")
        return False

def kv_lpush(key: str, value: str) -> bool:
    """Push to a KV list"""
    try:
        url     = f"{KV_REST_API_URL}/lpush/{urllib.parse.quote(key)}"
        payload = json.dumps(value).encode("utf-8")
        req     = urllib.request.Request(
            url,
            data    = payload,
            headers = {
                "Authorization": f"Bearer {KV_REST_API_TOKEN}",
                "Content-Type":  "application/json",
            },
            method  = "POST",
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status == 200
    except Exception as e:
        print(f"  KV lpush error: {e}")
        return False

# ── Text cleaner ──────────────────────────────────────────────────────────────
def clean(text: str) -> str:
    """Clean up text extracted from 2-column PDF layout"""
    # Collapse multiple spaces/newlines into single space
    text = re.sub(r'\s+', ' ', text)
    # Fix broken words (single char lines joined by pdftotext)
    text = text.strip()
    return text

# ── Answer key parser ─────────────────────────────────────────────────────────
def parse_answer_key(ak_text: str) -> dict:
    """Parse answer key text like '1. C 2. A 3. B ...' into {1:'C', 2:'A', ...}"""
    answers = {}
    # Match patterns like "1. C" or "1.C" or "1 C"
    pairs = re.findall(r'(\d+)\s*[.)]\s*([A-D])', ak_text)
    for num, letter in pairs:
        answers[int(num)] = letter
    return answers

# ── Core question parser ──────────────────────────────────────────────────────
def parse_year_section(raw_text: str, year: int, subject: str) -> list:
    """
    Parse a single year's questions from the raw PDF text.

    The PDF has a 2-column layout that pdftotext interleaves.
    We identify question blocks by their number prefix and
    reconstruct each question's text + options.
    """
    questions = []

    # Normalise line endings
    text = raw_text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove page markers
    text = re.sub(r'\f', '\n', text)
    text = re.sub(r'www\.toppers\.com\.ng', '', text)

    # Split into lines for processing
    lines = [l.strip() for l in text.split('\n')]
    full  = ' '.join(lines)  # full text for option extraction

    # Find all question start positions
    # Pattern: standalone number followed by question content
    q_starts = []
    for m in re.finditer(r'(?<!\d)(\d{1,2})\.\s+([A-Z])', full):
        num = int(m.group(1))
        if 1 <= num <= 60:  # JAMB has max 60 questions per paper
            q_starts.append((m.start(), num))

    # Deduplicate and sort
    seen_nums = set()
    unique_starts = []
    for pos, num in sorted(q_starts):
        if num not in seen_nums:
            seen_nums.add(num)
            unique_starts.append((pos, num))

    # Extract each question's raw block
    for i, (start_pos, q_num) in enumerate(unique_starts):
        end_pos = unique_starts[i+1][0] if i+1 < len(unique_starts) else len(full)
        block   = full[start_pos:end_pos]

        # Skip meta questions (paper type questions)
        if re.search(r'paper type|question paper type|which.*paper|paper.*given', block, re.IGNORECASE):
            continue

        # Extract question text (before first option A.)
        q_match = re.match(r'\d{1,2}\.\s+(.*?)(?=\s+A\.\s+)', block, re.DOTALL)
        if not q_match:
            continue
        q_text = clean(q_match.group(1))

        # Extract options A, B, C, D
        opt_a = re.search(r'A\.\s+(.*?)(?=\s+B\.\s+)', block, re.DOTALL)
        opt_b = re.search(r'B\.\s+(.*?)(?=\s+C\.\s+)', block, re.DOTALL)
        opt_c = re.search(r'C\.\s+(.*?)(?=\s+D\.\s+)', block, re.DOTALL)
        opt_d = re.search(r'D\.\s+(.*?)$',              block, re.DOTALL)

        if not all([opt_a, opt_b, opt_c, opt_d]):
            continue  # Skip incomplete questions

        options = {
            'A': clean(opt_a.group(1)),
            'B': clean(opt_b.group(1)),
            'C': clean(opt_c.group(1)),
            'D': clean(opt_d.group(1)),
        }

        # Skip if options are too short (likely parsing artifact)
        if any(len(v) < 1 for v in options.values()):
            continue

        # Check if question references a diagram
        has_diagram = bool(re.search(
            r'\bdiagram\b|\bfigure\b|\babove\b|\bbelow\b|use the|table above|chart|graph',
            q_text, re.IGNORECASE
        ))

        questions.append({
            'num':        q_num,
            'text':       q_text,
            'options':    options,
            'year':       year,
            'subject':    subject,
            'has_diagram': has_diagram,
            'answer':     None,  # filled in by answer key matcher
        })

    return questions

# ── Main extractor ────────────────────────────────────────────────────────────
def extract_subject(filepath: str, subject: str) -> list:
    """Extract all questions for a subject from the text dump"""
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        full_text = f.read()

    all_questions = []

    # Split into year sections
    # Pattern matches "2010 JAMB BIOLOGY QUESTIONS" etc.
    year_pattern = rf'(20\d\d)\s+JAMB\s+{subject.upper()}\s+QUESTIONS'
    parts        = re.split(year_pattern, full_text)

    # parts = [before_first, year1, section1, year2, section2, ...]
    if len(parts) < 3:
        print(f"  WARNING: Could not split {subject} by year. Check file.")
        return []

    year_sections = []
    for i in range(1, len(parts)-1, 2):
        year    = int(parts[i])
        section = parts[i+1]
        year_sections.append((year, section))

    print(f"\n{subject}: Found {len(year_sections)} year sections")

    for year, section in year_sections:
        # Find answer key within this section
        ak_match = re.search(
            r'ANSWER KEYS?:?\s*\n+(.*?)(?=\n\n\n|\f|20\d\d JAMB|$)',
            section,
            re.DOTALL | re.IGNORECASE
        )
        answers = {}
        if ak_match:
            answers = parse_answer_key(ak_match.group(1))

        # Remove answer key from section before parsing questions
        section_clean = re.sub(
            r'ANSWER KEYS?:?.*$', '', section, flags=re.DOTALL | re.IGNORECASE
        )

        # Parse questions
        qs = parse_year_section(section_clean, year, subject)

        # Assign answers
        answered = 0
        for q in qs:
            if q['num'] in answers:
                q['answer'] = answers[q['num']]
                answered += 1

        # Only include questions with answers (quality control)
        # For now include all — we'll mark unanswered ones
        all_questions.extend(qs)

        answered_count   = sum(1 for q in qs if q['answer'])
        diagram_count    = sum(1 for q in qs if q['has_diagram'])
        no_diagram_count = sum(1 for q in qs if not q['has_diagram'])

        print(f"  {year}: {len(qs)} questions "
              f"({answered_count} answered, "
              f"{diagram_count} with diagrams, "
              f"{no_diagram_count} text-only)")

    return all_questions

# ── KV loader ─────────────────────────────────────────────────────────────────
def load_to_kv(questions: list, subject_key: str):
    """Load questions into Vercel KV"""
    print(f"\nLoading {len(questions)} {subject_key} questions into KV...")

    loaded      = 0
    skipped     = 0
    no_answer   = 0
    subject_ids = []

    for q in questions:
        # Build unique ID
        qid = f"pq:{subject_key}:{q['year']}:{q['num']:03d}"

        # Build the question record
        record = {
            'id':         qid,
            'subject':    q['subject'],
            'year':       q['year'],
            'num':        q['num'],
            'question':   q['text'],
            'options':    q['options'],
            'answer':     q['answer'],   # correct letter e.g. "C"
            'has_diagram': q['has_diagram'],
            'source':     'JAMB Official Past Questions',
            'type':       'mcq',
        }

        # Store individual question
        ok = kv_set(f"question:{qid}", record)
        if ok:
            loaded += 1
            subject_ids.append(qid)
            if not q['answer']:
                no_answer += 1
        else:
            skipped += 1

        # Progress indicator
        if loaded % 50 == 0:
            print(f"  ... {loaded} loaded")

    # Store index of all IDs for this subject
    index_key = f"qbank:index:{subject_key}"
    kv_set(index_key, subject_ids)

    # Update total count
    kv_set(f"qbank:count:{subject_key}", len(subject_ids))

    print(f"  Done: {loaded} loaded, {skipped} failed, {no_answer} missing answers")
    return loaded

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("="*60)
    print("JAMB Past Questions Extractor")
    print("="*60)

    if not KV_REST_API_URL or not KV_REST_API_TOKEN:
        print("\nERROR: Set environment variables before running:")
        print("  export KV_REST_API_URL=your_url")
        print("  export KV_REST_API_TOKEN=your_token")
        print("\nGet these from Vercel Dashboard → Storage → your KV → .env.local")
        sys.exit(1)

    total_loaded = 0

    # ── Biology ───────────────────────────────────────────────────────────────
    if os.path.exists(BIOLOGY_FILE):
        bio_questions = extract_subject(BIOLOGY_FILE, "BIOLOGY")
        bio_text_only = [q for q in bio_questions if not q['has_diagram']]
        print(f"\nBiology total: {len(bio_questions)} questions")
        print(f"Text-only (Phase 1): {len(bio_text_only)}")
        print(f"Diagram questions (Phase 2): {len(bio_questions) - len(bio_text_only)}")
        n = load_to_kv(bio_text_only, "biology")
        total_loaded += n
    else:
        print(f"\nBiology file not found: {BIOLOGY_FILE}")

    # ── Government ────────────────────────────────────────────────────────────
    if os.path.exists(GOVERNMENT_FILE):
        gov_questions = extract_subject(GOVERNMENT_FILE, "GOVERNMENT")
        gov_text_only = [q for q in gov_questions if not q['has_diagram']]
        print(f"\nGovernment total: {len(gov_questions)} questions")
        print(f"Text-only (Phase 1): {len(gov_text_only)}")
        n = load_to_kv(gov_text_only, "government")
        total_loaded += n
    else:
        print(f"\nGovernment file not found: {GOVERNMENT_FILE}")

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print(f"COMPLETE: {total_loaded} questions loaded into KV")
    print("="*60)

    # ── Save local JSON backup ────────────────────────────────────────────────
    print("\nSaving local JSON backup...")
    all_qs = []
    if os.path.exists(BIOLOGY_FILE):
        all_qs += extract_subject(BIOLOGY_FILE, "BIOLOGY")
    if os.path.exists(GOVERNMENT_FILE):
        all_qs += extract_subject(GOVERNMENT_FILE, "GOVERNMENT")

    with open(os.path.expanduser("~/companion/scripts/questions_backup.json"), 'w') as f:
        json.dump(all_qs, f, indent=2)
    print("Backup saved to ~/companion/scripts/questions_backup.json")

if __name__ == "__main__":
    main()
