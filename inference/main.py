from fastapi import FastAPI, UploadFile, File, Form
from transformers import CLIPProcessor, CLIPModel, AutoProcessor, ClapModel
import torch
from PIL import Image
import io
import numpy as np
import librosa

import os

app = FastAPI()

def download_models():
    models_dir = "/models"
    clip_path = os.path.join(models_dir, "clip")
    clap_path = os.path.join(models_dir, "clap")

    if not os.path.exists(clip_path):
        print("Downloading CLIP model...")
        model_name = 'openai/clip-vit-base-patch32'
        model = CLIPModel.from_pretrained(model_name)
        processor = CLIPProcessor.from_pretrained(model_name)
        model.save_pretrained(clip_path)
        processor.save_pretrained(clip_path)
    
    if not os.path.exists(clap_path):
        print("Downloading CLAP model...")
        model_name = 'laion/clap-htsat-unfused'
        model = ClapModel.from_pretrained(model_name)
        processor = AutoProcessor.from_pretrained(model_name)
        model.save_pretrained(clap_path)
        processor.save_pretrained(clap_path)

# Ensure models are downloaded before loading
download_models()

# Load models
clip_model = CLIPModel.from_pretrained("/models/clip")
clip_processor = CLIPProcessor.from_pretrained("/models/clip")

clap_model = ClapModel.from_pretrained("/models/clap")
clap_processor = AutoProcessor.from_pretrained("/models/clap")

device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model.to(device)
clap_model.to(device)

@app.post("/embed/image")
async def embed_image(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read()))
    inputs = clip_processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        image_features = clip_model.get_image_features(**inputs)
    return {"embedding": image_features.cpu().numpy().tolist()[0]}

@app.post("/embed/text")
async def embed_text(text: str = Form(...)):
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
        text_features = clip_model.get_text_features(**inputs)
    return {"embedding": text_features.cpu().numpy().tolist()[0]}

@app.post("/embed/audio")
async def embed_audio(file: UploadFile = File(...)):
    audio_data, _ = librosa.load(io.BytesIO(await file.read()), sr=48000)
    inputs = clap_processor(audios=audio_data, return_tensors="pt", sampling_rate=48000).to(device)
    with torch.no_grad():
        audio_features = clap_model.get_audio_features(**inputs)
    return {"embedding": audio_features.cpu().numpy().tolist()[0]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
