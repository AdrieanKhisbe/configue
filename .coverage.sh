#!/bin/bash
lab -P spec -r lcov > ./coverage/lab.lcov
istanbul cover cucumber.js --lcovonly -- --tags ~@ignore --format json > /dev/null
lcov-result-merger 'coverage/*.lcov' 'coverage/merged.lcov'
cat ./coverage/merged.lcov |  coveralls
