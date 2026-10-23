# Keshav's notebook

A portfolio you can flip through. The whole site is `index.html`; everything it shows lives in `assets/`.
`api/ask.js` is optional and lets the sticky note answer questions live.

```
index.html        the site: styles, content and script in one file
api/ask.js        optional Vercel function behind the sticky note and the tic-tac-toe
assets/
  images/         photos for the pages (me.jpg, simular-1.jpg, …)
    posters/      a still frame for each video, shown until the video starts
  videos/         demo videos (mp4)
```

## Before you deploy
- Every file the page uses has to be inside this folder. Paths are case-sensitive on Vercel
  (`Liam-1.jpg` works on a Mac and breaks online), so keep names lowercase.
- Keep each video under about 15 MB. H.264 `.mp4` plays everywhere. To shrink one:
  `ffmpeg -i in.mp4 -vf scale=1280:-2 -crf 28 -movflags +faststart out.mp4`
- Open the site locally the way a server would, so video and image paths are tested:
  `python3 -m http.server 8000`, then visit http://localhost:8000

## Deploy on Vercel
**With GitHub (recommended: every push redeploys)**
1. `git init`, commit this folder and push it to a new GitHub repo.
2. At vercel.com choose Add New → Project and import the repo.
3. Framework Preset: Other. Leave the build command and output directory empty. Deploy.

**With the command line**
1. `npm i -g vercel` (once).
2. Run `vercel` in this folder for a preview link, then `vercel --prod` to go live.

**Live sticky-note answers (optional)**
1. Project → Settings → Environment Variables: add `ANTHROPIC_API_KEY` for Production, then redeploy.
2. Use a key made only for this site and set a monthly spend limit on it in the Anthropic console.
   The function's rate limit (20 requests a minute per visitor) is per server instance, so the spend limit is the real cap.
3. `ANTHROPIC_MODEL` overrides the default model (`claude-haiku-5-5`).
4. Without a key the note uses its built-in answers and the tic-tac-toe plays on its own.

**Custom domain (optional)**: Project → Settings → Domains → add the domain and set the DNS records Vercel shows.

## After it's live
- Flip through every page on a phone and a laptop, in light and dark mode.
- Check that each video starts by itself (muted) and that "tap for sound" turns the sound on.
- Open each recommendation envelope and the essay.
- Click the outside links (GitHub, Chrome Web Store, Liam demo, LinkedIn, résumé, Spotify, YouTube, Instagram).
- Open the browser console and look for red errors such as a missing image.
- Click each video: it should open its original player (YouTube, Instagram or Drive) in a new tab.

## Editing content
Everything is in `index.html`.
- **Links, photo, podcast, posts:** the `ME = { … }` block near the top of the script.
- **Images and videos for a page:** the `ME.media` block just below it.
  - A project video: `{ video:VID + 'name.mp4', poster:POST + 'name.jpg', link:'https://youtu.be/…' }`.
    `link` is where a click on the video goes. Add `portrait:true` for a phone video, or `ratio:'4/3'` for a non-16:9 one.
  - Photos on an experience page: `{ imgs:[IMG + 'a.jpg', IMG + 'b.jpg'], caps:['caption one','caption two'] }`.
  - Pages with no entry show a small doodle.
  - To make a poster: `ffmpeg -ss 1 -i assets/videos/name.mp4 -frames:v 1 -vf scale=800:-2 -q:v 4 assets/images/posters/name.jpg`
- **Recommendations:** `ME.recs`. Add a person's name, position and text, and an envelope appears on that page.
  Paragraphs are separated by a blank line.
- **Pages:** the `PAGES` list. Each entry is one page, and the notebook needs an even number of pages
  (the back cover pairs with the last page). Add or remove pages in twos.
- **Essay and posts:** `LETTERS` (the essay) and `ME.posts`.
- **Handwriting font:** put `keshav-hand.ttf` next to `index.html` and uncomment the font block in `<head>`.
