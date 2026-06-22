# Inference Service

Python FastAPI service for generating embeddings using pretrained models.

## Models

- **CLIP**: `openai/clip-vit-base-patch32` for text and images.
- **CLAP**: `laion/clap-htsat-unfused` for audio.

## API Endpoints

### Image Embedding
`POST /embed/image`
- Input: Multipart file
- Output: `{"embedding": [0.1, 0.2, ...]}`

### Text Embedding
`POST /embed/text`
- Input: Form data `text`
- Output: `{"embedding": [0.1, 0.2, ...]}`

### Audio Embedding
`POST /embed/audio`
- Input: Multipart file
- Output: `{"embedding": [0.1, 0.2, ...]}`

## Implementation Example (Python)
```python
# CLIP Inference
inputs = clip_processor(images=image, return_tensors="pt")
with torch.no_grad():
    image_features = clip_model.get_image_features(**inputs)
embedding = image_features.cpu().numpy().tolist()[0]
```
