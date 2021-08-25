import chunk from 'lodash/chunk';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

function Waveform({
  pixelHeight = 100,
  pixelWidth = 400,
  lineWidth = 1,
  cursorWidth = 1,
  waveColor = 'gray',
  progressColor = 'blue',
  cursorColor = 'black',
  peaks,
  cursorPos,
  duration,
  normalize = false,
  onClick = () => {},
}) {
  const svgEl = useRef();
  const pt = useRef();

  useEffect(() => {
    pt.current = svgEl.current?.createSVGPoint();
  }, [svgEl]);

  /*
  Both of these values are derived from props. We put them in state as an
  optimization -- we may have thousands of peaks, and we don't need to recalc
  these values unless the peaks change.
  */
  const [maxAmplitude, setMaxAmplitude] = useState(1);
  const [minMaxPeaks, setMinMaxPeaks] = useState([]);

  useEffect(() => {
    // If we have chosen to normalize the waveform, we want its
    // maximum amplitude to be used to determine the height of
    // the waveform instead of a scale of -1 to 1.
    setMaxAmplitude(normalize ? Math.max(...peaks.map(Math.abs)) : 1);
  }, [peaks, normalize]);

  useEffect(() => {
    const chunkSize = peaks.length / (pixelWidth / lineWidth);
    const chunkedPeaks = chunk(peaks, chunkSize);

    setMinMaxPeaks(
      chunkedPeaks.map(peaks => {
        const minP = Math.min(0, ...peaks);
        const maxP = Math.max(0, ...peaks);

        return [minP, maxP];
      })
    );
  }, [peaks, pixelWidth, lineWidth]);

  // Click events in JS give us the location relative to the browser window, but
  // we need the location in the SVG's coordinate system.
  // https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis
  const findSvgCoords = evt => {
    if (!svgEl.current) {
      return;
    }

    pt.current.x = evt.clientX;
    pt.current.y = evt.clientY;

    // The cursor point, translated into svg coordinates
    const cursorpt = pt.current.matrixTransform(
      svgEl.current.getScreenCTM().inverse()
    );

    return cursorpt;
  };

  // Transforms peak from number [-1, 1] to a pixel y position.
  const transformPeak = peak => {
    let normedPeak = peak / maxAmplitude;

    // Add 1 so the peak is 0 to 2 instead of -1 to 1.
    normedPeak = normedPeak + 1;
    normedPeak = normedPeak * (pixelHeight / 2);
    normedPeak = pixelHeight - normedPeak;

    return normedPeak;
  };

  const svgXToSecs = x => x * (duration / pixelWidth);
  const secsToSvgX = secs => (secs / duration) * pixelWidth;

  /*
  This function creates the content for the `d` attribute on an SVG `path`
  element. To draw the waveform, we need to draw the top from left-to-right
  and then the bottom from right-to-left. In order to prevent multiple loops,
  we collect the commands for the top and bottom in one loop and then reverse
  the commands for the bottom before concatenating them all together.
  */
  const createWaveformPath = peaks => {
    if (!peaks || !peaks.length) {
      return '';
    }

    let svgPath = [];
    const pathBack = [];

    svgPath.push(`M 0, ${transformPeak(peaks[0][1])}`);

    for (let idx = 0; idx < peaks.length; idx++) {
      const [minP, maxP] = peaks[idx];

      if (idx > 0) {
        svgPath.push(`L ${idx * lineWidth} ${transformPeak(maxP)}`);
      }

      if (idx < peaks.length - 1) {
        pathBack.push(`L ${idx * lineWidth} ${transformPeak(minP)}`);
      }
    }

    svgPath.push(
      `L ${(peaks.length - 1) * lineWidth}, ${transformPeak(
        peaks[peaks.length - 1][0]
      )}`
    );
    pathBack.reverse();
    svgPath = svgPath.concat(pathBack);
    svgPath.push('Z');

    return svgPath.join('\n');
  };

  const cursorPosPx = secsToSvgX(cursorPos);

  const handleSvgClick = e => {
    const { x, y } = findSvgCoords(e);

    e.svgX = x;
    e.svgY = y;
    e.pos = svgXToSecs(x);
    onClick(e);
  };

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
        ref={svgEl}
        viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleSvgClick}
      >
        <defs>
          <mask id="waveform-path">
            <rect
              x="0"
              width={pixelWidth}
              y="0"
              height={pixelHeight}
              fill="black"
            />
            <path fill="white" d={createWaveformPath(minMaxPeaks)} />
            <line
              className="center-line"
              x1="0"
              x2={pixelWidth}
              y1={pixelHeight / 2}
              y2={pixelHeight / 2}
              stroke="white"
              strokeWidth="4"
            />
          </mask>
        </defs>
        <rect
          className="played-section"
          x={cursorPosPx}
          width={pixelWidth - cursorPosPx}
          y="0"
          height={pixelHeight}
          fill={waveColor}
          mask="url(#waveform-path)"
        />
        <rect
          className="to-play-section"
          x="0"
          width={cursorPosPx}
          y="0"
          height={pixelHeight}
          fill={progressColor}
          mask="url(#waveform-path)"
        />
        <line
          x1={cursorPosPx}
          x2={cursorPosPx}
          y1="0"
          y2={pixelHeight}
          stroke={cursorColor}
          strokeWidth={cursorWidth}
        />
      </svg>
    </div>
  );
}

Waveform.propTypes = {
  pixelHeight: PropTypes.number,
  pixelWidth: PropTypes.number,
  lineWidth: PropTypes.number,
  cursorWidth: PropTypes.number,
  waveColor: PropTypes.string,
  progressColor: PropTypes.string,
  cursorColor: PropTypes.string,
  peaks: PropTypes.arrayOf(PropTypes.number).isRequired,
  cursorPos: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  normalize: PropTypes.bool,
  onClick: PropTypes.func,
};

export default Waveform;
