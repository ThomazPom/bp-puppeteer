const puppeteer = require('puppeteer');
const child_process = require('child_process');
console.log(process.argv);
const path = require('path');
captcha_path="./captcha.png"


fetch = require('node-fetch-commonjs');

var FormData = require('form-data');

// Alternative hack to get the same FormData instance as node-fetch
// const FormData = (await new Response(new URLSearchParams()).formData()).constructor




function goPython()
{
  out_python = child_process.execSync(process.argv[4] +" "+ process.argv[5]+" "+ path.resolve(captcha_path),
  {
    cwd:path.dirname(process.argv[5])
  }).toString();
  return JSON.parse(out_python)
}


(async () => {
  const browser = await puppeteer.launch(

    {headless : false,

      args: [`--window-size=1500,900`,`--disable-web-security`]}

      );

  const page = await browser.newPage();
  
  page.on('response', async(response) => {
    const request = response.request();
    console.log(request.url())
    if (request.url().includes('OstBrokerWeb/loginform?imgid=allunifie1')){
      const text = await response.text();
//        console.log("HELLO",request.url(),text);

const fse = require('fs-extra');
    // save all the data to SOMEWHERE_TO_STORE
    await fse.outputFile(captcha_path, await response.buffer());       


  }
  if(!page.searchDownload && request.url().includes("preparerRecherche-telechargementMouvements.ea")){
    page.searchDownload=1;

    let text= await page.evaluate(url=>fetch(url).then(r=>r.text()),request.url())
    let form = new FormData();
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


  await page.waitForSelector('.amount-euro'); 


  await page.evaluate(() => {

    document.querySelector(".amount-euro").click();
  })
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

