#!/usr/bin/env python3
import re, json, os, sys, urllib.request, urllib.parse, time

BIOLOGY_FILE    = os.path.expanduser("~/pq1.txt")
GOVERNMENT_FILE = os.path.expanduser("~/pq2.txt")
KV_URL   = os.environ.get("KV_REST_API_URL", "")
KV_TOKEN = os.environ.get("KV_REST_API_TOKEN", "")

def kv_set(key, value):
    if not KV_URL or not KV_TOKEN:
        print("ERROR: KV credentials not set"); sys.exit(1)
    try:
        url = f"{KV_URL}/set/{urllib.parse.quote(key, safe='')}"
        data = json.dumps(value).encode("utf-8")
        req = urllib.request.Request(url, data=data,
            headers={"Authorization": f"Bearer {KV_TOKEN}", "Content-Type": "application/json"},
            method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except Exception as e:
        print(f"  KV error {key[:40]}: {e}"); return False

def clean(t):
    return re.sub(r'\s+', ' ', t).strip()

def parse_answer_key(text):
    answers = {}
    for num, letter in re.findall(r'(\d+)\s*[.)]\s*([A-D])', text):
        answers[int(num)] = letter
    return answers

def parse_section(section_text, year, subject):
    text = re.sub(r'\f', '\n', section_text)
    text = re.sub(r'www\.[^\s]+', '', text)
    full = re.sub(r'\s+', ' ', text)
    questions = []
    positions = []
    for m in re.finditer(r'(?<!\d)(\d{1,2})\.\s+(?=[A-Z])', full):
        num = int(m.group(1))
        if 1 <= num <= 60:
            positions.append((m.start(), num))
    seen = set()
    unique = []
    for pos, num in sorted(positions):
        if num not in seen:
            seen.add(num)
            unique.append((pos, num))
    for i, (sp, qnum) in enumerate(unique):
        ep = unique[i+1][0] if i+1 < len(unique) else len(full)
        block = full[sp:ep]
        if re.search(r'paper type|question paper type|which.*paper type', block, re.IGNORECASE):
            continue
        qm = re.match(r'\d{1,2}\.\s+(.*?)(?=\s+A\.\s)', block, re.DOTALL)
        if not qm: continue
        qt = clean(qm.group(1))
        if len(qt) < 10: continue
        oa = re.search(r'A\.\s+(.*?)(?=\s+B\.\s)', block, re.DOTALL)
        ob = re.search(r'B\.\s+(.*?)(?=\s+C\.\s)', block, re.DOTALL)
        oc = re.search(r'C\.\s+(.*?)(?=\s+D\.\s)', block, re.DOTALL)
        od = re.search(r'D\.\s+(.+?)(?=\s+\d{1,2}\.|$)', block, re.DOTALL)
        if not all([oa, ob, oc, od]): continue
        opts = {
            'A': clean(oa.group(1)),
            'B': clean(ob.group(1)),
            'C': clean(oc.group(1)),
            'D': clean(od.group(1)),
        }
        if any(len(v) < 1 for v in opts.values()): continue
        has_diag = bool(re.search(
            r'\bdiagram\b|\bfigure\b|use the|table above|chart above|graph above',
            qt, re.IGNORECASE))
        questions.append({
            'num': qnum, 'text': qt, 'options': opts,
            'year': year, 'subject': subject,
            'has_diagram': has_diag, 'answer': None
        })
    return questions

def extract(filepath, subject):
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        full = f.read()
    year_pat = rf'(20\d\d)\s+JAMB\s+{subject.upper()}\s+QUESTIONS'
    parts = re.split(year_pat, full)
    if len(parts) < 3:
        print(f"  WARNING: no year sections found for {subject}"); return []
    all_qs = []
    for i in range(1, len(parts)-1, 2):
        year    = int(parts[i])
        section = parts[i+1]
        ak_m = re.search(
            r'ANSWER KEYS?:?\s*\n(.*?)(?=\n{3,}|\f|20\d\d JAMB|$)',
            section, re.DOTALL | re.IGNORECASE)
        answers = parse_answer_key(ak_m.group(1)) if ak_m else {}
        clean_section = re.sub(
            r'ANSWER KEYS?:?.*$', '', section,
            flags=re.DOTALL | re.IGNORECASE)
        qs = parse_section(clean_section, year, subject)
        answered = 0
        for q in qs:
            if q['num'] in answers:
                q['answer'] = answers[q['num']]; answered += 1
        diag = sum(1 for q in qs if q['has_diagram'])
        print(f"  {year}: {len(qs)} questions, {answered} answered, {diag} diagram")
        all_qs.extend(qs)
    return all_qs

def load_to_kv(questions, subj_key):
    print(f"\nLoading {len(questions)} {subj_key} questions into KV...")
    ids = []; loaded = 0; failed = 0
    for q in questions:
        qid = f"pq:{subj_key}:{q['year']}:{q['num']:03d}"
        rec = {
            'id': qid, 'subject': q['subject'], 'year': q['year'],
            'num': q['num'], 'question': q['text'], 'options': q['options'],
            'answer': q['answer'], 'has_diagram': q['has_diagram'],
            'source': 'JAMB Official Past Questions', 'type': 'mcq',
        }
        if kv_set(f"question:{qid}", rec):
            ids.append(qid); loaded += 1
        else:
            failed += 1
        if loaded % 25 == 0:
            print(f"  ... {loaded} loaded")
            time.sleep(0.1)
    kv_set(f"qbank:index:{subj_key}", ids)
    kv_set(f"qbank:count:{subj_key}", loaded)
    answered = sum(1 for q in questions if q.get('answer'))
    print(f"  Done: {loaded} loaded, {failed} failed, {answered} with answers")
    return loaded

print("="*55)
print("JAMB Past Questions Extractor")
print("="*55)

if not KV_URL or not KV_TOKEN or "placeholder" in KV_URL:
    print("ERROR: Set real KV credentials before running")
    sys.exit(1)

total = 0

# Biology
print("\nExtracting Biology...")
bio_qs = extract(BIOLOGY_FILE, "BIOLOGY")
bio_text = [q for q in bio_qs if not q['has_diagram']]
print(f"Total: {len(bio_qs)} | Text-only: {len(bio_text)} | Diagram: {len(bio_qs)-len(bio_text)}")
total += load_to_kv(bio_text, "biology")

# Government
print("\nExtracting Government...")
gov_qs = extract(GOVERNMENT_FILE, "GOVERNMENT")
gov_text = [q for q in gov_qs if not q['has_diagram']]
print(f"Total: {len(gov_qs)} | Text-only: {len(gov_text)} | Diagram: {len(gov_qs)-len(gov_text)}")
total += load_to_kv(gov_text, "government")

# Save backup
os.makedirs(os.path.expanduser("~/companion/scripts"), exist_ok=True)
backup_path = os.path.expanduser("~/companion/scripts/questions_backup.json")
all_qs = bio_qs + gov_qs
with open(backup_path, 'w') as f:
    json.dump(all_qs, f, indent=2)

print(f"\n{'='*55}")
print(f"COMPLETE: {total} questions loaded into KV")
print(f"Backup: {backup_path}")
print(f"{'='*55}")
