# Multi-Tenant Data Isolation Guide — LexAI

This guide covers how to ensure every user sees only their own data — both on the UI and the backend. It describes patterns that work with the current FastAPI + Next.js stack.

---

## Table of Contents

1. [Core Principle: Ownership](#1-core-principle-ownership)
2. [Backend — Database-Level Isolation](#2-backend--database-level-isolation)
3. [Backend — API-Level Enforcement](#3-backend--api-level-enforcement)
4. [Backend — Auth Middleware & Token Decoding](#4-backend--auth-middleware--token-decoding)
5. [Frontend — UI State per User](#5-frontend--ui-state-per-user)
6. [Frontend — Route Guards](#6-frontend--route-guards)
7. [End-to-End Flow Summary](#7-end-to-end-flow-summary)
8. [Common Pitfalls](#8-common-pitfalls)

---

## 1. Core Principle: Ownership

Every database row that belongs to a user MUST carry a `user_id` foreign key. Queries ALWAYS filter by the current user's ID derived from the JWT token. NEVER trust a `user_id` sent from the client.

```
┌─────────┐     JWT token     ┌──────────┐    user_id filter    ┌───────────┐
│ Frontend │ ──── bearer ────> │  FastAPI  │ ──── WHERE ───────> │ PostgreSQL│
│          │ <── only my data  │           │ <── filtered rows   │           │
└─────────┘                   └──────────┘                      └───────────┘
```

---

## 2. Backend — Database-Level Isolation

### Schema Design

Every entity table must include `user_id`:

```sql
-- Cases table (example)
CREATE TABLE cases (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX idx_cases_user_id ON cases(user_id);

-- Documents, analyses, reports follow the same pattern
CREATE TABLE documents (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id   INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    filename  VARCHAR(255) NOT NULL,
    -- ...
);
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

### Why `ON DELETE CASCADE`?

When a user deletes their account, all their data is automatically cleaned up. Row-level security (RLS) on PostgreSQL adds an extra safety layer but isn't strictly required if you follow the query pattern below.

### Optional: PostgreSQL Row-Level Security (defense-in-depth)

```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_isolation ON cases
    USING (user_id = current_setting('app.current_user_id')::INTEGER);
```

This prevents leaking data even if a query forgets the `WHERE user_id = ...` clause.

---

## 3. Backend — API-Level Enforcement

### The golden rule: never accept `user_id` from the client

```python
# ❌ WRONG — client can pass any user_id
@app.post("/cases")
def create_case(payload: CaseCreate, user_id: int = Body(...)):
    ...

# ✅ CORRECT — user_id comes from the JWT token
@app.post("/cases")
def create_case(
    payload: CaseCreate,
    current_user: User = Depends(get_current_user)
):
    case = Case(**payload.dict(), user_id=current_user.id)
    db.add(case)
    db.commit()
    return case
```

### Query pattern: always filter by `current_user.id`

```python
# List only MY cases
@app.get("/cases")
def list_cases(current_user: User = Depends(get_current_user)):
    return db.query(Case).filter(Case.user_id == current_user.id).all()

# Get a specific case — ensure it belongs to the current user
@app.get("/cases/{case_id}")
def get_case(case_id: int, current_user: User = Depends(get_current_user)):
    case = (
        db.query(Case)
        .filter(Case.id == case_id, Case.user_id == current_user.id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

# Update
@app.put("/cases/{case_id}")
def update_case(
    case_id: int,
    payload: CaseUpdate,
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(
        Case.id == case_id, Case.user_id == current_user.id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(case, key, val)
    db.commit()
    return case

# Delete
@app.delete("/cases/{case_id}")
def delete_case(case_id: int, current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(
        Case.id == case_id, Case.user_id == current_user.id
    ).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"ok": True}
```

### Using SQLAlchemy session filters (DRY pattern)

For larger projects, use a session wrapper that automatically applies the filter:

```python
from sqlalchemy.orm import Session

class TenantSession:
    """Wraps a SQLAlchemy session to auto-filter by user_id."""

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def query(self, model):
        return self.db.query(model).filter(model.user_id == self.user_id)

    def get_or_404(self, model, id):
        obj = self.db.query(model).filter(
            model.id == id, model.user_id == self.user_id
        ).first()
        if not obj:
            raise HTTPException(status_code=404)
        return obj
```

Usage:
```python
@app.get("/documents")
def list_docs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ts = TenantSession(db, current_user.id)
    return ts.query(Document).all()
```

---

## 4. Backend — Auth Middleware & Token Decoding

The `get_current_user` dependency decodes the JWT, extracts the `sub` (subject/user_id), and returns a `User` object:

```python
from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401)
    return user
```

The JWT payload should carry `sub` as the user's primary key:

```python
def create_access_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

---

## 5. Frontend — UI State per User

### Auth context (already implemented)

The `AuthContext` in `contexts/auth-context.tsx` holds the logged-in user's token and username. All protected pages consume this via `useAuth()`.

### Fetching data with the user's token

All API calls include the JWT in the `Authorization` header:

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("lexai_token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    // Token expired or invalid — force logout
    localStorage.removeItem("lexai_token");
    localStorage.removeItem("lexai_username");
    window.location.href = "/login";
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Request failed");
  }
  return res.json();
}

// Usage in components/pages:
const cases = await fetchWithAuth("/cases");
```

### Page/component pattern: always fetch from YOUR data

```typescript
// app/(dashboard)/cases/page.tsx (example pattern)
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/api";

export default function CasesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchWithAuth("/cases").then(setCases);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Cases</h1>
      {cases.length === 0
        ? <p>No cases yet. Create your first case.</p>
        : <ul>{cases.map(c => <li key={c.id}>{c.title}</li>)}</ul>
      }
    </div>
  );
}
```

### Dashboard stats: user-scoped

The dashboard stats card (`Total Cases`, `Documents`, etc.) fetches from `/cases?count=true`, `/documents?count=true`, etc. Each endpoint filters by `current_user.id` on the backend, so every user only sees their own numbers.

---

## 6. Frontend — Route Guards

### Middleware-based (recommended for Next.js)

```typescript
// middleware.ts (at project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/cases", "/documents", "/ai-analysis", "/jury-simulation", "/reports", "/settings"];
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lexai_token")?.value;
  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(r => path.startsWith(r));
  const isAuthPage = authRoutes.some(r => path.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
```

### Client-side guard (fallback, already in auth-context)

The `useAuth()` hook exposes `isAuthenticated`. Wrap protected pages:

```typescript
export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) return <p>Redirecting...</p>;

  return <div>Protected content here</div>;
}
```

---

## 7. End-to-End Flow Summary

```
1. User logs in     →  POST /token returns { access_token, token_type }
2. Frontend saves   →  localStorage.setItem("lexai_token", token)
3. Frontend sends   →  Authorization: Bearer <token> on every API call
4. Backend decodes  →  get_current_user() extracts user_id from JWT sub claim
5. Backend filters  →  WHERE user_id = <decoded> on every DB query
6. Frontend renders →  Only the current user's cases, docs, analyses, reports
7. User logs out    →  localStorage cleared, redirected to /login
```

---

## 8. Common Pitfalls

| Pitfall | Why it happens | Fix |
|---------|---------------|-----|
| Accepting `user_id` from request body | Client can forge any ID | Remove `user_id` from request schema; derive from token |
| `GET /cases` without `WHERE user_id` | Returns ALL users' cases | Always add `.filter(model.user_id == current_user.id)` |
| Not checking ownership on detail routes | `/cases/5` returns case 5 regardless of owner | Filter: `model.id == id AND model.user_id == current_user.id` |
| Storing token only in localStorage | Not accessible from middleware/server | Also set as httpOnly cookie (`setCookie` in `lib/auth.ts`) |
| Caching queries across users | Same cache key for different users | Include `user_id` in cache keys, or use per-session caches |
| Forgetting to index `user_id` | Full table scans on every query | `CREATE INDEX idx_<table>_user_id ON <table>(user_id)` |
| Admin/global views that expose all data | Dashboard shows site-wide stats | Either aggregate only, or explicitly separate admin views behind role checks |

---

## Next Steps for LexAI

1. **Create `middleware.ts`** — Add the route guard middleware described in section 6.
2. **Create `lib/api.ts`** — Add the `fetchWithAuth` helper so all pages use a consistent fetch pattern.
3. **Audit all API endpoints** — Ensure every endpoint that returns user-specific data filters by `current_user.id` with no exceptions.
4. **Add `user_id` index** — Verify every entity table has an index on `user_id`.
5. **Add token cookie** — The `setCookie`/`removeCookie` helpers in `lib/auth.ts` already exist — ensure they're called on login/logout so the middleware can read the token.