/** A URI returned by `Image.resolveAssetSource` or a file, HTTP, or HTTPS URI. */
export type MapImageSource = {
  uri: string;
  /** Requested native display width in density-independent points. */
  width?: number;
  /** Requested native display height in density-independent points. */
  height?: number;
};
