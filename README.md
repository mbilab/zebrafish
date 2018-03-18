# Install

1. intall avconv:
   * sudo apt-get install libav-tools libavcodex-extra-53

2. install cairo:
   * sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

3. install node js
   * sudo apt-get update
   * sudo apt-get install nodejs

4. install npm package
   * npm i

# Set up

mkdir output

# Execute

command: `node zebrafish.js [VIDEO] [BRIGHTNESS THRESHOLD] [GRAYSCALE ALGORITHM]`

\[VIDEO\]: the input video, only support **.mov** or **.MOV** format

\[BRIGHTNESS THRESHOLD\]: float point number between 0 and 1, used to filter the blood vessel and heart

\[GRAYSCALE ALGORITHM\]: integer between 0 and 11, every number is mapped to a grayscale algorithm, see the below:

0. linear luminance
1. intensity
2. gleam
3. liuminance
4. luma
5. value
6. luster
7. lightness
8. luminace with gamma correction
9. lightness with gamma correction
10. value with gamma correction
11. luster with gamma correction


