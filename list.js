"use strict";
import fs from "fs";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { GraphQLClient, gql } from "graphql-request";
dotenv.config();

class List {
  constructor({
    url,
    selectors = { section: "", pager: "", title: "", author: "", date: "" },
  }) {
    this.baseUrl = url;
    this.selectors = selectors;
    this.browser;
    this.result = { articles: [] };
  }

  test(){
    console.log("TEST function");
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
      this.result.articles.push(...themeArticles);

      // this.updateDB(themeArticles);
      // themeArticles.map(article=> this.updateDB(article))
    }
    this.result.articles.map((article, index) => {
      article.id = index;
    });
    this.browser.close();

    // fs.writeFile(
    //   "all_articles.json",
    //   JSON.stringify(this.result),
    //   function (err) {
    //     if (err) throw err;
    //     console.log("Saved!");
    //   }
    // );
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
      // const pagesNumber = await page.$$eval(this.selectors.pager, (e) =>
      //   e.map((e) => e)
      // );
      const pagesNumber = ["1"];
      console.log("length", pagesNumber);

      const result = [];

      for (const [index, page] of pagesNumber.entries()) {
        const page = await this.browser.newPage();
        await page.goto(`${url}?page=${index + 1}`, {
          waitUntil: "domcontentloaded",
        });
        const articlesTitles = await page.$$eval(this.selectors.title, (e) =>
          e.map((e) => ({
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
        // const date = "13-10-2021";
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

  async updateDB(articles) {
    const endpoint = process.env.HASURA_ENDPOINT;

    const graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": process.env.HASURA_SECRET,
      },
    });
    const query = gql`
      mutation MyMutation($articles: [articles_insert_input!]!) {
        insert_articles(objects: $articles) {
          returning {
            author
          }
        }
      }
    `;
    const variables = {
      articles: articles,
    };

    try {
      const data = await graphQLClient.request(query, variables);
      console.log('data', data);
    } catch (error) {
      console.log(error);
    }
  }
}

export default List;
