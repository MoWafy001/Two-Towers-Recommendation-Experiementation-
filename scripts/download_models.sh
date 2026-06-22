#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p models/clip
mkdir -p models/clap

echo "Downloading CLIP model..."
# Using python to download models to ensure they are in the right format for transformers
python3 -c "
from transformers import CLIPProcessor, CLIPModel
model_name = 'openai/clip-vit-base-patch32'
model = CLIPModel.from_pretrained(model_name)
processor = CLIPProcessor.from_pretrained(model_name)
model.save_pretrained('models/clip')
processor.save_pretrained('models/clip')
"

echo "Downloading CLAP model for audio..."
python3 -c "
from transformers import AutoProcessor, ClapModel
model_name = 'laion/clap-htsat-unfused'
model = ClapModel.from_pretrained(model_name)
processor = AutoProcessor.from_pretrained(model_name)
model.save_pretrained('models/clap')
processor.save_pretrained('models/clap')
"

echo "Models downloaded successfully to models/ directory."
