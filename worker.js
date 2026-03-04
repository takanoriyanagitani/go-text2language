(() => {
  const CACHE_NAME = "cache4wasm";

  postMessage({
    type: "INFO",
    body: "ready to start setup.",
  });

  importScripts("wasm_exec.js");

  postMessage({
    type: "INFO",
    body: "js imported.",
  });

  const go = new Go();

  const pcache = caches.open(CACHE_NAME);

  const url = "main.wasm";

  const presp = pcache.then((cache) => cache.match(url));

  const pwasm = pcache.then((cache) => {
    const presp = cache.match(url);
    return presp.then((resp) => {
      if (resp) {
        postMessage({
          type: "INFO",
          body: "using the cache",
        });
        return resp;
      }

      const pfresh = fetch("main.wasm");
      return pfresh.then((fresh) => {
        const cloned = fresh.clone(); // TODO: reduce clone if possible
        const slen = cloned?.headers?.get("Content-Length");
        const ilen = parseInt(slen);
        const clen = 0 < ilen;
        if (!clen) {
          postMessage({
            type: "ERROR",
            taskId: null,
            result: null,
            error: "invalid content length",
          });
          return fresh;
        }
        postMessage({
          type: "INFO",
          body: `the wasm size got: ${ilen}`,
        });

        const ppfresh = Promise.resolve(cloned.body.getReader())
          .then(async (rdr) => {
            let loaded = 0;
            let prevDate = null;
            while (true) {
              const { done, value } = await rdr.read();
              if (done) {
                return fresh;
              }

              const { length } = value;
              loaded += length;

              const now = Date.now();
              const diff = null === prevDate ? null : (now - prevDate);
              const tooFast = null !== diff && 0 <= diff && diff < 1000;
              if (tooFast) continue;

              prevDate = now;

              const progress = loaded / ilen;
              const pcnt = Math.round(100 * progress);

              postMessage({
                type: "INFO",
                body: `loaded: ${pcnt}`,
              });
            }
          });

        return ppfresh.then((f) => {
          if (f.ok) {
            cache.put(url, fresh.clone());
            postMessage({
              type: "INFO",
              body: "the response saved",
            });
          }

          return fresh;
        });
      });
    });
  });

  const presult = WebAssembly.instantiateStreaming(
    pwasm,
    go.importObject,
  );

  const pinstance = presult.then((res) => res.instance);

  pinstance.then((ins) => {
    postMessage({
      type: "INFO",
      body: "instance got",
    });

    go.run(ins);
    postMessage({ type: "READY" });
  });

  self.onmessage = function (evt) {
    const {
      taskId,
      payload,
      type,
    } = evt?.data || {};

    if (type === "SHUTDOWN") {
      const shutdown = globalThis?.shutdown;
      if (shutdown) shutdown();
      self.close();
      return;
    }

    const processTask = globalThis?.processTask;
    if (!processTask) {
      postMessage({
        type: "ERROR",
        taskId,
        result: null,
        error: "invalid processor",
      });
      return;
    }

    postMessage({
      type: "INFO",
      body: `ready to process the task: ${taskId}`,
    });

    const result = processTask(payload);
    postMessage({
      type: "RESULT",
      taskId,
      result,
      error: null,
    });
  };
})();
