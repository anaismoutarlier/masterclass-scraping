const express = require("express");
const http = require("http");
const { CronJob } = require("cron");

const app = express();
const server = http.createServer(app);

const scrap = require("./scrap");
const sendEmail = require("./mailer");

function cron() {
  const job = new CronJob(
    "44 19 * * *",
    async () => {
      const data = await scrap();
      await sendEmail({
        to: "anaismoutarlier@gmail.com",
        from: {
          name: "Anais Moutarlier",
          address: process.env.SMTP_EMAIL,
        },
        subject: "Nouveaux posts Welcome to the Jungle",
        html: `
	  <div>
	  <ul>
	  ${data.map(
      el =>
        `<li>${el.title} - ${el.company?.name || "unknown"} - ${el.url}</li>`
    )}
	  </ul>
	  </div>
	  `,
      });
    },
    null,
    true,
    "Europe/Paris"
  );
  job.start();
}

cron();
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server listening on port ${PORT}.`));
