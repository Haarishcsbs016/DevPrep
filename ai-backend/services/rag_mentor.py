import sqlite3
import numpy as np
import os
import json
import re
import google.generativeai as genai
from services.resume_parser import extract_text_from_pdf

DB_PATH = "rag_vault.db"

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

def split_text_into_chunks(text, chunk_size=800, overlap=150):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def save_document(user_id, file_name, file_path, api_key=None):
    text = extract_text_from_pdf(file_path)
    if not text:
        return 0
        
    chunks = split_text_into_chunks(text)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Optional: Clear old entries for this user & file to avoid duplicates
    cursor.execute("DELETE FROM document_chunks WHERE user_id = ? AND file_name = ?", (user_id, file_name))
    
    for chunk in chunks:
        embedding_json = "[]"
        if api_key:
            try:
                genai.configure(api_key=api_key)
                # Compute embedding
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=chunk,
                    task_type="retrieval_document"
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
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if active_files:
        placeholders = ','.join('?' for _ in active_files)
        cursor.execute(f"""
            SELECT id, file_name, chunk_text, embedding_json 
            FROM document_chunks 
            WHERE user_id = ? AND file_name IN ({placeholders})
        """, (user_id, *active_files))
    else:
        cursor.execute("SELECT id, file_name, chunk_text, embedding_json FROM document_chunks WHERE user_id = ?", (user_id,))
        
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return []
        
    # Vector Search Mode
    if api_key:
        try:
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=query,
                task_type="retrieval_query"
            )
            query_embedding = result['embedding']
            
            scored_chunks = []
            for row in rows:
                row_id, file_name, text, emb_json = row
                emb = json.loads(emb_json)
                if emb:
                    sim = cosine_similarity(query_embedding, emb)
                    scored_chunks.append((sim, file_name, text))
            
            scored_chunks.sort(key=lambda x: x[0], reverse=True)
            return [{"file_name": c[1], "text": c[2], "score": float(c[0])} for c in scored_chunks[:limit]]
        except Exception as e:
            print(f"Vector search failed: {e}. Falling back to keyword search.")

    # Keyword Search Fallback (TF-IDF equivalent)
    query_words = set(re.findall(r'\w+', query.lower()))
    scored_chunks = []
    for row in rows:
        row_id, file_name, text, _ = row
        text_words = re.findall(r'\w+', text.lower())
        overlap = len(query_words.intersection(text_words))
        score = overlap / (len(query_words) + 1.0)
        if score > 0:
            scored_chunks.append((score, file_name, text))
            
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    return [{"file_name": c[1], "text": c[2], "score": float(c[0])} for c in scored_chunks[:limit]]

def answer_query(user_id, query, api_key=None, active_files=None):
    relevant_chunks = search_documents(user_id, query, api_key, active_files=active_files)
    
    context = ""
    sources = []
    for c in relevant_chunks:
        context += f"--- Chunk from {c['file_name']} ---\n{c['text']}\n\n"
        if c['file_name'] not in sources:
            sources.append(c['file_name'])
            
    if not context:
        context = "No relevant document notes uploaded or found."
        
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            You are DevPrep AI, a placement prep mentor. Answer the student's question based on the provided notes context extracted from their uploaded PDF files.
            Ensure your response is highly specific to the context documents provided. 
            If the answer is found in the notes, cite details from the notes.
            If the answer is not found in the notes, you may answer using your general placement expertise, but explicitly state that you are using general knowledge because it is not in the uploaded documents.
            
            Context:
            {context}
            
            Question:
            {query}
            """
            
            response = model.generate_content(prompt)
            return {
                "answer": response.text.strip(),
                "sources": sources,
                "chunks": [{"file_name": c["file_name"], "text": c["text"]} for c in relevant_chunks]
            }
        except Exception as e:
            print(f"Gemini answer failed: {e}")

    # Fallback/Offline answer builder
    answer_text = ""
    if relevant_chunks:
        query_words = [w.lower() for w in re.findall(r'\w+', query) if len(w) > 3]
        if not query_words:
            query_words = [w.lower() for w in re.findall(r'\w+', query)]
            
        sentences_matched = []
        for c in relevant_chunks:
            sentences = re.split(r'(?<=[.!?])\s+', c['text'])
            for sentence in sentences:
                sentence_lower = sentence.lower()
                match_count = sum(1 for qw in query_words if qw in sentence_lower)
                if match_count > 0:
                    sentences_matched.append((match_count, sentence.strip()))
                    
        sentences_matched.sort(key=lambda x: x[0], reverse=True)
        
        seen = set()
        unique_sentences = []
        for count, s in sentences_matched:
            if s.lower() not in seen and len(s) > 12:
                seen.add(s.lower())
                unique_sentences.append(s)
                if len(unique_sentences) >= 5:
                    break
                    
        if unique_sentences:
            answer_text = "Based on the matching sections found in your notes:\n\n"
            for s in unique_sentences:
                answer_text += f"• {s}\n"
        else:
            answer_text = f"I found some passages matching your query in the documents:\n\n"
            for idx, c in enumerate(relevant_chunks[:2]):
                excerpt = c['text'][:300] + ("..." if len(c['text']) > 300 else "")
                answer_text += f"[Passage {idx+1} from {c['file_name']}]:\n\"{excerpt}\"\n\n"
    else:
        answer_text = "I couldn't find any relevant details in your uploaded notes. Please upload PDF study guides or documents in the Vault first!"

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
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
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
            """
            
            response = model.generate_content(prompt)
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
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            Extract exactly 5-8 key technical terms or core concepts from the following study materials context.
            For each concept, provide a concise definition and a brief description of its significance for technical placements.
            
            Context:
            {context}
            
            Return ONLY a raw JSON array. Do NOT wrap the JSON in markdown code blocks.
            Each object must have these exact keys:
            - "concept": string (name of the concept)
            - "definition": string (concise definition)
            - "significance": string (why this is important for technical placement prep)
            """
            
            response = model.generate_content(prompt)
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
