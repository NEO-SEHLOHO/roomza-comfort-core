# ResZa Student Room Marketplace

This folder is a separate static marketplace-style website for student rooms.

It is built to feel closer to Booking.com / Property24: students land on search, filter listings, compare prices and amenities, then enquire or log in only when they want to go deeper.

The public brand is `ResZa`. `ComfortCore` is used as the slogan/promise: helping students feel comfortable and settled when they move into a city they have never lived in before.

Login uses email and password only. Registration collects name, email, phone number, and password, then creates a Firebase Auth user and stores the student profile in Firestore under `users`. The header listens to Firebase Auth state and changes from `Login` to a signed-in greeting with `Logout`.

Room applications from the website are written to the same Firestore collection used by the Flutter application form: `residence_applications`. The website saves the core Flutter fields (`name`, `studentID`, `studentNumber`, `contact`, `gender`, `fundingType`, `nsfasRef`, `bursaryRef`, `uploadedFilePath`, `email`, `timestamp`, and `applicationStatus`) so existing admin/application screens can read them.

## Files

- `index.html` - Marketplace layout, search, filters, listings, and modals.
- `styles.css` - Responsive marketplace styling.
- `script.js` - Search, filters, sorting, Firebase form submissions, and form feedback.
- `firebase-config.js` - Firebase web app connection copied from the existing Flutter Firebase config.
- `assets/` - Local room and logo images copied from the Flutter project.

## Open

Open `index.html` in a browser.

No Flutter build is required for this version.

For Firebase submissions, run the folder through a local server such as `python -m http.server`.
