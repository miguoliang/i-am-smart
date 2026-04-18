import { logger } from './logger';

describe('logger', () => {
  it('logs info, warn, and error in test env', () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('i', { a: 1 });
    logger.warn('w');
    logger.error('e');

    expect(info).toHaveBeenCalledWith('[INFO] i', { a: 1 });
    expect(warn).toHaveBeenCalledWith('[WARN] w', '');
    expect(err).toHaveBeenCalledWith('[ERROR] e', '');

    info.mockRestore();
    warn.mockRestore();
    err.mockRestore();
  });
});
