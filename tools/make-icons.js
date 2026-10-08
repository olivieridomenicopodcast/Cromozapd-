#!/usr/bin/env node
/* Genera icon-192.png e icon-512.png (PWA) con Chromium: NODE_PATH=/opt/node-tools/node_modules node tools/make-icons.js */
'use strict';
const { chromium } = require('playwright');
const path = require('path');
require('../js/data.js'); require('../js/ui/sprites.js');
const FF = globalThis.FF;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const size of [192, 512]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:radial-gradient(circle at 50% 35%,#1d6b47,#0f2f21);display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;width:${size * 0.5}px;transform:rotate(-12deg) translateX(-${size * 0.14}px)">${FF.Sprites.svg('card-7-rosso')}</div>
      <div style="position:absolute;width:${size * 0.5}px;transform:rotate(10deg) translateX(${size * 0.12}px)">${FF.Sprites.svg('zapd-giallo')}</div></body>`);
    await p.screenshot({ path: path.join(__dirname, '..', `icon-${size}.png`) });
    await p.close();
  }
  await b.close(); console.log('icone create');
})();
