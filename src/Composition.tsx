// MyComposition.tsx
import React, {useLayoutEffect, useRef, useState} from "react";
import {
  Sequence, useVideoConfig, Audio, staticFile,
  useCurrentFrame, interpolate, Easing, Img
} from "remotion";

const FADE_IN_FRAMES = 14;
const FADE_OUT_FRAMES = 18;

// Tiny visual gap between non-last cues
const GAP_SECONDS = 0.1;

// Extra time added to the final cue for a nicer fade-out
const OUTRO_SECONDS = 2;

export type Cue = { start: number; end: number; arabic: string; translation?: string };

const useMeasuredWidth = <T extends HTMLElement>(deps: any[] = []) => {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => setW(el.getBoundingClientRect().width);
    (document as any).fonts?.ready?.then(measure);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return {ref, width: w};
};

export const MyComposition: React.FC<{
  cues: Cue[];
  fps?: number;
  audioUrl?: string;
}> = ({cues, fps, audioUrl}) => {
  const {fps: defaultFps, width: videoW} = useVideoConfig();
  const F = fps ?? defaultFps;
  const PAD = 48;
  const IS_YOUTUBE = videoW === 1920;
  const logoW = IS_YOUTUBE ? 500 : 700;

  // Pre-roll before 1st cue
  const firstStartFrames = cues.length ? Math.max(0, Math.round(cues[0].start * F)) : 0;
  const gapFrames = Math.max(0, Math.round(GAP_SECONDS * F));
  const extraOutroFrames = Math.max(0, Math.round(OUTRO_SECONDS * F));

  const Block: React.FC<{
    cue: Cue;
    durationInFrames: number;
    isFirst: boolean;
    isLast: boolean;
  }> = ({cue, durationInFrames, isFirst, isLast}) => {
    const frame = useCurrentFrame();
    const d = durationInFrames;

    // First cue: fade OUT only; others fade IN & OUT.
    const fadeInLen = isFirst ? 0 : Math.min(FADE_IN_FRAMES, Math.floor(d / 2));
    const baseFadeOut = Math.min(FADE_OUT_FRAMES, Math.floor(d / 2));
    const fadeOutLen = isLast
      ? Math.min(baseFadeOut + extraOutroFrames, Math.floor(d)) // extend last fade
      : baseFadeOut;

    const fadeIn =
      fadeInLen > 0
        ? interpolate(frame, [0, fadeInLen], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.ease,
          })
        : 1;

    const fadeOut =
      fadeOutLen > 0
        ? interpolate(frame, [d - fadeOutLen, d], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.ease,
          })
        : 1;

    const opacity = fadeIn * fadeOut;

    const {ref, width: arW} = useMeasuredWidth<HTMLDivElement>([cue.arabic]);
    const usableMax = Math.max(0, videoW - PAD * 2);

    // Wrap width heuristic for English
    const arLenNoSpaces = cue.arabic.replace(/\s/g, "").length;
    const wrapRatio =
      IS_YOUTUBE
        ? 0.6
        : (cue.translation && cue.translation.length > 40)
          ? 0.92   // wider if translation is long (phone)
          : 0.8;

    const targetW = Math.min(
      usableMax,
      Math.max(arW || usableMax, Math.round(usableMax * wrapRatio))
    );

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: PAD,
          opacity,
        }}
      >
        <div style={{textAlign: "center"}}>
          <div
            ref={ref}
            style={{
              display: "inline-block",
              direction: "rtl",
              unicodeBidi: "plaintext",
              fontFamily: "qpc-hafs, serif",
              fontSize: IS_YOUTUBE ? 90 : 100,
              lineHeight: 1.25,
              marginBottom: IS_YOUTUBE ? 28 : 36,
              maxWidth: usableMax,
              whiteSpace: "normal",
            }}
          >
            {cue.arabic}
          </div>

          {cue.translation && (
            <div
              style={{
                width: Math.round(targetW),
                margin: "0 auto",
                direction: "ltr",
                fontFamily: '"Alegreya Sans SC", sans-serif',
                fontSize: 55,
                lineHeight: 1.25,
              }}
            >
              {cue.translation}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black text-white">
      {audioUrl && <Audio src={staticFile(audioUrl)} />}

      {cues.map((c, i) => {
        const startFrames = Math.max(0, Math.round(c.start * F));
        const origDuration = Math.max(1, Math.round((c.end - c.start) * F));

        const isFirst = i === 0;
        const isLast  = i === cues.length - 1;

        const from = isFirst ? 0 : startFrames;

        // First cue gets extra pre-roll so it starts at t=0
        let effectiveDuration = origDuration + (isFirst ? firstStartFrames : 0);

        // Micro gap for all but the last
        if (!isLast) effectiveDuration = Math.max(1, effectiveDuration - gapFrames);

        // Extend the final cue for a nicer fade
        if (isLast) effectiveDuration += extraOutroFrames;

        return (
          <Sequence key={i} from={from} durationInFrames={effectiveDuration}>
            <Block
              cue={c}
              durationInFrames={effectiveDuration}
              isFirst={isFirst}
              isLast={isLast}
            />
          </Sequence>
        );
      })}

      <Img
        src={staticFile("/logo.png")}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 5,
          transform: "translateX(-50%)",
          width: logoW,
          opacity: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
