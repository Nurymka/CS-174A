#!/bin/bash
cd "$(dirname "$0")"
python3 -m http.server 8910
python3 -m SimpleHTTPServer