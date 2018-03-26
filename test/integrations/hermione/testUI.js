/* eslint no-invalid-this: "off" */
const chai = require('chai');
const assert = chai.assert;
chai.should();
describe('Git Local UI', () => {
    it('должны получить title страницы', async function() {
        return (await this.browser
            .url('/').getTitle())
            .should.to.be.equal('Git Local');
    });
    it('отображается ветка по умолчанию', async function() {
        (await this.browser.url('/')
            .getText('.branches__branch._active'))
            .should.to.be.equal('master');
        assert.includeMembers(
                await this.browser.getText('.commits__commit > a'),
                [
                    'f836af0', 'f3c20f0', '6c438e0', '1ad90c7', '4f8f31c',
                    '9ffb3b4', 'fefc433', 'b3d02f6', 'fc767be', '7e3575e',
                    '799d39e', '0983e16', '619db06',
                ]
            );
        return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'README.md',
                    'assets', 'index.html', 'package-lock.json', 'package.json',
                ]
            );
    });
    it('отображается корректный список файлов в директории в' +
        ' векте по умолчанию', async function() {
        assert.includeMembers(
            await this.browser.url('/').click('=assets')
                    .getText('.file-directory a')
                    ,
                [
                    '..', 'drawing.js', 'filters.js', 'filtersWebGl.js',
                    'main.css', 'main.js', 'three.min.js', 'tracking.js',
                ]
            );
        await this.browser.click('=..');
        assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'README.md',
                    'assets', 'index.html', 'package-lock.json', 'package.json',
                ]
            );
    });
    it('отображается содержимое файла в ветке по умолчанию', async function() {
        await this.browser.url('/').click('=assets').click('=main.css');
        assert.isNotEmpty(await this.browser.getText('.file-view__contents'));
        await this.browser.click('=assets');
        return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', 'drawing.js', 'filters.js', 'filtersWebGl.js',
                    'main.css', 'main.js', 'three.min.js', 'tracking.js',
                ]
            );
    });
    it('можно работать с деревом файлов для коммита из ветки по умолчанию',
        async function() {
            await this.browser.url('/').click('=619db06');
            assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'assets',
                    'index.html', 'package-lock.json', 'package.json',
                ]
            );
            await this.browser.click('=assets');
            assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                ['..', 'drawning.js', 'filters.js', 'main.css', 'main.js']
            );
            await this.browser.click('=..');
            return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'assets',
                    'index.html', 'package-lock.json', 'package.json',
                ]
            );
    });
    it('отображается содержимое файла для коммита в ветке по умолчанию',
        async function() {
            await this.browser.url('/')
                .click('=619db06').click('=assets').click('=main.css');
            assert.isNotEmpty(await this.browser
                .getText('.file-view__contents'));
            await this.browser.click('=assets');
            return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                ['..', 'drawning.js', 'filters.js', 'main.css', 'main.js']
            );
    });
    it('отображается ветка отличная от ветки по умолчанию', async function() {
        (await this.browser.url('/')
            .click('=dev').getText('.branches__branch._active'))
            .should.to.be.equal('dev');
        assert.includeMembers(
            await this.browser.getText('.commits__commit > a'),
            ['1ad90c7', 'b3d02f6', 'fc767be', '799d39e', '619db06']
        );
        return assert.includeMembers(
            await this.browser.getText('.file-directory a'),
            [
                '..', '.eslintrc.js', '.gitignore', 'assets',
                'index.html', 'package-lock.json', 'package.json'
            ]
        );
    });
    it('отображается корректный список файлов в директории в' +
        ' ветке отличной от ветки по умолчанию', async function() {
        assert.includeMembers(
            await this.browser.url('/').click('=dev').click('=assets')
                .getText('.file-directory a')
            ,
            [
                '..', 'drawing.js', 'filters.js', 'filtersWebGl.js',
                'main.css', 'main.js', 'three.min.js', 'tracking.js',
            ]
        );
        await this.browser.click('=..');
        assert.includeMembers(
            await this.browser.getText('.file-directory a'),
            [
                '..', '.eslintrc.js', '.gitignore', 'assets',
                'index.html', 'package-lock.json', 'package.json',
            ]
        );
    });
    it('отображается содержимое файла в ветке, отличной' +
        ' от ветки по умолчанию', async function() {
        await this.browser.url('/').click('=dev')
            .click('=assets').click('=main.css');
        assert.isNotEmpty(await this.browser.getText('.file-view__contents'));
        await this.browser.click('=assets');
        return assert.includeMembers(
            await this.browser.getText('.file-directory a'),
            [
                '..', 'drawing.js', 'filters.js', 'filtersWebGl.js',
                'main.css', 'main.js', 'three.min.js', 'tracking.js',
            ]
        );
    });
    it('можно работать с деревом файлов для коммита из ветки,' +
        'отличной от ветки по умолчанию',
        async function() {
            await this.browser.url('/').click('=dev').click('=619db06');
            assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'assets',
                    'index.html', 'package-lock.json', 'package.json',
                ]
            );
            await this.browser.click('=assets');
            assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                ['..', 'drawning.js', 'filters.js', 'main.css', 'main.js']
            );
            await this.browser.click('=..');
            return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                [
                    '..', '.eslintrc.js', '.gitignore', 'assets',
                    'index.html', 'package-lock.json', 'package.json',
                ]
            );
        });
    it('отображается содержимое файла для коммита в ветке,' +
        'отличной от ветки по умолчанию',
        async function() {
            await this.browser.url('/').click('=dev')
                .click('=619db06').click('=assets').click('=main.css');
            assert.isNotEmpty(await this.browser
                .getText('.file-view__contents'));
            await this.browser.click('=assets');
            return assert.includeMembers(
                await this.browser.getText('.file-directory a'),
                ['..', 'drawning.js', 'filters.js', 'main.css', 'main.js']
            );
        });
});
