# Universal Mind website deployment and rollback

## Environments

- Staging proofing site: `https://staging.universalmind.tv`
- Production site: `https://universalmind.tv`
- Staging publisher: `./deploy-panthur-staging.sh`
- Production publisher: `./deploy-panthurlive.sh`

Production publishing uses the dedicated `codexdeploy@universalmind.tv` FTP account, restricted to `/public_html`. Its credential is stored outside the repository in `/private/tmp/um-public-html-ftp-pass.txt` with owner-only permissions.

The Panthur deployment scripts remain the only website publishing method. GitHub stores version history and provides the rollback safety net; it does not automatically deploy either environment.

## GitHub branch model

Use one private GitHub repository for both environments:

- `main` records the exact source approved and deployed to production.
- `staging` records the current candidate deployed to the staging proofing site.

Keeping both branches in one repository makes the difference between staging and production visible while preserving the rule that production changes only after explicit approval.

## Production releases

After an approved staging build has been verified and deployed to production:

1. Fast-forward `main` to the verified staging commit.
2. Create an annotated tag named `production-YYYY-MM-DD-HHMM`.
3. Push `main`, `staging`, and the production tag to GitHub.

## Rollback

To restore an earlier production build:

1. Select the required `production-*` tag in GitHub.
2. Check out that tag locally.
3. Run the existing production publisher with `all-fast` so every non-video site file and the redirect layer are restored.
4. Verify the public user journey on `https://universalmind.tv`.
5. Return to the active branch after verification.

## Media scope

The repository excludes local `.mp4` masters because they total about 21 GB and exceed ordinary GitHub repository limits. Website source, deployment configuration, images, audio, catalogues, and other non-video assets are versioned. Hosted video delivery remains managed by the production media catalogue and Cloudflare Stream.
