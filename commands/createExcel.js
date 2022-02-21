import List from "../list.js";

const articles = new List({url:""});

articles.createSheet('articles').then(()=>console.log("excel created"));
