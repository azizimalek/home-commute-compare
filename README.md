# Commute Compare

Compare travel times from multiple potential home locations to a single work location using Google Maps.

## Features

- **Pan** or **Select** map modes — pan to explore, select to drop markers
- Search locations by address (Malaysia)
- Drop markers on the map for **work** and multiple **home** candidates
- Rename each home individually
- Drag markers to fine-tune positions
- Defaults to **Selangor, Malaysia**
- Routes drawn on the map with travel time labels after comparing
- Map / Satellite view toggle
- Auto-saves your session to the browser (survives page reload)
- Compare commute times via the Google Distance Matrix API
- Travel modes: driving, transit, walking, cycling
- Results sorted by shortest travel time

## Setup

### 1. Get a Google Maps API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Distance Matrix API**
   - **Directions API**
   - **Geocoding API**
   - **Places API**
4. Create an API key under **APIs & Services → Credentials**
5. Restrict the key to your domain in production

### 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and set your API key:

```
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key
```

### 3. Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1. Use **Pan** mode to move around the map (default)
2. Switch to **Select** mode, choose **Work**, then click the map or search for your office
3. Choose **Home**, then click or search to add candidate locations
4. Click a home name in the sidebar to rename it
5. Drag markers to fine-tune positions
6. Choose a travel mode and click **Compare commute times**

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

A GitHub Actions workflow is included (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

### 1. Create a GitHub repository

```bash
cd commute-compare
git init
git add .
git commit -m "Initial commit"
gh repo create commute-compare --public --source=. --push
```

Or create the repo on GitHub manually, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/commute-compare.git
git branch -M main
git push -u origin main
```

### 2. Set the base path

If your repo is **not** named `commute-compare`, edit `.github/workflows/deploy.yml` and change:

```yaml
VITE_BASE: /commute-compare/
```

to `/your-repo-name/` (slashes required).

If the repo is `YOUR_USERNAME.github.io` (user site), use:

```yaml
VITE_BASE: /
```

### 3. Add your API key as a GitHub secret

1. Open the repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_GOOGLE_MAPS_API_KEY`
4. Value: your Google Maps API key

### 4. Enable GitHub Pages

1. **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

### 5. Restrict your Google API key

In [Google Cloud Console](https://console.cloud.google.com/) → **Credentials** → your API key → **Application restrictions**:

- Choose **HTTP referrers**
- Add:
  - `https://YOUR_USERNAME.github.io/*`
  - `http://localhost:*` (for local dev)

### 6. Deploy

Push to `main` — the workflow runs automatically. Your site will be at:

```
https://YOUR_USERNAME.github.io/commute-compare/
```

Check progress under the repo’s **Actions** tab.

### Auto-update when the repo changes

**GitHub Pages (no server needed)** — already automatic. Every `git push` to `main` triggers `.github/workflows/deploy.yml`, which rebuilds and publishes the site. You do not need `git clone` on a server for this.

**First-time clone (local machine)**

```bash
git clone https://github.com/YOUR_USERNAME/commute-compare.git
cd commute-compare
cp .env.example .env   # add your API key
npm install
npm run dev
```

**Update an existing clone**

```bash
cd commute-compare
git pull origin main
npm ci
npm run dev
```

Or use the helper script:

```bash
cd commute-compare
chmod +x scripts/update.sh
./scripts/update.sh
```

**Optional: auto-pull on a schedule (self-hosted)**

If you host the built app on your own machine/VPS and want it to pull when GitHub changes, add a cron job (example: every hour):

```bash
crontab -e
```

```cron
0 * * * * cd /path/to/commute-compare && ./scripts/update.sh >> /tmp/commute-compare-update.log 2>&1
```

For GitHub Pages, cron is not needed — pushes to `main` are enough.
