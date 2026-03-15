# 🏠 EstateDesk — Full Setup Guide
### For complete beginners. Takes about 15 minutes.

---

## What You Need
- A computer or iPad Pro
- A free Supabase account (the database)
- A free Netlify account (the hosting)
- The EstateDesk project files (in the `estatedesk` folder)

---

## PART 1 — Set Up Your Database (Supabase)
*This is where all your dad's property and buyer data will live.*

### Step 1 — Create a Supabase account
1. Go to **https://supabase.com**
2. Click **"Start your project"** → Sign up with Google or email
3. Click **"New project"**
4. Give it a name like `estatedesk`
5. Choose a strong database password (save it somewhere!)
6. Pick the region closest to you
7. Click **"Create new project"** — wait about 1 minute

---

### Step 2 — Create the Properties table
1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL, then click **"Run"**:

```sql
CREATE TABLE properties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  title       text NOT NULL,
  address     text NOT NULL,
  price       numeric NOT NULL,
  type        text DEFAULT 'House',
  beds        integer DEFAULT 0,
  baths       integer DEFAULT 0,
  sqft        integer DEFAULT 0,
  status      text DEFAULT 'Available',
  description text,
  image       text
);

-- Allow anyone to read and write (since this is your dad's private app)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON properties FOR ALL USING (true) WITH CHECK (true);
```

---

### Step 3 — Create the Buyers table
1. Click **"New query"** again
2. Paste and run this:

```sql
CREATE TABLE buyers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  budget      numeric DEFAULT 0,
  interest    text DEFAULT 'Any',
  notes       text
);

-- Allow anyone to read and write
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON buyers FOR ALL USING (true) WITH CHECK (true);
```

---

### Step 4 — Get your API keys
1. In Supabase, click **"Project Settings"** (gear icon, bottom left)
2. Click **"API"**
3. Copy two things:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (a very long string starting with `eyJ...`)

---

### Step 5 — Add your keys to the app
1. Open the file: `estatedesk/src/supabaseClient.js`
2. Replace `YOUR_PROJECT_ID` with your Project URL
3. Replace `YOUR_ANON_PUBLIC_KEY` with your anon key
4. Save the file

It should look like this:
```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## PART 2 — Deploy to the Web (Netlify)
*This makes the app live at a real URL your dad can use.*

### Step 6 — Upload your project to GitHub
1. Go to **https://github.com** → Sign up for a free account
2. Click **"New repository"** → name it `estatedesk` → click **"Create repository"**
3. Upload all your project files by dragging them into the GitHub page

> **On iPad:** Use the **Working Copy** app (free) to manage your GitHub files easily.

---

### Step 7 — Deploy on Netlify
1. Go to **https://netlify.com** → Sign up free (use your GitHub account)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** → select your `estatedesk` repo
4. Set these build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **"Deploy site"**
6. Wait ~2 minutes → Netlify gives you a URL like `https://estatedesk-abc123.netlify.app`

---

### Step 8 — Share with your dad! 🎉
Send him the Netlify URL. He can:
- Bookmark it on his phone
- Add it to his home screen (tap Share → "Add to Home Screen" on iPhone/iPad)
- It works exactly like an app!

---

## Your Data is Safe
- All properties and buyers are stored in **Supabase** (not in the browser)
- Data persists forever — refreshing or closing the app changes nothing
- You can view/edit data directly in Supabase's dashboard anytime
- Free tier supports up to **500MB** of data and **50,000 monthly active users** — more than enough

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| App shows "Database Not Connected" | Check your keys in `supabaseClient.js` |
| Data not saving | Check Supabase → Table Editor to confirm tables exist |
| Build fails on Netlify | Make sure `package.json` and `vite.config.js` are in the root folder |
| Blank page after deploy | Check that `index.html` is in the root of the project |

---

## Need Help?
If you get stuck on any step, just come back to this Claude chat and describe what happened — I'll help you fix it!
