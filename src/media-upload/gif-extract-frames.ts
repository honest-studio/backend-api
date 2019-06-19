'use strict';
// MODIFIED FROM https://github.com/transitive-bullshit/gif-extract-frames

import * as gpixels from 'get-pixels';
import pify from 'pify';
import * as savePixels from 'save-pixels';
const getPixels = pify(gpixels);

const supportedFormats = new Set(['jpg', 'png', 'gif']);

export async function extractFrames(opts) {
    const { input_buffer, input_mime, coalesce = true } = opts;

    const format = input_mime.replace('image/', '');

    if (format && !supportedFormats.has(format)) {
        throw new Error(`invalid output format "${format}"`);
    }

    console.log("OPTS: ", opts)
    const results = await getPixels(input_buffer, input_mime);
    console.log("RESULTS: ", results)
    const { shape } = results;

    if (shape.length === 4) {
        // animated gif with multiple frames
        const [frames, width, height, channels] = shape;

        const numPixelsInFrame = width * height;

        for (let i = 0; i < frames; ++i) {
            if (i > 0) {
                // We don't care about the other frames
                continue;
            }
            if (i > 0 && coalesce) {
                const currIndex = results.index(i, 0, 0, 0);
                const prevIndex = results.index(i - 1, 0, 0, 0);

                for (let j = 0; j < numPixelsInFrame; ++j) {
                    const curr = currIndex + j * channels;

                    if (results.data[curr + channels - 1] === 0) {
                        const prev = prevIndex + j * channels;

                        for (let k = 0; k < channels; ++k) {
                            results.data[curr + k] = results.data[prev + k];
                        }
                    }
                }
            }
            return savePixels(results.pick(0), format);
            // await saveFrame(results.pick(i), format, output.replace('%d', i))
        }
    } else {
        // non-animated gif with a single frame

        // return the stream
        return savePixels(results, format);

        // await saveFrame(results, format, output.replace('%d', 0))
    }
};

function saveFrame(data, format, filename) {
    // Skip saving the frames for now. All we need is the buffer
    return true;
    // const stream = savePixels(data, format)
    // return pump(stream, fs.createWriteStream(filename))
}
