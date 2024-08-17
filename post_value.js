// const puppeteer = require('puppeteer');
import {
  executablePath
} from 'puppeteer';
//const puppeteer = require('puppeteer-extra')
import puppeteer from 'puppeteer-extra'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())
import fs from 'fs'
import {
  fileURLToPath
} from 'url';
import path, {
  dirname
} from 'path';
console.log(process.argv);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let launchArgs = {

  headless: process.platform === "linux",
  executablePath: executablePath(),
  args: [`--disable-web-security`],

  defaultViewport: null,
  args: [

      '--window-size=1920,1080',
  ],
}
let captcha_path = "./captcha.png";
let settings = {
  blank_profile: process.argv.includes("--blank_profile")
}
if (!settings.blank_profile) {

  let userDataDir = path.join(__dirname, "profile")
  fs.mkdir(userDataDir, {
      recursive: true
  }, z => {})
  launchArgs.userDataDir = userDataDir

}

import fetch from 'node-fetch';
import fse from 'fs-extra'
//var FormData = require('form-data'); // Obsolete
//var FormData = require('formdata-node').FormData;
import {
  FormData
} from "formdata-node"
// Alternative hack to get the same FormData instance as node-fetch
// const FormData = (await new Response(new URLSearchParams()).formData()).constructor

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function get_temp_virements_libelles(page, text) {

  try {
      await page.evaluate(z => {
          [...document.querySelectorAll("a")].filter(a => a.outerHTML.includes('virements') && a.outerHTML.includes('storique'))[0].click()
      })
      await timeout(3000);
      await page.evaluate(z => {
          [...document.querySelectorAll("a,h3")].filter(a => a.textContent.includes('exécutés'))[0].click()
      })

      await timeout(3000);
      (await page.evaluate(z => {
          document.querySelectorAll(".sr-only").forEach(z => z.remove());
          return [...document.querySelectorAll(".block-virement .row-list>:nth-child(4)")].map(x => x.textContent.trim());
      })).forEach(libelle => {
          text = text.replace('VIREMENT INSTANTANE DEBIT', "V.INSTANT " + libelle);
      });

  } catch (e) {
      console.log("Echec du rétablissement des textes des virements intantanés", e);
  }
  return text;
}


(async () => {
  const browser = await puppeteer.launch(
      launchArgs

  );

  const page = await browser.newPage();


  page.on('response', async (response) => {
      const request = response.request();
      console.log(request.url())
      if (request.url().includes('OstBrokerWeb/loginform?imgid=allunifie1')) {
          const text = await response.text();

          // save all the data to SOMEWHERE_TO_STORE
          await fse.outputFile(captcha_path, await response.buffer());

          // console.log("HELLO",request.url());
          // process.exit()

      }
      if (!page.searchDownload && request.url().includes("preparerRecherche-telechargementMouvements.ea")) {
          page.searchDownload = 1;

          let text = await page.evaluate(url => fetch(url).then(r => r.text()), request.url())
          let form = new FormData();
          text = await get_temp_virements_libelles(page, text)
          form.append('account_resume', text);
          let response = await fetch(process.argv[4], {
              method: 'POST',
              body: form
          });
          let data = await response.text();
          console.log("#################-DATA HAS BEEN SENT TO SERVER-########################");
          await browser.close();
          process.exit();
          //console.log(data);
          //    page.evaluate(url=>{
          //    
          //},request.url());
          //await new Promise(resolve=>setTimeout(resolve,3000));
          //const fse = require('fs-extra');
          //    await fse.outputFile("tsv_file_out.tsv", await response.buffer());
      }
  })


  await page.setViewport({
      width: 1500,
      height: 900
  });
  await page.goto(
      'https://www.labanquepostale.fr/particulier/connexion-espace-client.html', {
          waitUntil: 'networkidle2'
      }
  );


  await timeout(1000)

  const loginFrame = await page.$("iframe[src][title]");
  const boundingBox = await loginFrame.boundingBox();
  await page.mouse.wheel({
      deltaY: boundingBox.y - 100
  });

  let used_frame = await new Promise(resolve => {
      page.frames().forEach(async frame => {
          try {
              await frame.type("input#identifiant", process.argv[2] + String.fromCharCode(13), {
                  delay: 250
              })
              console.log(frame.url(), "is the login frame")
              resolve(frame)
          } catch {
              console.log(frame.url(), "is not a login frame")
          }
      })
  })


  await timeout(1000)
  await used_frame.evaluate(z => {
      document.querySelectorAll("[data-tb-index]").forEach(bt => bt.setAttribute('data-code', bt.innerText))
  })

  for (var x = 0, c = ''; c = process.argv[3].charAt(x); x++) {
      await used_frame.click(`[data-code="${c}"]`)
      console.log("Click on", c)
      await timeout(500)
  }
  used_frame.click("#btnConnexion")
  // await timeout(1000000000)
  // await new Promise(z=>false)git 
  await page.waitForSelector('.account-data a');
  //await page.click(".amount-euro");
  await page.goto(await page.evaluate(z => document.querySelector(".account-data a").href))
  // console.log(await page.evaluate(z =>  document.body.innerHTML));
  await page.waitForSelector('.icon-ic_interface_download');

  await page.evaluate(() => {
      //    alert(document.querySelector(".amount-euro").textContent);

      setTimeout(
          () => {
              document.querySelector(".icon-ic_interface_download").click()
              setTimeout(() => document.querySelector("#framePopin").contentDocument.querySelector("button").click(), 2000)
              setTimeout(() => document.querySelector("#framePopin").contentDocument.querySelector("button").click(), 4000)

          }, 1000)
  })

  await new Promise((resolve, reject) => {
      // wait for event (simulated with setTimeout)
      setTimeout(() => {
          // event happens, resolve promise
          resolve();

      }, 50000);
  });

  //await browser.close();
})();