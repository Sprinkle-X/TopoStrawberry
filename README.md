# TopoStrawberry website

Source code and deployment tooling for the [TopoStrawberry project website](https://sprinkle-x.github.io/TopoStrawberry/).

The website is the reference for dataset statistics, annotation conventions, benchmarks, licensing, and access requirements. This repository supports the website; it does not distribute the dataset.

## Dataset access

TopoStrawberry-RGBD is a controlled-access dataset for approved non-commercial research. There is no public dataset download link. Follow the [dataset access instructions on the website](https://sprinkle-x.github.io/TopoStrawberry/#resources) to obtain the application form and submit an access request.

## Local development

```bash
npm install
npm start
```

## Build and validation

```bash
npm run build
npm run check:site
```

The production build is generated in `dist`; edit source files rather than generated output.

## Deployment

The `Deploy GitHub Pages` workflow builds and publishes `dist` on pushes to `main`. Set the repository's Pages publishing source to **GitHub Actions**.

Assets use relative paths for domain-root and repository-path hosting. The public website URL supplies canonical and Open Graph metadata; `SITE_URL` can override it for previews.

## Source structure

- `src/pug/index.pug`: main page content and structure
- `src/pug/annotation-protocol.pug`: annotation protocol page
- `src/pug/includes`: shared navigation, footer, styles, and scripts
- `src/scss/styles.scss`: site styles
- `src/js`: navigation and interactive visualizations
- `src/assets`: website images, visualization data, and access application form
- `scripts`: build and validation tools
- `.github/workflows/deploy.yml`: GitHub Pages deployment

Legacy template pages under `src/pug` are excluded from the public build.

## Authors

## Template license

The build system originated from the MIT-licensed Start Bootstrap Modern Business template. The repository's MIT license covers website code; dataset licensing and access terms are documented on the project website.
