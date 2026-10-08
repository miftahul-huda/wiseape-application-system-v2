const fallbackApps = [
  {
    appID: 'helloWorld',
    appTitle: 'HelloWorld',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '✦',
    appLibraries: ['Wiseape WAS'],
    appConfig: { theme: 'light', mode: 'starter' },
    appStartPoint: 'applications/HelloWorld/AppHelloWorld.js:AppHelloWorld',
    appParameter: { message: 'Hello World' },
  },
  {
    appID: 'settings',
    appTitle: 'Settings',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '⚙',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/Settings/AppSettings.js:AppSettings',
    appParameter: {},
  },
  {
    appID: 'controls',
    appTitle: 'Controls',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '🎛',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/Controls/AppControls.js:AppControls',
    appParameter: {},
  },
  {
    appID: 'hris',
    appTitle: 'Wise HRIS',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '🏢',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/HRIS/AppHRIS.js:AppHRIS',
    appParameter: {},
  },
  {
    appID: 'employeeManagement',
    appTitle: 'Employee Management',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '👤',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/HRIS/EmployeeManagement/AppEmployeeManagement.js:AppEmployeeManagement',
    appParameter: {},
  },
  {
    appID: 'organizationManagement',
    appTitle: 'Organization Management',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '🏛️',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/HRIS/OrganizationManagement/AppOrganizationManagement.js:AppOrganizationManagement',
    appParameter: {},
  },
  {
    appID: 'masterDataManagement',
    appTitle: 'Master Data Management',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '🗂️',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/HRIS/MasterDataManagement/AppMasterDataManagement.js:AppMasterDataManagement',
    appParameter: {},
  },
  {
    appID: 'recruitment',
    appTitle: 'Recruitment',
    appVersion: '1.0.0',
    appDeveloper: 'Wiseape',
    appIcon: '🎯',
    appLibraries: ['Wiseape WAS'],
    appConfig: {},
    appStartPoint: 'applications/Recruitment/AppRecruitment.js:AppRecruitment',
    appParameter: {},
  },
];

class ApiAppRepository {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.API_BASE_URL || 'http://localhost:4000';
  }

  getFallbackApps() {
    return fallbackApps.map((app) => ({ ...app }));
  }

  async listApplications() {
    try {
      const response = await fetch(`${this.baseUrl}/api/apps`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const apps = await response.json();
      const appMap = new Map();
      this.getFallbackApps().forEach((app) => appMap.set(app.appID, app));

      if (Array.isArray(apps)) {
        apps.forEach((app) => {
          appMap.set(app.appID, {
            ...app,
            appIcon: app.appIcon || '◫',
          });
        });
      }

      return Array.from(appMap.values());
    } catch (error) {
      console.warn('[WAS] Application API unavailable; loading fallback application list.', error.message);
      return this.getFallbackApps();
    }
  }
}

module.exports = ApiAppRepository;
