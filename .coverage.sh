#!/bin/bash
mkdir -p coverage
lab -r lcov -o coverage/lab.lcov -r html -o coverage/index.html
istanbul cover cucumber.js --lcovonly -- --tags ~@ignore --format json > /dev/null
lcov-result-merger 'coverage/*.lcov' 'coverage/merged.lcov'
