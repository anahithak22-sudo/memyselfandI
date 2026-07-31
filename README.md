# Anahit Hakobyan — Interactive Resume

A single-page interactive resume for **Anahit Hakobyan**, Project/Product Manager.

All content comes from the source CV. The visual language — black canvas, blue-to-violet
aurora gradient, floating dark cards, pill-shaped controls — is adapted from a supplied
design reference.

## Features

- **Command palette** (`⌘K` / `Ctrl K`) — fuzzy search across sections, roles, skills,
  certifications, and contact actions; full keyboard navigation.
- **Expandable role panels** on an animated career timeline.
- **Skill filters** — All / Hard skills / Soft skills.
- Scroll-spy navigation, reading-progress bar, and scroll-reveal transitions.
- Fully responsive from 320 px upward; respects `prefers-reduced-motion`; print stylesheet included.

## Stack

Plain HTML, CSS, and JavaScript. **No build step, no dependencies, no framework.**

```
index.html            markup and all content
assets/styles.css     design tokens and styling
assets/main.js        interactions
assets/favicon.svg    aurora monogram
netlify.toml          publish directory and security headers
```

## Run locally

Any static server works. For example:

```bash
npx serve .
```

Or:

```bash
python -m http.server 8080
```

Then open the printed URL.

## Deploy to Netlify

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project → GitHub**, then pick this repo.
3. Leave the **build command empty** and set the **publish directory** to `.`
   (`netlify.toml` already declares this, so the defaults should be correct).
4. Deploy.

Any push to the default branch redeploys the site automatically.
