import fs from "node:fs";
import rawJson from "./data.json" assert { type: "json" };

// state i'll use
const aggregateData = {};
let keys;
let result = [];

// aggregate totals
rawJson.forEach((item) => {
  const {
    "Grant Code": grantCode,
    "Transaction Month": postingMonth,
    "Transaction Year": postingYear,
    "Project Code": projectCode,
    "Cost Center": costCenter,
    // Unit: unit,
    Currency: currency,
    "Sum of Actual": sumOfActual,
    Unit: unit,
  } = item;

  const grantCodeCleanME = grantCode.replace(/[ME]$/, "");
  const newGrantCode = `${grantCodeCleanME}_default`;
  const externalId = `${newGrantCode}_${projectCode}_${costCenter}_${postingMonth}_${postingYear}_${unit}`;

  if (!aggregateData[externalId]) {
    aggregateData[externalId] = {
      grantCode: newGrantCode,
      projectCode,
      costCenter,
      postingMonth,
      postingYear,
      unit,
      currency,
      sumOfActual: 0,
    };
  }
  if (!keys) {
    keys = Object.keys(aggregateData[externalId]);
  }
  aggregateData[externalId].sumOfActual += parseFloat(sumOfActual);
});

// now convert to the intermediate state
// TODO we could save more data if we aggregate as objects under grantCode, save repeating that key
const minified = {
  keys,
  data: Object.values(aggregateData).map(Object.values),
};
console.log(minified);
// output the converted data
fs.writeFileSync("./out/converted.json", JSON.stringify(minified));

// now read the data back in, we're in salesforce land now
// re-assemble the data
minified.data.forEach((item) => {
  const obj = item.reduce((acc, value, idx) => {
    acc[keys[idx]] = value;
    return acc;
  }, {});

  const {
    grantCode: newGrantCode, // preserving this but it could be mapped
    projectCode,
    costCenter,
    postingMonth,
    postingYear,
    unit,
    currency,
    sumOfActual,
  } = obj;

  const externalId = `${newGrantCode}_${projectCode}_${costCenter}_${postingMonth}_${postingYear}_${unit}`;

  const mapped = {
    ExternalId__c: externalId,
    ampi__Type__c: "Expenditure",
    Name: `${newGrantCode}_${projectCode}_${costCenter}_${postingMonth}_${postingYear}`,
    "ampi__Budget__r.External_Id__c": `${newGrantCode}_${postingYear}_${unit}`,
    "ampi__Reporting_Period__r.External_Id__c": `${newGrantCode}_${postingYear}_${postingMonth}_Monthly`,
    Local_Currency__c: currency,
    Amount_Actual_Local_Currency__c: sumOfActual,
    "Project_Code__r.Name": projectCode,
    "Implementing_Partner__r.BC_Cost_Center__c": costCenter,
  };
  result.push(mapped);
});

// dump the final converted data
fs.writeFileSync("./out/result.json", JSON.stringify(result));
