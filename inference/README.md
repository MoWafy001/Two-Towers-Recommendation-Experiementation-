# Inference Service

This is a Python FastAPI service that wraps the "intelligence" of the system. It uses pretrained AI models to turn raw data into mathematical vectors (embeddings).

## 🤖 The Models

We use two state-of-the-art models from Hugging Face:

1.  **CLIP (Contrastive Language-Image Pre-training)**:
    - **Used for**: Text and Images.
    - **How it works**: CLIP was trained on millions of images and their captions. It learned to map images and text into the *same* vector space. This means a picture of a dog and the word "dog" will have very similar embeddings.
2.  **CLAP (Contrastive Language-Audio Pre-training)**:
    - **Used for**: Audio.
    - **How it works**: Similar to CLIP, but for audio. It maps sounds and text descriptions into the same space.

## 🛣️ Endpoints

- `POST /embed/image`: Takes an image file, returns a 512-number vector.
- `POST /embed/text`: Takes a string of text, returns a 512-number vector.
- `POST /embed/audio`: Takes an audio file, returns a 512-number vector.

## 📥 Automated Setup

The models are automatically downloaded when the service starts for the first time. They are stored in the `models/` directory in the project root via a Docker bind mount.
