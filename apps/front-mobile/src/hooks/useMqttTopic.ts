import { useEffect } from "react";
import { getMqttClient } from "../lib/mqttClient";

export function useMqttTopic(
  topic: string | null,
  onMessage: (msg: any) => void
) {
  useEffect(() => {
    if (!topic) return;

    const client = getMqttClient();

    const handler = (_t: string, payload: any) => {
      try {
        const text = payload?.toString?.() ?? String(payload);
        onMessage(JSON.parse(text));
      } catch {
        // ignore
      }
    };

    client.on("message", handler);
    client.subscribe(topic);

    return () => {
      client.unsubscribe(topic);
      client.off("message", handler);
    };
  }, [topic, onMessage]);
}
