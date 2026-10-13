# TopoStrawberry Website

Source code for the [TopoStrawberry project website](https://sprinkle-x.github.io/TopoStrawberry/). Dataset documentation and access terms are maintained in the [repository README](../README.md).

From the repository root, enter the website directory first:

```bash
cd website
```

## Development

```bash
npm install
npm start
```

## Build and validation

```bash
npm run build
npm run check:site
```

The build generates website/dist, which is ignored by Git. Edit source files rather than generated output. Local dependencies are installed in website/node_modules.

## Deployment

The [Deploy GitHub Pages workflow](../.github/workflows/deploy.yml) builds from website/ and publishes website/dist on pushes to main. Set the repository's Pages publishing source to **GitHub Actions**.

Assets use relative paths for both domain-root and repository-path hosting. The public website URL supplies canonical and Open Graph metadata; SITE_URL can override it for previews.

## Source structure

- src/pug/index.pug: dataset overview page
- src/pug/annotation-protocol.pug: annotation documentation
- src/pug/includes: shared navigation, footer, styles, and scripts
- src/scss/styles.scss: site styles
- src/js: navigation and interactive visualizations
- src/assets: site images, visualization data, and access application form
- scripts: build and validation tools

Legacy template pages under src/pug are excluded from the public build. The build system originated from the MIT-licensed Start Bootstrap Modern Business template; its copyright notice is retained in the [code license](../LICENSE).

## Maintenance

Repository changes made by Codex must remain uncommitted for the owner to review and commit. Do not use Codex as a Git author or committer.
