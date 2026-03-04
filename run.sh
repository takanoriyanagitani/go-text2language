#!/bin/sh

addr=127.0.0.1
port=30280

goroot=$( go env GOROOT )
wasm_exec="${goroot}/lib/wasm/wasm_exec.js"

test -f "${wasm_exec}" || exec env jname="${wasm_exec}" sh -c '
	echo wasm exec js "${jname}" missing.
	exit 1
'

ln -sf "${wasm_exec}"

miniserve \
	--interfaces "${addr}" \
	--port ${port} \
	.
