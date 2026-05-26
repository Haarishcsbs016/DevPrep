import fitz  # PyMuPDF
import pdfplumber
import os
import re
import json
import google.generativeai as genai

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

def analyze_resume_ats(pdf_path, api_key=None):
    text = extract_text_from_pdf(pdf_path)
    
    if not text:
        return {
            "atsScore": 30,
            "missingKeywords": ["Text Extraction Failed"],
            "projectEnhancements": [],
            "feedback": "Failed to extract text from the PDF. Please check if it is a scanned image or corrupted file."
        }

    # If Gemini API Key is provided, use it!
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            Analyze the following resume text for ATS optimization. Provide a JSON response containing:
            1. 'atsScore' (integer 0-100)
            2. 'missingKeywords' (list of important keywords usually expected for engineering roles that are missing, e.g. Docker, Redis, CI/CD, Jest)
            3. 'projectEnhancements' (list of objects with keys 'before' and 'after' and 'impact' that rewrite weak phrases to strong action-oriented, metrics-driven descriptions)
            4. 'feedback' (overall professional critique text)

            Return ONLY raw JSON, with no markdown code blocks or backticks.

            Resume text:
            {text}
            """
            
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            # Remove markdown backticks if returned
            if clean_text.startswith("```"):
                clean_text = re.sub(r"^```json\s*", "", clean_text)
                clean_text = re.sub(r"^```\s*", "", clean_text)
                clean_text = re.sub(r"\s*```$", "", clean_text)
            
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini API analysis failed: {e}. Falling back to rule-based parser.")

    # Fallback/Rule-based parser
    # Match keywords
    tech_keywords = {
        "Docker": ["docker", "container"],
        "Kubernetes": ["kubernetes", "k8s"],
        "Redis": ["redis", "caching"],
        "AWS": ["aws", "amazon web", "cloud", "s3", "ec2"],
        "CI/CD": ["ci/cd", "github actions", "jenkins", "pipeline"],
        "TypeScript": ["typescript", "ts"],
        "Unit Testing": ["jest", "mocha", "cypress", "junit", "testing"],
        "SQL Optimization": ["indexing", "normalization", "query optimization", "sql"],
        "System Design": ["system design", "microservices", "scalability"],
        "GitHub Link": ["github.com/"]
    }

    found = []
    missing = []
    text_lower = text.lower()
    
    for kw, patterns in tech_keywords.items():
        if any(p in text_lower for p in patterns):
            found.append(kw)
        else:
            missing.append(kw)

    # Score calculation
    base_score = 50
    base_score += len(found) * 5
    if len(text) > 800:
        base_score += 10
    
    # Check for metrics/numbers in projects
    numbers = re.findall(r'\b\d+%\b|\b\d+x\b|\b\d+ms\b|\b\$\d+\b', text)
    if numbers:
        base_score += 10
    else:
        base_score -= 5

    ats_score = min(max(base_score, 10), 95)

    # Draft generic enhancements based on text
    enhancements = []
    if "react" in text_lower or "frontend" in text_lower:
        enhancements.append({
            "before": "Created a React website",
            "after": "Engineered a high-performance React application utilizing dynamic state management, boosting UI responsiveness by 30%.",
            "impact": "Improved user engagement and core web vitals."
        })
    if "backend" in text_lower or "api" in text_lower:
        enhancements.append({
            "before": "Made Express backend APIs",
            "after": "Designed and implemented robust Node.js/Express REST APIs with token authorization and index optimization, reducing server response times by 40%.",
            "impact": "Decreased latency from 350ms to 210ms."
        })
    if not enhancements:
        enhancements.append({
            "before": "Worked on college project",
            "after": "Collaborated in an agile team to design, code, and deploy an end-to-end web portal, resolving core concurrency bottlenecks.",
            "impact": "Secured project runner-up ranking."
        })

    feedback = "The resume lists technical competencies, but lacks measurable outcomes (metrics) and cloud deployment details. "
    if missing:
        feedback += f"Consider adding keywords like: {', '.join(missing[:4])}."
    
    return {
        "atsScore": ats_score,
        "missingKeywords": missing,
        "projectEnhancements": enhancements,
        "feedback": feedback
    }
