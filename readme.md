## About

This repo is an attempt to minify data from a large CSV and hand it off to multiple jobs.

The strategy is to minimize the size of the processed CSV data when we write it to disk by a) doing a light sort of encoding on the output data and b) generating the long salesforce strings in the salesforce job itself.

## Getting Started

You can run this with

```
npm install
npm start
```

The fake job will:

a) import the data in `./data.json`
b) process and minify the result into `converted.json` (this is the output of `applyMappings`)
c) Re-assemble the minified result, as in `loadFinancialstoSf`
d) write the final result into `./out/result.json`

## Problems

The problem at teh moment is that the parsed CSV data produced by the `msgraph` job result in too big a file to load into the `salesforce` job.

The ideal solution would be to stream the CSV direct from msgraph and then converting and batch-updating to salesforce in one job. This sort of requires two adaptors to run at once, which is not possible.

We might get away with it if we can somehow stream the CSV data from common (using common.http)

## Details

This approach simulates our curent approach first by a loading JSON file as if it has been parsed from CSV.

Broadly, the strategy is to

- Calculate actuals for the whole dataset
  - Generate an id for each item. If the id is unique, write it to an aggregated object cache.
- Convert the aggregated cache into a more lightweight JSON format (a tuple-like array of values with no keys)
- Re-assemble the lightweight JSON in the salesforce job
- Re-compute the external id and map values for salesforce
