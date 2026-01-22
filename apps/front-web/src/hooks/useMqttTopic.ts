import { useEffect } from "react";
import { getMqttClient } from "../lib/mqttClient";

export function useMqttTopic(topic: string, onMessage: (msg: any) => void) {
  useEffect(() => {
    const client = getMqttClient();

    const handler = (t: string, payload: Buffer) => {
      if (t !== topic && !topic.includes("#") && !topic.includes("+")) return;
      try {
        onMessage(JSON.parse(payload.toString()));
      } catch {
        
      }
    };

    client.on("message", handler);

    client.subscribe(topic, (err) => {
      if (err) console.error("[mqtt] subscribe error:", err);
    });

    return () => {
      client.unsubscribe(topic);
      client.off("message", handler);
    };
  }, [topic, onMessage]);
}
