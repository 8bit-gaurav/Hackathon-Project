from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from Backend.agent import process_request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

chat_history: List[Dict[str, str]] = []

@app.get("/")
def health_check():
    return {"status": "online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    global chat_history
    # Added 'await' here to match the new async agent logic
    reply = await process_request(request.message, chat_history) 
    chat_history.append({"role": "user", "content": request.message})
    chat_history.append({"role": "assistant", "content": reply})
    return {"reply": reply}