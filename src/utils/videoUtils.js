import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFmpegModule = new FFmpeg()

const VideoCroppingutils = async (file) => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    if (!FFmpegModule.loaded) {await FFmpegModule.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })}

    const InputFile = "input.mp4";
    const OutputFile = "output.mp4";
    let metadataLog = "";

    FFmpegModule.on("log", ({message}) => {
        metadataLog += `${message}\n`;
        console.log(message);
    })

    await FFmpegModule.writeFile(InputFile, await fetchFile(file));

    try {
        await FFmpegModule.exec(["-i", InputFile, OutputFile]);
    } catch (e) {
        console.error(e);
    }
    console.log("FFmpeg Metadata Log:\n", metadataLog);

    const match = metadataLog.match(/Stream #0:0.*?(\d+)x(\d+)/);
    if (!match) throw new Error("Failed to extract video resolution");

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    console.log(`Video resolution detected: ${width}x${height}`);

    const cropSize = Math.min(width, height);

    await FFmpegModule.exec([
        "-i", InputFile,
        "-an",
        "-vf", `crop=${cropSize}:${cropSize}`,
        "-preset", "ultrafast",
        OutputFile
    ]);

    const data = await FFmpegModule.readFile(OutputFile);


    return new Blob([data.buffer], { type: "video/mp4" });
}

export default VideoCroppingutils;