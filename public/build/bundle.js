
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let data = {
        'tomato': {
            'question': '{{keyAmount}} {{keyUnit}} {{name}} costs {{valueAmount}} {{valueUnit}}.',
            'answer': 'It costs {{valueAmount}} {{valueUnit}}!',
            'name': 'tomato',
            'value': {
                'type': 'currency',
                'amount': 20,
                'unit': 'rupees',
            },
            'key' : {
                'type': 'weight',
                'amount': 1,
                'unit': 'kg',
            },
            'category': 'groceries',
            'region': 'in',
            'tolerance': 5
        }, 
        'million-to-lakhs' : {
            'question': '{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.',
            'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
            'value': {
                'type': 'units',
                'amount': 10,
                'unit': 'lakhs',
            },
            'key' : {
                'type': 'units',
                'amount': 1,
                'unit': 'million',
            },
            'category': 'units',
            'tolerance': 5
        },
        'billion-to-crores' : {
            'question': '{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.',
            'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
            'value': {
                'type': 'units',
                'amount': 100,
                'unit': 'crores',
            },
            'key' : {
                'type': 'units',
                'amount': 1,
                'unit': 'billion',
            },
            'category': 'units',
            'tolerance': 10
        },
        'indian-population' : {
            'question': 'Indian {{name}} as of 2020 is {{valueAmount}} {{valueUnit}}.',
            'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
            'name': 'poulation',
            'value': {
                'type': 'population',
                'amount': 138,
                'unit': 'crores',
            },
            'category': 'units',
            'tolerance': 20,
            'source': {
                'link': 'https://data.worldbank.org/indicator/SP.POP.TOTL?locations=IN',
                'title': 'Worldbank'
            }
        },'double-given-rate-per-annum' : {
            'question': 'With a growth rate of 10%, you can double your money in approximately {{valueAmount}} {{valueUnit}}.',
            'answer': 'The rule of 70 (or 69 or 72): Years to double an amount = 70 / rate%',
            'value': {
                'type': 'math',
                'amount': 7,
                'unit': 'years',
            },
            'category': 'math',
            'tolerance': 3,
            'source': {
                'link': 'https://www.investopedia.com/terms/r/rule-of-70.asp',
                'title': 'Rule of 70'
            }
        }
    };

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (165:4) {#if result}
    function create_if_block(ctx) {
    	let t0;
    	let t1;
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*currentQuestionData*/ ctx[0].source?.link) return create_if_block_1;
    		if (/*currentQuestionData*/ ctx[0].source?.title) return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(/*result*/ ctx[2]);
    			t1 = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", "source");
    			attr_dev(div, "class", "svelte-3segm7");
    			add_location(div, file, 166, 5, 5326);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 4) set_data_dev(t0, /*result*/ ctx[2]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(165:4) {#if result}",
    		ctx
    	});

    	return block;
    }

    // (171:50) 
    function create_if_block_2(ctx) {
    	let div;
    	let t1;
    	let t2_value = /*currentQuestionData*/ ctx[0].source.title + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Source:";
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(div, "class", "source-title svelte-3segm7");
    			add_location(div, file, 171, 7, 5589);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentQuestionData*/ 1 && t2_value !== (t2_value = /*currentQuestionData*/ ctx[0].source.title + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(171:50) ",
    		ctx
    	});

    	return block;
    }

    // (168:6) {#if currentQuestionData.source?.link}
    function create_if_block_1(ctx) {
    	let div;
    	let t1;
    	let a;
    	let t2_value = /*currentQuestionData*/ ctx[0].source.title + "";
    	let t2;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Source:";
    			t1 = space();
    			a = element("a");
    			t2 = text(t2_value);
    			attr_dev(div, "class", "source-title svelte-3segm7");
    			add_location(div, file, 168, 7, 5398);
    			attr_dev(a, "href", a_href_value = /*currentQuestionData*/ ctx[0].source.link);
    			add_location(a, file, 169, 7, 5448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentQuestionData*/ 1 && t2_value !== (t2_value = /*currentQuestionData*/ ctx[0].source.title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*currentQuestionData*/ 1 && a_href_value !== (a_href_value = /*currentQuestionData*/ ctx[0].source.link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(168:6) {#if currentQuestionData.source?.link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t0;
    	let section;
    	let t1_value = /*currentQuestionData*/ ctx[0].question.split('{{valueAmount}}')[0].replace('{{keyAmount}}', /*currentQuestionData*/ ctx[0].key?.amount).replace('{{keyUnit}}', /*currentQuestionData*/ ctx[0].key?.unit).replace('{{name}}', /*currentQuestionData*/ ctx[0]?.name).replace('{{valueUnit}}', /*currentQuestionData*/ ctx[0].value?.unit) + "";
    	let t1;
    	let t2;
    	let input;
    	let t3;
    	let t4_value = /*currentQuestionData*/ ctx[0].question.split('{{valueAmount}}')[1].replace('{{keyAmount}}', /*currentQuestionData*/ ctx[0].key?.amount).replace('{{keyUnit}}', /*currentQuestionData*/ ctx[0].key?.unit).replace('{{name}}', /*currentQuestionData*/ ctx[0]?.name).replace('{{valueUnit}}', /*currentQuestionData*/ ctx[0].value?.unit) + "";
    	let t4;
    	let t5;
    	let div2;
    	let div0;
    	let t6;
    	let div1;
    	let t7;
    	let t8;
    	let footer;
    	let div3;
    	let t9;
    	let mounted;
    	let dispose;
    	let if_block = /*result*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			t0 = space();
    			section = element("section");
    			t1 = text(t1_value);
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t6 = space();
    			div1 = element("div");
    			t7 = text(/*error*/ ctx[3]);
    			t8 = space();
    			footer = element("footer");
    			div3 = element("div");
    			t9 = text(/*nextQuestionMsg*/ ctx[4]);
    			add_location(header, file, 131, 1, 4016);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "id", "value-amount");
    			input.autofocus = true;
    			attr_dev(input, "class", "svelte-3segm7");
    			add_location(input, file, 154, 2, 4850);
    			attr_dev(div0, "id", "result");
    			attr_dev(div0, "class", "svelte-3segm7");
    			add_location(div0, file, 163, 3, 5269);
    			attr_dev(div1, "id", "error");
    			attr_dev(div1, "class", "svelte-3segm7");
    			add_location(div1, file, 177, 3, 5725);
    			attr_dev(div2, "id", "results-container");
    			attr_dev(div2, "class", "svelte-3segm7");
    			add_location(div2, file, 162, 2, 5236);
    			attr_dev(section, "id", "question");
    			attr_dev(section, "class", "svelte-3segm7");
    			add_location(section, file, 146, 1, 4479);
    			attr_dev(div3, "id", "nextQuestionMsg");
    			attr_dev(div3, "class", "svelte-3segm7");
    			add_location(div3, file, 182, 2, 5795);
    			add_location(footer, file, 181, 1, 5783);
    			attr_dev(main, "class", "svelte-3segm7");
    			add_location(main, file, 130, 0, 4007);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(main, t0);
    			append_dev(main, section);
    			append_dev(section, t1);
    			append_dev(section, t2);
    			append_dev(section, input);
    			set_input_value(input, /*enteredAmount*/ ctx[1]);
    			append_dev(section, t3);
    			append_dev(section, t4);
    			append_dev(section, t5);
    			append_dev(section, div2);
    			append_dev(div2, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, t7);
    			append_dev(main, t8);
    			append_dev(main, footer);
    			append_dev(footer, div3);
    			append_dev(div3, t9);
    			input.focus();

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeydown*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentQuestionData*/ 1 && t1_value !== (t1_value = /*currentQuestionData*/ ctx[0].question.split('{{valueAmount}}')[0].replace('{{keyAmount}}', /*currentQuestionData*/ ctx[0].key?.amount).replace('{{keyUnit}}', /*currentQuestionData*/ ctx[0].key?.unit).replace('{{name}}', /*currentQuestionData*/ ctx[0]?.name).replace('{{valueUnit}}', /*currentQuestionData*/ ctx[0].value?.unit) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*enteredAmount*/ 2 && to_number(input.value) !== /*enteredAmount*/ ctx[1]) {
    				set_input_value(input, /*enteredAmount*/ ctx[1]);
    			}

    			if (dirty & /*currentQuestionData*/ 1 && t4_value !== (t4_value = /*currentQuestionData*/ ctx[0].question.split('{{valueAmount}}')[1].replace('{{keyAmount}}', /*currentQuestionData*/ ctx[0].key?.amount).replace('{{keyUnit}}', /*currentQuestionData*/ ctx[0].key?.unit).replace('{{name}}', /*currentQuestionData*/ ctx[0]?.name).replace('{{valueUnit}}', /*currentQuestionData*/ ctx[0].value?.unit) + "")) set_data_dev(t4, t4_value);

    			if (/*result*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*error*/ 8) set_data_dev(t7, /*error*/ ctx[3]);
    			if (dirty & /*nextQuestionMsg*/ 16) set_data_dev(t9, /*nextQuestionMsg*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let allQuestions = Object.keys(data);
    	let completedQuestions = {};

    	if (localStorage.getItem("completedQuestions")) {
    		completedQuestions = JSON.parse(localStorage.getItem("completedQuestions"));
    	}

    	//Remove already answered questions
    	allQuestions = allQuestions.filter(question => {
    		return completedQuestions[question] == null;
    	});

    	console.log('Remaining questions: ' + allQuestions);

    	function markQuestionCompleted(question) {
    		delete allQuestions[question];
    		completedQuestions[question] = Date.now();
    		localStorage.setItem("completedQuestions", JSON.stringify(completedQuestions));
    	}

    	let currentQuestion;
    	let currentQuestionData;
    	let enteredAmount = 0;
    	let result = '';
    	let error = '';
    	let nextQuestionMsg = '';

    	function clearMessages() {
    		$$invalidate(2, result = '');
    		$$invalidate(3, error = '');
    		$$invalidate(4, nextQuestionMsg = '');
    	}

    	function clearInput() {
    		$$invalidate(1, enteredAmount = '');
    	}

    	function setRandomQuestion() {
    		console.log('Remaining questions: ' + allQuestions);
    		clearMessages();
    		clearInput();
    		let randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    		currentQuestion = randomQuestion;
    		$$invalidate(0, currentQuestionData = data[currentQuestion]);
    		console.log(currentQuestion);
    	}

    	setRandomQuestion();

    	const handleKeydown = e => {
    		if (e.key === 'Enter') {
    			submit();
    			return;
    		}
    	};

    	let scores = {
    		'WRONG': 0,
    		'CLOSE_ENOUGH': 1,
    		'CORRECT': 2
    	};

    	function getScore(answer, input, tolerance) {
    		let closeEnoughFactor = 0.4; //For a tolerance of 100, +-40 says "right" and remaining says "close enough". 

    		if (answer - closeEnoughFactor * tolerance < input && answer + closeEnoughFactor * tolerance > input) {
    			console.log(`Input ${input} is ${answer} +- ${closeEnoughFactor * tolerance}`);
    			return scores.CORRECT;
    		} else if (answer - tolerance < input && answer + tolerance > input) {
    			console.log(`Input ${input} is ${answer} +- ${tolerance} but not +- ${closeEnoughFactor * tolerance}`);
    			return scores.CLOSE_ENOUGH;
    		} else {
    			return scores.WRONG;
    		}
    	}

    	function submit() {
    		clearMessages();
    		let millisToNextQuestion = 5000;

    		if (!enteredAmount) {
    			$$invalidate(3, error = `Enter a number. Any number!`);

    			setTimeout(
    				() => {
    					$$invalidate(3, error = '');
    				},
    				millisToNextQuestion
    			);

    			return;
    		}

    		if (isNaN(enteredAmount)) {
    			$$invalidate(3, error = `${enteredAmount} is not a number.`);

    			setTimeout(
    				() => {
    					$$invalidate(3, error = '');
    				},
    				millisToNextQuestion
    			);

    			return;
    		}

    		let score = getScore(currentQuestionData.value.amount, enteredAmount, currentQuestionData.tolerance);

    		if (score == scores.CORRECT) {
    			let answerText = currentQuestionData.answer.replace('{{valueAmount}}', currentQuestionData.value.amount).replace('{{valueUnit}}', currentQuestionData.value.unit);
    			$$invalidate(2, result = '✔️' + answerText);
    			markQuestionCompleted(currentQuestion);
    		} else if (score == scores.CLOSE_ENOUGH) {
    			let answerText = currentQuestionData.answer.replace('{{valueAmount}}', currentQuestionData.value.amount).replace('{{valueUnit}}', currentQuestionData.value.unit);
    			$$invalidate(2, result = '🔸' + answerText);
    		} else {
    			let answerText = currentQuestionData.answer.replace('{{valueAmount}}', currentQuestionData.value.amount).replace('{{valueUnit}}', currentQuestionData.value.unit);
    			$$invalidate(2, result = '❌ ' + answerText);
    		}

    		setTimeout(
    			() => {
    				$$invalidate(2, result = '');
    			},
    			millisToNextQuestion
    		);

    		//Next question
    		let secondsRemainingForNextQuestion = millisToNextQuestion / 1000;

    		let interval = setInterval(
    			() => {
    				secondsRemainingForNextQuestion--;
    				$$invalidate(4, nextQuestionMsg = `Navigating to next question in ${secondsRemainingForNextQuestion} seconds.`);

    				if (secondsRemainingForNextQuestion <= 0) {
    					$$invalidate(4, nextQuestionMsg = '');
    					setRandomQuestion();
    					console.log('Changed');
    					clearInterval(interval);
    				}
    			},
    			1000
    		);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		enteredAmount = to_number(this.value);
    		$$invalidate(1, enteredAmount);
    	}

    	$$self.$capture_state = () => ({
    		data,
    		allQuestions,
    		completedQuestions,
    		markQuestionCompleted,
    		currentQuestion,
    		currentQuestionData,
    		enteredAmount,
    		result,
    		error,
    		nextQuestionMsg,
    		clearMessages,
    		clearInput,
    		setRandomQuestion,
    		handleKeydown,
    		scores,
    		getScore,
    		submit
    	});

    	$$self.$inject_state = $$props => {
    		if ('allQuestions' in $$props) allQuestions = $$props.allQuestions;
    		if ('completedQuestions' in $$props) completedQuestions = $$props.completedQuestions;
    		if ('currentQuestion' in $$props) currentQuestion = $$props.currentQuestion;
    		if ('currentQuestionData' in $$props) $$invalidate(0, currentQuestionData = $$props.currentQuestionData);
    		if ('enteredAmount' in $$props) $$invalidate(1, enteredAmount = $$props.enteredAmount);
    		if ('result' in $$props) $$invalidate(2, result = $$props.result);
    		if ('error' in $$props) $$invalidate(3, error = $$props.error);
    		if ('nextQuestionMsg' in $$props) $$invalidate(4, nextQuestionMsg = $$props.nextQuestionMsg);
    		if ('scores' in $$props) scores = $$props.scores;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentQuestionData,
    		enteredAmount,
    		result,
    		error,
    		nextQuestionMsg,
    		handleKeydown,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
