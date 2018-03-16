const gammaCorrection = (channel) => {
  return Math.pow(channel / 255, 1 / 2.2) * 255
}

module.exports = {
  intensity: (r, g, b) => {
    return 1 / 3 * (r + g + b)
  },
  gleam: (r, g, b) => {
    return 1 / 3 * (gammaCorrection(r) + gammaCorrection(b) + gammaCorrection(b))
  },
  linearLuminance: (r, g, b) => {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  },
  luminance: (r, g, b) => {
    return 0.3 * r + 0.59 * g + 0.11 * b
  },
  luma: (r, g, b) => {
    return 0.2126 * gammaCorrection(r) + 0.7152 * gammaCorrection(g) + 0.0722 * gammaCorrection(b)
  },
  lightness: (r, g, b) => {
    const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const f = y > Math.pow(6 / 29, 3) ? Math.pow(y, 1 / 3) : (1 / 3) * Math.pow(29 / 6, 2) * y + 4/ 29
    return 0.01 * (116 * f - 16) * 255
  },
  value: (r, g, b) => {
    return Math.max(r, g, b)
  },
  luster: (r, g, b) => {
    return 0.5 * (Math.max(r, g, b) + Math.min(r, g, b))
  },
  luminaceGC: (r, g, b) => {
    return 0.3 * gammaCorrection(r) + 0.59 * gammaCorrection(g) + 0.11 * gammaCorrection(b)
  },
  lightnessGC: (r, g, b) => {
    const y = (0.2126 * gammaCorrection(r) + 0.7152 * gammaCorrection(g) + 0.0722 * gammaCorrection(b)) / 255
    const f = y > Math.pow(6 / 29, 3) ? Math.pow(y, 1 / 3) : (1 / 3) * Math.pow(29 / 6, 2) * y + 4 / 29
    return 0.01 * (116 * f - 16) * 255
  },
  valueGC: (r, g, b) => {
    return Math.max(gammaCorrection(r), gammaCorrection(g), gammaCorrection(b))
  },
  lusterGC: (r, g, b) => {
    r = gammaCorrection(r)
    g = gammaCorrection(g)
    b = gammaCorrection(b)
    return 0.5 * (Math.max(r, g, b) + Math.min(r, g, b))
  },
}
