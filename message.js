require("dotenv").config();
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

let chatIds = [];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Кукусики! Выбирайте настройку:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Узнать погоду", callback_data: "setting_1" },
          { text: "Напомнить о важном деле", callback_data: "setting_2" },
        ],
      ],
    },
  });
  if (!chatIds.includes(chatId)) {
    chatIds.push(chatId);
  }
});

bot.on("callback_query", (callback_query) => {
  const msg = callback_query.message;
  const data = callback_query.data;

  let response = "";

  switch (data) {
    case "setting_1":
      response = "Вы выбрали узнать погоду. Отправьте мне Ваше местоположение";
      break;
    case "setting_2":
      response = "Вы выбрали напомнить о важном деле ";
      break;

    default:
      response = "Неизвестная настройка";
      break;
  }

  bot.sendMessage(msg.chat.id, response);
});

bot.on("message", async (msg) => {
  const id = msg.chat.id;
  if (!chatIds.includes(id)) {
    chatIds.push(id);
  }
  if (msg.location) {
    console.log(msg.location);
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${msg.location.latitude}&lon=${msg.location.longitude}&units=metric&appid=${process.env.API}`;
    try {
      const response = await axios.get(weatherAPIUrl);
      const weatherData = response.data;
      const weatherMessage = `${weatherData.name}: ${weatherData.weather[0].description}, ${weatherData.main.temp} °C`;
      bot.sendMessage(id, weatherMessage);
    } catch (error) {
      bot.sendMessage(id, "Не удалось получить данные о погоде.");
      console.error("Ошибка при запросе погоды", error);
    }
  }

  console.log(`Получено сообщение от ${msg.chat.id}: ${msg.text}`);
});

const daileMessage = "Доброе утро, пора выпить таблетку 😉";

function sendDailyMessage() {
  chatIds.forEach((id) => {
    bot
      .sendMessage(id, daileMessage)
      .then(() => console.log(`Сообщение отправлено в чат ${id}`))
      .catch((err) => console.error("Ошибка", err));
  });
}

const time = new Date();
time.setHours(9, 0, 0, 0);

const now = new Date();
let delay = time - now;

if (delay < 0) {
  delay += 86400000;
}

setTimeout(() => {
  sendDailyMessage();
  setInterval(sendDailyMessage, 86400000);
}, delay);
