import { gql } from "graphql-request";
export const deleteArticles = gql`
  mutation DeleteArticles {
    delete_articles(where:{}) {
      returning {
        author
      }
    }
  }
`;