# Essential Layer Website

Static website for Essential Layer and Cottonique.

## Files

- `index.html`: Main website content
- `styles.css`: Brand styling and responsive layout
- `script.js`: Scroll reveal animations and footer year
- `vercel.json`: Vercel deployment config
- `firebase.json`: Firebase Hosting config

## Local Preview

Run from the project folder:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy on Vercel

1. Push this folder to a Git repository.
2. In Vercel, click **Add New Project** and import the repository.
3. Framework preset: **Other**.
4. Build command: leave empty.
5. Output directory: leave empty.
6. Deploy.

## Deploy on Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login:
   ```bash
   firebase login
   ```
3. Initialize your project (if needed):
   ```bash
   firebase use --add
   ```
4. Deploy:
   ```bash
   firebase deploy --only hosting
   ```
