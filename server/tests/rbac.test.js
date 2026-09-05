const { restrictTo, rbac, ROLE_ROUTE_MATRIX } = require('../src/middleware/rbac.middleware');
const { deptScope } = require('../src/middleware/deptScope.middleware');

const resources = ['student', 'faculty', 'hod', 'admin', 'llm', 'forum', 'feedback', 'safety', 'hallucination'];
const roles = Object.keys(ROLE_ROUTE_MATRIX);

describe('RBAC matrix', () => {
  test.each(roles)('%s is allowed only on its declared resources', (role) => {
    resources.forEach((resource) => {
      const next = jest.fn();
      rbac(resource)({ user: { role } }, {}, next);
      const allowed = ROLE_ROUTE_MATRIX[role].has(resource);
      expect(next).toHaveBeenCalledTimes(1);
      if (allowed) {
        expect(next.mock.calls[0][0]).toBeUndefined();
      } else {
        expect(next.mock.calls[0][0]).toEqual(expect.objectContaining({ statusCode: 403 }));
      }
    });
  });

  test.each(roles)('%s passes restrictTo only when listed', (role) => {
    const next = jest.fn();
    restrictTo(role)({ user: { role } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects a role omitted from a route', () => {
    const next = jest.fn();
    restrictTo('admin')({ user: { role: 'student' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('department scope', () => {
  test('rejects cross-department reads and writes', () => {
    const next = jest.fn();
    deptScope({ user: { role: 'faculty', dept: 'CS' }, query: { dept: 'ECE' }, body: {} }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('adds the authenticated department filter', () => {
    const request = { user: { role: 'student', dept: 'CS' }, query: {}, body: {} };
    const next = jest.fn();
    deptScope(request, {}, next);
    expect(request.departmentFilter).toEqual({ department: 'CS' });
    expect(next).toHaveBeenCalledWith();
  });

  test('allows admin global scope and optional department filtering', () => {
    const request = { user: { role: 'admin', dept: 'Admin' }, query: { dept: 'ECE' }, body: {} };
    const next = jest.fn();
    deptScope(request, {}, next);
    expect(request.departmentFilter).toEqual({ department: 'ECE' });
    expect(next).toHaveBeenCalledWith();
  });
});