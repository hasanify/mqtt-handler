import sendNotification from "@/notification";
import { capitalize } from "@/utils";
import { DeviceStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const updateTimeline = async (id: string, status: DeviceStatus) => {
  const device = await prisma.device.findFirst({
    where: { id },
    include: {
      sharedTo: { include: { expoTokens: true } },
      owner: { include: { expoTokens: true } },
    },
  });

  if (!device) return console.log("device not found");

  if (device.status === status && device.createdAt !== device.updatedAt)
    return console.log("no need to update");

  if (device.owner) {
    const pushTokens: string[] = [];

    for (const shared of device.sharedTo) {
      pushTokens.push(...shared.expoTokens.map((user) => user.token));
    }
    for (const owned of device.owner.expoTokens) {
      pushTokens.push(owned.token);
    }

    await sendNotification(pushTokens, {
      title: capitalize(device.alias),
      body: `Device just went ${status}!`,
    });
  }

  await prisma.device.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });

  const timeline = await prisma.timeline.create({
    data: {
      status: status,
      deviceId: id,
    },
  });
  return timeline;
};

export const removeExpoToken = async (pushToken: string) => {
  const existingToken = await prisma.expoToken.findFirst({
    where: {
      token: pushToken,
    },
  });

  if (!existingToken) return;

  await prisma.expoToken.delete({
    where: {
      id: existingToken.id,
      token: pushToken,
    },
  });
};
