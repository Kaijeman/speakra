from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    # Di sini nanti kamu implementasi:
    # - ekstraksi fitur suara
    # - model untuk menilai kualitas public speaking berbahasa Indonesia
    # Untuk saat ini dummy saja

    # Contoh dummy scoring khusus Speakra:
    result = {
        "score": 80.0,
        "fluency": 0.78,
        "clarity": 0.82,
        "confidence": 0.75,
        "feedback": (
            "Penyampaian sudah cukup jelas. "
            "Perbaiki tempo bicara, kurangi pengulangan kata, "
            "dan kuatkan artikulasi pada beberapa kata kunci."
        )
    }

    return JSONResponse(content=result)
