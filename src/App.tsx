import { useEffect, useRef, useState } from 'react'
import './App.css'
import wallClockTickingUrl from './assets/Wall Clock Ticking.mp3'
import magicMalletUrl from './assets/magic-mallet-6262.mp3'

type Mode = "focus" | "short_break";
type PlayState = "playing" | "paused";

const devMode = document.location.search.includes('dev');

function minutes(n: number) {
  return 60.0* 1000 * n;
}
function seconds(n: number) {
  return 1000 * n;
}
const focusTime = !devMode ? minutes(25) + seconds(0) : minutes(0) + seconds(5);
const shortBreakTime = !devMode ? minutes(5) + seconds(0) : minutes(0) + seconds(4);

function modeNext(state: Mode) {
  if (state === 'focus') {
    return 'short_break';
  } else {
    return 'focus';
  }
}

function playStateNext(state: PlayState) {
  if (state === 'playing') {
    return 'paused';
  } else {
    return 'playing';
  }
}


const modeTimeMap = {
  "focus": focusTime,
  "short_break": shortBreakTime
};

function PlayStateButton(props: { playing: PlayState, onToggle: (newState: PlayState) => void }) {
  return (
    <button onClick={() => props.onToggle(playStateNext(props.playing))}>
      {props.playing === 'playing' ? 'pause' : 'start'}
    </button>
  )
}

function TimerDisplay(props: { countdownMs: number }) {
  const date = new Date(props.countdownMs);
  const mins = date.getUTCMinutes();
  const secs = date.getUTCSeconds();
  const fmt = (t: number) => String(t).padStart(2, '0')
  return (
    <>
      {fmt(mins)}:{fmt(secs)}
    </>
  );
}

function Brand() {
  return (
    <span className="brand">TOMODORO by TOM LUXURY</span>
  )
}
function App() {
  const STARTING_MODE = "focus";
  const [mode, setMode] = useState<Mode>(STARTING_MODE)
  const [countdownMs, setCountdownMs] = useState(modeTimeMap[STARTING_MODE]);
  const [playState, setPlayState] = useState<"playing" | "paused">("paused");

  // we use these pairs to count up to 1 second
  const mark = useRef(performance.now());
  const now = useRef(mark.current);

  // if we've set countdown < 0, then transition mode + reset the mark as a side effect,
  // and also reset the countdown timer
  // it is this indirect way b/c setCountDownMs() call in playstate effect uses updater function
  useEffect(() => {
    if (countdownMs < 0) {
      // flip the mode
      const nextMode = modeNext(mode);
      setMode(nextMode);
      // reset timer … this doesn't bother to account for "underflow", so there is some error
      setCountdownMs(modeTimeMap[nextMode]);
    }
  }, [countdownMs]);

  // playstate set countdown / mark effect
  useEffect(() => {
    // TODO: this should really be setting mins/secs directly as a state
    if (playState == 'playing') {
      // when moving into playing, on an interval.  reset the interval
      mark.current = performance.now();
      const ival = setInterval(() => {
        now.current = performance.now();
        const delta = now.current - mark.current;
        console.log(`tick ${delta}`);
        setCountdownMs((ms) => ms - delta);
        mark.current = performance.now();
      }, 100.0);
      console.log('set interval', ival);

      return () => {
        console.log('clear interval', ival);
        clearInterval(ival);
      };
    } else {
      return;
    }
  }, [playState]);

  // disable audio in dev mode
  function pause(a: HTMLAudioElement) {
    if (devMode) return;
    if (!a.paused)
      a.pause();
  }
  function replay(a: HTMLAudioElement) {
    if (devMode) return;
    a.currentTime = (0.0);
    a.play();
  }

  function playOneshot(url: string) {
    if (devMode) return;
    new Audio(url).play();
  }

  // effect to update audio playback
  // - when playState is paused, no audio
  // - else, if mode is focus, tick-tick
  //    - if mode is short_break, no sound
  const tickRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!tickRef.current) return;
    if (playState == 'paused') {
      console.log('mute');
      pause(tickRef.current);
    } else {
      if (mode == 'focus') {
        console.log('play');
        replay(tickRef.current);
      } else {
        console.log('pause');
        pause(tickRef.current);
      }
    }
  }, [playState, mode]);

  // chime when entering a break
  // TODO: chime ahead of starting focus
  useEffect(() => {
    if (mode === 'short_break') {
      playOneshot(magicMalletUrl);
    }
  }, [mode])
  return (
    <div className={`container mode-${mode}`}>
      <div className="app">
        {mode}<br/><TimerDisplay countdownMs={countdownMs} /><br/>
        <audio src={wallClockTickingUrl} loop ref={tickRef} />
        <PlayStateButton playing={playState} onToggle={(state) => setPlayState(state)} /><br/>
        <Brand />
      </div>
    </div>
  )
}

export default App
