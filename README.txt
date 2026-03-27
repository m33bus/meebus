HOW TO USE

1. Put your 3D head model in the assets folder.
2. Rename it to exactly:
   head.glb
3. Upload the whole folder to your GitHub repo.
4. Turn on GitHub Pages for the repo.

WHAT IS INCLUDED
- black background
- floating 3D head
- iPhone touch drag rotation
- slow return to center after release
- red lowercase Helvetica nav words:
  music / merch / contact / other
- loading screen with animated loading dots and a red load bar
- smaller default head presentation size

FILES
- index.html    main page
- style.css     layout and text styling
- app.js        3D scene and touch rotation behavior
- assets/       put head.glb here

QUICK SIZE ADJUSTMENT
If you want the head bigger or smaller later, open app.js and change:

  const desiredHeight = 2.45;

Bigger number = bigger head
Smaller number = smaller head

NOTES
- This is built for GitHub Pages.
- The page uses Three.js from a CDN.
- If your model uses external textures, keep using a .glb if possible so everything is embedded.
- If your model has a different filename, change MODEL_PATH near the top of app.js.
- The fallback gray head only appears if head.glb is missing, so the page still loads for testing.
