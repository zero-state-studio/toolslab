declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';

  type Plugin = (service: TurndownService) => void;

  export const gfm: Plugin;
  export const tables: Plugin;
  export const strikethrough: Plugin;
  export const taskListItems: Plugin;
  export const highlightedCodeBlock: Plugin;
}
