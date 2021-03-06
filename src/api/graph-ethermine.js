const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

module.exports = {
	ethermine_graph: async (req) => {
		try {
			const url = req.query.url;
			const timestamp = req.query.timestamp;

			const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
			const page = await browser.newPage();
			await page.goto(url, {
				waitUntil: 'load',
			});

			await page.waitForSelector('#checkbox');
			await page.evaluate(() => {
				document.querySelector('#checkbox')?.parentElement?.click();
			});

			const selector = 'svg.highcharts-root';
			await page.waitForSelector(selector);

			setTimeout(async () => {
				const rect = await page.evaluate((selector) => {
					const element = document.querySelector(selector);
					if (!element) return null;
					const { x, y, width, height } = element.getBoundingClientRect();
					return { left: x, top: y, width, height, id: element.id };
				}, selector);

				if (!rect) throw Error(`Could not find element that matches selector: ${selector}.`);

				const image = await page.screenshot({
					clip: {
						x: rect.left,
						y: rect.top,
						width: rect.width,
						height: rect.height,
					},
				});

				await browser.close();

				fs.writeFileSync(`generated/image.png`, image);

				return image;
			}, 1000);
		} catch (err) {
			throw err;
		}
	},
};
