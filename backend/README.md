# Backend Service

This is a Node.js Express server that acts as the central hub of the recommendation system.

## 🛠️ What does it do?

1.  **Content Management**: Handles file uploads and stores metadata in PostgreSQL.
2.  **Embedding Coordination**: When a file is uploaded, it sends it to the `inference` service to get its "meaning" (embedding) and saves that vector in the database.
3.  **User Interaction**: Records when a user "likes" an item.
4.  **User Tower Logic**: 
    - Every time a user likes an item, the backend recalculates the **User Embedding**.
    - It does this by taking the average of the embeddings of all items that user has liked.
5.  **Recommendation Engine**: 
    - It performs a "Vector Similarity Search" using `pgvector`.
    - It finds items whose embeddings are closest to the user's embedding.
    - **Randomness**: It adds a small amount of random noise to the search results so that the user sees different things even if their profile hasn't changed.

## 🗄️ Database Schema

- `items`: Stores the type (image/text/audio), the file path, and the 512-dimension vector embedding.
- `users`: Stores the user profile and their current 512-dimension vector embedding.
- `interactions`: Records which user liked which item.

## 🚀 Tech Stack
- **Node.js & Express**: Web server.
- **PostgreSQL & pgvector**: Vector database.
- **Multer**: For handling file uploads.
- **Axios**: To communicate with the inference service.
