import React, { useEffect, type JSX, useCallback } from 'react';
import { useInterval } from '../hooks/use-interval';
import { Button } from './button';
import { Timer } from './timer';
import bellStart from '../sounds/bell-start.mp3';
import bellFinish from '../sounds/bell-finish.mp3';
import { secondsToTime } from '../utils/seconds-to-time';
import { loadFromLocalStorage } from '../utils/load-localStorage';
import { saveToLocalStorage } from '../utils/saved-localStorage';

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

  const isHandlingEndRef = React.useRef(false);

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
    if (isHandlingEndRef.current) return; // 🔒 trava
    isHandlingEndRef.current = true; //Isso significa: “Se o fim do tempo já foi processado, não faça nada.”
    // Ou seja: Primeira execução → passa Segunda execução (Strict Mode) → é bloqueada

    if (working && cyclesQtdManager.length > 0) {
      console.log(cyclesQtdManager);
      configureRest(false);
      setCyclesQtdManager((prev) => prev.slice(0, -1));
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

  const savedAllLocalStorage = (): void => {
    saveToLocalStorage('completedCycles', completedCycles);
    saveToLocalStorage('fullWorkingTime', fullWorkingTime);
    saveToLocalStorage('fullRestingTime', fullRestingTime);
    saveToLocalStorage('numberOfPomodoros', numberOfPomodoros);
    console.log('Salvei os dados no Localstorage');
  };

  useInterval(
    () => {
      setMainTime((prev) => {
        if (working) {
          setFullWorkingTime(fullWorkingTime + 1);
          if (fullWorkingTime % 60 === 0) savedAllLocalStorage();
        }
        if (resting) {
          setFullRestingTime(fullRestingTime + 1);
          if (fullRestingTime % 60 === 0) savedAllLocalStorage();
        }
        if (prev <= 1) {
          setTimeCounting(false); // ⛔ para o intervalo
          handleTimeEnd(); // ✅ UMA ÚNICA VEZ
          setTimeCounting(true);
          return 0;
        }
        isHandlingEndRef.current = false; // 🔓 novo tick
        return prev - 1;
      });
    },
    timeCounting ? 1000 : null,
  );

  // Toda vez que Work mudar, isso ira ser executado
  useEffect(() => {
    if (working) document.body.classList.add('working');
    if (resting) document.body.classList.remove('working');
  }, [working, resting]);

  //Vai pegar os dados do localStorage, se existir, vai carregar no estado
  const loadAllLocalStorage = (
    savedCompletedCycles: number,
    savedFullWorkingTime: number,
    savedFullRestingTime: number,
    savedNumberOfPomodoros: number,
  ): void => {
    // queueMicrotask adia a execução do setState para depois do render atual, evitando warnings de "cascading renders" no React 18+
    if (savedCompletedCycles) {
      queueMicrotask(() => setCompletedCycles(savedCompletedCycles));
    }
    if (savedFullWorkingTime) {
      queueMicrotask(() => setFullWorkingTime(savedFullWorkingTime));
    }
    if (savedFullRestingTime) {
      queueMicrotask(() => setFullRestingTime(savedFullRestingTime));
    }
    if (savedNumberOfPomodoros) {
      queueMicrotask(() => setNumberOfPomodoros(savedNumberOfPomodoros));
    }
    console.log('Peguei os dados do LocalStorage');
  };

  //Vai chamar a funcao, que vai pegar os dados de tal dia
  useEffect(() => {
    const savedCompletedCycles = loadFromLocalStorage('completedCycles');
    const savedFullWorkingTime = loadFromLocalStorage('fullWorkingTime');
    const savedFullRestingTime = loadFromLocalStorage('fullRestingTime');
    const savedNumberOfPomodoros = loadFromLocalStorage('numberOfPomodoros');

    loadAllLocalStorage(
      savedCompletedCycles,
      savedFullWorkingTime,
      savedFullRestingTime,
      savedNumberOfPomodoros,
    );
  }, []);

  return (
    <div className="pomodoro">
      <h2>Você está: {working ? 'Trabalhando' : 'Descansando'}</h2>
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
