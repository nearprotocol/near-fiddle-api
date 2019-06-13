#!/bin/bash
set -e

if [[ -z ${NODE_ENV} ]]
then
    export NODE_ENV=production
fi

cd /near-fiddle-api
node app.js >> /var/log/fiddle.log 2>&1
