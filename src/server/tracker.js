(() => {
  const BUFFER_LIMIT = 3;
  const POST_INTERVAL = 1000;
  const TRACK_URL = "http://localhost:8888/track";

  const buffer = [];
  let lastSendTime = 0;
  let isSending = false;

  const getEventPayload = (event, tags = []) => ({
    event,
    tags,
    url: window.location.href,
    title: document.title,
    ts: Math.floor(Date.now() / 1000),
  });

  const sendBuffer = async () => {
    if (buffer.length === 0 || isSending) return;
    const now = Date.now();
    if (now - lastSendTime < POST_INTERVAL && buffer.length < BUFFER_LIMIT)
      return;

    isSending = true;
    const eventsToSend = buffer.splice(0, BUFFER_LIMIT);
    try {
      const response = await fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          data: JSON.stringify(eventsToSend),
        }),
      });
      if (!response.ok) throw new Error("Failed to send events");
      lastSendTime = now;
    } catch (error) {
      console.error("Error sending events:", error);
      buffer.unshift(...eventsToSend);
      setTimeout(sendBuffer, POST_INTERVAL);
    } finally {
      isSending = false;
    }
  };

  const sendPendingEvents = () => {
    if (buffer.length === 0) return;
    const eventsToSend = buffer.splice(0, BUFFER_LIMIT);
    const blob = new Blob([JSON.stringify(eventsToSend)], {
      type: "application/json; charset=UTF-8",
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TRACK_URL, blob);
    } else {
      fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventsToSend),
        keepalive: true,
      }).catch((error) => {
        console.error("Error sending events on unload:", error);
        buffer.unshift(...eventsToSend);
        setTimeout(sendBuffer, POST_INTERVAL);
      });
    }
  };

  const tracker = {
    track(event, ...tags) {
      buffer.push(getEventPayload(event, tags));
      sendBuffer();
    },
  };

  window.tracker = tracker;

  const beforeUnloadHandler = () =>  sendPendingEvents();

  const clickHandler = async (event) => {
    console.log(event.target.onclick.toString())
    if (event.target.onclick.toString().includes("tracker.track")) {
      event.preventDefault();
      await new Promise((resolve) => {
        const checkBuffer = () => {
          if (buffer.length === 0 || isSending) {
            resolve();
          } else {
            setTimeout(checkBuffer, 100);
          }
        };
        checkBuffer();
      });
      sendPendingEvents();
      setTimeout(() => {
        window.location.href = event.target.href;
      }, 100);
    }
  };

  window.addEventListener("beforeunload", beforeUnloadHandler);
  document.addEventListener("click", clickHandler);

  const removeEventListeners = () => {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    document.removeEventListener("click", clickHandler);
  };

  window.addEventListener("unload", () => {
    removeEventListeners();
  });
})();
