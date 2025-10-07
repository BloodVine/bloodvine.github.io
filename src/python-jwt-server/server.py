# server.py - minimal Flask server to create JWTs
import os
import time
from flask import Flask, request, jsonify
import jwt
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore

load_dotenv()
SECRET = os.environ.get("PY_JWT_SECRET", "very-secret-please-change")
JWT_EXP_SECONDS = int(os.environ.get("PY_JWT_EXP", 3600))

# Initialize Firebase Admin if provided
FIRE_CRED = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")  # path to service account json
if FIRE_CRED and os.path.exists(FIRE_CRED):
    cred = credentials.Certificate(FIRE_CRED)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    db = None

app = Flask(__name__)

@app.route("/health")
def health():
    return jsonify({"ok": True})

@app.route("/exchange-token", methods=["POST"])
def exchange_token():
    """
    Frontend could POST a Firebase ID token here, and we verify it and return a JWT
    """
    data = request.get_json() or {}
    id_token = data.get("idToken")
    if not id_token:
        return jsonify({"error": "no idToken"}), 400
    try:
        # verify with firebase admin
        decoded = fb_auth.verify_id_token(id_token)
        uid = decoded.get("uid")
        # Create our own JWT
        payload = {
          "sub": uid,
          "email": decoded.get("email"),
          "iat": int(time.time()),
          "exp": int(time.time()) + JWT_EXP_SECONDS
        }
        token = jwt.encode(payload, SECRET, algorithm="HS256")
        return jsonify({"token": token})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/signup", methods=["POST"])
def signup():
    """
    Optional server route: create user via Firebase Admin and return a signed JWT.
    Body: {email, password, displayName}
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    displayName = data.get("displayName")
    if not (email and password):
        return jsonify({"error":"missing"}), 400
    try:
        user = fb_auth.create_user(email=email, password=password, display_name=displayName)
        # Optionally store extra in Firestore
        if db:
            db.collection('users').document(user.uid).set({"displayName": displayName, "email": email, "createdAt": firestore.SERVER_TIMESTAMP})
        payload = {"sub": user.uid, "email": email, "iat": int(time.time()), "exp": int(time.time())+JWT_EXP_SECONDS}
        token = jwt.encode(payload, SECRET, algorithm="HS256")
        return jsonify({"token": token, "uid": user.uid})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
