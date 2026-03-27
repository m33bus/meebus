HOW TO USE

1. Put your 3D head model in the assets folder.
2. Rename it to exactly:
   head.glb
3. Upload the whole folder to your GitHub repo.
4. Turn on GitHub Pages for the repo.

FILES
- index.html    main page
- style.css     layout and text styling
- app.js        3D scene and touch rotation behavior
- assets/       put head.glb here

NOTES
- This is built for GitHub Pages.
- The page uses Three.js from a CDN.
- If your model uses external textures, keep using a .glb if possible so everything is embedded.
- If you want a different file name, change MODEL_PATH near the top of app.js.
- The fallback gray head only appears if head.glb is missing, so the page still loads for testing.
