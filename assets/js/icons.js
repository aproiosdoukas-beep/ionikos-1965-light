/* ==========================================================================
   ΙΩΝΙΚΟΣ 1965 — Inline SVG icons (stroke-based, currentColor)
   ========================================================================== */
(function (global) {
  "use strict";

  const P = {
    card:    '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M6.5 14.5h4"/>',
    tag:     '<path d="M3.5 11.3V4.5a1 1 0 0 1 1-1h6.8a1 1 0 0 1 .7.3l8.2 8.2a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0L3.8 12a1 1 0 0 1-.3-.7Z"/><circle cx="8" cy="8" r="1.4"/>',
    play:    '<circle cx="12" cy="12" r="9"/><path d="M10 8.6 16 12l-6 3.4V8.6Z"/>',
    medal:   '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10 6 2.5h12L15.5 10"/><path d="m12 12.6.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z"/>',
    user:    '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    bell:    '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z"/><path d="M10 18a2 2 0 0 0 4 0"/>',
    gear:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    search:  '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    check:   '<path d="m4.5 12.5 5 5 10-11"/>',
    checks:  '<path d="m2.5 12.5 4.5 4.5 9-10"/><path d="m11 15.5 1.5 1.5 9-10"/>',
    cross:   '<path d="m6 6 12 12M18 6 6 18"/>',
    warn:    '<path d="M12 4.2 2.8 19.5h18.4L12 4.2Z"/><path d="M12 10v4"/><path d="M12 16.6v.1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-1.3 5.4"/><path d="M20 4.5V11h-6.5"/>',
    store:   '<path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5"/><path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/>',
    ticket:  '<path d="M3.5 8.5V6a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a3.5 3.5 0 0 0 0 7V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2.5a3.5 3.5 0 0 0 0-7Z"/><path d="M14 5v14"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    send:    '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z"/>',
    users:   '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16.5 5.6a3.5 3.5 0 0 1 0 6.8"/><path d="M17.5 14.2a6.5 6.5 0 0 1 4 5.8"/>',
    chart:   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    euro:    '<path d="M17.5 6.5a7 7 0 1 0 0 11"/><path d="M4 10h8M4 14h8"/>',
    logout:  '<path d="M14 7V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2"/><path d="M9 12h12"/><path d="m18 8.5 3.5 3.5L18 15.5"/>',
    camera:  '<rect x="2.5" y="6.5" width="19" height="13" rx="2.5"/><circle cx="12" cy="13" r="3.5"/><path d="M8.5 6.5 10 4h4l1.5 2.5"/>',
    shield:  '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9.3 4.3-1.5 7.5-4.8 7.5-9.3V6L12 3Z"/>',
    signal:  '<path d="M3 18h2M8 18v-4M13 18V9M18 18V4" stroke-width="2.4"/>',
    wifi:    '<path d="M3.5 8.5a13 13 0 0 1 17 0"/><path d="M6.8 12a8.5 8.5 0 0 1 10.4 0"/><path d="M10 15.3a4 4 0 0 1 4 0"/><path d="M12 18.6v.1" stroke-width="2.4"/>',
    battery: '<rect x="2" y="7.5" width="17" height="9" rx="2.5"/><path d="M21 11v2"/><rect x="4" y="9.5" width="12" height="5" rx="1" fill="currentColor" stroke="none"/>',
    chat:    '<path d="M20.5 12.5c0 4-3.8 7-8.5 7a9.8 9.8 0 0 1-2.6-.3L4 21l1.4-3.6A6.6 6.6 0 0 1 3.5 12.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7Z"/>',
    bus:     '<rect x="4" y="4.5" width="16" height="12" rx="2"/><path d="M4 11h16M7.5 20v-3.5M16.5 20v-3.5"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
    bag:     '<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    lock:    '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    expand:  '<path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5"/>',
    pause:   '<path d="M9 5v14M15 5v14" stroke-width="2.4"/>',
    volume:  '<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z"/><path d="M16 9.2a4 4 0 0 1 0 5.6"/><path d="M18.5 6.8a7.5 7.5 0 0 1 0 10.4"/>'
  };

  /**
   * @param {string} name κλειδί από το P
   * @param {number} size px
   * @param {number} sw stroke width
   */
  function icon(name, size, sw) {
    const d = P[name] || P.shield;
    return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) +
      '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.7) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  function iconEl(name, size, sw) {
    const span = document.createElement("span");
    span.style.display = "inline-flex";
    span.innerHTML = icon(name, size, sw);
    return span.firstChild;
  }

  global.ION_ICONS = P;
  global.icon = icon;
  global.iconEl = iconEl;
})(window);
