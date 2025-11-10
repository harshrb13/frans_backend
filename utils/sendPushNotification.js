const { Expo } = require("expo-server-sdk");

// Create a new Expo client
let expo = new Expo();

const sendPushNotifications = async (pushTokens, title, body, data) => {
  let messages = [];

  // 1. Filter out any invalid tokens
  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // 2. Construct a message (see the Expo docs for more options)
    messages.push({
      to: pushToken,
      sound: "default",
      title: title,
      body: body,
      data: data,
    });
  }

  // 3. Chunk the messages into arrays of 100 (Expo's limit)
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  // 4. Send the chunks to Expo's servers
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("Push notification chunk sent:", ticketChunk);
    } catch (error) {
      console.error("Error sending push notification chunk:", error);
    }
  }
};

module.exports = sendPushNotifications;