#!/usr/bin/bash -x

# Run latexmk on given files,
# then chmod the results to the source's owner.

/usr/bin/latexmk --enable-write18 -pdf "$1"
# chown -v $(stat --format=%u "$1"):$(stat --format=%g "$1") $(basename "$1" .tex).*