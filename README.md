# Wholspace

The home for AI-native builders. Showcase your projects, connect with builders, and get discovered.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Your Firebase config is already set up in `src/lib/firebase.js`. Enable these services in Firebase Console:

#### Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Authentication
2. Click "Get Started"
3. Enable these sign-in providers:
   - **Email/Password**: Enable for email registration
   - **Google**: Click Google → Enable → Add support email → Save
   - **GitHub**: 
     - Go to [GitHub Developer Settings](https://github.com/settings/developers)
     - Create a new OAuth App
     - Set Homepage URL: `https://wholspace.firebaseapp.com`
     - Set Authorization callback URL: `https://wholspace.firebaseapp.com/__/auth/handler`
     - Copy Client ID and Client Secret to Firebase

#### Enable Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create Database"
3. Start in **test mode** (for development)
4. Choose a location closest to your users

#### Enable Storage (for images)
1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Start in **test mode**

### 3. Set Up Security Rules

#### Firestore Rules
Go to Firebase Console → Firestore → Rules and paste the contents of `firestore.rules`

#### Storage Rules
Go to Firebase Console → Storage → Rules and paste the contents of `storage.rules`

### 4. Create Firestore Indexes

Go to Firebase Console → Firestore → Indexes and create:

| Collection | Fields | Query Scope |
|------------|--------|-------------|
| users | isProfileComplete (Asc), projectCount (Desc) | Collection |
| users | isFeatured (Asc), isProfileComplete (Asc) | Collection |
| projects | userId (Asc), createdAt (Desc) | Collection |
| projects | isPublished (Asc), createdAt (Desc) | Collection |
| projects | category (Asc), isPublished (Asc), createdAt (Desc) | Collection |
| projects | tool (Asc), isPublished (Asc), createdAt (Desc) | Collection |
| follows | followingId (Asc), createdAt (Desc) | Collection |
| follows | followerId (Asc), createdAt (Desc) | Collection |

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000

## 📁 Project Structure

```
wholspace/
├── src/
│   ├── components/
│   │   ├── MyProjects.jsx      # My Projects page
│   │   └── AddProjectModal.jsx # Add new project modal
│   ├── contexts/
│   │   └── AuthContext.jsx     # Auth state management
│   ├── lib/
│   │   ├── firebase.js         # Firebase config
│   │   ├── firestore.js        # Database operations
│   │   └── storage.js          # File upload operations
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
├── index.html
├── package.json
└── vite.config.js
```

## 🔐 Authentication Features

- ✅ Email/Password with verification
- ✅ Google Sign-In
- ✅ GitHub Sign-In  
- ✅ Auto-create user profile on first sign-in
- ✅ Block unverified email users

## 📊 Database Features

- ✅ User profiles with social links
- ✅ Project listings with categories & tools
- ✅ Image upload (avatars, project screenshots)
- ✅ Like/Unlike projects
- ✅ Follow/Unfollow users
- ✅ Real-time stats

## 📸 Storage Features

- ✅ Avatar uploads (5MB max)
- ✅ Project thumbnails (10MB max)
- ✅ Multiple screenshots per project
- ✅ Auto-delete images when project deleted

## 🚀 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

## 📝 What's Included

### Pages
- **Home** - Marketplace landing page with featured builders and projects
- **My Projects** - User's project dashboard with add/delete functionality

### User Menu (when logged in)
- My Profile (coming soon)
- My Projects ✅
- Settings (coming soon)
- Log out

### Modals
- Auth Modal (Login/Register with email verification)
- Add Project Modal

## 🤝 Support

Built with ❤️ for the Wholspace community.
