#!/bin/bash
# Railway will detect this and use it as the start command for frontend

npm run build
npm install -g serve
serve -s dist -l $PORT
