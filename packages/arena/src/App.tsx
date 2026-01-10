import { useCallback } from 'react';
import { useSocket, TapEffectEvent } from './hooks/useSocket';
import { Canvas } from './components/Canvas';

function App() {
  // Handle tap effects from other users
  const handleTapEffect = useCallback((effect: TapEffectEvent) => {
    const showRemoteTapEffect = (window as unknown as { showRemoteTapEffect?: (x: number, y: number) => void }).showRemoteTapEffect;
    if (showRemoteTapEffect) {
      showRemoteTapEffect(effect.x, effect.y);
    }
  }, []);

  const { puckConfigs, puckStates, settings, sendTap } = useSocket(handleTapEffect);

  return (
    <div className="w-full h-full relative bg-slate-900">
      <Canvas
        puckConfigs={puckConfigs}
        puckStates={puckStates}
        settings={settings}
        onTap={sendTap}
      />
    </div>
  );
}

export default App;
