import { inject } from '@loopback/core';
import {
  Request,
  RestBindings,
  get,
  response,
  ResponseObject,
} from '@loopback/rest';
import * as puppeteer from 'puppeteer';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'array',
        title: 'PingResponse',
        items: {
          properties: {
            title: { type: 'string' },
            interestsRows: {
              type: 'object',
              properties: {
                tenure: { type: 'string' },
                generatInt: { type: 'number' },
                seniorCitzInt: { type: 'number' }
              }
            },
          }
        },
      },
    },
  }
};

/**
 * A simple controller to bounce back http requests
 */
export class ScrappingController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) { }

  // Map to `GET /v1/scraper-app/scrap/now`
  @get('/v1/scraper-app/scrap/now')
  @response(200, PING_RESPONSE)
  async ping(): Promise<any> {
    // Launch the headless browser and open a new blank page
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto('https://www.hdfcbank.com/personal/save/deposits/fixed-deposit-interest-rate');

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    //To test if pupeteer is working..
    // await page.screenshot({
    //     path: 'example.png'
    // });

    const data  = await page.evaluate(() => {
      //Specfiy the if the interest rows should be sort by senior citizen or general interest rate
      const sortBy = 'generatInt';
      const containerToIterate = [2, 3];
      const bestFdRates = [];
      const hpdContainers =
        document.querySelectorAll('.bp-area.HPD-template-hdfc-9-3--area .bp-widget.bp-ui-dragRoot');
      //0th Template - 	FD Interest Rates - Check Fixed Deposit Rates Online
      //1st Template - 	FD Interest Calculator
      //2nd Template -    Fixed Deposit Interest Rate Less Than 2 Cr
      //3rd Template -    Fixed Deposit Interest Rate Greater Than Or Equal To 2 Cr To Less Than 5 Cr
      //4th Template -    Fixed Deposit Interest Rate Greater Than Or Equal To 5 Cr
      //5th Template -    Non- Withdrawal Fixed Deposit Rates Greater Than Or Equal To 2 Cr
      for (let i = 0; i < containerToIterate.length; i++) {
        let trElements, interestsRows, title, table;
        const container = containerToIterate[i];
        const fdIrContainer = hpdContainers.item(container);
        if (fdIrContainer && fdIrContainer.getElementsByTagName) {
          title = fdIrContainer.getElementsByTagName('h3').item(0).innerText;
          table = fdIrContainer.getElementsByTagName('table');
        }
        if (table?.item(0)?.getElementsByTagName)
          trElements = Array.from(table.item(0).getElementsByTagName('tr'));
        if (trElements?.length > 1) {
          interestsRows = trElements.map(td => {
            const tdData = td.innerHTML;
            const eachIntArr = tdData.match(/<td>(.*?)<\/td>/g);
            if (eachIntArr?.length === 3) {
              const tenureIntArray = eachIntArr.map(val => {
                var span = document.createElement('span');
                span.innerHTML = val;
                return span.textContent || span.innerText;
              })
              return {
                tenure: tenureIntArray[0],
                generatInt: parseFloat((tenureIntArray[1]).replace("%", "")),
                seniorCitzInt: parseFloat((tenureIntArray[2]).replace("%", ""))
              }
            }
            return {};
          }).filter(a => a?.tenure).sort((a, b) => b[sortBy] - a[sortBy]).splice(0, 3);
        }

        bestFdRates.push({
          title,
          interestsRows
        })
      }
      return bestFdRates
    });
    console.table(data);
    await browser.close();

    return data
  }
}
