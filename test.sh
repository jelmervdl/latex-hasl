#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TESTDIR="${DIR}/test"

BUILD=$(docker build -q -t jelmervdl/latexmk ${DIR})

echo $BUILD

rm -f "${TESTDIR}/test.pdf"

docker run -v "${TESTDIR}":/target "$BUILD" --enable-write18 ./test.tex \
	&& open "${TESTDIR}/test.pdf"