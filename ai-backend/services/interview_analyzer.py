import re
import json
import google.generativeai as genai

FILLER_WORDS = ["um", "uh", "like", "basically", "you know", "actually", "so", "ah"]

def analyze_speech_patterns(text):
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    total_words = len(words)
    
    filler_counts = {}
    total_fillers = 0
    for filler in FILLER_WORDS:
        count = len(re.findall(r'\b' + re.escape(filler) + r'\b', text_lower))
        if count > 0:
            filler_counts[filler] = count
            total_fillers += count

    # Determine speech speed heuristic (based on words count assuming ~30 sec response)
    # Average speech is ~130-150 words per minute.
    speed = "Normal"
    if total_words < 15:
        speed = "Too Short / Slow"
    elif total_words > 90:
        speed = "Too Fast"

    fluency_score = 100
    if total_words > 0:
        filler_ratio = total_fillers / total_words
        fluency_score = max(int(100 - (filler_ratio * 400)), 30)

    return {
        "fillerWords": [k for k in filler_counts.keys()],
        "fillerCount": total_fillers,
        "fluencyScore": fluency_score,
        "speakingSpeed": speed,
        "wordCount": total_words
    }

def generate_mock_questions(interview_type, company="General", target_role="Backend Developer", skills=[], api_key=None):
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            Generate exactly 3 professional interview questions for a {interview_type} mock interview.
            Target Company: {company}
            Target Role: {target_role}
            Skills: {', '.join(skills)}
            
            Return ONLY a raw JSON array of strings. Do not include markdown formatting or backticks.
            Example: ["Question 1", "Question 2", "Question 3"]
            """
            
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = re.sub(r"^```json\s*", "", clean_text)
                clean_text = re.sub(r"^```\s*", "", clean_text)
                clean_text = re.sub(r"\s*```$", "", clean_text)
            return json.loads(clean_text)
        except Exception as e:
            print(f"Failed to generate questions via Gemini: {e}")

    # Fallback/Offline Questions Generator
    if company.lower() == "amazon":
        if interview_type == "HR":
            return [
                "Tell me about a time when you had a conflict with a team member. How did you resolve it?",
                "Describe a situation where you had to make a decision without all the information you needed. What was the outcome?",
                "Why do you want to join Amazon, and how do you demonstrate Customer Obsession?"
            ]
        elif interview_type == "Technical":
            return [
                "How would you design a thread-safe cache system with LRU eviction policy?",
                "What is the difference between SQL and NoSQL database structures, and when would you use one over the other?",
                "Explain the time and space complexity of sorting an array using QuickSort in average and worst-case scenarios."
            ]
        else: # Coding
            return [
                "Write a function to find the lowest common ancestor (LCA) of two nodes in a Binary Tree.",
                "How would you solve the 'Merge k Sorted Lists' problem efficiently?",
                "Explain how you would write code to find the longest palindromic substring in a string."
            ]
    elif company.lower() == "tcs":
        return [
            "What are the pillars of Object-Oriented Programming (OOP) in Java?",
            "What is a primary key and a foreign key, and how do you perform a LEFT JOIN in SQL?",
            "Explain the difference between method overloading and method overriding."
        ]
    
    # General Default questions
    if interview_type == "HR":
        return [
            "Tell me about yourself and your career goals.",
            "What is your greatest technical strength, and what is a weakness you are actively trying to improve?",
            "Describe a project you worked on where you faced a significant bottleneck. How did you overcome it?"
        ]
    elif interview_type == "Technical":
        return [
            "Explain what REST APIs are and what makes them stateless.",
            "What is indexing in database management systems, and how does it speed up queries?",
            "Explain the concept of Virtual Memory and page faults in Operating Systems."
        ]
    else: # Coding
        return [
            "Explain the difference between Dynamic Programming and Memoization with an example.",
            "How would you check if a linked list has a cycle?",
            "What is recursion, and how can it cause stack overflow?"
        ]

def evaluate_interview_performance(questions_and_answers, interview_type, company="General", behavior_data=None, api_key=None):
    evaluated_questions = []
    
    overall_tech = 0
    overall_comm = 0
    overall_conf = 0
    
    # Process each question
    for idx, qa in enumerate(questions_and_answers):
        q_text = qa.get("question", "")
        a_text = qa.get("answer", "")
        
        # Analyze speech metrics
        speech_analysis = analyze_speech_patterns(a_text)
        
        score = 50
        feedback = "Answer logged."
        
        if api_key:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-3.5-flash')
                
                prompt = f"""
                You are a placement examiner. Grade the correctness of the answer for the question.
                Question: {q_text}
                Answer: {a_text}
                
                Respond with a JSON containing:
                1. 'score' (integer 0-100)
                2. 'feedback' (1-2 sentences of specific technical critique)
                
                Return ONLY raw JSON, no markdown formatting.
                """
                
                response = model.generate_content(prompt)
                clean = response.text.strip()
                if clean.startswith("```"):
                    clean = re.sub(r"^```json\s*", "", clean)
                    clean = re.sub(r"^```\s*", "", clean)
                    clean = re.sub(r"\s*```$", "", clean)
                data = json.loads(clean)
                score = data.get("score", 60)
                feedback = data.get("feedback", "Completed review.")
            except Exception as e:
                print(f"Gemini qa evaluation failed: {e}")
        else:
            # Basic keyword score builder
            word_count = speech_analysis["wordCount"]
            if word_count > 50:
                score = 80
                feedback = "Detailed answer provided with clear explanation of concepts."
            elif word_count > 15:
                score = 65
                feedback = "Conceptually correct, but could benefit from more detailed explanation or examples."
            else:
                score = 40
                feedback = "Response is too short. Try to elaborate on structural elements, methodologies, or time complexity."

        # Add speech metrics into question score
        # Fluent speech improves communication
        comm_val = speech_analysis["fluencyScore"]
        
        evaluated_questions.append({
            "questionText": q_text,
            "answerText": a_text,
            "score": score,
            "feedback": feedback,
            "analysis": {
                "fillerWords": speech_analysis["fillerWords"],
                "fillerCount": speech_analysis["fillerCount"],
                "fluencyScore": speech_analysis["fluencyScore"],
                "speakingSpeed": speech_analysis["speakingSpeed"]
            }
        })
        
        overall_tech += score
        overall_comm += comm_val
        overall_conf += 80 if speech_analysis["speakingSpeed"] == "Normal" else 60

    num_qs = max(len(questions_and_answers), 1)
    avg_tech = int(overall_tech / num_qs)
    avg_comm = int(overall_comm / num_qs)
    avg_conf = int(overall_conf / num_qs)
    
    # Process behavior feedback
    behavior_pros = []
    behavior_cons = []
    
    if behavior_data:
        eye_contact = behavior_data.get("eyeContactScore", 90)
        confidence = behavior_data.get("confidenceScore", 85)
        expression_breakdown = behavior_data.get("expressionBreakdown", {})
        focused = expression_breakdown.get("focused", 80)
        anxious = expression_breakdown.get("anxious", 20)
        
        # Rule-based behavior feedback
        if eye_contact >= 85:
            behavior_pros.append("Maintained excellent eye contact with the camera, conveying confidence and engagement.")
        else:
            behavior_cons.append("Eye contact dropped frequently. Try to focus on the camera while delivering answers.")
            
        if confidence >= 80:
            behavior_pros.append("Expressions reflected high composure, poise, and readiness.")
        else:
            behavior_cons.append("Facial tension or micro-expressions of hesitation noticed during difficult questions.")
            
        if anxious >= 25:
            behavior_cons.append("Subtle signs of anxiety (e.g. rapid blinking or minor fidgeting) were detected.")
        else:
            behavior_pros.append("Demonstrated stable physical presence with zero distracting facial fidgets.")
    else:
        behavior_pros = ["Simulated camera session indicated satisfactory structural posture."]
        behavior_cons = ["Enable camera during mock sessions to get deep facial expression metrics."]

    summary = ""
    weak_areas = []
    
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            # Format QA for the prompt
            qa_summary = ""
            for idx, item in enumerate(evaluated_questions):
                qa_summary += f"Q{idx+1}: {item['questionText']}\nAnswer: {item['answerText']}\nScore: {item['score']}\nCritique: {item['feedback']}\n\n"
                
            behavior_summary = ""
            if behavior_data:
                behavior_summary = f"""
                Facial & Behavioral telemetry:
                - Eye Contact Score: {behavior_data.get('eyeContactScore')}%
                - Confidence Score: {behavior_data.get('confidenceScore')}%
                - Focused Expression: {behavior_data.get('expressionBreakdown', {}).get('focused')}%
                - Anxious/Fidget Expression: {behavior_data.get('expressionBreakdown', {}).get('anxious')}%
                """
            
            prompt = f"""
            You are a placement mentor examining a mock interview session.
            Interview Type: {interview_type}
            Target Company: {company}
            
            Q&A Performance:
            {qa_summary}
            
            {behavior_summary}
            
            Evaluate this overall performance and return a raw JSON with the following fields:
            1. 'summary' (a detailed 3-4 sentence placement review summary covering technical depth, communication, and body language behavior)
            2. 'weakAreas' (list of strings representing 1-3 specific topics or skills the candidate needs to work on)
            3. 'behaviorPros' (list of exactly 2 strings outlining pros of their behavior, posture, or facial expressions based on behavior telemetry)
            4. 'behaviorCons' (list of exactly 2 strings outlining cons or areas to improve regarding behavior, expressions, pacing, or nervousness)
            
            Return ONLY raw JSON, no markdown formatting or backticks.
            """
            
            response = model.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```json\s*", "", clean)
                clean = re.sub(r"^```\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            data = json.loads(clean)
            
            summary = data.get("summary", "")
            weak_areas = data.get("weakAreas", [])
            behavior_pros = data.get("behaviorPros", behavior_pros)
            behavior_cons = data.get("behaviorCons", behavior_cons)
        except Exception as e:
            print(f"Gemini overall evaluation failed: {e}")

    # Fallback to rules if Gemini evaluation not run or failed
    if not summary:
        summary = f"Completed mock {interview_type} interview for {company}. "
        if avg_tech < 70:
            summary += "Needs additional study of core technical details. "
            weak_areas.append("Technical Depth")
        if avg_comm < 75:
            summary += "Try to reduce reliance on filler words (like 'um' and 'basically'). "
            weak_areas.append("Speech Fluency / Filler words")
        if avg_conf < 70:
            summary += "Focus on speaking pacing."
            weak_areas.append("Pacing and Cadence")
            
        if not weak_areas:
            summary += "Excellent job! Ready for real placements."
            weak_areas.append("No immediate concerns - keep practicing")

    return {
        "questions": evaluated_questions,
        "overallFeedback": {
            "technicalScore": avg_tech,
            "communicationScore": avg_comm,
            "confidenceScore": avg_conf,
            "summary": summary,
            "weakAreas": weak_areas,
            "behaviorFeedback": {
                "pros": behavior_pros,
                "cons": behavior_cons
            }
        }
    }

def generate_adaptive_followup(interview_type, company="General", target_role="Backend Developer", skills=[], chat_history=[], api_key=None):
    if len(chat_history) >= 3:
        return "COMPLETED"
        
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            history_str = ""
            for qa in chat_history:
                history_str += f"Interviewer: {qa.get('question')}\nCandidate: {qa.get('answer')}\n\n"
                
            prompt = f"""
            You are a skilled interviewer conducting a {interview_type} mock interview for the company {company}.
            The candidate's target role is {target_role} and they know the following skills: {', '.join(skills)}.
            
            Here is the conversation history so far:
            {history_str}
            
            Generate the next appropriate question.
            - If the history is empty, ask a strong starter question about their experience, or a technical concept related to {interview_type} / target role.
            - If the history is not empty, do NOT ask a random question. Instead, ask a follow-up probing question directly testing or digging deeper into what the candidate answered in their last response. For example, if they mention a technology, ask how they would handle a specific limitation, scaling, or edge case of that technology.
            - Keep the question concise, realistic, and professional.
            
            Return ONLY the question text. Do not write anything else.
            """
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Failed to generate adaptive question via Gemini: {e}")
            
    # Fallback/Offline Adaptive questions
    if len(chat_history) == 0:
        if interview_type == "HR":
            return "Tell me about a challenging project you worked on. What was your role and the outcome?"
        elif interview_type == "Technical":
            return f"What are the key architectural patterns you consider when designing a scalable {target_role} system?"
        else: # Coding
            return "Explain the difference between recursive and iterative solutions. When would you prefer one over the other?"
            
    # Simple rule-based follow-ups for fallback
    last_ans = chat_history[-1].get("answer", "").lower()
    if "redis" in last_ans or "cache" in last_ans:
        return "You mentioned caching/Redis. How do you handle cache invalidation, cache stampedes, or consistency between Redis and your primary database?"
    elif "sql" in last_ans or "database" in last_ans or "nosql" in last_ans:
        return "Regarding databases, how do you approach schema indexing, and what are the trade-offs of having too many indexes?"
    elif "api" in last_ans or "rest" in last_ans or "graphql" in last_ans:
        return "Since you mentioned APIs, how do you handle security, rate limiting, and versioning in production environments?"
    elif "react" in last_ans or "next" in last_ans or "frontend" in last_ans:
        return "Concerning front-end development, how do you optimize web page performance and reduce initial load time?"
    elif "git" in last_ans or "merge" in last_ans:
        return "How do you handle complex git merge conflicts in a large team setting?"
    
    return "That's interesting. Can you elaborate on the trade-offs, potential bottlenecks, or how you would scale that approach?"

def analyze_whiteboard_code(problem_title, problem_description, code_language, code_content, api_key=None):
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            You are a technical coding interviewer. Review this code submission for the coding problem:
            
            Problem Title: {problem_title}
            Problem Description: {problem_description}
            Code Language: {code_language}
            
            Submitted Code:
            ```{code_language}
            {code_content}
            ```
            
            Analyze this code thoroughly and return a JSON object with:
            1. "correctness": string (detailed explanation of whether it's correct, logical bugs, syntax issues, or edge cases it fails)
            2. "timeComplexity": string (e.g. O(N), O(N log N)) with brief explanation
            3. "spaceComplexity": string (e.g. O(1), O(N)) with brief explanation
            4. "score": integer (0 to 100 based on accuracy, efficiency, and cleanliness)
            5. "refactoredCode": string (an optimized, cleaner, or idiomatic version of the solution)
            6. "suggestions": list of strings (concrete steps to improve or fix the code)
            
            Return ONLY raw JSON, no markdown formatting.
            """
            
            response = model.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```json\s*", "", clean)
                clean = re.sub(r"^```\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            return json.loads(clean)
        except Exception as e:
            print(f"Gemini code whiteboard analysis failed: {e}")
            
    # Fallback/Offline analyzer
    score = 70
    suggestions = ["Consider edge cases such as empty input, null values, or extremely large ranges."]
    time_comp = "O(N) typical"
    space_comp = "O(1) typical"
    correctness = "Code syntax appears valid. Standard logic flow detected."
    refactored = code_content
    
    if not code_content.strip():
        score = 0
        correctness = "No code was submitted."
        suggestions = ["Write a solution in the editor before submitting."]
    else:
        if code_language.lower() == "python":
            if "for " in code_content and code_content.count("for ") >= 2:
                time_comp = "O(N^2)"
                suggestions.append("Avoid nested loops if possible to optimize time complexity.")
        elif "for(" in code_content or "for (" in code_content:
            if code_content.count("for") >= 2:
                time_comp = "O(N^2)"
                suggestions.append("Avoid nested loops if possible to optimize time complexity.")
                
    return {
        "correctness": correctness,
        "timeComplexity": time_comp,
        "spaceComplexity": space_comp,
        "score": score,
        "refactoredCode": refactored,
        "suggestions": suggestions
    }
