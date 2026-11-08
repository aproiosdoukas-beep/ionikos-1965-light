#!/bin/sh
# Τρέχει όλα τα tests του φακέλου. Από τη ρίζα του repo: sh tests/run.sh
cd "$(dirname "$0")/.." || exit 1
for f in tests/*.test.js; do
  echo "# $f"
  node "$f" || exit 1
done
echo "ALL PASS"
