define([
    'angular'
], function(angular) {
    'use strict';

    var template = [
        '<form name="userForm">',
        '<input type="text" name="username" sd-user-unique data-unique-field="username" data-exclude="user" ng-model="user.username">',
        '<input type="password" name="password" ng-model="user.password">',
        '<input type="password" name="passwordConfirm" ng-model="_confirm"',
        ' sd-password-confirm ng-model="passwordConfirm" data-password="user.password">',
        '</form>'
    ].join('');

    describe('sdUserUnique Directive', function() {
        var scope;

        beforeEach(module('superdesk.users'));
        beforeEach(module(function($provide) {
            $provide.service('api', function($q) {
                this.users = {
                    // make it find foo but not any other
                    query: function(criteria) {
                        if (criteria.where && criteria.where.username === 'foo') {
                            return $q.when({
                                _items: [{_id: 9, username: 'foo'}]
                            });
                        } else {
                            return $q.when({_items: []});
                        }
                    }
                };
            });
        }));

        beforeEach(inject(function($rootScope) {
            scope = $rootScope.$new(true);
        }));

        it('fails on unique constraint', inject(function($compile) {
            scope.user = {_id: 3, username: 'test'};
            $compile(template)(scope);

            scope.$eval('userForm.username.$setViewValue("foo")');
            scope.$digest();

            expect(scope.$eval('userForm.username.$dirty')).toBe(true);
            expect(scope.$eval('userForm.username.$valid')).toBe(false);
            expect(scope.$eval('userForm.username.$error.unique')).toBe(true);
        }));

        it('succeeds on unique constraint', inject(function($compile) {
            scope.user = {_id: 6, username: 'baz'};
            $compile(template)(scope);

            expect(scope.$eval('userForm.username.$valid')).toBe(true);

            scope.$eval('userForm.username.$setViewValue("bar")');
            scope.$digest();

            expect(scope.$eval('userForm.username.$valid')).toBe(true);
            expect(scope.$eval('userForm.username.$error.unique')).toBe(undefined);
            expect(scope.$eval('userForm.username.$modelValue')).toBe('bar');
        }));

        it('succeeds failing test using exclusion', inject(function($compile) {
            scope.user = {_id: 9, username: 'foo'};
            $compile(template)(scope);

            scope.$eval('userForm.username.$setViewValue("foo")');
            scope.$digest();

            expect(scope.$eval('userForm.username.$valid')).toBe(true);
        }));

        it('fails confirming password', inject(function($compile) {
            scope.user = {password: 'test'};
            $compile(template)(scope);

            scope.$eval('userForm.passwordConfirm.$setViewValue("not-test")');
            scope.$digest();

            expect(scope.$eval('userForm.passwordConfirm.$dirty')).toBe(true);
            expect(scope.$eval('userForm.passwordConfirm.$valid')).toBe(false);
            expect(scope.$eval('userForm.passwordConfirm.$error.confirm')).toBe(true);
        }));

        it('succeeds confirming password', inject(function($compile) {
            scope.user = {password: 'test'};
            $compile(template)(scope);

            scope.$eval('userForm.passwordConfirm.$setViewValue("test")');
            scope.$digest();

            expect(scope.$eval('userForm.passwordConfirm.$valid')).toBe(true);
            expect(scope.$eval('userForm.passwordConfirm.$error.confirm')).toBe(undefined);
        }));

    });

    describe('user edit directive', function() {
        var noop = angular.noop;

        beforeEach(module('superdesk.users'));
        beforeEach(module('templates'));

        beforeEach(module(function($provide) {
            $provide.service('gettext', noop);
            $provide.service('api', noop);
            $provide.service('notify', noop);
            $provide.service('resource', noop);
            $provide.service('$route', noop);
            $provide.service('superdesk', noop);
            $provide.provider('translateFilter', function() {
                this.$get = function() {
                    return angular.identity;
                };
            });
        }));

        it('checks username for valid characters', inject(function(users) {
            expect(users.usernamePattern.test('!')).toBe(false);
            expect(users.usernamePattern.test('@')).toBe(false);
            expect(users.usernamePattern.test('#')).toBe(false);
            expect(users.usernamePattern.test(' ')).toBe(false);

            expect(users.usernamePattern.test('.')).toBe(true);
            expect(users.usernamePattern.test('_')).toBe(true);
            expect(users.usernamePattern.test('-')).toBe(true);
            expect(users.usernamePattern.test('\'')).toBe(true);

            expect(users.usernamePattern.test('b')).toBe(true);
            expect(users.usernamePattern.test('B')).toBe(true);
            expect(users.usernamePattern.test('1')).toBe(true);
        }));

        it('checks phone number for valid characters', inject(function(users) {
            expect(users.phonePattern.test('z')).toBe(false);
            expect(users.phonePattern.test('zxcvbnmas')).toBe(false);

            expect(users.phonePattern.test('12345678')).toBe(false);
            expect(users.phonePattern.test('123456789')).toBe(true);
            expect(users.phonePattern.test('+1234567890')).toBe(true);
            expect(users.phonePattern.test('+123456789000')).toBe(true);

            expect(users.phonePattern.test('+')).toBe(false);
            expect(users.phonePattern.test('$')).toBe(false);
            expect(users.phonePattern.test('$$$$$$$$$')).toBe(false);
        }));

    });
});
