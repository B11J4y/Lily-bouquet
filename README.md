# ASCII Lily Bouquet

A standalone animated lily bouquet drawn entirely in text characters, wrapped in paper and tied with a ribbon, slowly spinning under a twinkling night sky. It ends on the caption `F O R   Y O U   <3`. Zero dependencies: HTML + CSS + vanilla JS (Canvas 2D).

## Files
`index.html`, `styles.css`, `script.js` (all paths are relative, so it works at `https://USERNAME.github.io/REPO/`).

## Preview locally
```
python -m http.server 8000
```
Open http://localhost:8000 (the server is only for previewing; visitors need nothing).

## Publish on GitHub Pages
1. Create a new empty public repo (e.g. `lily-bouquet`).
2. Upload these files (or `git init && git add . && git commit -m "Lily bouquet" && git branch -M main && git remote add origin https://github.com/USERNAME/lily-bouquet.git && git push -u origin main`).
3. **Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save**.
4. After a minute open `https://USERNAME.github.io/lily-bouquet/`.

## Customize
- Top of `script.js`, the `CFG` object: caption text (`word`), `spin` speed, camera `pitch`, `seed`, `duration`.
- Just below it, the `VARIANTS` entry: `N` (how many flower heads), `R` (head size), `pals` (petal colours), `flower` (petal layers), `leaves`, and `theme` (background glows, star colours, paper and ribbon colours).
- With `prefers-reduced-motion` a finished static bouquet is shown; Pause and Replay buttons work by mouse, touch and keyboard.
