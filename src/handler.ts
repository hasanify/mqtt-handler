import type { RelayStates } from "@/database";
import {
  updatePowerStatus,
  updateRelayStates,
  updateTimeline,
} from "@/database";
import { getPosition } from "@/utils";
import { DevicePowerStatus, DeviceStatus } from "@prisma/client";
import mqtt from "mqtt";

const statusTopic = process.env.MQTT_TOPIC_BASE! + "+/status";
const powerTopic = process.env.MQTT_TOPIC_BASE! + "+/power";
const responseTopic = process.env.MQTT_TOPIC_BASE! + "+/response";

const topics = [statusTopic, powerTopic, responseTopic];
const connectionURI = `${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
let mqttClient: mqtt.MqttClient;

const handleMqtt = () => {
  console.log("connectionURI -->", connectionURI);
  mqttClient = mqtt.connect(connectionURI, {
    username: process.env.MQTT_USERNAME!,
    password: process.env.MQTT_PASSWORD!,
    reconnectPeriod: 1000,
    clean: true,
    rejectUnauthorized: false,
    clientId: `mqtt-handler`,
  });

  mqttClient.on("disconnect", () => {
    console.log("mqtt disconnected");
    mqttClient.reconnect();
  });

  mqttClient.on("connect", (ack) => {
    if (ack) {
      mqttClient.subscribe(topics, { qos: 1 }, (err, granted) => {
        if (!err) {
          console.log("mqtt connected and subscribed to ", granted);
        } else {
          console.log(err);
        }
      });
    } else console.log("failed to connect to mqtt");
  });

  mqttClient.on("error", (err) => {
    console.log(err.message);
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      topic = topic.toString();
      if (!message) return;
      const msgString = message.toString();

      if (msgString === "") return;
      const payload = JSON.parse(msgString);

      const command = topic.slice(topic.lastIndexOf("/") + 1, topic.length);
      const device = topic.slice(
        getPosition(topic, "/", 1) + 1,
        getPosition(topic, "/", 2)
      );

      if (command === "response" && payload.message !== "current_states")
        return;

      console.log("---------------------------------------");
      console.log("timestamp -->", new Date().toLocaleString());
      console.log("topic     -->", topic);
      console.log("command   -->", command);
      console.log("device_id -->", device);
      console.log("payload   -->", payload);
      console.log("---------------------------------------");

      if (process.env.NODE_ENV === "development") return;

      if (command === "status") {
        if (payload.status && payload.status !== "") {
          const status: DeviceStatus = payload.status;
          await updateTimeline(device, status);
          mqttClient.publish(topic, "", { retain: true, qos: 1 });
        }
      } else if (command === "power") {
        if (payload.status && payload.status !== "") {
          const status: DevicePowerStatus = payload.status;
          await updatePowerStatus(device, status);
          mqttClient.publish(topic, "", { retain: true, qos: 1 });
        }
      } else if (command === "response") {
        if (payload.message === "current_states") {
          const relayStates: RelayStates = payload.states;
          await updateRelayStates(device, relayStates);
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
};

interface IPublish {
  topic: string;
  payload: object;
}

export const publish = async (msg: IPublish) => {
  if (!mqttClient.connected) return console.log("client not connected");
  mqttClient.publish(msg.topic, JSON.stringify(msg.payload), (e, p) => {
    if (e) return console.log(e);
    console.log("message published -->", msg.payload, "\ntopic -->", msg.topic);
    if (p) console.log(p);
  });
};

export default handleMqtt;
