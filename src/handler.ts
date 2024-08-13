import { updateTimeline } from "@/database";
import { getPosition, randomString } from "@/utils";
import { DeviceStatus } from "@prisma/client";
import mqtt from "mqtt";

const topic = process.env.MQTT_TOPIC_BASE! + "+/status";
const connectionURI = `${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;

const handleMqtt = () => {
  const mqttClient = mqtt.connect(connectionURI, {
    username: process.env.MQTT_USERNAME!,
    password: process.env.MQTT_PASSWORD!,
    reconnectPeriod: 1000,
    clean: true,
    rejectUnauthorized: false,
    clientId: `mqtt-handler/${randomString(6)}`,
  });

  mqttClient.on("disconnect", () => {
    console.log("mqtt disconnected");
    mqttClient.reconnect();
  });

  mqttClient.on("connect", (err) => {
    if (err) console.log(err);
    mqttClient.subscribe(topic, { qos: 1 }, (err) => {
      if (!err) {
        console.log("mqtt connected and subscribed to ", topic);
      } else {
        console.log(err);
      }
    });
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      topic = topic.toString();
      if (!message) return;
      const msgString = message.toString();

      if (msgString === "") return;
      const msg = JSON.parse(msgString);

      const command = topic.slice(topic.lastIndexOf("/") + 1, topic.length);
      const device = topic.slice(
        getPosition(topic, "/", 1) + 1,
        getPosition(topic, "/", 2)
      );

      console.log();
      console.log("---------------------------------------");
      console.log("timestamp -->", new Date().toLocaleDateString());
      console.log("topic     -->", topic);
      console.log("command   -->", command);
      console.log("device_id -->", device);
      console.log("payload   -->", msg);
      console.log("---------------------------------------");
      console.log();

      if (process.env.NODE_ENV === "development") return;

      if (command === "status") {
        if (msg.status && msg.status !== "") {
          const status: DeviceStatus = msg.status;
          await updateTimeline(device, status);
          mqttClient.publish(topic, "", { retain: true, qos: 1 });
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
};

export default handleMqtt;
