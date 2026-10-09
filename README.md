# Strawberry Dataset website

A responsive project website for a real-world strawberry dataset annotated with:

- one bounding box per fruit instance;
- five anatomical keypoints;
- maturity labels;
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

## GitHub Pages deployment

The `Deploy GitHub Pages` workflow builds and publishes `dist` on each push to
`main`. Set the repository's Pages publishing source to **GitHub Actions**.
CSS, JavaScript, images, downloads, and point-cloud data use relative paths,
so the same build works at the domain root or under a repository path.

The deployment reads the public URL from `actions/configure-pages`; no hosting
domain is embedded in the source. `SITE_URL` can optionally be set as a repository
Actions variable to override it. To switch to a custom domain, configure it in
Pages settings and rerun the workflow. Update or remove the override if one was set.

Local builds omit canonical and Open Graph URL tags unless the `SITE_URL`
environment variable is supplied. Run `npm run check:site` after a build to verify
local resources and navigation anchors.

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
