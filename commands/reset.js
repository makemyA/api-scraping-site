import List from "../list.js";

const articles = new List({url:""});

articles.deleteData().then(() => articles.deleteJson('articles'));
