"use strict";
import fs from "fs";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { GraphQLClient } from "graphql-request";
import { insertArticles } from "./graphql/insertArticles.js";
import { deleteArticles } from "./graphql/deleteArticles.js";
import { exportUsersToExcel } from "./excel/exportService.js";
dotenv.config();

class List {
  constructor({
    url = "",
    selectors = { section: "", pager: "", title: "", author: "", date: "" },
  }) {
    this.baseUrl = url;
    this.selectors = selectors;
    this.browser;
    this.result = { articles: [] };
  }

  async scrapData() {
    console.log("wtf");
    this.browser = await puppeteer.launch({ headless: true });
    console.log(await this.browser.version());
    const page = await this.browser.newPage();
    await page.goto(this.baseUrl);

    const themes = await page.$$eval(this.selectors.section, (e) =>
      e.map((e) => ({ text: e.textContent, href: e.href }))
    );

    for (const [index, theme] of themes.entries()) {
      const themeArticles = await this.getArticles(
        theme.href,
        theme.text,
        index
      );

      this.result.articles.push(...themeArticles);
    }

    this.result.articles.map((article, index) => {
      article.id = index;
    });

    this.browser.close();
  }

  async getArticles(url, name) {
    try {
      const page = await this.browser.newPage();
      console.log("newpage");
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      console.log("parse theme", name);
      // const screenshot= await page.screenshot({ path: `theme-${index}.png` });
      const pagesNumber = await page.$$eval(this.selectors.pager, (e) =>
        e.map((e) => e)
      );
      // const pagesNumber = ["1"];

      const result = [];

      for (const [index, page] of pagesNumber.entries()) {
        const page = await this.browser.newPage();
        await page.goto(`${url}?page=${index + 1}`, {
          waitUntil: "domcontentloaded",
        });
        const articlesTitles = await page.$$eval(this.selectors.title, (e) =>
          e.map((e) => ({
            id: null,
            text: e.textContent.split("\n").shift(),
            href: e.href,
          }))
        );
        const articlesAuthors = await page.$$eval(this.selectors.author, (e) =>
          e.map((e) => ({ author: e.textContent }))
        );
        const articlesDates = await page.$$eval(this.selectors.date, (e) =>
          e.map((e) => {
            function getTimeStamp(date) {
              console.log("DATE", date);
              const dateSplitted = date.split(" ");
              const year = dateSplitted[2];
              const month = [
                "January",
                "February",
                "Marth",
                "April",
                "may",
                "June",
                "July",
                "Augustus",
                "September",
                "October",
                "November",
                "December",
              ].findIndex((el) => el === dateSplitted[1]);
              const timestamp =
                new Date(
                  year,
                  month - 1,
                  dateSplitted[0].substring(0, 2)
                ).getTime() / 1000 ||
                new Date(
                  year,
                  month - 1,
                  dateSplitted[0].substring(0, 1)
                ).getTime() / 1000;

              return timestamp;
            }

            const timestamp = getTimeStamp(e.textContent);
            return {
              date: e.textContent,
              timestamp: timestamp,
            };
          })
        );
        const articles = articlesTitles.map((article, index) => ({
          ...article,
          ...articlesAuthors[index],
          ...articlesDates[index],
        }));

        articles.map((article, index) => {
          article.theme = name;
        });
        result.push(...articles);
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //log

  showLogs() {
    console.log(this.result);
  }

  //JSON

  generateJson(fileName) {
    if (fs.existsSync(`data/${fileName}.json`)) {
      fs.unlink(`data/${fileName}.json`, (err) => {
        if (err) throw err;

        console.log("file deleted");

        fs.writeFile(
          `data/${fileName}.json`,
          JSON.stringify(this.result),
          function (err) {
            if (err) throw err;
            console.log("Saved!");
          }
        );
      });
    } else {
      fs.writeFile(
        `data/${fileName}.json`,
        JSON.stringify(this.result),
        function (err) {
          if (err) throw err;
          console.log("Saved!");
        }
      );
    }
  }

  deleteJson(fileName) {
    if (fs.existsSync(`data/${fileName}.json`)) {
      fs.unlink(`data/${fileName}.json`, (err) => {
        if (err) throw err;
        console.log("file deleted");
      });
    }
  }

  // Graphql

  async insertData(articles) {
    const endpoint = process.env.HASURA_ENDPOINT;

    const graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_SECRET,
      },
    });
    const variables = {
      articles: articles,
    };

    try {
      const data = await graphQLClient.request(insertArticles, variables);
      console.log("data", data);
    } catch (error) {
      console.log(error);
    }
  }

  async deleteData() {
    const endpoint = process.env.HASURA_ENDPOINT;

    const graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_SECRET,
      },
    });

    try {
      const data = await graphQLClient.request(deleteArticles);
      console.log("data", data);
    } catch (error) {
      console.log(error);
    }
  }

  // Excel

  async createSheet(fileName) {
    const dataToExport = fs.existsSync(`data/${fileName}.json`)
      ? JSON.parse(fs.readFileSync(`data/${fileName}.json`)).articles
      : "none";
    // const dataToExport = 'yoo';
    console.log("DATATOEXPORT", dataToExport);
    const workSheetColumnName = Object.keys(dataToExport[0]);

    const workSheetName = "Articles";
    const filePath = `./data/${fileName}.xlsx`;

    exportUsersToExcel(dataToExport, workSheetColumnName, workSheetName, filePath);
  }

  async deleteSheet(fileName){
    if (fs.existsSync(`data/${fileName}.xlsx`)) {
      fs.unlink(`data/${fileName}.xlsx`, (err) => {
        if (err) throw err;
        console.log("file deleted");
      });
    }
  }
}

export default List;
