require("dotenv").config();
const { Bot, GrammyError } = require("grammy");
const axios = require("axios");
const schedule = require("node-schedule");

const bot = new Bot(process.env.BOT_TOKEN);

let reminders = {};

bot.api.setMyCommands([
  { command: "start", description: "Запуск бота" },
  { command: "weather", description: "Узнать погоду" },
  { command: "reminder", description: "Напомнить о важном деле" },
  { command: "tabletka", description: "Напомнить о приеме лекарств" },
]);

bot.command("start", async (ctx) => {
  await ctx.reply("Кукусики! Выбирайте настройку:");
});

bot.command("weather", async (ctx) => {
  await ctx.reply(
    "Пожалуйста, отправьте своё местоположение для получения данных о погоде."
  );
});

bot.command("reminder", async (ctx) => {
  const chatId = ctx.chat.id;
  reminders[chatId] = { state: "waiting_for_date" };
  await ctx.reply(
    "Введите дату, время и текст напоминания в формате 'YYYY-MM-DD HH:MM текст напоминания' (например, 2024-09-06 15:00 Забрать посылку)"
  );
});

bot.command("tabletka", async (ctx) => {
  await ctx.reply(
    "Пожалуйста, установите время, когда Вам напомнить о приеме лекарств"
  );
});

bot.on("message:location", async (ctx) => {
  const { latitude, longitude } = ctx.message.location;
  const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.API}`;

  try {
    const response = await axios.get(weatherAPIUrl);
    const weatherData = response.data;
    const weatherMessage = `${weatherData.name}: ${weatherData.weather[0].description}, ${weatherData.main.temp} °C`;
    await ctx.reply(`Погода в Вашем местоположении: ${weatherMessage}`);
  } catch (error) {
    await ctx.reply("Не удалось получить данные о погоде.");
    console.error("Ошибка при запросе погоды", error);
  }
});

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;

  if (reminders[chatId] && reminders[chatId].state === "waiting_for_date") {
    const reminderDate = new Date(ctx.message.text);
    const input = ctx.message.text.trim();
    console.log(input);
    const datePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
    if (!datePattern.test(input)) {
      await ctx.reply("Неправильный формат даты и времени. Попробуйте снова.");
      return;
    }

    reminders[chatId].text = input;
    reminders[chatId].job = schedule.scheduleJob(reminderDate, () => {
      ctx.reply(`Напоминание: ${reminders[chatId].text}`);
      delete reminders[chatId];
    });

    reminders[chatId].state = "set";
    await ctx.reply(`Напоминание установлено на ${ctx.message.text}`);
  } else {
    console.log(`Received message: ${ctx.message.text}`);
  }
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else {
    console.error(e);
  }
});

bot.start();
