import React, { useEffect, type JSX, useCallback } from 'react';
import { useInterval } from '../hooks/use-interval';
import { Button } from './button';
import { Timer } from './timer';
import bellStart from '../sounds/bell-start.mp3';
import bellFinish from '../sounds/bell-finish.mp3';
import { secondsToTime } from '../utils/seconds-to-time';

const audioStartWorking = new Audio(bellStart);
const audioStopWorking = new Audio(bellFinish);

interface Props {
  pomodoroTime: number;
  shortRestTime: number;
  longRestTime: number;
  cycles: number;
}

export function PomodoroTimer(props: Props): JSX.Element {
  const [mainTime, setMainTime] = React.useState(props.pomodoroTime);
  const [timeCounting, setTimeCounting] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  const [resting, setResting] = React.useState(false);
  const [cyclesQtdManager, setCyclesQtdManager] = React.useState(
    new Array(props.cycles - 1).fill(true),
  );

  const [completedCycles, setCompletedCycles] = React.useState(0);
  const [fullWorkingTime, setFullWorkingTime] = React.useState(0);
  const [fullRestingTime, setFullRestingTime] = React.useState(0);
  const [numberOfPomodoros, setNumberOfPomodoros] = React.useState(0);

  useInterval(
    () => {
      setMainTime((prev) => {
        if (prev === 1) {
          console.log(prev);
          handleTimeEnd(); // agora chamado dentro do setState
          return 0;
        }
        return prev - 1;
      });
    },
    timeCounting ? 1000 : null,
  );

  const configureWork = useCallback(() => {
    setTimeCounting(true);
    setWorking(true);
    setResting(false);
    setMainTime(props.pomodoroTime);
    audioStartWorking.play();
  }, [props.pomodoroTime]);

  const configureRest = useCallback(
    (long: boolean) => {
      setTimeCounting(true);
      setWorking(false);
      setResting(true);

      if (long) {
        setMainTime(props.longRestTime);
      } else {
        setMainTime(props.shortRestTime);
      }

      audioStopWorking.play();
    },
    [props.longRestTime, props.shortRestTime],
  );

  const handleTimeEnd = useCallback(() => {
    if (working && cyclesQtdManager.length > 0) {
      console.log(cyclesQtdManager);
      configureRest(false);
      cyclesQtdManager.pop();
    } else if (working && cyclesQtdManager.length <= 0) {
      configureRest(true);
      setCyclesQtdManager(new Array(props.cycles - 1).fill(true));
      setCompletedCycles(completedCycles + 1);
    }

    if (working) setNumberOfPomodoros(numberOfPomodoros + 1);
    if (resting) configureWork();
  }, [
    working,
    resting,
    cyclesQtdManager,
    configureRest,
    setCyclesQtdManager,
    setCompletedCycles,
    completedCycles,
    numberOfPomodoros,
    setNumberOfPomodoros,
    configureWork,
    props.cycles,
  ]);

  // Toda vez que Work mudar, isso ira ser executado
  useEffect(() => {
    if (working) document.body.classList.add('working');
    if (resting) document.body.classList.remove('working');
  }, [working, resting]);

  return (
    <div className="pomodoro">
      <h2>You are: working</h2>
      <Timer mainTime={mainTime} />

      <div className="controls">
        <Button text="Work" onClick={() => configureWork()}></Button>
        <Button text="Rest" onClick={() => configureRest(false)}></Button>
        <Button
          className={!working && !resting ? 'hidden' : ''}
          text={timeCounting ? 'Pause' : 'Play'}
          onClick={() => setTimeCounting(!timeCounting)} // Vai fazer um toogle no TimeCounting
        ></Button>
      </div>

      <div className="details">
        <p>Ciclos Concluidos: {completedCycles}</p>
        <p>Horas Trabalhadas: {secondsToTime(fullWorkingTime)}</p>
        <p>Horas Descansadas: {secondsToTime(fullRestingTime)}</p>
        <p>Pomodoros Concluidos: {numberOfPomodoros}</p>
      </div>
    </div>
  );
}
