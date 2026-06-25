# User Authentication Lifecycle

BhoomiOne operates a fully stateless session validation flow utilizing JSON Web Tokens.

---

## 🔑 Authentication Endpoints

### 1. User Login Credentials
Authenticate a user and retrieve a JWT session token.

* **Method**: `POST`
* **Route**: `/auth/login`
* **Request Payload**:
  ```json
  {
    "email": "surveyor@developerA.com",
    "password": "SecurePassword123"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "e6a2bc38-16aa-498c-8517-7cc757c617b0",
      "email": "surveyor@developerA.com",
      "role": "SURVEYOR",
      "tenant_id": "99ea7b4e-8fae-4f75-8bfb-4f9e160f8df4"
    }
  }
  ```

### 2. JWT Session Token Refresh
Request a fresh token to extend the active browser session.

* **Method**: `POST`
* **Route**: `/auth/refresh`
* **Headers**: `Authorization: Bearer <expired_token>`
* **Success Response (`200 OK`)**: Returns a fresh JWT token.

### 3. User Session Logout
Invalidates the current session token.

* **Method**: `POST`
* **Route**: `/auth/logout`
