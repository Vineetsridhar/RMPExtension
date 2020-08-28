const JSSoup = require('jssoup').default;
import fetch = require('node-fetch');
const MAINRATINGID = "RatingValue__Numerator-qw8sqy-2 gxuTRq";
const SUBRATINGIDS = "FeedbackItem__FeedbackNumber-uof32n-1 bGrrmf";


async function scrapeURL(url:string): Promise<{rating?:number, difficulty?:number, retake?:number}> {
    try{
        let difficulty:number|undefined, retake:number|undefined, rating:number|undefined;

        let html = await fetch(url).then((data:any) => data.text());
        let soup = new JSSoup(html);
        let divs = soup.findAll("div");

        rating = parseFloat(divs.find((div:any) => div.attrs.class === MAINRATINGID).text)
        let extras = divs.filter((div:any) => div.attrs.class === SUBRATINGIDS)

        for(let i in extras){
            let text:string = extras[i].text
            if(text.includes("%")){
                retake = parseInt(text.substring(0, text.length - 1));
            } else{
                difficulty = parseFloat(text)
            }
        }

        return {rating, difficulty, retake}
    } catch(err){
        console.log("Error scraping RMP", err)
    }
    return {rating:undefined, difficulty:undefined, retake:undefined}
}
module.exports = scrapeURL