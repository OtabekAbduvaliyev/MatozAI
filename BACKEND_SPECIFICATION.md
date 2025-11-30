# MatozAI Backend Specification

## 📋 Umumiy Ma'lumot

**Loyiha nomi:** MatozAI Backend  
**Texnologiyalar:** NestJS, PostgreSQL, Prisma ORM, JWT Authentication  
**Maqsad:** MatozAI frontend uchun to'liq RESTful API va WebSocket xizmatlari

---

## 🏗️ Arxitektura

### Tech Stack

- **Framework:** NestJS 10.x
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5.x
- **Authentication:** JWT (Access + Refresh Tokens)
- **Real-time:** WebSocket (Socket.IO)
- **File Storage:** Local filesystem / S3 (optional)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Logging:** Winston / NestJS Logger

### Folder Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/
│   ├── guards/
│   ├── strategies/
│   └── auth.service.ts
├── users/                   # User management
│   ├── dto/
│   ├── entities/
│   └── users.service.ts
├── sessions/                # Recording sessions
│   ├── dto/
│   ├── entities/
│   └── sessions.service.ts
├── transcriptions/          # Transcription management
│   ├── dto/
│   └── transcriptions.service.ts
├── storage/                 # File storage (audio blobs)
│   └── storage.service.ts
├── websocket/               # Real-time features
│   └── websocket.gateway.ts
├── common/                  # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
├── config/                  # Configuration
│   └── configuration.ts
├── prisma/                  # Prisma schema & migrations
│   └── schema.prisma
└── main.ts
```

---

## 📊 Database Schema (Prisma)

### User Model

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  name          String?
  password      String    // Hashed with bcrypt
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  refreshTokens RefreshToken[]

  @@map("users")
}
```

### Session Model (Recording Session)

```prisma
model Session {
  id            String    @id @default(uuid())
  userId        Int
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  text          String    @db.Text
  audioUrl      String?   # Path to audio file
  audioSize     Int?      # File size in bytes
  duration      Float     @default(0) # Duration in seconds

  script        String    @default("lat") # "lat" or "cyr"

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId, createdAt])
  @@map("sessions")
}
```

### RefreshToken Model

```prisma
model RefreshToken {
  id            String    @id @default(uuid())
  userId        Int
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  token         String    @unique
  expiresAt     DateTime
  createdAt     DateTime  @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}
```

---

## 🔐 Authentication System

### Endpoints

#### 1. Register

```
POST /auth/register
Body: {
  email: string;
  password: string;
  name?: string;
}
Response: {
  user: { id, email, name }
  accessToken: string;
  refreshToken: string;
}
```

#### 2. Login

```
POST /auth/login
Body: {
  email: string;
  password: string;
}
Response: {
  user: { id, email, name }
  accessToken: string;
  refreshToken: string;
}
```

#### 3. Refresh Token

```
POST /auth/refresh
Body: {
  refreshToken: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
}
```

#### 4. Logout

```
POST /auth/logout
Headers: Authorization: Bearer {accessToken}
Body: {
  refreshToken: string;
}
Response: { message: "Logged out successfully" }
```

#### 5. Get Current User

```
GET /auth/me
Headers: Authorization: Bearer {accessToken}
Response: {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}
```

### JWT Strategy

- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry
- **Secret:** Environment variable `JWT_SECRET`
- **Algorithm:** HS256

### Password Security

- Hash: bcrypt with 10 rounds
- Validation: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number

---

## 📝 Sessions API

### Endpoints

#### 1. Create Session

```
POST /sessions
Headers: Authorization: Bearer {accessToken}
Body: {
  text: string;
  audioBlob?: File; # Multipart form-data
  duration: number;
  script?: "lat" | "cyr";
}
Response: {
  id: string;
  text: string;
  audioUrl: string | null;
  duration: number;
  script: string;
  createdAt: string;
}
```

#### 2. Get All Sessions (Paginated)

