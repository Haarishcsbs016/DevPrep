import fitz  # PyMuPDF
import pdfplumber
import os
import re
import json
from collections import Counter
import google.generativeai as genai

GENERIC_STOPWORDS = {
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'were', 'will', 'have', 'has',
    'had', 'can', 'could', 'should', 'would', 'may', 'might', 'also', 'into', 'than', 'then', 'when', 'where', 'what',
    'which', 'their', 'there', 'them', 'they', 'our', 'out', 'about', 'over', 'under', 'been', 'being', 'using', 'use',
    'used', 'role', 'resume', 'job', 'description', 'responsible', 'responsibilities', 'experience', 'skills', 'project',
    'projects', 'team', 'work', 'worked', 'developed', 'development', 'including', 'within', 'across', 'through', 'more'
}

TECH_KEYWORD_GROUPS = {
    'Python': ['python'],
    'Java': ['java'],
    'JavaScript': ['javascript', 'js'],
    'TypeScript': ['typescript', 'ts'],
    'React': ['react'],
    'Next.js': ['next.js', 'nextjs', 'next'],
    'Node.js': ['node.js', 'nodejs', 'node'],
    'Express': ['express'],
    'SQL': ['sql', 'mysql', 'postgres', 'postgresql'],
    'MongoDB': ['mongodb', 'mongo'],
    'REST APIs': ['rest api', 'rest apis', 'api', 'apis'],
    'Git/GitHub': ['git', 'github'],
    'Docker': ['docker'],
    'CI/CD': ['ci/cd', 'github actions', 'jenkins', 'pipeline'],
    'Testing': ['test', 'testing', 'jest', 'mocha', 'cypress', 'pytest'],
    'System Design': ['system design', 'microservices', 'scalability'],
    'Data Structures': ['array', 'stack', 'queue', 'tree', 'graph', 'hashmap', 'linked list', 'binary tree'],
}

SECTION_HINTS = {
    'Contact': ['email', 'phone', 'linkedin', 'github', 'portfolio'],
    'Summary': ['summary', 'profile', 'objective'],
    'Experience': ['experience', 'internship', 'employment', 'work history'],
    'Projects': ['projects', 'project experience'],
    'Skills': ['skills', 'technical skills', 'core skills'],
    'Education': ['education', 'academic', 'qualification'],
}

def normalize_api_keys(api_key):
    if not api_key:
        return []

    if isinstance(api_key, (list, tuple, set)):
        raw_keys = [str(key) for key in api_key]
    else:
        raw_keys = re.split(r"[\n,;|]+", str(api_key))

    keys = []
    for raw_key in raw_keys:
        key = raw_key.strip()
        if key and key not in keys:
            keys.append(key)
    return keys

def call_with_gemini_fallback(api_key, callback):
    keys = normalize_api_keys(api_key)
    if not keys:
        raise ValueError("No Gemini API keys available")

    last_error = None
    for key in keys:
        try:
            genai.configure(api_key=key)
            return callback(key)
        except Exception as e:
            last_error = e
            print(f"Gemini analysis failed for one key: {e}")

    if last_error:
        raise last_error
    raise RuntimeError("Gemini analysis failed without a concrete error")

def grade_from_score(score):
    if score >= 90:
        return 'A+'
    if score >= 80:
        return 'A'
    if score >= 70:
        return 'B'
    if score >= 60:
        return 'C'
    if score >= 50:
        return 'D'
    return 'F'

def extract_text_from_pdf(pdf_path):
    text = ""
    # Try PyMuPDF (faster)
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"PyMuPDF failed: {e}. Trying pdfplumber...")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    val = page.extract_text()
                    if val:
                        text += val + "\n"
        except Exception as ex:
            print(f"pdfplumber failed: {ex}")
    return text.strip()

def extract_resume_text(pdf_path=None, resume_text=None):
    if resume_text and resume_text.strip():
        return resume_text.strip(), 'text'

    if pdf_path:
        return extract_text_from_pdf(pdf_path), 'pdf'

    return '', 'text'

