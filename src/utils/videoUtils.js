import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const FFmpegModule = new FFmpeg()

const VideoCroppingutils = async (file) => {
    if (!FFmpegModule.loaded) {await FFmpegModule.load()}

    FFmpegModule.on("log", ({message}) => {
        console.log(message)
    })
    const InputFile = "input.mp4";
    const OutputFile = "output.mp4";

    await FFmpegModule.writeFile(InputFile, await fetchFile(file));

    await FFmpegModule.exec(
        ["-i", InputFile, "-an", "-vf", "scale='if(gt(iw,ih),-1,299)':'if(gt(iw,ih),299,-1)',crop=299:299", "-preset", "ultrafast", OutputFile]
    );

    const data = await FFmpegModule.readFile(OutputFile);

    return new File([new Blob([data], { type: "video/mp4" })], "videomiden.mp4", { type: "video/mp4" });
}

export default VideoCroppingutils;