// const express = require("express");
import puppeteer from "puppeteer";

const app = express();

// const count_verified_followers = (username: string) => {
//   const uniqueFollowers = new Set();
//   const links = document.querySelectorAll(
//     'button[data-testid="UserCell"] a[href]',
//   );
//   links.forEach((link) => {
//     uniqueHrefs.add(link.getAttribute("href"));
//   });
//   console.log("Unique verified followers count:", uniqueHrefs.size);
//   const observer = new MutationObserver((mutationsList) => {
//     mutationsList.forEach((mutation) => {
//       if (mutation.type === "childList") {
//         countUniqueHrefs();
//       }
//     });
//   });
//   observer.observe(document.body, { childList: true, subtree: true });

//   // Initial count
//   countUniqueHrefs();
// };

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://x.com/lukeberrypi/verified-followers");
  await page.locator("text/Log In").click();
  await page.locator("text/Sign In").click();
  await browser.close();
})();

// app.get("/get-verified-follower-count", async (req, res) => {
//   const username = req.query.username;
//   if (!username) return;
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   const url = `https://x.com/${username}/verified-followers`;
//   await page.goto(url);
//   await browser.close();
//   return res.json({ verifiedFollowerCount });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
