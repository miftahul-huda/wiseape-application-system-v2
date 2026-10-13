// Entry for the ES-module part of the client. Classic scripts (WiseI18n,
// controls, WiseDesktop, WiseApplicationSystem, auth.js, script.js) load
// first; this module registers the in-browser runtime they delegate to.
import LocalAppRuntime from './runtime/LocalAppRuntime.js';

window.WiseLocalRuntime = new LocalAppRuntime();
