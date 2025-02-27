import sendNotification from "@/notification";
import { capitalize } from "@/utils";
import { DevicePowerStatus, DeviceStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export interface RelayStates {
  "1": boolean;
  "2": boolean;
  "3": boolean;
  "4": boolean;
}

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

export const updatePowerStatus = async (
  id: string,
  status: DevicePowerStatus
) => {
  const device = await prisma.device.findFirst({
    where: { id },
    include: {
      sharedTo: { include: { expoTokens: true } },
      owner: { include: { expoTokens: true } },
    },
  });

  if (!device) return console.log("device not found");

  if (device.power === status && device.createdAt !== device.updatedAt)
    return console.log("no need to update");

  await prisma.device.update({
    where: {
      id,
    },
    data: {
      power: status,
    },
  });

  const powerStatus = await prisma.powerStatus.create({
    data: {
      status,
      deviceId: id,
    },
  });
  return powerStatus;
};

export const updateRelayStates = async (id: string, relayStates: any) => {
  const device = await prisma.device.findFirst({
    where: { id },
    select: {
      id: true,
    },
  });

  if (!device) return console.log("device not found");

  await prisma.device.update({
    where: {
      id: device.id,
    },
    data: {
      relayStates,
    },
  });
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
