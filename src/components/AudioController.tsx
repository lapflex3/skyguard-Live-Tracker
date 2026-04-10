import React, { useEffect, useRef } from 'react';

export const AudioController: React.FC<{ alertLevel: 'none' | 'low' | 'medium' | 'high' }> = ({ alertLevel }) => {
  const sirenRef = useRef<HTMLAudioElement | null>(null);
  const notifyRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (alertLevel === 'high' || alertLevel === 'medium') {
      playSiren();
    } else {
      stopSiren();
    }
  }, [alertLevel]);

  const playSiren = () => {
    if (sirenRef.current) {
      sirenRef.current.loop = true;
      sirenRef.current.play().catch(() => {});
    }
  };

  const stopSiren = () => {
    if (sirenRef.current) {
      sirenRef.current.pause();
      sirenRef.current.currentTime = 0;
    }
  };

  return (
    <div className="hidden">
      <audio ref={sirenRef} src="https://www.soundjay.com/buttons/sounds/beep-07.mp3" />
      <audio ref={notifyRef} src="https://www.soundjay.com/buttons/sounds/button-3.mp3" />
    </div>
  );
};
