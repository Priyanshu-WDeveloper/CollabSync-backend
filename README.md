# CollabSync Backend

Node.js + Express + TypeScript backend API for realtime workspace collaboration.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Realtime:** Socket.io

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret

# Start development server
npx tsx src/server.ts

# Or build for production
npx tsc && node dist/server.js
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collabsync
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## API Endpoints

### Auth `/api/auth`
- POST /register - Register new user
- POST /login - Login user
- POST /logout - Logout user
- GET /me - Get current user
- PUT /profile - Update profile

### Workspaces `/api/workspaces`
- GET / - List workspaces
- POST / - Create workspace
- GET /:id - Get workspace
- PUT /:id - Update workspace
- DELETE /:id - Delete workspace
- POST /:id/invite - Generate invite code
- POST /join - Join via invite code

### Tasks `/api/tasks`
- GET /workspace/:workspaceId - List tasks
- POST /workspace/:workspaceId - Create task
- GET /:id - Get task
- PUT /:id - Update task
- DELETE /:id - Delete task
- PUT /:id/status - Update status
- PUT /reorder - Reorder tasks

### Messages `/api/messages`
- GET /workspace/:workspaceId - Get messages
- POST /workspace/:workspaceId - Send message
- DELETE /:id - Delete message

### Notifications `/api/notifications`
- GET / - List notifications
- PUT /:id/read - Mark as read
- PUT /read-all - Mark all read
- DELETE /:id - Delete notification

## Socket.io Events

### Client → Server
- `join:workspace` - Join workspace room
- `leave:workspace` - Leave workspace room
- `join:user` - Join user notification room
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Server → Client
- `task:created`, `task:updated`, `task:deleted`, `task:moved`, `task:reordered`
- `message:new`, `message:deleted`
- `user:typing`, `user:stopTyping`
- `notification:new`