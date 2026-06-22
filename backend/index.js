const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('/app/uploads'));

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'recommendation_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const upload = multer({ dest: '/app/uploads/' });

const INFERENCE_URL = process.env.INFERENCE_URL || 'http://inference:8000';

const FormData = require('form-data');

// Initialize Database
async function initDb() {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      content_path TEXT,
      text_content TEXT,
      embedding vector(512)
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      embedding vector(512)
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS interactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      item_id INTEGER REFERENCES items(id),
      type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Create a default user if not exists
    await pool.query('INSERT INTO users (username) VALUES ($1) ON CONFLICT DO NOTHING', ['default_user']);

    // Seed initial data if empty
    const countRes = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(countRes.rows[0].count) === 0) {
        console.log('Seeding initial data...');
        const seedItems = [
            { type: 'text', text: 'The future of AI is multi-modal and agentic.' },
            { type: 'text', text: 'Space exploration is the next frontier for humanity.' },
            { type: 'text', text: 'Sustainable energy is crucial for our planet.' },
        ];

        for (const item of seedItems) {
            const embedding = await getEmbedding('text', item.text);
            await pool.query(
                'INSERT INTO items (type, text_content, embedding) VALUES ($1, $2, $3)',
                [item.type, item.text, `[${embedding.join(',')}]`]
            );
        }
        console.log('Seeding complete.');
    }
}

initDb().catch(console.error);

// Helper to get embedding from inference service
async function getEmbedding(type, data) {
    const form = new FormData();
    if (type === 'text') {
        form.append('text', data);
        const res = await axios.post(`${INFERENCE_URL}/embed/text`, form, { headers: form.getHeaders() });
        return res.data.embedding;
    } else if (type === 'image') {
        form.append('file', fs.createReadStream(data), { filename: 'image.jpg' });
        const res = await axios.post(`${INFERENCE_URL}/embed/image`, form, { headers: form.getHeaders() });
        return res.data.embedding;
    } else if (type === 'audio') {
        form.append('file', fs.createReadStream(data), { filename: 'audio.wav' });
        const res = await axios.post(`${INFERENCE_URL}/embed/audio`, form, { headers: form.getHeaders() });
        return res.data.embedding;
    }
}

// Routes
app.post('/upload', upload.single('file'), async (req, res) => {
    const { type, text } = req.body;
    let embedding;
    let contentPath = null;
    let textContent = null;

    try {
        if (type === 'text') {
            textContent = text;
            embedding = await getEmbedding('text', text);
        } else {
            contentPath = req.file.path;
            embedding = await getEmbedding(type, contentPath);
        }

        const result = await pool.query(
            'INSERT INTO items (type, content_path, text_content, embedding) VALUES ($1, $2, $3, $4) RETURNING *',
            [type, contentPath ? `/uploads/${path.basename(contentPath)}` : null, textContent, `[${embedding.join(',')}]`]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.get('/items', async (req, res) => {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
});

app.post('/interact', async (req, res) => {
    const { userId, itemId, type } = req.body;
    await pool.query('INSERT INTO interactions (user_id, item_id, type) VALUES ($1, $2, $3)', [userId, itemId, type]);

    // Update user embedding (Two-Tower logic)
    // Simple: average of embeddings of items interacted with
    const interactions = await pool.query(`
    SELECT i.embedding 
    FROM items i 
    JOIN interactions int ON i.id = int.item_id 
    WHERE int.user_id = $1
  `, [userId]);

    if (interactions.rows.length > 0) {
        const embeddings = interactions.rows.map(r => JSON.parse(r.embedding.replace('[', '[').replace(']', ']')));
        const avgEmbedding = embeddings[0].map((_, i) => embeddings.reduce((acc, e) => acc + e[i], 0) / embeddings.length);

        await pool.query('UPDATE users SET embedding = $1 WHERE id = $2', [`[${avgEmbedding.join(',')}]`, userId]);
    }

    res.send('Interaction recorded');
});

app.get('/recommendations/:userId', async (req, res) => {
    const { userId } = req.params;
    const userRes = await pool.query('SELECT embedding FROM users WHERE id = $1', [userId]);
    const userEmbedding = userRes.rows[0]?.embedding;

    if (!userEmbedding) {
        const result = await pool.query('SELECT * FROM items ORDER BY RANDOM() LIMIT 10');
        return res.json(result.rows);
    }

    // Vector similarity search with some randomness
    const result = await pool.query(`
    SELECT *, (embedding <=> $1) as distance 
    FROM items 
    ORDER BY distance + (random() * 0.2) 
    LIMIT 10
  `, [userEmbedding]);

    res.json(result.rows);
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
