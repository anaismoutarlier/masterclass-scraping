const puppeteer = require("puppeteer");
const moment = require("moment");

const SEARCH_URL =
  "https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=temporary&refinementList%5Bcontract_type%5D%5B%5D=full_time&query=javascript%20developer&page=1&aroundQuery=France&sortBy=mostRecent";
const scrap = async () => {
  try {
    var browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", request => {
      console.log(request.method(), request.url(), request.postData());
      if (["stylesheet", "font", "image"].includes(request.resourceType()))
        request.abort();
      else request.continue();
    });
    // load, domcontentloaded, networkidle0, networkidle2
    await page.goto(SEARCH_URL, { waitUntil: "networkidle2" });

    const totalJobCount = await page.$eval(
      "div[data-testid='jobs-search-results-count']",
      el => {
        if (el) return Number(el.textContent.trim());
        return null;
      }
    );
    console.log(totalJobCount);

    const limitDate = moment().subtract(1, "days").toDate();

    const jobs = await page.$$eval(
      "ul[data-testid='search-results'] li",
      (arr, limitDate) => {
        return arr
          .map(el => {
            const url = el.querySelector("a").href;
            const title = el.querySelector("h4").textContent.trim();
            console.log(el.querySelectorAll("div[variant='default']"));
            const tags = [
              ...el.querySelectorAll("div[variant='default'] span"),
            ].map(tag => tag.textContent.trim());
            const createdAt = el.querySelector("time").dateTime;
            return { url, title, tags, createdAt };
          })
          .filter(el => new Date(el.createdAt) > new Date(limitDate));
      },
      limitDate
    );
    console.log(jobs);
  } catch (error) {
    console.error(error);
  } finally {
    // if (browser) await browser.close();
  }
};

module.exports = scrap;
