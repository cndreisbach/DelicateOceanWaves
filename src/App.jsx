import React, {useState} from 'react';
import './App.css';
import Waveform from './Waveform';
import ReactWaves from "@dschoon/react-waves";
import peaks from "./peaks1.json";
import audio from "./audio1.mp4";

function App() {
  const [playheadPos, setPlayheadPos] = useState(100);
  return (
    <main>
      <div style={{marginLeft: '50px', marginRight: '50px'}}>
        <Waveform
          pixelWidth={1200}
          pixelHeight={100}
          peaks={peaks}
          lineWidth={5}
          waveColor="#DCDCE0"
          progressColor="#FF623E"
          cursorPos={playheadPos}
          duration={300}
          normalize={true}
          onClick={({pos}) => setPlayheadPos(pos)}        
        />
      </div>      
    </main>
  );
}

export default App;