1. Put service account JSON path in env var GOOGLE_APPLICATION_CREDENTIALS (or place file)
2. Set PY_JWT_SECRET in environment
3. Deploy to your hosting (Render, Railway, Heroku, etc.)
4. Frontend can POST Firebase idToken to /exchange-token to receive signed JWT.
