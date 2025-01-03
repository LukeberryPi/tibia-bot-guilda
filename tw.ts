import puppeteer from "puppeteer";

const user_email = process.env.TWITTER_EMAIL ?? "";
const user_username = process.env.TWITTER_USERNAME ?? "";
const password = process.env.TWITTER_PASSWORD ?? "";
const target_username = "eufountai";

async function fkTwitter() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://x.com/i/flow/login");
  await page.waitForSelector("input[autocomplete=username]");
  await page.type("input[autocomplete=username]", user_email, { delay: 150 });
  await page.locator("text/Next").click();
  // await page.waitForNetworkIdle({ idleTime: 1500 });
  new Promise((r) => setTimeout(r, 1000));
  const isTwitterSuspicious = await page.waitForSelector("");
  if (isTwitterSuspicious) {
    console.log("aqui1");
    await page.waitForSelector("[autocomplete=on]");
    console.log("aqui2");
    await page.type("input[autocomplete=on]", user_username, { delay: 150 });
    console.log("aqui3");
    await page.waitForNetworkIdle({ idleTime: 1500 });
    await page.locator("text/Next").click();
  }
  await page.waitForSelector('[autocomplete="current-password"]');
  await page.type('[autocomplete="current-password"]', password, {
    delay: 150,
  });
  await page.waitForNetworkIdle({ idleTime: 1500 });
  await page.locator("text/Log in").click();
  await page.locator("text/Refuse non-essential cookies").click();
  await page.goto(`https://x.com/eufountai/verified-followers`);
  // await browser.close();
}

fkTwitter();
