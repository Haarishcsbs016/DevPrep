import google.generativeai as genai
import json
import re

def compute_readiness_and_roadmap(profile, dsa_progress, resume_reports, profile_stats=None, api_key=None):
    # Parse inputs
    target_role = profile.get("targetRole", "Full Stack Developer")
    target_companies = profile.get("targetCompanies", ["General"])
    weak_areas = profile.get("weakAreas", [])
    known_skills = profile.get("knownSkills", [])
    
    # 1. LeetCode Performance (25%)
    lc_solved_pct = 0
    lc_rating_pct = 0
    if profile_stats and "leetcode" in profile_stats:
        lc = profile_stats["leetcode"]
        lc_solved_pct = min((lc.get("solved", 0) / 300.0) * 100.0, 100.0)
        rating = lc.get("rating", 1500)
        lc_rating_pct = min((rating / 1800.0) * 100.0, 100.0)
        leetcode_score = int((lc_solved_pct + lc_rating_pct) / 2.0)
    else:
        # Fallback to internal DSA progress
        total_dsa_solved = sum(topic.get("solvedCount", 0) for topic in dsa_progress)
        leetcode_score = int(min((total_dsa_solved / 40.0) * 100.0, 100.0))

    # 2. HackerRank Performance (20%)
    if profile_stats and "hackerrank" in profile_stats:
        hr = profile_stats["hackerrank"]
        stars = hr.get("stars", {})
        if stars:
            valid_star_vals = [v for v in stars.values() if v > 0]
            if valid_star_vals:
                hackerrank_score = int((sum(valid_star_vals) / len(valid_star_vals)) * 20.0) # 5 stars = 100%
            else:
                hackerrank_score = 60
        else:
            hackerrank_score = 60
    else:
        hackerrank_score = 70

    # 3. Resume Score (25%)
    resume_score = 60
    if resume_reports:
        resume_score = resume_reports[0].get("atsScore", 60)

    # 4. GitHub Activity (20%)
    if profile_stats and "github" in profile_stats:
        gh = profile_stats["github"]
        commit_pct = min((gh.get("commits", 0) / 300.0) * 100.0, 100.0)
        repo_pct = min((gh.get("repos", 0) / 15.0) * 100.0, 100.0)
        github_score = int((commit_pct + repo_pct) / 2.0)
    else:
        github_score = 65

    # Compute weighted score (4 factors, no mock interview)
    # LeetCode: 30%, HackerRank: 25%, Resume: 25%, GitHub: 20%
    readiness_score = int(
        (leetcode_score * 0.30) +
        (hackerrank_score * 0.25) +
        (resume_score * 0.25) +
        (github_score * 0.20)
    )
    readiness_score = min(max(readiness_score, 10), 100)

    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.5-flash')
            
            prompt = f"""
            You are a senior placement director. Based on the student's data, generate a dynamic and adaptive preparation plan:
            1. 'placementReadinessScore' (integer 0-100, reference calculation was {readiness_score})
            2. 'weaknessAnalysis' (list of strings identifying topics they need to review, e.g. Dynamic Programming, Operating Systems, SQL, etc.)
            3. 'dailyTasks' (list of exactly 5 actionable tasks for today, e.g. "Solve 2 Graph Problems", "1 SQL Revision", "Review System Design", "Optimize resume keywords")
            4. 'roadmap' (list of 4 objects with 'week' ("Week 1" to "Week 4"), 'title', and 'tasks' (list of strings) tailor-made for targeting {', '.join(target_companies)} as a {target_role})

            CRITICAL REQUIREMENT: The weekly roadmap MUST be highly adaptive based on the student's performance:
            - If they have solved few DSA problems or have self-reported weak areas, prioritize tasks like "Solve 5 problems on [weak area]" (e.g., Arrays, Trees, DP) in Week 1 and 2.
            - If their resume ATS score is low (below 75), prioritize "Scan and optimize resume formatting", "Incorporate metrics to project descriptions", and "Add missing keywords".
            - If they have connected profiles, suggest profile-specific actions (e.g., "Solve 5 problems on HackerRank to increase SQL star count", "Review GitHub activity commits").

            Student stats:
            - Target Career Path: {target_role}
            - Target Companies: {', '.join(target_companies)}
            - DSA Confidence: {profile.get("dsaConfidence", "Intermediate")}
            - LeetCode Score: {leetcode_score}/100 (Solved count: {profile_stats.get('leetcode', {}).get('solved', 0) if profile_stats else 0})
            - HackerRank Score: {hackerrank_score}/100 (Java: {profile_stats.get('hackerrank', {}).get('stars', {}).get('java', 0) if profile_stats else 0} Star, SQL: {profile_stats.get('hackerrank', {}).get('stars', {}).get('sql', 0) if profile_stats else 0} Star)
            - HackerEarth Solved count: {profile_stats.get('hackerearth', {}).get('solved', 0) if profile_stats else 0}
            - GitHub Commits count: {profile_stats.get('github', {}).get('commits', 0) if profile_stats else 0}
            - ATS Resume Score: {resume_score}/100
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
    if leetcode_score < 60:
        calc_weaknesses.append("Dynamic Programming depth")
    if hackerrank_score < 70 and "SQL" not in calc_weaknesses:
        calc_weaknesses.append("SQL Queries & Joins")
    if resume_score < 75:
        calc_weaknesses.append("Resume keyword optimization & ATS score")
        
    for w in weak_areas:
        if w not in calc_weaknesses:
            calc_weaknesses.append(w)
            
    if not calc_weaknesses:
        calc_weaknesses.append("System scalability concepts")

    # Generate daily tasks
    daily_tasks = [
        f"Solve 2 practice problems on '{calc_weaknesses[0] if calc_weaknesses else 'Arrays'}'",
        "1 SQL Revision query task on HackerRank",
        "Review 3 system design concepts (caching, load balancing, sharding)",
        "Add measurable achievements and github link to resume",
        "Review common Object-Oriented Programming (OOP) questions"
    ]

    # Rule-Based Adaptive Roadmap Generator
    primary_weakness = calc_weaknesses[0] if calc_weaknesses else "Arrays"
    secondary_weakness = calc_weaknesses[1] if len(calc_weaknesses) > 1 else "LinkedLists & Stacks"

    # Week 1: Diagnostic & Fundamentals
    w1_tasks = []
    if leetcode_score < 40:
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

    w2_tasks.append("Design a basic distributed system schema (caching & rate limits)")
    w2_tasks.append("Format self-introduction answers using STAR framework")

    # Week 3: Mock Drills & Deep Dive
    w3_tasks = []
    w3_tasks.append("Solve 5 LeetCode Medium/Hard problems on Graphs & DP")
    w3_tasks.append("Review common computer network protocols (TCP/IP, HTTP/S, DNS)")
    w3_tasks.append("Read up on Microservices, message queues, and indexing")

    # Week 4: Final Certification & Placement Polish
    w4_tasks = []
    w4_tasks.append(f"Execute final check for {company.upper()} candidate preparation")
    w4_tasks.append("Audit public GitHub repositories and clean up README profiles")
    if readiness_score < 75:
        w4_tasks.append("Iterate on weaknesses list to push overall placement score above 75%")
    else:
        w4_tasks.append("Conduct a full simulated placement certification round")

    roadmap = [
        {"week": "Week 1", "title": f"{company.capitalize()} DSA & Resume Prep", "tasks": w1_tasks},
        {"week": "Week 2", "title": "System Design & Databases", "tasks": w2_tasks},
        {"week": "Week 3", "title": "System Design & Networking Deep Dive", "tasks": w3_tasks},
        {"week": "Week 4", "title": "Mock assessments & Final Review", "tasks": w4_tasks}
    ]

    return {
        "placementReadinessScore": readiness_score,
        "weaknessAnalysis": calc_weaknesses,
        "dailyTasks": daily_tasks,
        "roadmap": roadmap
    }

