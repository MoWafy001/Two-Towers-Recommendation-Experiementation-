# Scripts

This folder contains utility scripts for setting up the environment.

## 📥 `download_models.sh`

This is the most important script. Because AI models are very large (several hundred megabytes each), we don't include them in the git repository.

### What it does:
1.  Creates a `models/` directory in the project root.
2.  Uses a small Python snippet to download the **CLIP** and **CLAP** models from Hugging Face.
3.  Saves the models in a format that the `inference` service can load locally without needing an internet connection later.

### Requirements:
- You need **Python 3** and the `transformers` library installed on your host machine to run this script.
- Alternatively, you can modify the Dockerfile to download them during the build, but downloading them once on the host is usually faster and more reliable for development.
