# Setup

1. install [libav](https://www.libav.org/)
2. install [cairo](https://www.cairographics.org/)
3. install [node.js](https://nodejs.org/)
4. `npm i`
5. `mkdir output`

# Usage

```
Usage: node zebrafish.js [video] [theda]

Arguments:
  video  the video (.mov format) to analyze
  theda  the threshold to binarize a grayscale image (`0.96` is suggested)

The result is stored in `output/[VIDEO]/[THEDA]/custom-init-kmeans-centroids/result.json`
```