def extract_keywords(text, limit=12):
    tokens = re.findall(r'[A-Za-z][A-Za-z0-9+.#/-]{1,}', text.lower())
    cleaned = [token for token in tokens if token not in GENERIC_STOPWORDS and len(token) > 2]
    ranked = Counter(cleaned)
    return [word for word, _ in ranked.most_common(limit)]

def keyword_presence_score(text_lower, keywords):
    if not keywords:
        return 0, []

    matches = []
    found = 0
    for keyword in keywords:
        keyword_lower = keyword.lower()
        if keyword_lower in text_lower:
            found += 1
            matches.append(keyword)
    score = int((found / max(len(keywords), 1)) * 100)
    return score, matches

def detect_section_scores(text):
    lower = text.lower()
    sections = []

    contact_score = 0
    if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', text):
        contact_score += 40
    if re.search(r'\b(\+?\d[\d\s().-]{8,}\d)\b', text):
        contact_score += 30
    if 'github.com' in lower or 'linkedin.com' in lower or 'portfolio' in lower:
        contact_score += 30
    sections.append({
        'section': 'Contact',
        'score': min(contact_score, 100),
        'notes': 'Contact links and identifiers detected' if contact_score else 'Add email, phone, and profile links'
    })

    for section_name, hints in SECTION_HINTS.items():
        if section_name == 'Contact':
            continue
        score = 0
        for hint in hints:
            if hint in lower:
                score += 50
        if section_name == 'Projects' and re.search(r'\b(project|built|designed|developed|implemented)\b', lower):
            score += 35
        if section_name == 'Experience' and re.search(r'\b(intern|internship|engineer|developer|analyst|associate)\b', lower):
            score += 30
        sections.append({
            'section': section_name,
            'score': min(score, 100),
            'notes': 'Section detected' if score else f'Add a clear {section_name.lower()} section'
        })

    return sections

def build_rule_based_analysis(text, job_description=None, source_type='pdf'):
    text_lower = text.lower()
    job_description = job_description or ''

    sections = detect_section_scores(text)
    section_score_avg = int(sum(item['score'] for item in sections) / max(len(sections), 1))

    job_keywords = extract_keywords(job_description, limit=14) if job_description.strip() else []
    combined_keywords = []
    for keyword in list(TECH_KEYWORD_GROUPS.keys()) + job_keywords:
        if keyword not in combined_keywords:
            combined_keywords.append(keyword)

    keyword_score, matched_keywords = keyword_presence_score(text_lower, combined_keywords)
    job_alignment_score, matched_job_keywords = keyword_presence_score(text_lower, job_keywords)

    metrics_bonus = 10 if re.search(r'\b\d+%\b|\b\d+x\b|\b\d+\+\b|\b\$\d+\b', text) else 0
    length_bonus = 10 if len(text) > 1200 else 0

    ats_score = int(
        (section_score_avg * 0.30) +
        (keyword_score * 0.35) +
        (job_alignment_score * 0.20) +
        metrics_bonus +
        length_bonus
    )
    ats_score = min(max(ats_score, 10), 100)

    missing_keywords = [kw for kw in combined_keywords if kw.lower() not in text_lower]
    risks = []
    if section_score_avg < 55:
        risks.append('Missing or weak ATS-friendly sections such as summary, skills, or projects')
    if not re.search(r'\b\d+%\b|\b\d+x\b|\b\d+\+\b|\b\$\d+\b', text):
        risks.append('No measurable impact or metrics found in resume bullets')
    if job_description and job_alignment_score < 50:
        risks.append('Resume does not align strongly with the supplied job description keywords')
    if len(missing_keywords) > 8:
        risks.append('Too many keywords are missing for strong ATS matching')
    if not risks:
        risks.append('Resume has decent structure but can still be optimized for stronger keyword matching')

    recommendations = []
    if not re.search(r'\b\d+%\b|\b\d+x\b|\b\d+\+\b|\b\$\d+\b', text):
        recommendations.append('Rewrite project bullets with measurable outcomes, percentages, or scale')
    if missing_keywords:
        recommendations.append(f"Add high-priority keywords: {', '.join(missing_keywords[:5])}")
    if job_description and matched_job_keywords:
        recommendations.append(f"Mirror language from the job description around: {', '.join(matched_job_keywords[:4])}")
    if not recommendations:
        recommendations.append('Tune headline, summary, and project bullets to match the target role more closely')

    enhancements = []
    if 'react' in text_lower or 'frontend' in text_lower:
        enhancements.append({
            'before': 'Created a React website',
            'after': 'Built and optimized a responsive React application with structured state management and reusable components.',
            'impact': 'Improved maintainability and user experience.'
        })
    if 'backend' in text_lower or 'api' in text_lower:
        enhancements.append({
            'before': 'Made Express backend APIs',
            'after': 'Designed and shipped scalable Node.js/Express APIs with validation, error handling, and maintainable endpoints.',
            'impact': 'Improved backend reliability and API quality.'
        })
    if not enhancements:
        enhancements.append({
            'before': 'Worked on a college project',
            'after': 'Delivered an end-to-end project with clear ownership, technical execution, and measurable outcomes.',
            'impact': 'Makes the bullet more ATS-friendly and impact-focused.'
        })

    feedback = [
        f"ATS style score: {ats_score}/100 ({grade_from_score(ats_score)} grade).",
        'Section structure is ' + ('strong' if section_score_avg >= 70 else 'moderate' if section_score_avg >= 50 else 'weak') + '.',
        'Keyword matching is ' + ('good' if keyword_score >= 70 else 'partial' if keyword_score >= 40 else 'light') + '.',
    ]
    if job_description:
        feedback.append('A job description was supplied, so the analysis is aligned against those target keywords.')

    return {
        'atsScore': ats_score,
        'grade': grade_from_score(ats_score),
        'sectionScores': sections,
        'missingKeywords': missing_keywords,
        'atsRisks': risks,
        'rewriteRecommendations': recommendations,
        'projectEnhancements': enhancements,
        'matchedKeywords': matched_keywords,
        'jobKeywords': job_keywords,
        'feedback': ' '.join(feedback),
        'sourceType': source_type
    }

