import sqlite3
import numpy as np
import os
import json
import re
from collections import Counter
import google.generativeai as genai
from services.resume_parser import extract_text_from_pdf

DB_PATH = "rag_vault.db"

# Retrieval and chunking defaults tuned for study-note QA.
DEFAULT_CHUNK_SIZE = 260
DEFAULT_CHUNK_OVERLAP = 60
MIN_KEYWORD_SCORE = 0.02
MIN_COMBINED_SCORE = 0.04

STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "am",
    "of", "to", "in", "on", "at", "for", "from", "with", "without", "by", "as",
    "and", "or", "if", "then", "than", "so", "that", "this", "these", "those",
    "it", "its", "into", "about", "over", "under", "up", "down", "out", "off",
    "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
    "can", "could", "should", "would", "may", "might", "must", "will", "shall",
    "do", "does", "did", "done", "have", "has", "had", "having", "i", "you",
    "we", "they", "he", "she", "them", "his", "her", "our", "your", "their",
    "me", "my", "mine", "us", "ours", "yours", "theirs", "please", "explain",
    "tell", "give", "show", "notes", "note", "pdf", "file", "document"
}

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            file_name TEXT,
            chunk_text TEXT,
            embedding_json TEXT
        )
    """)
    conn.commit()
    conn.close()

# Initialize database
init_db()

def split_text_into_chunks(text, chunk_size=DEFAULT_CHUNK_SIZE, overlap=DEFAULT_CHUNK_OVERLAP):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def tokenize(text):
    raw_tokens = re.findall(r"[a-zA-Z0-9_]+", (text or "").lower())
    return [t for t in raw_tokens if t not in STOP_WORDS and len(t) > 1]

def _is_broad_query(query):
    q = (query or "").lower()
    broad_markers = ["summary", "summarize", "overview", "high level", "key points", "main points"]
    return any(marker in q for marker in broad_markers)

def _is_file_explanation_query(query):
    q = (query or "").lower()
    patterns = [
        r"\bbrief\b",
        r"\bexplain(?:ation)?\b",
        r"\bsummar(?:y|ize)\b",
        r"\bwhat(?:'s| is| does)?\s+this\s+.*\b(file|pdf|document|notes?)\b.*\btell(?:s)?\s+us\b",
        r"\bwhat\s+does\s+this\s+.*\b(file|pdf|document|notes?)\b\s+contain\b",
        r"\bwhat\s+is\s+in\s+this\s+.*\b(file|pdf|document|notes?)\b",
        r"\babout\s+this\s+file\b",
        r"\btell\s+me\s+about\b",
        r"\bgive\s+me\s+(?:a\s+)?brief\b",
        r"\bdescribe\b",
    ]
    return any(re.search(pattern, q) for pattern in patterns)

def keyword_score(query_tokens, text):
    if not query_tokens:
        return 0.0

    text_tokens = tokenize(text)
    if not text_tokens:
        return 0.0

    q_counter = Counter(query_tokens)
    t_counter = Counter(text_tokens)
    q_set = set(query_tokens)

    unique_overlap = len(q_set.intersection(t_counter.keys())) / max(len(q_set), 1)
    weighted_overlap = sum(min(t_counter[token], q_counter[token]) for token in q_counter) / max(sum(q_counter.values()), 1)

    query_text = " ".join(query_tokens)
    phrase_bonus = 0.12 if query_text and query_text in (text or "").lower() else 0.0

    score = (0.65 * unique_overlap) + (0.35 * weighted_overlap) + phrase_bonus
    return float(min(score, 1.0))

def _best_sentences(query, chunks, limit=6):
    query_tokens = tokenize(query)
    candidate_sentences = []
    for c in chunks:
        file_name = c.get("file_name", "Unknown")
        text = c.get("text", "")
        for sentence in re.split(r'(?<=[.!?])\s+', text):
            s = sentence.strip()
            if len(s) < 20:
                continue
            sentence_tokens = tokenize(s)
            if not sentence_tokens:
                continue
            if query_tokens:
                overlap = len(set(query_tokens).intersection(sentence_tokens))
                phrase_bonus = 1 if " ".join(query_tokens) in s.lower() else 0
                score = (overlap * 3) + phrase_bonus + min(len(sentence_tokens), 20) * 0.01
            else:
                score = len(sentence_tokens) * 0.01
            candidate_sentences.append((score, s, file_name))

    candidate_sentences.sort(key=lambda x: (x[0], len(x[1])), reverse=True)

    unique = []
    seen = set()
    for score, sentence, file_name in candidate_sentences:
        lowered = sentence.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        unique.append((sentence, file_name))
        if len(unique) >= limit:
            break
    return unique

def _build_structured_offline_answer(query, relevant_chunks, sources):
    is_summary = _is_file_explanation_query(query) or _is_broad_query(query)

    if not relevant_chunks:
        return (
            "RAG Analysis Steps:\n"
            f"Step 1 - Query Understanding: {query}\n"
            "Step 2 - Retrieval: No relevant chunks were found in selected files.\n"
            "Step 3 - Grounded Answer: I could not find this in your selected files.\n"
            "Step 4 - Sources: None"
        )

    best = _best_sentences(query, relevant_chunks, limit=6 if is_summary else 5)
    evidence_lines = []
    for idx, (sentence, file_name) in enumerate(best, start=1):
        evidence_lines.append(f"- {sentence} [EVIDENCE {idx} | {file_name}]")

    if not evidence_lines:
        evidence_lines = [
            f"- Retrieved material from {sources[0]} but could not extract clear full sentences."
        ]

    if is_summary:
        answer_intro = "This is a brief explanation of your uploaded file content based only on retrieved text."
    else:
        answer_intro = "This answer is grounded only in retrieved chunks from your selected files."

    source_line = ", ".join(sources) if sources else "None"
    return (
        "RAG Analysis Steps:\n"
        f"Step 1 - Query Understanding: {query}\n"
        f"Step 2 - Retrieval: {len(relevant_chunks)} chunk(s) retrieved from selected file scope.\n"
        f"Step 3 - Grounded Answer: {answer_intro}\n\n"
        "Evidence:\n"
        + "\n".join(evidence_lines)
        + "\n\n"
        f"Step 4 - Sources: {source_line}"
    )

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

def call_with_gemini_fallback(api_key, operation, callback):
    keys = normalize_api_keys(api_key)
    if not keys:
        raise ValueError(f"No Gemini API keys available for {operation}")

    last_error = None
    for key in keys:
        try:
            genai.configure(api_key=key)
            return callback(key)
        except Exception as e:
            last_error = e
            print(f"Gemini {operation} failed for one key: {e}")
            continue

    if last_error:
        raise last_error
    raise RuntimeError(f"Gemini {operation} failed without a concrete error")

def load_chunks(user_id, active_files=None, limit=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if active_files:
        placeholders = ','.join('?' for _ in active_files)
        query = f"""
            SELECT id, file_name, chunk_text, embedding_json
            FROM document_chunks
            WHERE user_id = ? AND file_name IN ({placeholders})
            ORDER BY id ASC
        """
        params = (user_id, *active_files)
    else:
        query = """
            SELECT id, file_name, chunk_text, embedding_json
            FROM document_chunks
            WHERE user_id = ?
            ORDER BY id ASC
        """
        params = (user_id,)

    if limit is not None:
        query += " LIMIT ?"
        params = (*params, limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

def save_document(user_id, file_name, file_path, api_key=None):
    text = extract_text_from_pdf(file_path)
    if not text:
        return 0
        
    chunks = split_text_into_chunks(text)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Optional: Clear old entries for this user & file to avoid duplicates
    cursor.execute("DELETE FROM document_chunks WHERE user_id = ? AND file_name = ?", (user_id, file_name))

    embedding_enabled = bool(normalize_api_keys(api_key))
    
    for chunk in chunks:
        embedding_json = "[]"
        if embedding_enabled:
            try:
                result = call_with_gemini_fallback(
                    api_key,
                    "embedding",
                    lambda _key: genai.embed_content(
                        model="models/text-embedding-004",
                        content=chunk,
                        task_type="retrieval_document"
                    )
                )
                embedding_json = json.dumps(result['embedding'])
            except Exception as e:
                print(f"Embedding generation failed: {e}")
                
        cursor.execute("""
            INSERT INTO document_chunks (user_id, file_name, chunk_text, embedding_json)
            VALUES (?, ?, ?, ?)
        """, (user_id, file_name, chunk, embedding_json))
        
    conn.commit()
    conn.close()
    return len(chunks)

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0
    return dot_product / (norm_v1 * norm_v2)

def search_documents(user_id, query, api_key=None, limit=3, active_files=None):
    if active_files is not None and len(active_files) == 0:
        return []

    rows = load_chunks(user_id, active_files=active_files)
    
    if not rows:
        return []
        
    query_tokens = tokenize(query)
    key_available = bool(normalize_api_keys(api_key))

    # 1) Attempt vector scoring when possible.
    vector_scores = {}
    if key_available:
        try:
            result = call_with_gemini_fallback(
                api_key,
                "query embedding",
                lambda _key: genai.embed_content(
                    model="models/text-embedding-004",
                    content=query,
                    task_type="retrieval_query"
                )
            )
            query_embedding = result["embedding"]

            for row_id, _file_name, _text, emb_json in rows:
                try:
                    emb = json.loads(emb_json or "[]")
                except json.JSONDecodeError:
                    emb = []
                if emb:
                    vector_scores[row_id] = float(cosine_similarity(query_embedding, emb))
        except Exception as e:
            print(f"Vector search failed: {e}. Continuing with keyword search.")

    # 2) Score all rows with keyword matching, then combine with vector score if available.
    scored_chunks = []
    for row_id, file_name, text, _emb_json in rows:
        k_score = keyword_score(query_tokens, text)
        v_score = vector_scores.get(row_id)

        if v_score is None:
            combined = k_score
            threshold = MIN_KEYWORD_SCORE
        else:
            combined = (0.65 * v_score) + (0.35 * k_score)
            threshold = MIN_COMBINED_SCORE

        if _is_broad_query(query):
            threshold *= 0.5

        if combined >= threshold:
            scored_chunks.append((combined, file_name, text, v_score, k_score))

    # If strict filtering yields nothing, do not hallucinate relevance.
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top = scored_chunks[:limit]
    return [
        {
            "file_name": item[1],
            "text": item[2],
            "score": float(item[0]),
            "vector_score": None if item[3] is None else float(item[3]),
            "keyword_score": float(item[4]),
        }
        for item in top
    ]

def answer_query(user_id, query, api_key=None, active_files=None):
    summary_intent = _is_broad_query(query) or _is_file_explanation_query(query)
    relevant_chunks = search_documents(user_id, query, api_key, limit=8, active_files=active_files)

    if summary_intent and active_files and len(relevant_chunks) < 2:
        fallback_rows = load_chunks(user_id, active_files=active_files, limit=20)
        relevant_chunks = [
            {"file_name": file_name, "text": text, "score": 0.0}
            for _, file_name, text, _ in fallback_rows
        ]
    
    context = ""
    sources = []
    for idx, c in enumerate(relevant_chunks, start=1):
        context += f"[EVIDENCE {idx}] Source: {c['file_name']}\n{c['text']}\n\n"
        if c['file_name'] not in sources:
            sources.append(c['file_name'])
            
    if not context:
        context = "No relevant document notes uploaded or found."
        
    if api_key:
        try:
            if summary_intent and relevant_chunks:
                summarized_context = "\n\n".join(
                    [f"[EVIDENCE {idx}] Source: {c['file_name']}\n{c['text']}" for idx, c in enumerate(relevant_chunks, start=1)]
                )
                response = call_with_gemini_fallback(
                    api_key,
                    "summary generation",
                    lambda _key: genai.GenerativeModel('gemini-1.5-flash').generate_content(f"""
