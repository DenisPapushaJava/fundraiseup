(() => {
  const BUFFER_LIMIT = 3;
  const POST_INTERVAL = 1000;
  const TRACK_URL = "http://localhost:8888/track";

  interface EventPayload {
    event: string;
    tags: string[];
    url: string;
    title: string;
    ts: number;
  }

  const buffer: EventPayload[] = [];
  let lastSendTime = 0;
  let isSending = false;

  const getEventPayload = (
    event: string,
    tags: string[] = [],
  ): EventPayload => ({
    event,
    tags,
    url: window.location.href,
    title: document.title,
    ts: Math.floor(Date.now() / 1000),
  });

  const sendBuffer = async (): Promise<void> => {
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
    } finally {
      isSending = false;
    }
  };

  const sendPendingEvents = (): void => {
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
    track(event: string, ...tags: string[]): void {
      buffer.push(getEventPayload(event, tags));
      sendBuffer();
    },
  };

  (window as any).tracker = tracker;

  const beforeUnloadHandler = (): void => sendPendingEvents();

  const clickLinkHandler = async (event: MouseEvent): Promise<void> => {
    const target = event.target as HTMLElement;
    if (target.tagName === "A") {
      event.preventDefault();
      await new Promise<void>((resolve) => {
        const checkBuffer = (): void => {
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
        window.location.href = (target as HTMLAnchorElement).href;
      }, 100);
    }
  };

  window.addEventListener("beforeunload", beforeUnloadHandler);
  document.addEventListener("click", clickLinkHandler);

  const removeEventListeners = (): void => {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    document.removeEventListener("click", clickLinkHandler);
  };

  window.addEventListener("unload", () => {
    removeEventListeners();
  });
})();
