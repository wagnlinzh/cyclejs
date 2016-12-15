import 'mocha';
import * as assert from 'assert';
import * as Rx from 'rxjs';
import {Observable} from 'rxjs';
import {setup} from '@cycle/rxjs-run';
import {div, h3, h2, h, makeHTMLDriver, VNode, HTMLSource} from '../../lib';

describe('HTML Driver', function () {
  it('should output HTML when given a simple vtree stream', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should allow effect to see one or many HTML outputs', function (done) {
    function app() {
      return {
        html: Rx.Observable.interval(150).take(3).map(i =>
          div('.test-element', ['Foobar' + i]),
        ),
      };
    }

    const expected = [
      '<div class="test-element">Foobar0</div>',
      '<div class="test-element">Foobar1</div>',
      '<div class="test-element">Foobar2</div>',
    ];

    function effect(html: string): void {
      assert.strictEqual(html, expected.shift());
      if (expected.length === 0) {
        done();
      }
    }

    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should allow effect to see one (the last) HTML outputs', function (done) {
    function app() {
      return {
        html: Rx.Observable.interval(150).take(3).map(i =>
          div('.test-element', ['Foobar' + i]),
        ).last(),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar2</div>');
      done();
    }

    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should output HTMLSource as an adapted stream', function (done) {
    interface MySources {
      html: HTMLSource;
    }
    interface MySinks {
      html: Observable<VNode>;
    }

    function app(sources: MySources): MySinks {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }
    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual(typeof (sources.html.elements() as any).observeOn, 'function');
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function (done) {
    function app(sources: {html: HTMLSource}): any {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }
    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual((sources.html.elements() as any)._isCycleSource, 'html');
    done();
  });

  it('should have DevTools flag in HTMLSource elements() stream', function (done) {
    function app(sources: {html: HTMLSource}): any {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }
    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver((html: string) => {}),
    });
    assert.strictEqual((sources.html.events('click') as any)._isCycleSource, 'html');
    done();
  });

  it('should make bogus select().events() as sources', function (done) {
    function app(sources: {html: HTMLSource}) {
      assert.strictEqual(typeof sources.html.select, 'function');
      assert.strictEqual(
        typeof sources.html.select('whatever').elements().subscribe,
        'function',
      );
      assert.strictEqual(
        typeof sources.html.select('whatever').events('click').subscribe,
        'function',
      );
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should output simple HTML Observable', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(div('.test-element', ['Foobar'])),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html, '<div class="test-element">Foobar</div>');
      done();
    }

    let {sinks, sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });
    run();
  });

  it('should render a complex and nested HTML', function (done) {
    function app() {
      return {
        html: Rx.Observable.of(
          h('.test-element', [
            div([
              h2('.a', 'a'),
              h('h4.b', 'b'),
              h('h1.fooclass'),
            ]),
            div([
              h3('.c', 'c'),
              h('div', [
                h('p.d', 'd'),
                h('h2.barclass'),
              ]),
            ]),
          ]),
        ),
      };
    }

    function effect(html: string): void {
      assert.strictEqual(html,
        '<div class="test-element">' +
          '<div>' +
            '<h2 class="a">a</h2>' +
            '<h4 class="b">b</h4>' +
            '<h1 class="fooclass"></h1>' +
          '</div>' +
          '<div>' +
            '<h3 class="c">c</h3>' +
            '<div>' +
              '<p class="d">d</p>' +
              '<h2 class="barclass"></h2>' +
            '</div>' +
          '</div>' +
        '</div>',
      );
      done();
    }

    let {sources, run} = setup(app, {
      html: makeHTMLDriver(effect),
    });

    run();
  });
});