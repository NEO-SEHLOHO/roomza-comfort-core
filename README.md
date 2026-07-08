# ResZa Student Room Marketplace

This folder is a separate static marketplace-style website for student rooms.

It is built to feel closer to Booking.com / Property24: students land on search, filter listings, compare prices and amenities, then enquire or log in only when they want to go deeper.

The public brand is `ResZa`. `ComfortCore` is used as the slogan/promise: helping students feel comfortable and settled when they move into a city they have never lived in before.

Login uses email and password only. Registration collects name, email, phone number, and password, then creates a Firebase Auth user and stores the student profile in Firestore under `users`. The header listens to Firebase Auth state and changes from `Login` to a signed-in greeting with `Logout`.

Room applications from the website are written to the same Firestore collection used by the Flutter application form: `residence_applications`. The website saves the core Flutter fields (`name`, `studentID`, `studentNumber`, `contact`, `gender`, `fundingType`, `nsfasRef`, `bursaryRef`, `uploadedFilePath`, `email`, `timestamp`, and `applicationStatus`) so existing admin/application screens can read them.

When a student is signed in, the header also counts matching `residence_applications` documents and shows how many applications that student has submitted.

## Files

- `index.html` - Marketplace layout, search, filters, listings, and modals.
- `styles.css` - Responsive marketplace styling.
- `script.js` - Search, filters, sorting, Firebase form submissions, and form feedback.
- `firebase-config.js` - Public-safe Firebase loader with blank placeholder values.
- `firebase-config.local.example.js` - Copy this to `firebase-config.local.js` locally and add your real Firebase web config there.
- `assets/` - Local room and logo images copied from the Flutter project.

## Firebase config

The GitHub-safe version does not need real Firebase values in `firebase-config.js`.

For local/live Firebase:

1. Copy `firebase-config.local.example.js` to `firebase-config.local.js`.
2. Paste the real Firebase web config into `firebase-config.local.js`.
3. Keep `firebase-config.local.js` out of git. It is ignored by `.gitignore`.

If Firebase config is missing, the website switches to local demo mode. Forms still work, login/register creates a local browser session, applications are saved in `localStorage`, and the application count still works in that browser. Demo-mode applications do not appear in the Firebase/admin side.

## Open

Use a local server:

```bash
python -m http.server 8091
```

No Flutter build is required for this version.

Then open `http://127.0.0.1:8091`.
