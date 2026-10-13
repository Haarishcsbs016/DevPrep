import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import Services
from services.resume_parser import analyze_resume_ats
from services.rag_mentor import save_document, answer_query, search_documents, list_documents, delete_document, generate_rag_quiz, generate_rag_concepts, train_rag_index
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

class TrainRagRequest(BaseModel):
    userId: str
    activeFiles: Optional[List[str]] = None

class ReadinessRequest(BaseModel):
    profile: dict
    dsaProgress: List[dict]
    resumeReports: List[dict]
    profileStats: Optional[dict] = None

@app.get("/health")
def health_check():
    return {"status": "online", "message": "FastAPI AI server is running"}

@app.post("/analyze-resume")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    x_gemini_key: Optional[str] = Header(None)
):
    if file is None and not (resume_text and resume_text.strip()):
        raise HTTPException(status_code=400, detail="Please upload a resume file or paste resume text.")

    try:
        temp_file_path = None
        if file is not None:
            temp_file_path = os.path.join(TEMP_DIR, file.filename)
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        result = analyze_resume_ats(
            pdf_path=temp_file_path,
            resume_text=resume_text,
            job_description=job_description,
            api_key=x_gemini_key
        )

        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        return result
    except HTTPException:
        raise
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

@app.post("/rag/train")
def train_rag(request: TrainRagRequest, x_gemini_key: Optional[str] = Header(None)):
    try:
        result = train_rag_index(
            user_id=request.userId,
            api_key=x_gemini_key,
            active_files=request.activeFiles,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
            profile_stats=request.profileStats,
            api_key=x_gemini_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
