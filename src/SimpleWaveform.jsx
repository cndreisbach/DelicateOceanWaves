import chunk from "lodash/chunk"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

function SimpleWaveform({
  pixelHeight = 100,
  pixelWidth = 400,
  lineWidth = 1,
  cursorWidth = 1,
  waveColor = "gray",
  peaks,
  cursorPos,
  duration,
  normalize = false,
  onClick = () => {},
}) {
  const maxAmplitude = 1
  const [minMaxPeaks, setMinMaxPeaks] = useState([])

  useEffect(() => {
    const chunkSize = peaks.length / (pixelWidth / lineWidth)
    const chunkedPeaks = chunk(peaks, chunkSize)

    setMinMaxPeaks(
      chunkedPeaks.map((peaks) => {
        const minP = Math.min(0, ...peaks)
        const maxP = Math.max(0, ...peaks)

        return [minP, maxP]
      })
    )
  }, [peaks, pixelWidth, lineWidth])

  // Transforms peak from number [-1, 1] to a pixel y position.
  const transformPeak = (peak) => {
    let normedPeak = peak / maxAmplitude

    // Add 1 so the peak is 0 to 2 instead of -1 to 1.
    normedPeak = normedPeak + 1
    normedPeak = normedPeak * (pixelHeight / 2)
    normedPeak = pixelHeight - normedPeak

    return normedPeak
  }

  const svgXToSecs = (x) => x * (duration / pixelWidth)
  const secsToSvgX = (secs) => (secs / duration) * pixelWidth

  /*
  This function creates the content for the `d` attribute on an SVG `path`
  element. To draw the waveform, we need to draw the top from left-to-right
  and then the bottom from right-to-left. In order to prevent multiple loops,
  we collect the commands for the top and bottom in one loop and then reverse
  the commands for the bottom before concatenating them all together.
  */
  const createWaveformPath = (peaks) => {
    if (!peaks || !peaks.length) {
      return ""
    }

    let svgPath = []
    const pathBack = []

    svgPath.push(`M 0, ${transformPeak(peaks[0][1])}`)

    for (let idx = 0; idx < peaks.length; idx++) {
      const [minP, maxP] = peaks[idx]

      if (idx > 0) {
        svgPath.push(`L ${idx * lineWidth} ${transformPeak(maxP)}`)
      }

      if (idx < peaks.length - 1) {
        pathBack.push(`L ${idx * lineWidth} ${transformPeak(minP)}`)
      }
    }

    svgPath.push(
      `L ${(peaks.length - 1) * lineWidth}, ${transformPeak(
        peaks[peaks.length - 1][0]
      )}`
    )
    pathBack.reverse()
    svgPath = svgPath.concat(pathBack)
    svgPath.push("Z")

    return svgPath.join("\n")
  }

  /*
  Our SVG below uses masking to show the level of progress through the
  waveform. A mask of the waveform is created, then the SVG is drawn with two
  rectangles, the first from the beginning to the cursor and the second from
  the cursor to the end. These rectangles use our mask, so only the part of the
  rectangle that the mask covers will be shown.
  */
  return (
    <div>
      <svg
        viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="black" d={createWaveformPath(minMaxPeaks)} />
      </svg>
    </div>
  )
}

export default SimpleWaveform
