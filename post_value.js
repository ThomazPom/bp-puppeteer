// const puppeteer = require('puppeteer');
import { executablePath } from 'puppeteer';
//const puppeteer = require('puppeteer-extra')
import puppeteer from 'puppeteer-extra'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

import  child_process from 'child_process';
console.log(process.argv);

import path from 'path';
let captcha_path="./captcha.png"


import fetch from 'node-fetch';
import fse from 'fs-extra'
//var FormData = require('form-data'); // Obsolete
//var FormData = require('formdata-node').FormData;
import {FormData} from "formdata-node"
// Alternative hack to get the same FormData instance as node-fetch
// const FormData = (await new Response(new URLSearchParams()).formData()).constructor

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function get_temp_virements_libelles(page,text)
{
  
  try{
      await page.evaluate(z=>{
        [...document.querySelectorAll("a")].filter(a=>a.outerHTML.includes('virements') && a.outerHTML.includes('storique'))[0].click()
      })
      await timeout(3000);        
      await page.evaluate(z=>{
        [...document.querySelectorAll("a")].filter(a=>a.textContent.includes('exécutés'))[0].click()
      })
      
      await timeout(3000);
      (await page.evaluate(z=>{
        document.querySelectorAll(".sr-only").forEach(z=>z.remove());
        return [...document.querySelectorAll(".block-virement .row-list>:nth-child(4)")].map(x=>x.textContent.trim());
      })) .forEach(libelle=>{
        text=text.replace('VIREMENT INSTANTANE DEBIT',"V.INSTANT "+libelle);
      });
      
  }
  catch(e){
    console.log("Echec du rétablissement des textes des virements intantanés",e);
  }
  return text;
}

function goPython()
{
  let out_python = child_process.execSync(process.argv[4] +" "+ process.argv[5]+" "+ path.resolve(captcha_path),
  {
    cwd:path.dirname(process.argv[5])
  }).toString();
  console.log("Python output:")
  console.log(JSON.parse(out_python));
  return JSON.parse(out_python)
}


(async () => {
  const browser = await puppeteer.launch(

    {headless :  process.platform === "linux",
    executablePath: executablePath(),
      args: [`--disable-web-security`]}

      );

  const page = await browser.newPage();
  
  
  page.on('response', async(response) => {
    const request = response.request();
    console.log(request.url())
    if (request.url().includes('OstBrokerWeb/loginform?imgid=allunifie1')){
      const text = await response.text();
        
    // save all the data to SOMEWHERE_TO_STORE
    await fse.outputFile(captcha_path, await response.buffer());       

    // console.log("HELLO",request.url());
    // process.exit()

  }
  if(!page.searchDownload && request.url().includes("preparerRecherche-telechargementMouvements.ea")){
    page.searchDownload=1;

    let text= await page.evaluate(url=>fetch(url).then(r=>r.text()),request.url())
    let form = new FormData();
    text = await get_temp_virements_libelles(page,text)
    form.append('account_resume', text);
    let response = await fetch(process.argv[6], {method: 'POST', body: form});
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


  await page.setViewport({ width: 1500, height: 900 });
  await page.goto(
    'https://www.labanquepostale.fr/particulier/connexion-espace-client.html'
    ,{
      waitUntil: 'networkidle2' }
      );
  

  await timeout(1000)
  //typeLogin
  await page.evaluate((id,pass,indexes) => {
    var elem = frames[0].window.document.querySelector("#val_cel_identifiant")
    elem.value=id;
    let buttons =frames[0].window.document.querySelectorAll("#imageclavier button");
    [...pass].forEach(char=>{
      buttons[indexes.indexOf(char)].click();
    })
    
    frames[0].window.document.querySelector("#valider").click();
  },process.argv[2],process.argv[3],goPython())
  // await new Promise(z=>false)
  await page.waitForSelector('.account-data a');
  //await page.click(".amount-euro");
  await page.goto(await page.evaluate(z =>  document.querySelector(".account-data a").href))
  // console.log(await page.evaluate(z =>  document.body.innerHTML));
  await page.waitForSelector('.icon-ic_interface_download'); 

  await page.evaluate(() => {
//    alert(document.querySelector(".amount-euro").textContent);

setTimeout(
  ()=>{
    document.querySelector(".icon-ic_interface_download").click()
    setTimeout(()=>document.querySelector("#framePopin").contentDocument.querySelector("button").click(),2000)
    setTimeout(()=>document.querySelector("#framePopin").contentDocument.querySelector("button").click(),4000)

  }
  ,1000)
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