You are DevPrep AI RAG Mentor.

The user is asking for a brief explanation or summary of the selected file(s).
Use ONLY the evidence below. Do not say retrieval failed if evidence is present.

Return in this exact format:
RAG Analysis Steps:
Step 1 - Query Understanding: one short line.
Step 2 - Retrieval: say that selected-file chunks were used for summary mode.
Step 3 - Grounded Answer: 3-8 sentences explaining the file in simple language, with evidence IDs.
Evidence:
- 2-6 bullets with facts from the file, each ending in [EVIDENCE n | file_name]
Step 4 - Sources: comma-separated file names.

Evidence:
{summarized_context}

Query:
{query}
""")
                )
                return {
                    "answer": response.text.strip(),
                    "sources": sources,
                    "chunks": [{"file_name": c["file_name"], "text": c["text"]} for c in relevant_chunks]
                }

            response = call_with_gemini_fallback(
                api_key,
                "answer generation",
                lambda _key: genai.GenerativeModel('gemini-1.5-flash').generate_content(f"""
You are DevPrep AI RAG Mentor.

Hard rules:
1) Use ONLY the evidence blocks below.
2) Do NOT invent facts that are not present in evidence.
3) If the answer is not present in evidence, explicitly say: "I could not find this in your selected files." 
4) Every factual claim must cite evidence IDs like [EVIDENCE 2].
5) Mention source file names from the evidence.
6) Keep the response in explicit RAG steps.

