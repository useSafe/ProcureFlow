# Firebase Security Rules Setup

To fix the "Permission denied" errors, you need to update your Firebase Realtime Database Security Rules.

Since this application currently uses simulated authentication (not real Firebase Auth), you need to allow public read/write access for the application to work, OR implement proper Firebase Authentication.

## Option 1: Development Mode (Public Access)
**WARNING:** This makes your database accessible to anyone. Only use for development/prototyping.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **My First Project** (procurewise-9e599).
3. Go to **Build** > **Realtime Database**.
4. Click on the **Rules** tab.
5. Replace the existing rules with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. Click **Publish**.

## Option 2: Secured (Requires Firebase Auth Implementation)
If you want to secure the data, you must implement `signInWithEmailAndPassword` using the Firebase SDK in `AuthContext.tsx`.

Current Rules (Likely causing error):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

**Recommendation:** For now, switch to **Option 1** to verify the application functionality.
