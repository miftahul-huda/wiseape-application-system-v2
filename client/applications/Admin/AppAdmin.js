const WiseApplication = require('../../system/WiseApplication');
const WinAdmin = require('./forms/WinAdmin');
const ApiAuthRepository = require('../../system/ApiAuthRepository');

const authRepository = new ApiAuthRepository();

class AppAdmin extends WiseApplication {
  async run(appConfig = {}, appParameter = {}) {
    const session = this.system.currentSession;
    if (!session || !session.user || session.user.role !== 'admin') {
      throw new Error('Admin access only');
    }

    const [requiresApproval, pendingUsers] = await Promise.all([
      authRepository.getSettings().then((data) => data.requiresApproval),
      authRepository.listPendingUsers(session.token).then((data) => data.pending),
    ]);

    const adminWindow = this.createWindow(WinAdmin, {
      width: '90%',
      height: 640,
      positionY: 60,
      requiresApproval,
      pendingUsers,
    });


    adminWindow.show(appParameter);

    if (typeof adminWindow.loadInitialData === 'function') {
      await adminWindow.loadInitialData();
    }

    return {
      appID: this.appID,
      appTitle: this.appTitle,
      status: 'started',
      window: adminWindow.toJSON(),
    };
  }
}

module.exports = AppAdmin;

