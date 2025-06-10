/**
 * Converts RGB values (0-1) to a hex color string
 * @param {number} r - Red value (0-1)
 * @param {number} g - Green value (0-1)
 * @param {number} b - Blue value (0-1)
 * @returns {string} Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255)
          .toString(16)
          .padStart(2, "0");
        return hex;
      })
      .join("")
  );
}
