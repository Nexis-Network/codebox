#!/bin/bash

set -e
SHA=`git rev-parse --short --verify HEAD`

cd dist/apps/remix-ide

# this gh action is used to deploy the build to the gh pages
mkdir dist/apps/remix-ide/.github
mkdir dist/apps/remix-ide/.github/workflows
cp apps/remix-ide/ci/gh-actions-deploy.yml dist/apps/remix-ide/.github/workflows

git init
git checkout -b gh-pages
git config user.name "$COMMIT_AUTHOR"
git config user.email "$COMMIT_AUTHOR_EMAIL"

echo "# Automatic build" > README.md
echo "Built website from \`$SHA\`. See https://github.com/ethereum/remix-ide/ for details." >> README.md
echo "To use an offline copy, download \`remix-$SHA.zip\`." >> README.md

zip -r remix-$SHA.zip .
git add .
git commit -m "Built website from {$SHA}."

git push -f git@github.com:ethereum/remix-live-alpha.git gh-pages
