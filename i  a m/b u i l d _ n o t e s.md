# **BUILD_NOTES.md**

## **Purpose**

This document contains the current engineering decisions for the Universal Mind “i am” microsite.

Unlike `i am.md`, this file is expected to evolve throughout development.

---

# **Development Workflow**

The website is developed locally on Ben’s Mac using Codex.

The final deliverable is a folder ready for upload.

Ben is not expected to perform software development tasks beyond basic file management.

The goal is that Ben can simply upload the finished website to his hosting account.

---

# **Hosting**

Hosting provider:

Panthur.com.au

Hosting environment:

cPanel

The website should be exportable as a static website.

The finished output should consist of standard website files suitable for uploading to `public_html`.

Avoid requiring server-side configuration wherever possible.

---

# **Design Source**

The Keynote artwork is the master reference.

The screenshots inside the `/references` folder are the visual source of truth.

If the browser differs noticeably from the Keynote artwork, prioritise matching the Keynote.

Architectural panel correction:

The panel grid is 5 × 3.

Panel colour:

`#ff005e`

Panel opacity:

22%.

---

# **Build Philosophy**

Build in small iterations.

Version 0.1

Match Screen 1 only.

Initial implementation files:

- `index.html`
- `styles.css`
- `script.js`

Favicon:

The site uses the supplied Universal Mind flora PNG as both favicon and Apple touch icon.

Version 0.2

Add hero video playback.

Version 0.3

Add language transitions.

Version 0.4

Add Global Navigation Lightbox.

Version 1.0

Polish and optimisation.

Avoid building unnecessary features early.

---

# **Responsive Behaviour**

Desktop and laptop experience are the priority.

Tablet should preserve the same composition wherever practical.

Mobile should remain faithful to the design while adapting the layout appropriately.

Where responsive changes are required, preserve the creative intent before optimising for technical convenience.

---

# **Video**

Background video:

Silent.

Loops continuously.

Hosted via YouTube.

Hero videos:

Hosted via Vimeo.

Links supplied separately.

Problem Vimeo player ID:

`1205354450`

---

# **Performance**

Keep the homepage lightweight.

Load assets only when required.

Avoid unnecessary JavaScript.

Prefer smoothness over visual effects.

---

# **AI Collaboration**

Implement the approved design first.

Do not redesign.

Do not “improve” the interface without approval.

Suggestions are welcome but should be presented as optional prototypes.

Visual comparison is preferred over discussion.

---

# **Code Quality**

Write clean, well-organised code.

Comment only where useful.

Keep the project easy for future AI agents to understand.

Avoid unnecessary complexity.

---

# **Project Goal**

The objective is not simply to build a website.

The objective is to faithfully recreate the approved Keynote experience inside a web browser.
