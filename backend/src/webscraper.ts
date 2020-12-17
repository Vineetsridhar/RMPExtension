const JSSoup = require("jssoup").default;
import fetch = require("node-fetch");

const MAINRATINGID = "RatingValue__Numerator-qw8sqy-2 liyUjw";
const SUBRATINGIDS = "FeedbackItem__FeedbackNumber-uof32n-1 kkESWs";
const NUMRATINGID = "RatingValue__NumRatings-qw8sqy-0 jMkisx";

function getDifficultyAndRetake(
  divs: any[]
): { difficulty: number; retake: number } {
  let difficulty = 0,
    retake = 0;
  let extras = divs.filter((div: any) => div.attrs.class === SUBRATINGIDS);
  for (let i in extras) {
    let text: string = extras[i].text;
    if (text.includes("%")) {
      retake = parseInt(text.substring(0, text.length - 1));
    } else {
      difficulty = parseFloat(text);
    }
  }
  return { difficulty, retake };
}

function getRating(divs: any[]): number {
  const item = divs.find(div => div.attrs.class === MAINRATINGID);
  return parseFloat(item.text);
}

function getNumRatings(divs: any[]): number {
  let numratings = 0;
  let numRatingElement = divs.find(
    (div: any) => div.attrs.class === NUMRATINGID
  );

  for (let word of numRatingElement.text.split("\xa0")) {
    if (!isNaN(parseInt(word))) {
      numratings = parseInt(word);
      break;
    }
  }
  return numratings;
}

async function scrapeURL(
  url: string
): Promise<{
  rating: number;
  difficulty: number;
  retake: number;
  numratings: number;
}> {
  try {
    let rating = 0,
      numratings = 0;

    let html = await fetch(url).then((data: any) => data.text());
    let divs = new JSSoup(html).findAll("div");

    let { difficulty, retake } = getDifficultyAndRetake(divs);
    rating = getRating(divs);
    numratings = getNumRatings(divs);

    return { rating, difficulty, retake, numratings };
  } catch (err) {
    console.log("Error scraping RMP", err);
  }
  return { rating: 0, difficulty: 0, retake: 0, numratings: 0 };
}

module.exports = scrapeURL;
