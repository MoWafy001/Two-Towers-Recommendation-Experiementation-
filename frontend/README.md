# Frontend Service

React application for interacting with the recommendation system.

## Features

- **Grid View**: Displays all content and personalized recommendations.
- **Real-time Updates**: Recommendations refresh automatically after likes or uploads.
- **Multi-modal Upload**: Supports text input and file uploads for images and audio.

## Key Components

- `App.jsx`: Main logic for fetching data and handling interactions.
- `renderItem`: Helper function for displaying different media types.

## Example Interaction Flow
1. User clicks "Like" on an item.
2. Frontend calls `POST /interact`.
3. Backend updates user embedding.
4. Frontend calls `GET /recommendations/:userId`.
5. UI updates with new recommendations.
