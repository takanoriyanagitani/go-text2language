(() => {
  const wk0 = new Worker("worker.js");

  const button = document.getElementById("guess");

  const itext = document.getElementById("input-text");
  const olang = document.getElementById("detected");

  button.onclick = () => {
    alert("the detector not ready");
  };

  let taskCounter = 0;

  wk0.onmessage = (evt) => {
    const { data } = evt || {};
    const { type } = data || {};

    switch (type) {
      case "READY":
        (() => {
          button.onclick = () => {
            wk0.postMessage({
              taskId: taskCounter++,
              payload: itext.value,
            });
          };
          itext.disabled = false;
          itext.value = "";
          button.disabled = false;
          console.info("ready to process");
        })();
        break;

      case "RESULT":
        (() => {
          const { taskId, result } = data;
          console.info(`task id: ${taskId}`);
          olang.textContent = result;
        })();
        break;

      case "ERROR":
        (() => {
          const { taskId, error } = data;
          console.warn(`taskId(${taskId}): ${error}`);
        })();
        break;

      case "INFO":
        (() => {
          const { body } = data;
          console.info(body);
        })();
        break;

      default:
        break;
    }
  };
})();
