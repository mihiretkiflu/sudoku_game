import { useTimer } from "react-timer-hook";

function Timer({ expiryTimestamp }) {
  const { seconds, minutes } = useTimer({ expiryTimestamp, autoStart: true });
  return (
    <span>
      Time: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </span>
  );
}

export default Timer;
