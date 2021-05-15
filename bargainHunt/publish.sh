#! /usr/bin/env bash

cp -avR ./display/ ~/Sites/www/personal/
cp -v ./testing.json ~/Sites/www/personal/testing.json
open 'http://localhost/personal/chart_ma20.html'
open 'http://localhost/personal/chart_ma50.html'