def analyze_resume_ats(pdf_path=None, resume_text=None, job_description=None, api_key=None):
    text, source_type = extract_resume_text(pdf_path=pdf_path, resume_text=resume_text)

    if not text:
        return {
            'atsScore': 30,
            'grade': 'F',
            'sectionScores': [],
            'missingKeywords': ['Text Extraction Failed'],
            'atsRisks': ['Failed to extract text from the uploaded file or pasted text'],
            'rewriteRecommendations': ['Try uploading a selectable PDF or paste the resume text directly'],
            'projectEnhancements': [],
            'feedback': 'Failed to extract text from the resume. Please upload a selectable PDF or paste the resume text directly.',
            'sourceType': source_type
        }

    if api_key:
        try:
            def generate_with_key(_key):
                model = genai.GenerativeModel('gemini-3.5-flash')
                prompt = f"""
                Analyze the resume text for ATS optimization. Return ONLY raw JSON with these keys:
                - atsScore: integer 0-100
                - grade: one of A+, A, B, C, D, F
                - sectionScores: list of objects with section, score, notes
                - missingKeywords: list of keywords missing from the resume
                - atsRisks: list of ATS risks
                - rewriteRecommendations: list of actionable rewrite suggestions
                - projectEnhancements: list of objects with before, after, impact
                - matchedKeywords: list of keywords found
                - jobKeywords: list of keywords extracted from the job description
                - feedback: short overall critique

                If a job description is provided, prioritize alignment to it.

                Resume text:
                {text}

                Job description:
                {job_description or 'Not provided'}
                """
                response = model.generate_content(prompt)
                clean_text = response.text.strip()
                if clean_text.startswith('```'):
                    clean_text = re.sub(r'^```json\s*', '', clean_text)
                    clean_text = re.sub(r'^```\s*', '', clean_text)
                    clean_text = re.sub(r'\s*```$', '', clean_text)
                result = json.loads(clean_text)
                result['sourceType'] = source_type
                return result

            return call_with_gemini_fallback(api_key, generate_with_key)
        except Exception as e:
            print(f"Gemini API analysis failed: {e}. Falling back to rule-based parser.")

    return build_rule_based_analysis(text, job_description=job_description, source_type=source_type)
