#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TESTDIR="${DIR}/test"

BUILD=$(docker build -q -t jelmervdl/latexmk ${DIR})

echo $BUILD

rm -f "${TESTDIR}/tmp/*.{pdf,hasl,log,tex}"
rm -f "${TESTDIR}/test.pdf"

docker run -v "${TESTDIR}":/target "$BUILD" ./test.tex \
	&& open "${TESTDIR}/test.pdf"

cat "${TESTDIR}/test.log"