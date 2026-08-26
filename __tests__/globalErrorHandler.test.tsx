import { installGlobalErrorHandlers } from '../src/utils/globalErrorHandler';
import * as errorReporting from '../src/utils/errorReporting';

describe('installGlobalErrorHandlers', () => {
  it('wraps ErrorUtils.setGlobalHandler and reports errors while preserving default behavior', () => {
    const reportErrorSpy = jest.spyOn(errorReporting, 'reportError').mockImplementation(() => {});
    const previousHandler = jest.fn();
    const g = global as unknown as {
      ErrorUtils: {
        getGlobalHandler: () => jest.Mock;
        setGlobalHandler: (h: (error: Error, isFatal?: boolean) => void) => void;
      };
    };

    let installedHandler: ((error: Error, isFatal?: boolean) => void) | undefined;
    g.ErrorUtils = {
      getGlobalHandler: jest.fn(() => previousHandler),
      setGlobalHandler: jest.fn((handler) => {
        installedHandler = handler;
      }),
    };

    installGlobalErrorHandlers();

    expect(g.ErrorUtils.setGlobalHandler).toHaveBeenCalledTimes(1);
    expect(installedHandler).toBeDefined();

    const err = new Error('boom');
    installedHandler!(err, true);

    expect(reportErrorSpy).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ source: 'GlobalJsHandler', isFatal: true })
    );
    // Must still call through to whatever handler was previously installed
    // (dev RedBox / prod restart), never swallow it.
    expect(previousHandler).toHaveBeenCalledWith(err, true);

    reportErrorSpy.mockRestore();
  });

  it('reports unhandled promise rejections through the shared reportError hook', () => {
    jest.resetModules();
    jest.doMock('promise/setimmediate/rejection-tracking', () => ({
      enable: jest.fn(),
    }));

    const errorReportingModule = require('../src/utils/errorReporting');
    const reportErrorSpy = jest
      .spyOn(errorReportingModule, 'reportError')
      .mockImplementation(() => {});

    const g = global as unknown as { ErrorUtils?: unknown };
    delete g.ErrorUtils; // isolate this test to the rejection-tracking path

    const { installGlobalErrorHandlers: install } = require('../src/utils/globalErrorHandler');
    install();

    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    expect(rejectionTracking.enable).toHaveBeenCalledTimes(1);

    const { onUnhandled } = rejectionTracking.enable.mock.calls[0][0];
    const err = new Error('unhandled rejection boom');
    onUnhandled(42, err);

    expect(reportErrorSpy).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ source: 'UnhandledPromiseRejection', rejectionId: 42 })
    );

    reportErrorSpy.mockRestore();
    jest.dontMock('promise/setimmediate/rejection-tracking');
  });
});
