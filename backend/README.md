# Backend Service

Node.js Express server managing data, interactions, and recommendation logic.

## Key Functions

- **Uploads**: Receives files, requests embeddings from the inference service, and stores them in Postgres.
- **Interactions**: Records user likes and updates the User Tower.
- **Recommendations**: Performs vector similarity search via `pgvector`.

## API Examples

### Upload Content
```bash
curl -X POST -F "type=image" -F "file=@image.jpg" http://localhost:3000/upload
```

### Record Interaction
```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"userId": 1, "itemId": 5, "type": "like"}' \
     http://localhost:3000/interact
```

### Get Recommendations
```bash
curl http://localhost:3000/recommendations/1
```

## Database Schema

### Items Table
| Column | Type | Description |
| --- | --- | --- |
| id | SERIAL | Primary Key |
| type | TEXT | image, audio, or text |
| content_path | TEXT | Path to file |
| text_content | TEXT | Raw text if type is text |
| embedding | vector(512) | 512-dimension vector |
