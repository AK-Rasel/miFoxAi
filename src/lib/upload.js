import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import OpenAI from "openai";
import { myKeyWord, myKeyWordFindKeys } from "../components/MyKeyWord";
const s3 = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateAIVoice(file) {
  // eslint-disable-next-line no-useless-catch
  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });
    console.log(transcription.text);
    const text = [];
    console.log(text);
    myKeyWordFindKeys.forEach((item) => {
      if (transcription.text.toLowerCase().includes(item.toLowerCase())) {
        text.push([item, myKeyWord[item]]);
      }
    });

    console.log(text[0][1]);
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
  console.log(file);
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
