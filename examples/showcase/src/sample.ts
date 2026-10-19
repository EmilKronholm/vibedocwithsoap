// A 1x1 image, so there is something for the rules about images to act on.
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * A proposal that runs over more than one page, and declares its own settings
 * (the @knob comments) for the Settings tab to show as controls.
 */
export const SAMPLE = `
<style>
  :root {
    --font-size: 10.5pt;  /* @knob "Font size" 8..14 step 0.25 */
    --accent: #1f3d63;    /* @knob "Accent colour" color */
    --gap: 9pt;           /* @knob "Paragraph spacing" 3..20 step 1 */
    --density: cozy;      /* @knob "Density" options compact|cozy|airy */
  }
  .doc { font-family: Georgia, serif; font-size: var(--font-size); line-height: 1.5; }
  .doc h1 { font-size: 26pt; color: var(--accent); margin: 0 0 4pt; }
  .doc .lead { color: #475569; margin: 0 0 14pt; }
  .doc h2 { font-size: 15pt; color: var(--accent); margin: 18pt 0 var(--gap); }
  .doc p, .doc li { margin: 0 0 var(--gap); }
  .doc .row { display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding: 5pt 0; }
  .doc table { width: 100%; margin: 4pt 0 var(--gap); }
  .doc td { padding: 4pt 6pt; border-bottom: 1px solid #e2e8f0; }
  .doc .note { background: #f1f5f9; padding: 8pt 10pt; border-left: 3px solid var(--accent); margin: 0 0 var(--gap); }
</style>
<article class="doc">
  <img data-block="logo" alt="Logo" src="${PIXEL}" width="40" height="40" style="background:#1f3d63;margin-bottom:8pt">
  <h1 data-block="title">Website redesign proposal</h1>
  <p class="lead" data-block="lead">Prepared for Fabrikam AB</p>

  <section data-block="summary">
    <h2>Summary</h2>
    <p>Fabrikam's website has grown over ten years and no longer reflects the company. This proposal describes a redesign that makes the site faster, easier to maintain and clearer for new customers.</p>
    <p>The work is split into three phases over twelve weeks. Each phase ends with something you can use, so there is never a long wait without a result.</p>
  </section>

  <section data-block="goals">
    <h2>Goals</h2>
    <ul>
      <li>Cut page load time by at least a third</li>
      <li>Let the team edit content without a developer</li>
      <li>Make the offer clear within five seconds of landing</li>
      <li>Meet accessibility standards on every page</li>
    </ul>
  </section>

  <section data-block="approach">
    <h2>Approach</h2>
    <p>We start by listening. Two workshops with your team and a review of the existing analytics tell us what visitors actually do, which is often not what we expect.</p>
    <p>Design happens in the browser from the first week, so you review real pages rather than pictures of pages. Feedback goes straight into the next iteration.</p>
    <p class="note" data-block="note">Nothing is built that you have not seen and approved first.</p>
    <p>Content is migrated in batches. Old pages stay online until their replacement is approved, and redirects are set up so no link breaks.</p>
  </section>

  <section data-block="timeline">
    <h2>Timeline</h2>
    <div class="row" data-block="phase-1"><span>Phase 1: Discovery and design</span><span>Weeks 1 to 4</span></div>
    <div class="row" data-block="phase-2"><span>Phase 2: Build and migration</span><span>Weeks 5 to 10</span></div>
    <div class="row" data-block="phase-3"><span>Phase 3: Launch and handover</span><span>Weeks 11 to 12</span></div>
  </section>

  <section data-block="team">
    <h2>Team</h2>
    <p>You will work with a small, stable team: a project lead who is your single point of contact, a designer, and two developers. Everyone on the team has delivered sites of this size before.</p>
    <p>We meet weekly and share progress at the end of every week, so you always know where things stand and what comes next.</p>
  </section>

  <section data-block="pricing">
    <h2>Pricing</h2>
    <table>
      <tr><td>Discovery and design</td><td>120 000 SEK</td></tr>
      <tr><td>Build and migration</td><td>210 000 SEK</td></tr>
      <tr><td>Launch and handover</td><td>45 000 SEK</td></tr>
    </table>
    <p>Prices exclude VAT. Changes to the scope are always agreed in writing before work on them begins.</p>
  </section>

  <section data-block="next-steps">
    <h2>Next steps</h2>
    <p>If this looks right, we can book the first workshop for next week. Tell us who should attend and we will send an agenda in advance.</p>
  </section>
</article>
`;
