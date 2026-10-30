# Keshav's notebook

The whole site is `index.html`. `api/ask.js` is optional and lets the sticky note answer live.

## Deploy on Vercel (about 5 minutes)
1. Install the CLI once: `npm i -g vercel`
2. In this folder run `vercel` and accept the defaults. That gives you a preview link.
3. Run `vercel --prod` to put it live at your-project.vercel.app.
4. Optional, for live sticky-note answers: in Vercel open Project → Settings → Environment Variables,
   add `ANTHROPIC_API_KEY`, then run `vercel --prod` again. Set a monthly spend limit on that key in the
   Anthropic console. Without the key the note uses its built-in answers.
5. Optional, custom domain: Project → Settings → Domains → add your domain and follow the DNS steps.


## Editing content
- Links, photo, podcast, experiments and posts: the `ME = { ... }` block near the top of the script in `index.html`.
- Your photo: put `me.jpg` next to `index.html` and set `photo:'me.jpg'`. The polaroid appears.
- When the essay is in your own words: set `ESSAY_IS_DRAFT = false` and edit the `LETTERS` text.
- Handwriting font: put `keshav-hand.ttf` next to `index.html` and uncomment the font block in `<head>`.
