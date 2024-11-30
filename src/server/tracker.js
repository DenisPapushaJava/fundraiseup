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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventsToSend),
      });
      if (!response.ok) throw new Error("Failed to send events");
      lastSendTime = now;
    } catch (error) {
      console.error("Error sending events:", error);
      buffer.unshift(...eventsToSend);
    } finally {
      isSending = false;
    }
  };

  const tracker = {
    track(event, ...tags) {
      buffer.push(getEventPayload(event, tags));
      sendBuffer();
    },
  };

  window.tracker = tracker;

  window.addEventListener("beforeunload", sendBuffer);
})();
