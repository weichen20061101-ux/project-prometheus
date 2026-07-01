# Project Prometheus Deployment

This project is prepared for static deployment on GitHub Pages.

## What is already prepared

- `vite.config.js` uses `base: "./"` so the built assets work on GitHub Pages project URLs.
- `.github/workflows/deploy-pages.yml` builds the Vite app and deploys `dist/` to GitHub Pages.
- `pnpm build` produces the deployable output in `dist/`.

## What you need to do

### 1. Create a GitHub repository

- Create a new repository on GitHub.
- Push this project to the `main` branch.

### 2. Enable GitHub Pages

- Open the repository on GitHub.
- Go to `Settings -> Pages`.
- Set the source to `GitHub Actions`.

### 3. Trigger the first deployment

- Push to `main`, or manually run the `Deploy GitHub Pages` workflow.
- Wait for the workflow to finish.
- GitHub will provide the Pages URL.

## What I can handle later

Once the repository exists, I can help with:

- checking the workflow files
- adjusting the build if the repo path changes
- preparing a custom-domain setup

## What you must handle yourself

- creating the GitHub repository
- logging into GitHub and granting Pages / Actions permissions
- buying a domain later, if you want one
- changing DNS records later, if you bind a custom domain
