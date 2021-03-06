
const global = (typeof window !== 'undefined' ? window : this);
const doc    = global.document;
const header = doc.querySelector('header');
const main   = doc.querySelector('main');
const footer = doc.querySelector('footer');

import { isBrowser   } from '../source/Browser.mjs';
import { Address     } from './header/Address.mjs';
import { Beacon      } from './footer/Beacon.mjs';
import { Context     } from './footer/Context.mjs';
import { Help        } from './footer/Help.mjs';
import { History     } from './header/History.mjs';
import { Mode        } from './header/Mode.mjs';
import { Session     } from './footer/Session.mjs';
import { Settings    } from './header/Settings.mjs';
import { Site        } from './footer/Site.mjs';
import { Tabs        } from './footer/Tabs.mjs';
import { Webview     } from './main/Webview.mjs';



export * from './Element.mjs';

export const WIDGETS = global.WIDGETS = {};

export const dispatch = (window, browser) => {

	browser = isBrowser(browser) ? browser : null;


	if (browser !== null) {

		Object.keys(WIDGETS).forEach((key) => {

			let widget = WIDGETS[key] || null;
			if (widget !== null) {
				widget.erase();
			}

			WIDGETS[key] = null;

		});

		WIDGETS.address  = new Address(browser, WIDGETS);
		WIDGETS.beacon   = new Beacon(browser, WIDGETS);
		WIDGETS.context  = new Context(browser, WIDGETS);
		WIDGETS.help     = new Help(browser, WIDGETS);
		WIDGETS.history  = new History(browser, WIDGETS);
		WIDGETS.mode     = new Mode(browser, WIDGETS);
		WIDGETS.session  = new Session(browser, WIDGETS);
		WIDGETS.settings = new Settings(browser, WIDGETS);
		WIDGETS.site     = new Site(browser, WIDGETS);
		WIDGETS.tabs     = new Tabs(browser, WIDGETS);
		WIDGETS.webview  = new Webview(browser, WIDGETS);


		WIDGETS.history.render(header);
		WIDGETS.address.render(header);
		WIDGETS.mode.render(header);
		WIDGETS.settings.render(header);

		WIDGETS.webview.render(main);

		WIDGETS.tabs.render(footer);
		WIDGETS.beacon.render(footer);
		WIDGETS.site.render(footer);
		WIDGETS.session.render(footer);
		WIDGETS.context.render(footer);
		WIDGETS.help.render(footer);


		setTimeout(() => {

			let tabindex = 1;

			[
				WIDGETS.history.back,
				WIDGETS.history.next,
				WIDGETS.history.action,
				WIDGETS.history.open,
				WIDGETS.address.input,
				...WIDGETS.mode.buttons,
				WIDGETS.settings.beacon,
				WIDGETS.settings.session,
				WIDGETS.settings.site,
				WIDGETS.settings.browser
			].filter((v) => v !== null).forEach((element) => {
				element.attr('tabindex', tabindex++);
			});

			WIDGETS.tabs.tabindex = tabindex;

		}, 100);

	}

};

