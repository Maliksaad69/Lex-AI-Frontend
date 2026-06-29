# Litigation MVP — Full-Stack Guide

> **Your stack:** Next.js 16 (App Router) + shadcn/ui v4 + FastAPI (Python) + MongoDB + Qdrant  
> **Current state:** Frontend scaffolded with login/signup UI, sidebar dashboard layout. Auth and backend not yet wired.

---

## 1. Folder Structure

```
litigation-mvp/                    # repo root
├── frontend/                      # Next.js 16 App Router (your current dir)
│   ├── app/
│   │   ├── layout.tsx             # root layout (theme, fonts)
│   │   ├── page.tsx               # landing / redirect
│   │   ├── globals.css            # tailwind + shadcn theme
│   │   ├── (auth)/                # route group — no sidebar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   └── (dashboard)/           # route group — has sidebar + auth guard
│   │       ├── layout.tsx         # sidebar wrapper + auth check
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── cases/
│   │       │   └── page.tsx
│   │       ├── ai-analysis/
│   │       │   └── page.tsx
│   │       ├── jury-simulation/
│   │       │   └── page.tsx
│   │       ├── documents/
│   │       │   └── page.tsx
│   │       ├── reports/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (button, input, card, ...)
│   │   ├── sidebar.tsx            # dashboard sidebar (move from ui/ if cleaner)
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── auth-guard.tsx         # NEW: client-side auth wrapper
│   ├── lib/
│   │   ├── utils.ts               # cn() helper (already exists)
│   │   ├── api-client.ts          # NEW: fetch wrapper with auth
│   │   └── auth.ts                # NEW: token helpers, user state
│   ├── hooks/
│   │   └── use-auth.ts           # NEW: auth React hook
│   ├── middleware.ts              # NEW: Next.js edge middleware (route protection)
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
└── backend/                       # Python FastAPI
    ├── main.py                    # app entrypoint, CORS, startup
    ├── config.py                  # settings (env vars, DB URLs)
    ├── requirements.txt
    ├── models/
    │   ├── __init__.py
    │   ├── user.py                # Pydantic + Beanie User model
    │   └── case.py                # Pydantic + Beanie Case model
    ├── routes/
    │   ├── __init__.py
    │   ├── auth.py                # login, signup, refresh, me
    │   ├── cases.py               # CRUD cases
    │   ├── analysis.py            # AI analysis endpoints
    │   ├── jury.py                # jury simulation
    │   ├── documents.py           # document upload / management
    │   └── reports.py             # report generation
    ├── services/
    │   ├── __init__.py
    │   ├── auth_service.py        # hashing, JWT create/verify
    │   ├── mongo_service.py       # MongoDB init + helpers
    │   └── qdrant_service.py      # Qdrant init + vector ops
    └── deps.py                    # FastAPI dependency injection (get_current_user)
```

---

## 2. Python Backend Setup

### 2.1 Create and enter the backend directory

```bash
mkdir backend
cd backend
python -m venv venv

# Windows activation:
venv\Scripts\activate
# or in Git Bash:
source venv/Scripts/activate
```

### 2.2 requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
motor==3.6.0           # async MongoDB driver
beanie==1.27.0         # ODM on top of motor
pydantic==2.9.0
pydantic-settings==2.5.0
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.12
qdrant-client==1.11.0
```

### 2.3 config.py — All environment variables in one place

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT
    jwt_secret: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "litigation_mvp"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "legal_docs"

    class Config:
        env_file = ".env"

settings = Settings()
```

### 2.4 main.py — App entrypoint

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from config import settings
from models.user import User
from models.case import Case
from routes import auth, cases, analysis, jury, documents, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB + init Beanie ODM
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(
        database=client[settings.mongo_db],
        document_models=[User, Case],
    )
    app.state.mongo_client = client
    yield
    # Shutdown
    client.close()


app = FastAPI(lifespan=lifespan)

