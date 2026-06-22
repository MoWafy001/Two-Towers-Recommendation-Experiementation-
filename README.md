# Multi-Modal Two-Tower Recommendation System PoC

Welcome! This project is a Proof of Concept (PoC) for a recommendation system that can handle text, images, and audio. It is designed to be self-contained and easy to run using Docker.

## 🧠 What is a Recommendation System?

At its core, a recommendation system is an algorithm that predicts what a user might like based on their past behavior or the characteristics of items.

### The Problem: The "Needle in a Haystack"
Imagine you have millions of videos, songs, or products. How do you show the right ones to a specific user? You can't compare every user to every item every time they refresh the page—it's too slow.

### The Solution: Embeddings & Vector Space
Instead of comparing raw data (like pixels in an image or characters in text), we turn everything into **Embeddings**.
- **An Embedding** is just a list of numbers (a vector) that represents the "meaning" of an item.
- Items that are similar (e.g., two pictures of cats) will have embeddings that are "close" to each other in mathematical space.

---

## 🗼 The "Two-Tower" Strategy

This project uses a **Two-Tower** architecture, which is a industry-standard way to build scalable recommendation systems.

### 1. The Item Tower
This "tower" is responsible for understanding the content. 
- It takes an item (image, text, or audio) and turns it into an embedding.
- These embeddings are pre-calculated and stored in a database.
- In this PoC, we use pretrained models (**CLIP** for images/text and **CLAP** for audio) as our Item Tower.

### 2. The User Tower
This "tower" is responsible for understanding the user.
- It looks at what a user has liked or interacted with.
- It creates a single embedding that represents the user's current "taste."
- In this PoC, we calculate the User Embedding by **averaging the embeddings** of all items the user has "liked."

### 3. Retrieval (The Matchmaking)
When a user wants recommendations, we take the **User Embedding** and look for the **Item Embeddings** that are closest to it. We use a specialized database extension called `pgvector` to do this math extremely fast.

---

## 🏗️ Project Architecture

The system is split into four main parts:

1.  **[Inference Service](./inference)**: The "Brain." It runs the AI models that turn content into embeddings.
2.  **[Backend](./backend)**: The "Orchestrator." It manages the database, records user likes, and calculates the User Tower.
3.  **[Frontend](./frontend)**: The "Face." A simple UI to see content and interact with it.
4.  **[Database](./db)**: The "Memory." A PostgreSQL database with `pgvector` to store and search embeddings.

---

## 🚀 Getting Started

### 1. Download Models
The AI models are large, so they aren't included in the code. Run this script to download them to your local machine:
```bash
bash scripts/download_models.sh
```

### 2. Run with Docker
Everything is automated. Just run:
```bash
docker compose up --build
```

### 3. Explore
Go to [http://localhost:5173](http://localhost:5173).
- Like some items.
- Refresh the recommendations.
- Upload your own files and see them get recommended!

---

## 📂 Folder Structure

- `/backend`: Node.js API and recommendation logic.
- `/frontend`: React UI.
- `/inference`: Python service running the AI models.
- `/scripts`: Utility scripts for setup.
- `/models`: (Created after download) Stores the AI model files.
- `/data`: Stores uploaded files.
