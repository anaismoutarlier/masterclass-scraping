const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs").promises;
const SEARCH_URL =
  "https://www.welcometothejungle.com/en/jobs?refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bcontract_type%5D%5B%5D=internship&refinementList%5Bcontract_type%5D%5B%5D=temporary&refinementList%5Bcontract_type%5D%5B%5D=full_time&query=javascript%20developer&page=1&aroundQuery=France&sortBy=mostRecent";
const scrap = async () => {
  try {
    console.log("Scraping started.");
    var browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    console.log("Page created.");
    await page.setRequestInterception(true);
    page.on("request", request => {
      //   console.log(request.method(), request.url(), request.postData());
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
    const sample = jobs.slice(0, 4);
    // console.log(jobs);
    for (const job of sample) {
      await page.goto(job.url, { waitUntil: "networkidle0" });
      const data = await page.evaluate(() => {
        const attributes = [
          ...document.querySelectorAll(
            "div[data-testid='job-metadata-block'] div.sc-bXCLTC.hdepoj > div"
          ),
        ].map(el => el.textContent.trim());
        const companyLink = document.querySelector(
          "div#the-company-section a.sc-jdUcAg.gLJznh"
        );

        return {
          attributes,
          company: !companyLink
            ? null
            : {
                name: companyLink.textContent.trim(),
                url: companyLink.href,
              },
        };
      });
      for (const key in data) job[key] = data[key];
    }
    // await fs.writeFile(
    //   `./jobs-${Date.now()}.json`,
    //   JSON.stringify(sample, null, 2)
    // );
    return jobs;
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Scraping finished");
    if (browser) await browser.close();
  }
};

module.exports = scrap;
