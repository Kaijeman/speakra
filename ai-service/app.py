from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    size = 0
    chunk = await file.read()
    size = len(chunk)
    if size == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    # data dummy untuk testing
    return {
        "analysis": {
            "score": 78.5,
            "fluency": 0.74,
            "clarity": 0.81,
            "speed": 0.92,
            "feedback": "Hasil sementara."
        }
    }