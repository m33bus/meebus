HEAD SITE SETUP

Put these files in your GitHub Pages repo root.

Required assets:
- ./assets/head.glb   -> your 3D head model
- ./assets/logo.png   -> your top logo image
- ./assets/song.mp3   -> the song you want to play

Notes:
- To change the song later, just replace assets/song.mp3 with a new file using the same name.
- On iPhone, audio with sound is often blocked until the first tap. This build tries to play on load and again on first interaction.
- Placeholder pages are:
  - music.html
  - merch.html
  - other.html

Main edits included:
- contact removed
- loading text only with animated dots
- top logo fades in and pulses/glows
- glowy site haze overlay
- camera position set to 0,0,0
- bottom music link lifted higher for iPhone browser chrome
