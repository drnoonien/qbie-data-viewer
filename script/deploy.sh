#!/bin/bash

npm run build

sleep 1

git branch -D pages
git checkout -b pages

sleep 1

rm -rf ./src/
sleep 1
rm -rf ./public/
sleep 1
rm -rf ./script/
sleep 1

mv ./build/* ./

sleep 1

git add -A
git commit -m "build"
git push --set-upstream origin pages --force

sleep 1

git checkout master
git branch -D pages