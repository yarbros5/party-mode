# Inputs — Coming in Future Sprints

This folder will hold the two real-time input streams that feed Party Mode.

## Sprint 2: audioInput.js
Uses the **Web Audio API** to capture game audio from the browser tab.
Will analyze volume and beat energy, then call `lifxService.setColor()` in response.

## Sprint 3: screenInput.js
Uses the **Screen Capture API** (`getDisplayMedia`) to sample average colors
from the game screen in real time. Will send color data to Claude AI,
which combines it with audio data to decide what lighting to fire.
