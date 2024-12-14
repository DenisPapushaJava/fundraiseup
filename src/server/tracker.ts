(() => {
  const BUFFER_LIMIT = 3;
  const POST_INTERVAL = 1000;
  const TRACK_URL = "http://localhost:8888/track";
  const TRACKING_SERVICE_TIMEOUT = 5000;

  interface ITracks {
    event: string;
    tags: string[];
    url: string;
    title: string;
    ts: number;
  }

  const buffer: ITracks[] = [];
  let lastSendTime = 0;
  let isSending = false;

  const getEventPayload = (event: string, tags: string[] = []): ITracks => ({
    event,
    tags,
    url: window.location.href,
    title: document.title,
    ts: Math.floor(Date.now() / 1000),
  });

  const saveToSessionStorage = (events: ITracks[]): void => {
    const storedEvents = JSON.parse(
      sessionStorage.getItem("trackingEvents") || "[]",
    );
    sessionStorage.setItem(
      "trackingEvents",
      JSON.stringify([...storedEvents, ...events]),
    );
  };

  const sendFromSessionStorage = async (): Promise<void> => {
    if (!navigator.onLine) return;
    const storedEvents = JSON.parse(
      sessionStorage.getItem("trackingEvents") || "[]",
    );
    if (storedEvents.length === 0) return;
    try {
      const response = await fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          data: JSON.stringify(storedEvents),
        }),
      });
      if (!response.ok)
        throw new Error("Failed to send events from sessionStorage");
      sessionStorage.removeItem("trackingEvents");
    } catch (error) {
      console.error("Error sending events from sessionStorage:", error);
    }
  };

  const sendBuffer = async (): Promise<void> => {
    if (buffer.length === 0 || isSending) return;
    if (!navigator.onLine) {
      saveToSessionStorage(buffer.splice(0, BUFFER_LIMIT));
      return;
    }
    const now = Date.now();
    const isSendLimitOver = buffer.length >= BUFFER_LIMIT;
    const isTimeElapsed = now - lastSendTime >= POST_INTERVAL;
    if (!isSendLimitOver && !isTimeElapsed) return;
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

      await Promise.race([
        new Promise<void>((resolve) => {
          const checkBuffer = (): void => {
            if (buffer.length === 0 || isSending) {
              resolve();
            } else {
              setTimeout(checkBuffer, 100);
            }
          };
          checkBuffer();
        }),
        new Promise<void>((resolve) => {
          setTimeout(resolve, TRACKING_SERVICE_TIMEOUT);
        }),
      ]);
      sendPendingEvents();
      setTimeout(() => {
        window.location.href = (target as HTMLAnchorElement).href;
      }, 100);
    }
  };
  window.addEventListener("online", sendFromSessionStorage);
  window.addEventListener("beforeunload", beforeUnloadHandler);
  document.addEventListener("click", clickLinkHandler);

  const removeEventListeners = (): void => {
    window.removeEventListener("online", sendFromSessionStorage);
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    document.removeEventListener("click", clickLinkHandler);
  };

  window.addEventListener("unload", () => {
    removeEventListeners();
  });
})();
