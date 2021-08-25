import React, { useState } from "react"
import "./App.css"
import Waveform from "./Waveform"
import SimpleWaveform from "./SimpleWaveform"
import ReactWaves from "@dschoon/react-waves"
import peaks from "./peaks1.json"
import audio from "./audio1.mp4"

function App() {
  const [playheadPos, setPlayheadPos] = useState(100)
  return (
    <main>
      <div style={{ marginLeft: "50px", marginRight: "50px" }}>
        <h2>A simple waveform</h2>

        <SimpleWaveform
          pixelWidth={1200}
          pixelHeight={100}
          peaks={peaks}
          lineWidth={5}
          waveColor="#DCDCE0"
          duration={300}
        />

        <h3>Data used</h3>

        <pre>
          <code>
            {`
[
  0,0,0.00018310546875,-0.00091552734375,0.003387451171875,-0.2537841796875,0.139984130859375,
  -0.275543212890625,0.048858642578125,-0.146881103515625,0.130096435546875,-0.097259521484375,
  0.17047119140625,-0.090179443359375,0.1640625,-0.11724853515625,0.141326904296875,
  ...
]
          `}
          </code>
        </pre>

        <h2>A waveform with a cursor</h2>

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
          onClick={({ pos }) => setPlayheadPos(pos)}
        />
      </div>
    </main>
  )
}

export default App