Selected-file evidence:
{context}

Student question:
{query}

Output format:
RAG Analysis Steps:
Step 1 - Query Understanding: one line.
Step 2 - Retrieval: one line (how many evidence blocks and what scope).
Step 3 - Grounded Answer: 3-8 sentences with inline evidence IDs.
Evidence:
- 2-6 bullets, each ending with [EVIDENCE n | file_name]
Step 4 - Sources: comma-separated file names.
""")
            )
            return {
                "answer": response.text.strip(),
                "sources": sources,
                "chunks": [{"file_name": c["file_name"], "text": c["text"]} for c in relevant_chunks]
            }
        except Exception as e:
            print(f"Gemini answer failed: {e}")

    # Fallback/Offline answer builder (structured, grounded).
    answer_text = _build_structured_offline_answer(query, relevant_chunks, sources)

    return {
        "answer": answer_text,
        "sources": sources,
        "chunks": [{"file_name": c["file_name"], "text": c["text"]} for c in relevant_chunks]
    }

def list_documents(user_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT file_name FROM document_chunks WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [row[0] for row in rows]

def delete_document(user_id, file_name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_chunks WHERE user_id = ? AND file_name = ?", (user_id, file_name))
    conn.commit()
    conn.close()

def train_rag_index(user_id, api_key=None, active_files=None):
    """
    Rebuilds retrieval embeddings for a user's indexed chunks.
    This is the closest "training" step in a classic RAG setup.
    """
    if not user_id:
        raise ValueError("user_id is required")

    keys = normalize_api_keys(api_key)
    if not keys:
        raise ValueError("Gemini API key is required to train embeddings")

    rows = load_chunks(user_id, active_files=active_files)
    if not rows:
        return {
            "status": "empty",
            "message": "No indexed chunks found for this user.",
            "files": [],
            "totalChunks": 0,
            "updatedChunks": 0,
            "failedChunks": 0,
        }

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    updated = 0
    failed = 0
    files = set()

    for row_id, file_name, chunk_text, _embedding_json in rows:
        files.add(file_name)
        try:
            result = call_with_gemini_fallback(
                api_key,
                "embedding retrain",
                lambda _key: genai.embed_content(
                    model="models/text-embedding-004",
                    content=chunk_text,
                    task_type="retrieval_document"
                )
            )
            embedding_json = json.dumps(result["embedding"])
            cursor.execute(
                "UPDATE document_chunks SET embedding_json = ? WHERE id = ?",
                (embedding_json, row_id)
            )
            updated += 1
        except Exception as e:
            failed += 1
            print(f"Embedding retrain failed for row {row_id}: {e}")

    conn.commit()
    conn.close()

    return {
        "status": "success" if updated > 0 else "failed",
        "message": "RAG index training completed.",
        "files": sorted(list(files)),
        "totalChunks": len(rows),
        "updatedChunks": updated,
        "failedChunks": failed,
    }

def generate_rag_quiz(user_id, active_files, api_key=None):
    if not active_files:
        return []
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    placeholders = ','.join('?' for _ in active_files)
    cursor.execute(f"""
        SELECT chunk_text FROM document_chunks 
        WHERE user_id = ? AND file_name IN ({placeholders})
        LIMIT 10
    """, (user_id, *active_files))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return []
        
    context = "\n\n".join([row[0] for row in rows])
    
    if api_key:
        try:
            response = call_with_gemini_fallback(
                api_key,
                "quiz generation",
                lambda _key: genai.GenerativeModel('gemini-3.5-flash').generate_content(f"""
            You are a technical interviewer. Based on the following study materials context, generate a multiple-choice quiz consisting of exactly 5 questions.
            The questions should test the user's comprehension of the materials.
            
            Context:
            {context}
            
            Return ONLY a raw JSON array containing exactly 5 question objects. Do NOT wrap the JSON in markdown code blocks (e.g. do not use ```json). Just return the valid JSON string.
            Each question object must have these exact keys:
            - "id": integer (1 to 5)
            - "question": string (the question text)
            - "options": list of 4 strings (multiple choice options)
            - "correctAnswer": string (must exactly match one of the options)
            - "explanation": string (brief explanation of why it is correct)
            """)
            )
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = re.sub(r'^```(?:json)?\n|```$', '', clean_text, flags=re.MULTILINE).strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Quiz generation failed: {e}")
            
    return [
        {
            "id": 1,
            "question": f"Self-study check: What is the main focus of the document(s): {', '.join(active_files)}?",
            "options": ["Core theory and formulas", "System architecture", "Code implementation details", "General overview of the topics"],
            "correctAnswer": "Core theory and formulas",
            "explanation": "Select this answer to confirm you are starting your active recall session!"
        }
    ]

def generate_rag_concepts(user_id, active_files, api_key=None):
    if not active_files:
        return []
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    placeholders = ','.join('?' for _ in active_files)
    cursor.execute(f"""
        SELECT chunk_text FROM document_chunks 
        WHERE user_id = ? AND file_name IN ({placeholders})
        LIMIT 12
    """, (user_id, *active_files))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return []
        
    context = "\n\n".join([row[0] for row in rows])
    
    if api_key:
        try:
            response = call_with_gemini_fallback(
                api_key,
                "concept extraction",
                lambda _key: genai.GenerativeModel('gemini-3.5-flash').generate_content(f"""
            Extract exactly 5-8 key technical terms or core concepts from the following study materials context.
            For each concept, provide a concise definition and a brief description of its significance for technical placements.
            
            Context:
            {context}
            
            Return ONLY a raw JSON array. Do NOT wrap the JSON in markdown code blocks.
            Each object must have these exact keys:
            - "concept": string (name of the concept)
            - "definition": string (concise definition)
            - "significance": string (why this is important for technical placement prep)
            """)
            )
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = re.sub(r'^```(?:json)?\n|```$', '', clean_text, flags=re.MULTILINE).strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Concepts generation failed: {e}")
            
    return [
        {
            "concept": "Self-Study Mode",
            "definition": "Active recall studying of the uploaded files.",
            "significance": "Essential for revision when API keys are not provided."
        }
    ]
