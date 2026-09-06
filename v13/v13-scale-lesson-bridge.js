/*
 * V13 Scale/Lesson Bridge — DISABLED
 *
 * This temporary bridge is intentionally disabled. The previous version
 * polled nested iframes every 300ms and could repeatedly mutate the active
 * document, causing visible flicker/looping. No DOM or storage mutation is
 * performed here until the scale -> lesson handoff is redesigned cleanly.
 */
(function(){'use strict';})();