```
GET /sessions?page=1&limit=20&sortBy=createdAt&order=desc
Headers: Authorization: Bearer {accessToken}
Response: {
  data: Session[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

#### 3. Get Session by ID

```
GET /sessions/:id
Headers: Authorization: Bearer {accessToken}
Response: {
  id: string;
  text: string;
  audioUrl: string | null;
  duration: number;
  script: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 4. Update Session

```
PATCH /sessions/:id
Headers: Authorization: Bearer {accessToken}
Body: {
  text?: string;
  script?: "lat" | "cyr";
}
Response: {
  id: string;
  text: string;
  script: string;
  updatedAt: string;
}
```

#### 5. Delete Session

```
DELETE /sessions/:id
Headers: Authorization: Bearer {accessToken}
Response: {
  message: "Session deleted successfully"
}
```

#### 6. Download Audio

```
GET /sessions/:id/audio
Headers: Authorization: Bearer {accessToken}
Response: Audio file stream (audio/webm or audio/mp4)
```

#### 7. Get Session Statistics

```
GET /sessions/stats
Headers: Authorization: Bearer {accessToken}
Response: {
  totalSessions: number;
  totalDuration: number; # in seconds
  averageDuration: number;
  totalAudioSize: number; # in bytes
}
```

---

## 🔄 Real-time Features (WebSocket)

### Connection

```
ws://localhost:3000/ws
Headers: {
  Authorization: Bearer {accessToken}
}
```

### Events

#### Client → Server

1. **join_session**

```typescript
{
  event: 'join_session',
  data: {
    sessionId: string;
  }
}
```

2. **transcription_update**

```typescript
{
  event: 'transcription_update',
  data: {
    sessionId: string;
    text: string;
    isFinal: boolean;
  }
}
```

3. **leave_session**

```typescript
{
  event: 'leave_session',
  data: {
    sessionId: string;
  }
}
```

#### Server → Client

1. **session_joined**

```typescript
{
  event: 'session_joined',
  data: {
    sessionId: string;
    message: string;
  }
}
```

2. **transcription_received**

```typescript
{
  event: 'transcription_received',
  data: {
    sessionId: string;
    text: string;
    isFinal: boolean;
    timestamp: string;
  }
}
```

3. **error**

```typescript
{
  event: 'error',
  data: {
    message: string;
    code: string;
  }
}
```

---

## 👤 User Management

### Endpoints

#### 1. Get User Profile

```
GET /users/profile
Headers: Authorization: Bearer {accessToken}
Response: {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  sessionCount: number;
}
```

#### 2. Update Profile

```
PATCH /users/profile
Headers: Authorization: Bearer {accessToken}
Body: {
  name?: string;
  email?: string;
}
Response: {
  id: number;
  email: string;
  name: string;
  updatedAt: string;
}
```

#### 3. Change Password

```
POST /users/change-password
Headers: Authorization: Bearer {accessToken}
Body: {
  currentPassword: string;
  newPassword: string;
}
Response: {
  message: "Password changed successfully"
}
```

#### 4. Delete Account

```
DELETE /users/account
Headers: Authorization: Bearer {accessToken}
Body: {
  password: string; # Confirmation
}
Response: {
  message: "Account deleted successfully"
}
```

---

## 📁 File Storage

### Configuration

- **Storage Type:** Local filesystem (uploads/)
- **Max File Size:** 50MB
- **Allowed Formats:** audio/webm, audio/mp4, audio/wav, audio/mpeg
- **Naming Convention:** `{userId}/{sessionId}.{ext}`

### Storage Service Methods

```typescript
class StorageService {
  async saveAudio(
    file: Express.Multer.File,
    userId: number,
    sessionId: string
  ): Promise<string>;
  async getAudio(audioUrl: string): Promise<Buffer>;
  async deleteAudio(audioUrl: string): Promise<void>;
  async getFileSize(audioUrl: string): Promise<number>;
}
```

---

## 🛡️ Security & Validation

### Global Guards

1. **JwtAuthGuard** - Protect all routes except auth endpoints
2. **RolesGuard** - Future admin/user role separation

### Validation Pipes

- **ValidationPipe** - Global DTO validation
- **ParseIntPipe** - ID parameter validation
- **ParseUUIDPipe** - UUID validation

### Error Handling

```typescript
// Custom Exception Filter
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### CORS Configuration

```typescript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}
```

### Rate Limiting

- **Global:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes

---

## 📝 DTOs (Data Transfer Objects)

### Auth DTOs

```typescript
// register.dto.ts
class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}

// login.dto.ts
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### Session DTOs

```typescript
// create-session.dto.ts
class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;

  @IsOptional()
  audioBlob?: Express.Multer.File;
}

// update-session.dto.ts
class UpdateSessionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;
}

// query-sessions.dto.ts
class QuerySessionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn(["createdAt", "duration", "updatedAt"])
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc" = "desc";
}
```

---

## 🔧 Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/matozai?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=debug
```

---

## 🚀 API Response Standards

### Success Response

```typescript
{
  statusCode: 200 | 201,
  data: T,
  message?: string
}
```

### Error Response

```typescript
{
  statusCode: 400 | 401 | 403 | 404 | 500,
  message: string | string[],
  error: string,
  timestamp: string,
  path: string
}
```

### Pagination Response

```typescript
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

## 📊 Logging Strategy

### Log Levels

- **error:** Critical errors, exceptions
- **warn:** Warnings, deprecated usage
- **info:** Important events (user login, session created)
- **debug:** Detailed debugging information
- **verbose:** Very detailed logs

### Log Format

```typescript
{
  timestamp: string,
  level: string,
  context: string,
  message: string,
  userId?: number,
  requestId?: string,
  metadata?: any
}
```

---

## 🧪 Testing Requirements

### Unit Tests

- All services must have >80% coverage
- Test all business logic methods
- Mock external dependencies

### Integration Tests

- Test all API endpoints
- Test authentication flow
- Test file upload/download
- Test WebSocket events

### E2E Tests

- Complete user journey: Register → Login → Create Session → Get Sessions → Logout
- File upload and retrieval flow
- WebSocket real-time updates

