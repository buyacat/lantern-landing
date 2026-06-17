#!/usr/bin/env bash
set -e
rm -rf dist
cp -r src dist
echo "Built → dist/"
