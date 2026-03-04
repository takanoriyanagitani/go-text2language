package main

import (
	"context"
	"encoding/json"
	"fmt"

	ldet "github.com/takanoriyanagitani/go-text2language/lang/detect/lingua"
	"syscall/js"
)

//nolint:gochecknoglobals
var jsGlobal js.Value = js.Global()

func releaseAll(funcs ...js.Func) {
	for _, f := range funcs {
		f.Release()
	}
}

type Result struct {
	Language string `json:"language"`
	Text     string `json:"text"`
	Error    string `json:"error"`
}

func detectLanguage(text string) Result {
	lang, err := ldet.TextToLanguage(text)
	if nil != err {
		return Result{
			Language: "",
			Text:     text,
			Error:    err.Error(),
		}
	}
	return Result{
		Language: lang,
		Text:     text,
		Error:    "",
	}
}

func processTask(_this js.Value, args []js.Value) any {
	if 1 != len(args) {
		return `{"language":"", "error":"unexpected arguments got"}`
	}

	var vtext js.Value = args[0]
	var ttyp js.Type = vtext.Type()
	if ttyp != js.TypeString {
		return `{"language":"", "error":"invalid text type"}`
	}

	var text string = vtext.String()
	var rslt Result = detectLanguage(text)
	bytes, err := json.Marshal(rslt)
	if nil != err {
		return `{"language":"", "error":"unable to serialize the result"}`
	}
	return string(bytes)
}

func sub(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var ptask js.Func = js.FuncOf(processTask)
	jsGlobal.Set(
		"processTask",
		ptask,
	)

	var shutdown js.Func = js.FuncOf(func(
		_this js.Value,
		_args []js.Value,
	) any {
		fmt.Println("shutting down...")
		cancel()
		return nil
	})
	jsGlobal.Set("shutdown", shutdown)

	<-ctx.Done()

	releaseAll(
		ptask,
		shutdown,
	)
}

func main() {
	sub(context.Background())
}
