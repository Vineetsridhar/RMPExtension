const JSSoup = require('jssoup').default;
import fetch = require('node-fetch');
const MAINRATINGID = "RatingValue__Numerator-qw8sqy-2 gxuTRq";
const SUBRATINGIDS = "FeedbackItem__FeedbackNumber-uof32n-1 bGrrmf";
const RATINGID = "Rating__RatingBody-sc-1rhvpxz-0 dGrvXb";

async function scrapeURL(url:string): Promise<{rating:number, difficulty:number, retake:number, numratings:number}> {
    try{
        let difficulty = 0, retake = 0, rating = 0, numratings = 0;

        let html = await fetch(url).then((data:any) => data.text());
        let soup = new JSSoup(html);
        let divs = soup.findAll("div");

        rating = parseFloat(divs.find((div:any) => div.attrs.class === MAINRATINGID).text);
        let extras = divs.filter((div:any) => div.attrs.class === SUBRATINGIDS);
        let ratings = divs.filter((div:any) => div.attrs.class === RATINGID);

        numratings = ratings.length;

        for(let i in extras){
            let text:string = extras[i].text;
            if(text.includes("%")){
                retake = parseInt(text.substring(0, text.length - 1));
            } else{
                difficulty = parseFloat(text);
            }
        }
        return {rating, difficulty, retake, numratings}
    } catch(err){
        console.log("Error scraping RMP", err)
    }
    return {rating:0, difficulty:0, retake:0, numratings:0}
}
module.exports = scrapeURL