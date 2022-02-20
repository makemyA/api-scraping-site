import List from "./list.js";

const articles = new List({
  url: "https://theecologist.org/",
  selectors: {
    section: "#mm-2 li a",
    pager: ".pager__item",
    title: ".grid article header h2 a",
    author: ".grid article header .writers-inline .field__item",
    date: ".grid article header .node__meta span:nth-of-type(2n)",
  },
});

// articles.start().then(()=>articles.updateDB(articles.result.articles));

export default function test(){
  articles.test()
}

test();