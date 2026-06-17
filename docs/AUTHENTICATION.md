# Authentication Flow

## Overview

The HR AI Platform uses JWT (JSON Web Token) based authentication with HMAC-SHA256 signing.

## Architecture

```
┌─────────────┐      Login Request      ┌──────────────┐
│   Client    │ ───────────────────────> │   Backend    │
│  (Browser)  │     POST /api/auth/login │   (FastAPI)  │
└─────────────┘                         └──────────────┘
                                             │
                                             │ 1. Validate credentials
                                             ▼
                                    ┌──────────────────┐
                                    │  AuthService     │
                                    │                  │
                                    │ - Verify password│
                                    │ - Create JWT     │
                                    └──────────────────┘
                                             │
                                             │ 2. Return token + user info
                                             ▼
┌─────────────┐    Auth Response    ┌──────────────┐
│   Client    │ <─────────────────── │   Backend    │
│  (Browser)  │  {access_token, ...} │   (FastAPI)  │
└─────────────┘                      └──────────────┘
```

## API Endpoints

### POST `/api/auth/login`

Authenticates a user and returns an access token.

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "depopova",
    "password": "your_password"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXBvcG92YSIsImlhdCI6MTYz..."
  "token_type": "bearer",
  "user": {
    "login": "depopova",
    "full_name": "Дарья Попова",
    "role": "HR business partner",
    "department": "HR"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Invalid credentials"
}
```

## JWT Token Structure

The access token is a JWT with the following structure:

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "depopova",                    // User login (subject)
  "iat": 1703001234,                    // Issued at timestamp
  "exp": 1703004834,                    // Expiration timestamp (+1 hour)
  "iss": "hr-ai-platform",              // Issuer
  "name": "Дарья Попова",               // User full name
  "role": "HR business partner",        // User role
  "department": "HR",                   // User department
  "auth_provider": "local-identity-provider"
}
```

### Signature
HMAC-SHA256 signed with a secret key.

## Client Usage

### 1. Login

```javascript
// frontend/src/api/client.js
const authApi = {
  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    
    return response.json();
  },
};

// Usage
const { access_token, user } = await authApi.login({
  login: 'depopova',
  password: 'your_password',
});

// Store token
localStorage.setItem('access_token', access_token);
```

### 2. Protected Requests

```javascript
// Include token in subsequent requests
const response = await fetch('/api/vacancies', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});
```

### 3. Token Validation (Backend)

```python
# backend/app/core/security.py
def create_access_token(subject: str, claims: dict, ttl_seconds: int = 3600) -> str:
    """Create a JWT access token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    
    body = {
        "sub": subject,
        "iat": now,
        "exp": now + ttl_seconds,
        "iss": os.getenv("JWT_ISSUER", "hr-ai-platform"),
        **claims,
    }
    
    # Sign with HMAC-SHA256
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(
        signing_key, 
        signing_input.encode(), 
        hashlib.sha256
    ).digest()
    
    return f"{signing_input}.{encoded_signature}"
```

## Security Features

1. **Password Hashing**: SHA-256 with HMAC comparison
2. **JWT Signing**: HMAC-SHA256 with configurable secret
3. **Token Expiration**: 1 hour default TTL
4. **Claim Validation**: Role, department, and provider claims
5. **Secure Comparison**: Prevents timing attacks

## Configuration

Environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ISSUER=hr-ai-platform

# Demo User (for development)
DEMO_USER_LOGIN=depopova
DEMO_USER_PASSWORD_HASH=<sha256_hash>
DEMO_USER_FULL_NAME=Дарья Попова
DEMO_USER_ROLE=HR business partner
DEMO_USER_DEPARTMENT=HR

# Authentication Mode
AUTH_MODE=local  # or keycloak
```

## Token Lifecycle

1. **Generation**: User provides credentials → Server validates → JWT created
2. **Storage**: Client stores token (localStorage/cookie)
3. **Usage**: Client includes token in `Authorization: Bearer <token>` header
4. **Expiration**: Token expires after 1 hour → Client must re-authenticate
5. **Refresh**: Not implemented yet (future feature)

## Error Handling

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Invalid credentials | Wrong login or password |
| 401 | Token expired | JWT has expired |
| 401 | Invalid token | Token signature mismatch |
| 501 | Not implemented | Keycloak mode not yet supported |

## Future Enhancements

- [ ] Token refresh mechanism
- [ ] Keycloak integration
- [ ] Multi-factor authentication
- [ ] Session management
- [ ] Rate limiting on login endpoint