# CORS — allow your Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["AI Analysis"])
app.include_router(jury.router, prefix="/api/jury", tags=["Jury Simulation"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

Run with:

```bash
uvicorn main:app --reload --port 8000
```

### 2.5 models/user.py — User document

```python
from beanie import Document
from pydantic import EmailStr
from datetime import datetime


class User(Document):
    email: str
    name: str
    hashed_password: str
    created_at: datetime = datetime.utcnow()
    is_active: bool = True

    class Settings:
        name = "users"
```

### 2.6 models/case.py — Case document

```python
from beanie import Document
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Case(Document):
    title: str
    description: str
    status: str = "open"          # open | active | closed
    plaintiff: str
    defendant: str
    user_id: str                  # owner
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "cases"
```

### 2.7 services/auth_service.py — Password hashing + JWT

```python
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
```

### 2.8 deps.py — FastAPI dependency (gets current user from token)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from services.auth_service import decode_access_token
from models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await User.get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### 2.9 routes/auth.py — Login / Signup / Me

```python
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from models.user import User
from services.auth_service import hash_password, verify_password, create_access_token
from deps import get_current_user

router = APIRouter()


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest):
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
    )
    await user.insert()

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name},
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "name": user.name},
    )


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "name": current_user.name}
```

### 2.10 routes/cases.py — Example CRUD (pattern for other routes)

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from models.user import User
from models.case import Case
from deps import get_current_user

router = APIRouter()


class CaseCreate(BaseModel):
    title: str
    description: str
    plaintiff: str
    defendant: str


@router.get("/")
async def list_cases(current_user: User = Depends(get_current_user)):
    cases = await Case.find(Case.user_id == str(current_user.id)).to_list()
    return cases


@router.post("/")
async def create_case(body: CaseCreate, current_user: User = Depends(get_current_user)):
    case = Case(
        title=body.title,
        description=body.description,
        plaintiff=body.plaintiff,
        defendant=body.defendant,
        user_id=str(current_user.id),
    )
    await case.insert()
    return case
```

### 2.11 services/qdrant_service.py — Vector DB helpers

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from config import settings


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)


def ensure_collection(client: QdrantClient):
    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )


def upsert_embedding(client: QdrantClient, point_id: str, vector: list[float], payload: dict):
    client.upsert(
        collection_name=settings.qdrant_collection,
        points=[PointStruct(id=point_id, vector=vector, payload=payload)],
    )
```

---

## 3. Frontend — Auth & Protected Routes

### 3.1 lib/auth.ts — Token management

```typescript
const TOKEN_KEY = "litigation_auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

### 3.2 lib/api-client.ts — Fetch wrapper that auto-attaches auth

```typescript
import { getToken, removeToken } from "./auth";

const API_BASE = "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || "Request failed", res.status);
  }

  return res.json();
}
```

### 3.3 hooks/use-auth.ts — React auth hook

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken, setToken, removeToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: if we have a token, verify it
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    const data = await apiFetch<{ access_token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return { user, loading, login, signup, logout };
}
```

### 3.4 middleware.ts — Edge-level redirect for unauthenticated users

