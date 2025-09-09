import "./index.css";
import { Composition } from "remotion";
import { Cue, MyComposition } from "./Composition";
import cues from "../public/test.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Landscape1920x1080"
        component={MyComposition}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={Math.ceil((cues[cues.length-1].end + 2) * 60)}
        defaultProps={{cues: cues as Cue[], fps: 60, audioUrl: "Surah Masad.mp3"}}
      />
       <Composition
        id="Landscape1080x1920"
        component={MyComposition}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={Math.ceil((cues[cues.length-1].end + 2) * 60)}
        defaultProps={{cues: cues as Cue[], fps: 60, audioUrl: "Surah Masad.mp3"}}
      />
    </>
  );
};
