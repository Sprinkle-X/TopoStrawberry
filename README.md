# Strawberry Dataset website

A responsive project website for a real-world strawberry dataset annotated with:

- one bounding box per fruit instance;
- five anatomical keypoints;
- ripeness labels;
- occlusion labels.

The public build is a focused single-page site. Legacy Start Bootstrap Pug pages are retained under `src/pug` for reference but are intentionally excluded from `dist`.

## Work on the site

Install dependencies:

```bash
npm install
```

Run the local preview with live reload:

```bash
npm start
```

Create a production build:

```bash
npm run build
```

The generated site is written to `dist`.

## Project structure

- `src/pug/index.pug` — page content and semantic structure
- `src/pug/includes` — shared navigation, footer, styles, and scripts
- `src/scss/styles.scss` — Bootstrap configuration and custom visual system
- `src/js/scripts.js` — lightweight navigation behavior
- `src/worker/index.js` — static asset delivery and security headers
- `src/assets` — optimized site and social-preview images
- `dist` — generated deployment output; do not edit this folder directly

## Content that still needs project-owner input

The website deliberately does not invent dataset statistics or publication details. Add the following when confirmed:

- dataset size and train/validation/test splits;
- paper URL and author list;
- dataset license;
- code repository and citation entry;
- alternative download mirrors.

## Credits

The build system began from the MIT-licensed Start Bootstrap Modern Business template. The public page design, content structure, and project branding have been replaced for the Strawberry Dataset website.
