// ES-module facade over the WAS framework classes, for applications that
// run in the browser (see LocalAppRuntime).
//
// The framework files in system/ are dual-mode (Node `require` + browser
// globals) because server-mode applications still use them. WiseI18n and the
// controls are loaded as classic <script> tags by index.html -- so they are
// read from the same globals here instead of being imported a second time
// (a second copy would carry its own language/currency state). WiseWindow and
// WiseApplication are not loaded by index.html, so they are pulled in as
// side-effect imports; each registers itself on `window`.
import '../../system/WiseWindow.js';
import '../../system/WiseApplication.js';
import '../../system/ApiAuthRepository.js';
import '../../system/ApiThemeRepository.js';

export const WiseWindow = window.WiseWindow;
export const WiseApplication = window.WiseApplication;
export const WiseI18n = window.WiseI18n;
export const ApiAuthRepository = window.ApiAuthRepository;
export const ApiThemeRepository = window.ApiThemeRepository;

export const {
  WiseControl,
  WiseButton,
  WiseCardGroup,
  WiseCheckboxGroup,
  WiseComboBox,
  WiseDataTable,
  WiseDate,
  WiseDateRange,
  WiseFileUpload,
  WiseFrame,
  WiseHtmlEditor,
  WiseIconMenu,
  WiseIconMenuGroup,
  WiseLabel,
  WiseNumericBox,
  WiseRadioGroup,
  WiseTabControl,
  WiseTableLayout,
  WiseTextArea,
  WiseTextBox,
  WiseVerticalSeparator,
} = window.WiseControlRegistry;
