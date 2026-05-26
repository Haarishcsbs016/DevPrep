import google.generativeai as genai
import json
import re

def compute_readiness_and_roadmap(profile, dsa_progress, resume_reports, interview_history, api_key=None):
    # Parse inputs
    target_role = profile.get("targetRole", "Full Stack Developer")
    target_companies = profile.get("targetCompanies", ["General"])
    weak_areas = profile.get("weakAreas", [])
    known_skills = profile.get("knownSkills", [])
    
    # 1. DSA Score Calculation
    total_dsa_solved = sum(topic.get("solvedCount", 0) for topic in dsa_progress)
    dsa_factor = min((total_dsa_solved / 40.0) * 100, 100) # Expect 40 problems total for full credit
    
    # 2. Resume Score
    resume_score = 60
    if resume_reports:
        resume_score = resume_reports[0].get("atsScore", 60)
        
    # 3. Interview Score
    interview_score = 60
    if interview_history:
        completed = [h for h in interview_history if h.get("status") == "completed"]
        if completed:
            # Avg of technical and communication scores
            latest = completed[0]
            feedback = latest.get("overallFeedback", {})
            interview_score = (feedback.get("technicalScore", 60) + feedback.get("communicationScore", 60)) / 2.0
            
    # Compute weighted score
    # DSA (35%), Resume ATS (30%), Interviews (35%)
    readiness_score = int((dsa_factor * 0.35) + (resume_score * 0.30) + (interview_score * 0.35))
    readiness_score = min(max(readiness_score, 10), 100)

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            You are a senior placement director. Based on the student's data, generate a dynamic and adaptive preparation plan:
            1. 'placementReadinessScore' (integer 0-100, reference calculation was {readiness_score})
            2. 'weaknessAnalysis' (list of strings identifying topics they need to review)
            3. 'dailyTasks' (list of exactly 5 actionable tasks for today, e.g. "Solve 2 DP problems", "Revise Deadlocks")
            4. 'roadmap' (list of 4 objects with 'week' ("Week 1" to "Week 4"), 'title', and 'tasks' (list of strings) tailor-made for targeting {', '.join(target_companies)} as a {target_role})

            CRITICAL REQUIREMENT: The weekly roadmap MUST be highly adaptive based on the student's performance:
            - If they have solved few DSA problems or have self-reported weak areas, prioritize tasks like "Solve 5 problems on [weak area]" (e.g., Arrays, Trees, DP) in Week 1 and 2.
            - If their resume ATS score is low (below 75), prioritize "Scan and optimize resume formatting", "Incorporate metrics to project descriptions", and "Add missing keywords".
            - If their interview rating is low or they have completed 0 mocks, prioritize "Conduct behavioral HR mock voice interview" and "Revise common verbal placement questions".
            - If they are already strong in a category, reduce tasks in that category and add advanced topics or focus on remaining weaknesses.

            Student stats:
            - DSA Confidence: {profile.get("dsaConfidence", "Intermediate")}
            - Solved DSA problems count: {total_dsa_solved}
            - ATS Resume Score: {resume_score}/100
            - Interview rating: {interview_score}/100
            - Known skills: {', '.join(known_skills)}
            - Self-reported weak topics: {', '.join(weak_areas)}
            
            Return ONLY a raw JSON response, no markdown headers or backticks.
            """
            
            response = model.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```json\s*", "", clean)
                clean = re.sub(r"^```\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            return json.loads(clean)
        except Exception as e:
            print(f"Failed to generate readiness plan via Gemini: {e}")

    # Fallback/Offline Dynamic Adaptive Roadmap Generator
    company = target_companies[0].lower() if target_companies else "general"
    
    # Identify weaknesses based on data
    calc_weaknesses = []
    if dsa_factor < 50:
        calc_weaknesses.append("Data Structures & Algorithms depth")
    if resume_score < 70:
        calc_weaknesses.append("Resume keyword optimization & ATS score")
    if interview_score < 70:
        calc_weaknesses.append("Mock interview confidence & speed")
        
    for w in weak_areas:
        if w not in calc_weaknesses:
            calc_weaknesses.append(w)
            
    if not calc_weaknesses:
        calc_weaknesses.append("System scalability concepts")

    # Generate daily tasks
    daily_tasks = [
        f"Solve 2 practice problems on '{weak_areas[0] if weak_areas else 'Arrays'}'",
        "Add measurable achievements and github link to resume",
        "Revise basic Database management system (DBMS) queries",
        "Record 1 mock interview session using voice mode",
        "Browse open developer roles for target companies"
    ]

    # Rule-Based Adaptive Roadmap Generator
    primary_weakness = weak_areas[0] if weak_areas else "Arrays"
    secondary_weakness = weak_areas[1] if len(weak_areas) > 1 else "LinkedLists & Stacks"

    # Week 1: Diagnostic & Fundamentals
    w1_tasks = []
    if total_dsa_solved < 10:
        w1_tasks.append(f"Solve 5 practice problems on {primary_weakness}")
        w1_tasks.append("Review basic time and space complexity theory")
    else:
        w1_tasks.append("Solve 5 advanced problems on Trees and Graphs")
        w1_tasks.append("Implement Dijkstra's algorithm and BFS traversals")

    if resume_score < 70:
        w1_tasks.append("Re-format resume for ATS parser compatibility")
        w1_tasks.append("Integrate GitHub and portfolio links to resume header")
    else:
        w1_tasks.append("Review Database Management ACID properties and normalization")
        w1_tasks.append("Write SQL queries involving complex JOIN operations")

    # Week 2: Deep Practice & Core Revision
    w2_tasks = []
    if resume_score < 75:
        w2_tasks.append("Add missing placement keywords to project bullet points")
        w2_tasks.append("Confirm resume score exceeds 75 on ATS Scanner")
    else:
        w2_tasks.append(f"Solve 5 practice problems on {secondary_weakness}")
        w2_tasks.append("Review Operating System deadlocks and process schedules")

    if interview_score < 70:
        w2_tasks.append("Record 1 behavioral HR mock interview session to build confidence")
        w2_tasks.append("Format self-introduction answers using STAR framework")
    else:
        w2_tasks.append("Conduct 1 technical mock interview with detailed speech evaluation")
        w2_tasks.append("Design a basic distributed system schema (caching & rate limits)")

    # Week 3: Mock Drills & Deep Dive
    w3_tasks = []
    if total_dsa_solved < 20:
        w3_tasks.append("Solve 5 recursion and Dynamic Programming problems")
    else:
        w3_tasks.append("Solve 5 LeetCode Hard problems on Graphs & Backtracking")

    if interview_score < 75:
        w3_tasks.append("Conduct 1 verbal technical mock interview focusing on communication")
        w3_tasks.append("Practice speaking out loud while typing whiteboard code")
    else:
        w3_tasks.append("Perform a company-specific coding mockup round")
        w3_tasks.append("Read up on Microservices, message queues, and indexing")

    # Week 4: Final Certification & Placement Polish
    w4_tasks = []
    w4_tasks.append(f"Execute final check for {company.upper()} candidate interviews")
    w4_tasks.append("Audit public GitHub repositories and clean up README profiles")
    if readiness_score < 75:
        w4_tasks.append("Iterate on weaknesses list to push overall placement score above 75%")
    else:
        w4_tasks.append("Conduct a full simulated placement certification round")

    roadmap = [
        {"week": "Week 1", "title": "Diagnostic & Fundamentals", "tasks": w1_tasks},
        {"week": "Week 2", "title": "Target Practice & Core Revise", "tasks": w2_tasks},
        {"week": "Week 3", "title": "Mock Drills & Deep Dive", "tasks": w3_tasks},
        {"week": "Week 4", "title": "Final Certification & Polish", "tasks": w4_tasks}
    ]

    return {
        "placementReadinessScore": readiness_score,
        "weaknessAnalysis": calc_weaknesses,
        "dailyTasks": daily_tasks,
        "roadmap": roadmap
    }
