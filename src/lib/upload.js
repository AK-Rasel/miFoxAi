import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import OpenAI from "openai";
// ---------------------------------- S3Client ---------------------------
const s3 = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

//----------------------------------- key word------------------------------------------------------------------
const myKeyWord = {
  bangladesh: "bangladesh is small country",
  dhaka: "dhaka is big city",
  world: "hello world",
  usa: "usa is a large country",
  london: "london is a historic city",
  java: "java is a programming language",
  react: "react is a JavaScript library",
  india: "india is known for its diversity",
  paris: "paris is the city of love",
  python: "python is a versatile programming language",
  apple: "apple makes popular tech products",
  amazon: "amazon is a leading e-commerce company",
  nile: "the nile is the longest river",
  everest: "mount everest is the highest peak",
  sun: "the sun is a star",
  moon: "the moon orbits the earth",
  galaxy: "our galaxy is the Milky Way",
  europe: "europe is a continent",
  africa: "africa has diverse wildlife",
};
const myKeyWordFindKeys = Object.keys(myKeyWord);
// ------------------------------------ OpenAI ------------------------------------------
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});
// ------------------------------ generateAIVoice ---------------------------------
export async function generateAIVoice(file) {
  // eslint-disable-next-line no-useless-catch
  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });
    // console.log(transcription.text);
    const text = [];

    myKeyWordFindKeys.forEach((item) => {
      if (transcription.text.toLowerCase().includes(item.toLowerCase())) {
        text.push([item, myKeyWord[item]]);
      }
    });

    // console.log(text[0]);
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text[0][1],
      language: "en",
    });

    return [text[0][0], mp3];
  } catch (error) {
    throw error;
  }
}

export async function uploadAIVoice(file) {
  const [a, b] = file;
  const blob = await b.blob();

  const audio = new File([blob], "audio.mp3", { type: blob.type });
  const params = {
    Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
  };
  // eslint-disable-next-line no-useless-catch
  try {
    const data = await s3.send(new ListObjectsV2Command(params));
    const mp3Files = data.Contents.filter((file) => file.Key.endsWith(".mp3"));
    for (const file of mp3Files) {
      const keysSplit = file.Key.split(".")[0];

      if (!myKeyWordFindKeys.includes(keysSplit)) {
        console.log(myKeyWordFindKeys);
        const command = new PutObjectCommand({
          Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
          Key: a + ".mp3",
          Body: audio,
          ContentType: "audio/mpeg",
        });
        // Send the upload command
        await s3.send(command);
        console.log("File uploaded successfully!");
      } else {
        console.log("File Not uploaded");
      }
    }
  } catch (error) {
    throw error;
  }
}