---

## 📈 Performance Optimization

### Database

- Index on `userId` and `createdAt` for sessions
- Use connection pooling (Prisma default)
- Implement query result caching for stats

### File Storage

- Stream large files instead of loading into memory
- Implement file compression for audio storage
- Consider CDN for production

### API

- Implement response caching for GET requests
- Use compression middleware (gzip)
- Implement request throttling

---

## 🔄 Migration Strategy

### Prisma Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Seed Data (Optional)

```typescript
// prisma/seed.ts
async function main() {
  const user = await prisma.user.create({
    data: {
      email: "demo@matozai.com",
      password: await bcrypt.hash("Demo1234", 10),
      name: "Demo User",
    },
  });
}
```

---

## 📚 API Documentation (Swagger)

### Setup

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle("MatozAI API")
  .setDescription("Backend API for MatozAI voice-to-text platform")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);
```

### Access

- **URL:** `http://localhost:3000/api/docs`
- **Format:** OpenAPI 3.0

---

## 🚦 Deployment Checklist

### Pre-deployment

- [ ] Set strong JWT_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry)
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Configure file storage (S3 for production)

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 🔗 Integration with Frontend

### Frontend Changes Required

1. **Install Dependencies**

```bash
npm install axios socket.io-client
```

2. **Create API Client**

```typescript
// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add refresh token interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          "http://localhost:3000/auth/refresh",
          {
            refreshToken,
          }
        );

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

3. **Update Storage Service**

```typescript
// Replace IndexedDB calls with API calls
import api from "./api";

class StorageService {
  async saveSession(session: SavedSession) {
    const formData = new FormData();
    formData.append("text", session.text);
    formData.append("duration", session.duration.toString());
    if (session.audioBlob) {
      formData.append("audioBlob", session.audioBlob);
    }
    if (session.script) {
      formData.append("script", session.script);
    }

    const response = await api.post("/sessions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async getSessions(): Promise<SavedSession[]> {
    const response = await api.get("/sessions");
    return response.data.data;
  }

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/sessions/${id}`);
  }

  async getSession(id: string): Promise<SavedSession> {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  }
}

export const storageService = new StorageService();
```

4. **Add Authentication Service**

```typescript
// src/services/authService.ts
import api from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name?: string;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post("/auth/register", data);
    this.saveTokens(response.data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login", credentials);
    this.saveTokens(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("refreshToken");
    await api.post("/auth/logout", { refreshToken });
    this.clearTokens();
  }

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  }

  private saveTokens(data: AuthResponse) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  }

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();
```

5. **Add WebSocket Service**

```typescript
// src/services/socketService.ts
import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = localStorage.getItem("accessToken");

    this.socket = io("http://localhost:3000/ws", {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(sessionId: string) {
    this.socket?.emit("join_session", { sessionId });
  }

  leaveSession(sessionId: string) {
    this.socket?.emit("leave_session", { sessionId });
  }

  sendTranscriptionUpdate(sessionId: string, text: string, isFinal: boolean) {
    this.socket?.emit("transcription_update", { sessionId, text, isFinal });
  }

  onTranscriptionReceived(callback: (data: any) => void) {
    this.socket?.on("transcription_received", callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on("error", callback);
  }
}

export const socketService = new SocketService();
```

6. **Add Authentication Screen Component**

```typescript
// src/components/AuthScreen.tsx
import React, { useState } from "react";
import { authService } from "../services/authService";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login({ email, password });
      } else {
        await authService.register({ email, password, name });
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          MatozAI
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Ism"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading
              ? "Yuklanmoqda..."
              : isLogin
              ? "Kirish"
              : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? "Akkauntingiz yo'qmi?" : "Akkauntingiz bormi?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-600 hover:underline"
          >
            {isLogin ? "Ro'yxatdan o'tish" : "Kirish"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
```

7. **Update App.tsx**

```typescript
// Add authentication check
import { authService } from "./services/authService";
import AuthScreen from "./components/AuthScreen";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  // Rest of the app...
};
```

---

## 📞 Support & Maintenance

### Health Check Endpoint

```
GET /health
Response: {
  status: "ok",
  database: "connected",
  uptime: number,
  timestamp: string
}
```

### Monitoring Metrics

- Request count per endpoint
- Average response time
- Error rate
- Database query performance
- Active WebSocket connections

---

## 🎯 Future Enhancements

1. **AI Integration**

   - Direct Gemini API integration on backend
   - Server-side transcription processing
   - Batch processing for uploaded files

2. **Advanced Features**

   - Session sharing (public links)
   - Collaborative editing
   - Voice notes with timestamps
   - Search within transcriptions

3. **Analytics**

   - User activity dashboard
   - Usage statistics
   - Popular transcription times

4. **Mobile App Support**
   - Dedicated mobile API endpoints
   - Push notifications
   - Offline sync

---

## 📄 License

MIT License - Same as frontend

---

**Tayyorlandi:** MatozAI Development Team  
**Versiya:** 1.0.0  
**Sana:** 2025-11-30
