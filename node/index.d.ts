export type ThemeId = 'sunset' | 'matcha' | 'sky' | 'berry' | 'midnight' | 'paper';
export interface Mask { x: number; y: number; w: number; h: number }
export interface BeautifyOptions {
  theme?: ThemeId;
  colorA?: string;
  colorB?: string;
  padding?: number;
  radius?: number;
  shadow?: number;
  ratio?: 'auto' | '4:3' | '1:1' | '3:4' | '16:9';
  browserFrame?: boolean;
  caption?: string;
  format?: 'png' | 'jpeg';
  scale?: 1 | 2;
  /** Rectangles relative to the oriented source image, each coordinate in 0..1. */
  masks?: Mask[];
  overwrite?: boolean;
}
export const themes: ReadonlyArray<Readonly<{id: ThemeId; name: string; a: string; b: string}>>;
export function beautify(input: string | Uint8Array, options?: BeautifyOptions): Promise<Buffer>;
export function beautifyToFile(input: string | Uint8Array, output: string, options?: BeautifyOptions): Promise<{path: string; format: string; width: number; height: number}>;
