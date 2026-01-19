import { r as requireReact, g as getDefaultExportFromCjs } from './index-r0AJwOpC.js';

var jsxRuntime$2 = { exports: {} };

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production_min;

function requireReactJsxRuntime_production_min() {
  if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
  hasRequiredReactJsxRuntime_production_min = 1;
  ('use strict');
  var f = requireReact(),
    k = Symbol.for('react.element'),
    l = Symbol.for('react.fragment'),
    m = Object.prototype.hasOwnProperty,
    n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    p = { key: !0, ref: !0, __self: !0, __source: !0 };
  function q(c, a, g) {
    var b,
      d = {},
      e = null,
      h = null;
    void 0 !== g && (e = '' + g);
    void 0 !== a.key && (e = '' + a.key);
    void 0 !== a.ref && (h = a.ref);
    for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
    if (c && c.defaultProps) for (b in ((a = c.defaultProps), a)) void 0 === d[b] && (d[b] = a[b]);
    return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
  }
  reactJsxRuntime_production_min.Fragment = l;
  reactJsxRuntime_production_min.jsx = q;
  reactJsxRuntime_production_min.jsxs = q;
  return reactJsxRuntime_production_min;
}

var jsxRuntime$1 = jsxRuntime$2.exports;

var hasRequiredJsxRuntime;

function requireJsxRuntime() {
  if (hasRequiredJsxRuntime) return jsxRuntime$2.exports;
  hasRequiredJsxRuntime = 1;
  ('use strict');
  if (true) {
    jsxRuntime$2.exports = requireReactJsxRuntime_production_min();
  } else {
    module.exports = require('./cjs/react-jsx-runtime.development.js');
  }
  return jsxRuntime$2.exports;
}

var jsxRuntimeExports = requireJsxRuntime();
const jsxRuntime = /*@__PURE__*/ getDefaultExportFromCjs(jsxRuntimeExports);

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'primary',
}) {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx('div', {
    className: 'confirm-modal-overlay',
    onClick: onCancel,
    children: /* @__PURE__ */ jsxRuntimeExports.jsxs('div', {
      className: 'confirm-modal',
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx('div', {
          className: 'confirm-modal-header',
          children: /* @__PURE__ */ jsxRuntimeExports.jsx('h2', {
            className: 'confirm-modal-title',
            children: title,
          }),
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx('div', {
          className: 'confirm-modal-content',
          children: /* @__PURE__ */ jsxRuntimeExports.jsx('p', {
            className: 'confirm-modal-message',
            children: message,
          }),
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs('div', {
          className: 'confirm-modal-actions',
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx('button', {
              className: 'confirm-modal-button cancel-button',
              onClick: onCancel,
              children: cancelText,
            }),
            /* @__PURE__ */ jsxRuntimeExports.jsx('button', {
              className: `confirm-modal-button confirm-button ${variant}`,
              onClick: onConfirm,
              children: confirmText,
            }),
          ],
        }),
      ],
    }),
  });
}

export { ConfirmModal };
//# sourceMappingURL=ConfirmModal-DkbcHBm5.js.map
