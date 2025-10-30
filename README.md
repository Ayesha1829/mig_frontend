# Migoyugo Game - Frontend Client

This is the frontend client for the Migoyugo game, built with React and TypeScript.

## Features

- Interactive 8x8 game board
- Real-time multiplayer gameplay
- AI opponents with different difficulty levels
- User authentication and profiles
- Game statistics and history
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sheesikram/production-frontend-game.git
cd production-frontend-game
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3002
```

### Running the Application

The client runs on port 3001 by default:

```bash
npm start
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

**Note**: Make sure the server is running on port 3002 for full functionality.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## 🐛 Debugging Google Authentication

If you're experiencing issues with Google authentication not preserving user data:

### Check Firestore Security Rules

Make sure your Firestore security rules allow reading user documents:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow users to read and write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow anyone authenticated to read user documents (for leaderboard)
      allow read: if request.auth != null;
    }
  }
}
```

### Check Browser Console Logs

When you sign in with Google, check the browser console for these logs:
1. `🔵 Starting Google sign-in...`
2. `🔵 Google sign-in successful! User UID: [YOUR_UID]`
3. `📝 createOrUpdateUser called with user:` - Shows your user data
4. `📝 Looking for existing user document at path: users/[YOUR_UID]`
5. Either:
   - `✅ Existing user found! Stats:` - Your data is being preserved ✓
   - `🆕 No existing user found, creating new user document` - New user created

### Common Issues

**Issue: Always shows "New user" even after multiple logins**
- **Cause**: Firestore security rules might be blocking the read operation
- **Solution**: Update your Firestore security rules (see above)

**Issue: Different UID each login**
- **Cause**: Using different Google accounts or browser clearing Firebase auth
- **Solution**: Make sure you're signing in with the same Google account

### Manual Database Check

1. Go to Firebase Console → Firestore Database
2. Open the `users` collection
3. Find your user document by searching for your email
4. Note the document ID (this should be your UID)
5. Sign out and sign back in with Google
6. Check console logs - the UID should match the document ID you noted

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
