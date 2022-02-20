import { gql } from "graphql-request";
export const insertArticles = gql`
  mutation InsertArticles($articles: [articles_insert_input!]!) {
    insert_articles(objects: $articles) {
      returning {
        author
      }
    }
  }
`;
