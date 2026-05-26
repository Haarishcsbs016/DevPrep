import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import Services
from services.resume_parser import analyze_resume_ats
from services.rag_mentor import save_document, answer_query, search_documents, list_documents, delete_document, generate_rag_quiz, generate_rag_concepts
from services.interview_analyzer import generate_mock_questions, evaluate_interview_performance, generate_adaptive_followup, analyze_whiteboard_code
from services.readiness_engine import compute_readiness_and_roadmap

app = FastAPI(title="DevPrep AI Backend")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# Schema definitions
class QueryRequest(BaseModel):
    userId: str
    query: str
    activeFiles: Optional[List[str]] = None

class DeleteFileRequest(BaseModel):
    userId: str
    fileName: str

class QuizRequest(BaseModel):
    userId: str
    activeFiles: List[str]

class ConceptsRequest(BaseModel):
    userId: str
    activeFiles: List[str]

class QuestionRequest(BaseModel):
    interviewType: str
    company: Optional[str] = "General"
    targetRole: Optional[str] = "Backend Developer"
    skills: Optional[List[str]] = []

class AnswerItem(BaseModel):
    question: str
    answer: str

class BehaviorAnalysisSchema(BaseModel):
    eyeContactScore: int
    confidenceScore: int
    expressionBreakdown: dict

class EvaluateRequest(BaseModel):
    interviewType: str
    company: Optional[str] = "General"
    answers: List[AnswerItem]
    behaviorAnalysis: Optional[BehaviorAnalysisSchema] = None

class AdaptiveChatRequest(BaseModel):
    interviewType: str
    company: Optional[str] = "General"
    targetRole: Optional[str] = "Backend Developer"
    skills: Optional[List[str]] = []
    chatHistory: List[dict] = []

class WhiteboardReviewRequest(BaseModel):
    problemTitle: str
    problemDescription: str
    codeLanguage: str
    codeContent: str

class ReadinessRequest(BaseModel):
    profile: dict
    dsaProgress: List[dict]
    resumeReports: List[dict]
    interviewHistory: List[dict]

@app.get("/health")
def health_check():
    return {"status": "online", "message": "FastAPI AI server is running"}

@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        # Save temp file
        temp_file_path = os.path.join(TEMP_DIR, file.filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Analyze
        result = analyze_resume_ats(temp_file_path, api_key=x_gemini_key)
        
        # Clean up
        os.remove(temp_file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/upload")
async def upload_rag_document(
    userId: str = Form(...),
    file: UploadFile = File(...),
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        temp_file_path = os.path.join(TEMP_DIR, file.filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse & Save
        num_chunks = save_document(userId, file.filename, temp_file_path, api_key=x_gemini_key)
        
        os.remove(temp_file_path)
        return {"status": "success", "fileName": file.filename, "chunksSaved": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/query")
def query_rag_document(
    request: QueryRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        result = answer_query(request.userId, request.query, api_key=x_gemini_key, active_files=request.activeFiles)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/files")
def get_rag_files(userId: str):
    try:
        files = list_documents(userId)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/rag/file")
def delete_rag_file(request: DeleteFileRequest):
    try:
        delete_document(request.userId, request.fileName)
        return {"status": "success", "message": f"Deleted {request.fileName}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/quiz")
def get_rag_quiz(request: QuizRequest, x_gemini_key: Optional[str] = Header(None)):
    try:
        quiz = generate_rag_quiz(request.userId, request.activeFiles, api_key=x_gemini_key)
        return {"quiz": quiz}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/concepts")
def get_rag_concepts(request: ConceptsRequest, x_gemini_key: Optional[str] = Header(None)):
    try:
        concepts = generate_rag_concepts(request.userId, request.activeFiles, api_key=x_gemini_key)
        return {"concepts": concepts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mock-interview/questions")
def get_questions(
    request: QuestionRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        questions = generate_mock_questions(
            interview_type=request.interviewType,
            company=request.company,
            target_role=request.targetRole,
            skills=request.skills,
            api_key=x_gemini_key
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mock-interview/evaluate")
def evaluate_answers(
    request: EvaluateRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        # Convert items to list of dicts
        qa_list = [{"question": qa.question, "answer": qa.answer} for qa in request.answers]
        behavior_data = request.behaviorAnalysis.dict() if request.behaviorAnalysis else None
        result = evaluate_interview_performance(
            questions_and_answers=qa_list,
            interview_type=request.interviewType,
            company=request.company,
            behavior_data=behavior_data,
            api_key=x_gemini_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/readiness-score")
def get_readiness_score(
    request: ReadinessRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        result = compute_readiness_and_roadmap(
            profile=request.profile,
            dsa_progress=request.dsaProgress,
            resume_reports=request.resumeReports,
            interview_history=request.interviewHistory,
            api_key=x_gemini_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mock-interview/adaptive-chat")
def get_adaptive_chat_question(
    request: AdaptiveChatRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        next_question = generate_adaptive_followup(
            interview_type=request.interviewType,
            company=request.company,
            target_role=request.targetRole,
            skills=request.skills,
            chat_history=request.chatHistory,
            api_key=x_gemini_key
        )
        return {"question": next_question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mock-interview/whiteboard-review")
def review_whiteboard_code(
    request: WhiteboardReviewRequest,
    x_gemini_key: Optional[str] = Header(None)
):
    try:
        review_result = analyze_whiteboard_code(
            problem_title=request.problemTitle,
            problem_description=request.problemDescription,
            code_language=request.codeLanguage,
            code_content=request.codeContent,
            api_key=x_gemini_key
        )
        return review_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
