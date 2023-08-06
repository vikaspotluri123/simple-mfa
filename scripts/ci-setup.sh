#! /bin/bash

set -ex

yarn install --frozen-lockfile --prefer-offline
yarn link
cd example
yarn link @potluri/simple-mfa
yarn install --frozen-lockfile --prefer-offline
