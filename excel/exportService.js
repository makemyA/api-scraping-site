import * as XLSX from "xlsx/xlsx.mjs";
// import { read, writeFile, book_new } from "xlsx";
import path from "path";
import * as fs from "fs";
XLSX.set_fs(fs);

const exportExcel = async (
  data,
  workSheetColumnNames,
  workSheetName,
  filePath
) => {
  console.log(
    "export Excel",
    data,
    workSheetColumnNames,
    workSheetName,
    filePath,
    path.resolve(filePath)
  );
  const workBook = XLSX.utils.book_new();
  console.log("create workbook");
  const workSheetData = [workSheetColumnNames, ...data];
  console.log("create worksheetData", workSheetData);
  const workSheet = XLSX.utils.aoa_to_sheet(workSheetData);
  console.log("create worksheet");
  XLSX.utils.book_append_sheet(workBook, workSheet, workSheetName);
  console.log("append sheet");
  XLSX.writeFile(workBook, path.resolve(filePath));
};

export const exportUsersToExcel = (
  articles,
  workSheetColumnNames,
  workSheetName,
  filePath
) => {
  const data = articles.map((article) => {
    return [
      article.id,
      article.text,
      article.href,
      article.author,
      article.date,
      article.timestamp,
      article.theme,
    ];
  });
  console.log("DATA received", data);
  exportExcel(data, workSheetColumnNames, workSheetName, filePath);
};
