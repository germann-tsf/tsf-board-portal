#!/bin/bash
# TSF Board Portal - Push to GitHub
# Run this script from the tsf-board-app folder

cd "$(dirname "$0")"

echo "Initializing git repository..."
git init
git add -A
git commit -m "Initial commit: TSF Board Portal"
git branch -M main
git remote add origin https://github.com/germann-tsf/tsf-board-portal.git

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "Done! Your code is now on GitHub."
echo "Next step: Go to vercel.com and import this repository."
