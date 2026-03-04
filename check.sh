#!/bin/sh

GOOS=js GOARCH=wasm go \
	vet \
	-all \
	. || exec sh -c 'echo go vet failure.; exit 1'

GOOS=js GOARCH=wasm golangci-lint \
	run
