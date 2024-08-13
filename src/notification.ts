import { removeExpoToken } from "@/database";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo({
  useFcmV1: true,
});

interface Message {
  title: string;
  body: string;
}

const sendNotification = async (pushTokens: string[], message: Message) => {
  try {
    const messages: ExpoPushMessage[] = [];

    for (const pushToken of pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`${pushToken} is not a valid Expo push token.`);
        removeExpoToken(pushToken);
        continue;
      } else {
        messages.push({
          to: pushToken,
          title: message.title,
          body: message.body,
          priority: "high",
        });
      }
    }

    await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    console.log(error);
  }
};

export default sendNotification;
