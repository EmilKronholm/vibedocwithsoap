/** A document that declares its own settings (the @knob comments) for the panel to show as controls. */
export const SAMPLE = `
<style>
  :root {
    --font-size: 11pt;   /* @knob "Font size" 8..16 step 0.5 */
    --accent: #1f3d63;   /* @knob "Accent colour" color */
    --gap: 8pt;          /* @knob "Paragraph spacing" 2..24 step 1 */
  }
  .doc { font-family: Georgia, serif; font-size: var(--font-size); line-height: 1.5; }
  .doc h1 { font-size: 24pt; color: var(--accent); margin: 0 0 var(--gap); }
  .doc h2 { font-size: 15pt; color: var(--accent); margin: 18pt 0 var(--gap); }
  .doc p, .doc li { margin: 0 0 var(--gap); }
</style>
<article class="doc">
  <h1 data-block="title">Quarterly report</h1>
  <p data-block="intro">This quarter we shipped the new editor and moved the pipeline to the cloud.</p>
  <h2 data-block="highlights-title">Highlights</h2>
  <ul data-block="highlights">
    <li>Launched the review flow for AI changes</li>
    <li>Cut page load time by a third</li>
    <li>Onboarded twelve new customers</li>
  </ul>
  <h2 data-block="next-title">Next quarter</h2>
  <p data-block="next">We will focus on reliability and on making the editor easier to embed.</p>
</article>
`;