> Place at `frontend/middleware.ts` (sibling of next.config.ts)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/cases",
  "/ai-analysis",
  "/jury-simulation",
  "/documents",
  "/reports",
  "/settings",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("litigation_auth_token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/ai-analysis/:path*",
    "/jury-simulation/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
```

> **Important:** For middleware to read the token, you need it in a cookie. Update `lib/auth.ts` to also set a cookie named `litigation_auth_token` with the same value. Simplest approach: in `login()` and `signup()`, after `setToken(...)`, also do `document.cookie = "litigation_auth_token=<token>; path=/; max-age=86400; SameSite=Lax"`. Then the middleware can read it via `request.cookies`.

### 3.5 app/(dashboard)/layout.tsx — Sidebar + Auth guard

```tsx
// app/(dashboard)/layout.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useState } from "react";
import {
  IconHome,
  IconBriefcase,
  IconBrain,
  IconGavel,
  IconFile,
  IconReport,
  IconSettings,
} from "@tabler/icons-react"; // adjust icons as needed

const links = [
  { label: "Dashboard",       href: "/dashboard",         icon: <IconHome className="h-5 w-5" /> },
  { label: "Cases",           href: "/cases",             icon: <IconBriefcase className="h-5 w-5" /> },
  { label: "AI Analysis",     href: "/ai-analysis",       icon: <IconBrain className="h-5 w-5" /> },
  { label: "Jury Simulation", href: "/jury-simulation",   icon: <IconGavel className="h-5 w-5" /> },
  { label: "Documents",       href: "/documents",         icon: <IconFile className="h-5 w-5" /> },
  { label: "Reports",         href: "/reports",           icon: <IconReport className="h-5 w-5" /> },
  { label: "Settings",        href: "/settings",          icon: <IconSettings className="h-5 w-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth (or a spinner)
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between">
          <div className="space-y-2">
            {links.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
```

### 3.6 Wire LoginForm to call the backend

Update `components/login-form.tsx` — the `<form>` needs `onSubmit`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
// ... keep all existing imports ...

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {/* ... header unchanged ... */}
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* ... email field: bind value + onChange to email state ... */}
              {/* ... password field: bind value + onChange to password state ... */}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Field>
                <Button type="submit">Login</Button>
                {/* ... signup link ... */}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 4. Page Shells — Drop these in each route

For each page (`cases/page.tsx`, `ai-analysis/page.tsx`, etc.), start with this shell and build from there:

```tsx
"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any[]>("/cases/")
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cases</h1>
      <pre className="text-sm">{JSON.stringify(cases, null, 2)}</pre>
    </div>
  );
}
```

---

## 5. Calling Python APIs — The Pattern

Every backend call from the frontend follows this pattern:

```
Frontend (Next.js)
    │
    ├── apiFetch("/cases/")          ← your wrapper (lib/api-client.ts)
    │       │
    │       ├── attaches Authorization: Bearer <token>
    │       ├── base URL = http://localhost:8000/api
    │       └── handles 401 → redirect to /login
    │
    ▼
Backend (FastAPI :8000)
    │
    ├── CORS allows localhost:3000
    ├── JWT verified in deps.py → get_current_user
    └── Returns JSON
```

**Calling from a Server Component (SSR):**

```tsx
// app/(dashboard)/cases/page.tsx  (NO "use client")
import { cookies } from "next/headers";

async function getCases() {
  const token = (await cookies()).get("litigation_auth_token")?.value;
  const res = await fetch("http://localhost:8000/api/cases/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function CasesPage() {
  const cases = await getCases();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cases</h1>
      <ul>{cases.map((c: any) => <li key={c._id}>{c.title}</li>)}</ul>
    </div>
  );
}
```

---

## 6. MongoDB + Qdrant — When to Use Each

| Concern | MongoDB | Qdrant |
|---|---|---|
| User accounts, cases, documents metadata | ✅ Primary store | ❌ |
| Full-text search | ✅ Atlas Search | ❌ |
| Semantic / vector search on legal docs | ❌ | ✅ |
| AI embeddings (case law similarity, jury bias analysis) | ❌ | ✅ Store vectors |
| CRUD operations | ✅ Beanie ODM | ❌ Use qdrant-client |

**Flow:** Store documents/cases in MongoDB. When you need AI features (similarity search, semantic retrieval, jury analysis), generate embeddings (e.g., via OpenAI `text-embedding-3-small`) and upsert them into Qdrant. Keep the `point_id` in Qdrant matching the MongoDB `_id` so you can cross-reference.

---

## 7. Dark Mode Fix (Next.js + next-themes + React 19)

You already have `next-themes` v0.4.6 with React 19. There's a known issue: the anti-flicker `<script>` tag doesn't execute because React 19 doesn't run `<script>` tags in JSX. Fix by adding to `app/layout.tsx` inside `<head>`:

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var theme = localStorage.getItem('theme');
            if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        })();
      `,
    }}
  />
</head>
```

---

## 8. Quickstart Checklist

1. **Backend:**
   - [ ] `cd backend && pip install -r requirements.txt`
   - [ ] Start MongoDB (`mongod`) and Qdrant (`docker run -p 6333:6333 qdrant/qdrant`)
   - [ ] `uvicorn main:app --reload --port 8000`
   - [ ] Test: `curl http://localhost:8000/api/health`

2. **Frontend:**
   - [ ] Create `lib/auth.ts`, `lib/api-client.ts`, `hooks/use-auth.ts`
   - [ ] Create `middleware.ts`
   - [ ] Create `app/(dashboard)/layout.tsx` with sidebar + auth guard
   - [ ] Update `login-form.tsx` and `signup-form.tsx` to use `useAuth()`
   - [ ] Create page shells for all 7 routes
   - [ ] Add dark mode `<script>` fix in root layout
   - [ ] `npm run dev` → http://localhost:3000

3. **Verify:**
   - [ ] Visit `/dashboard` without token → redirected to `/login`
   - [ ] Sign up → token saved → redirected to `/dashboard`
   - [ ] Each sidebar link navigates to its page
   - [ ] `/api/cases/` returns data (after creating some)

---

## 9. shadcn/ui Tips for Your Project

- **Add new components:** `npx shadcn@latest add <component>` — e.g., `table`, `dialog`, `tabs`, `textarea`, `select`, `badge`, `skeleton`, `toast`
- **Tone:** shadcn v4 uses CSS variables defined in `globals.css` — your `@theme inline` block maps them. Adding a component auto-adds the relevant vars.
- **Icons:** You have both `@tabler/icons-react` and `lucide-react`. Tabler has legal-adjacent icons (gavel, scale, file-report). For sidebar links, use Tabler: `IconGavel`, `IconScale`, `IconFileDescription`, `IconReportAnalytics`, `IconBrain`, `IconFolders`.
