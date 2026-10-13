# Report Designer

Browser-run WAS applications (ES modules) backed by the REST API in
`server/applications/ReportDesigner` (`http://localhost:4002/api`).

| appID            | Class             | Purpose                                              |
|------------------|-------------------|------------------------------------------------------|
| `reportDesigner` | `AppReportDesigner` | Manage reports, database connections, report groups |
| `reportViewer`   | `AppReportViewer`   | View the reports of one report group (chart + data) |

## Opening the Report Viewer from another app

`WiseWindow.launchApp(appId, param)` (client/system/WiseWindow.js) already
exists. It queues the request; when the window's event handler returns,
`WiseDesktop` sees `launchAppId` / `launchAppParam` in the window JSON and calls
`onIconClick({ appId, appParameter })`, which ends in
`WiseApplicationSystem.runApplication(appId, null, appParameter)` ->
`LocalAppRuntime.run()` -> `AppReportViewer.run(appConfig, appParameter)`.

```js
// inside any WiseWindow subclass, e.g. in a button's onClick handler
onShowReportsClick() {
  this.launchApp('reportViewer', { reportGroupId: 'EMPLOYEE_INFORMATION_REPORT' });
}
```

- `reportGroupId` present (a numeric group id like `3`, or a group **code** such as
  `'EMPLOYEE_INFORMATION_REPORT'`; `reportGroupCode` is an alias): the viewer preselects that group, disables the
  group chooser and lists only that group's reports.
- `reportGroupId` absent (`this.launchApp('reportViewer')`): the viewer shows
  a group chooser.

Notes:

- `launchApp` must be called from a handler that the runtime dispatches (a
  click, change, ...), because the request is delivered with the window JSON
  returned from that handler.
- The `appId` is the `appID` registered in the WAS DB (`reportViewer`).
- The group id/code come from `GET /report-groups` (`id` / `code` fields).
