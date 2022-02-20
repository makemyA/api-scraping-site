"use strict";
import fs from "fs";
import puppeteer from "puppeteer";
// var fs = require("fs");
// const puppeteer = require("puppeteer");

class List {
  constructor({
    url,
    selectors = { section: "", pager: "", title: "", author: "", date: "" },
  }) {
    this.baseUrl = url;
    this.selectors = selectors;
    this.browser;
    this.result = [];
  }

  async start() {
    console.log("wtf");
    this.browser = await puppeteer.launch({ headless: true });
    console.log(await this.browser.version());
    const page = await this.browser.newPage();
    await page.goto(this.baseUrl);

    const themes = await page.$$eval(this.selectors.section, (e) =>
      e.map((e) => ({ text: e.textContent, href: e.href }))
    );

    for (const [index, theme] of themes.entries()) {
      const themeArticles = await this.getThemePage(
        theme.href,
        theme.text,
        index
      );
      // console.log("themes articles", themeArticles);
      this.result.push([...themeArticles]);
    }

    this.browser.close();

    // const authors = await page.$$eval(".writers-inline .field__item", (e) =>
    //   e.map((el) => el.textContent)
    // );
    fs.writeFile(
      "allArticles.json",
      JSON.stringify(this.result),
      function (err) {
        if (err) throw err;
        console.log("Saved!");
      }
    );
  }

  async getThemePage(url, name, index) {
    try {
      // console.log("name", name, url);
      const page = await this.browser.newPage();
      console.log("newpage");
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      console.log("is on url", name);
      // const screenshot= await page.screenshot({ path: `theme-${index}.png` });
      const pagesNumber = await page.$$eval(this.selectors.pager, (e) =>
        e.map((e) => e)
      );
      console.log("length", pagesNumber);

      const result = [];

      for (const [index, page] of pagesNumber.entries()) {
        const page = await this.browser.newPage();
        await page.goto(`${url}?page=${index + 1}`, {
          waitUntil: "domcontentloaded",
        });
        const articlesTitles = await page.$$eval(this.selectors.title, (e) =>
          e.map((e) => ({ text: e.textContent, href: e.href }))
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
                ).getTime() ||
                new Date(
                  year,
                  month - 1,
                  dateSplitted[0].substring(0, 1)
                ).getTime();

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
        // const date = "13-10-2021";
        articles.map((article) => (article.theme = name));
        result.push([...articles]);
      }
      return result;
      // console.log('after screenshot', screenshot)
      // console.log("articles", articles);
    } catch (error) {
      console.log(error);
    }
  }
}

export default List;
