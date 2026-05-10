/// <reference lib="dom" />
import type { Page } from "playwright";

export async function materializePseudoElements(page: Page): Promise<void> {
	await page.evaluate(() => {
		const slides = document.querySelectorAll(".slide");

		for (let i = 0; i < slides.length; i++) {
			const slide = slides.item(i);
			if (!(slide instanceof HTMLElement)) continue;
			const elements = slide.querySelectorAll("*");

			for (let j = 0; j < elements.length; j++) {
				const el = elements.item(j);
				if (!(el instanceof HTMLElement)) continue;
				const materialized: string[] = [];

				for (const pseudoName of ["::before", "::after"]) {
					const computed = window.getComputedStyle(el, pseudoName);
					const content = computed.getPropertyValue("content");
					if (!content || content === '""' || content === "''" || content === "none") continue;

					const pseudoEl = document.createElement("span");
					pseudoEl.classList.add(`pseudo-${pseudoName.slice(2)}`);

					for (let p = 0; p < computed.length; p++) {
						const prop = computed.item(p);
						if (prop === "content") continue;
						const value = computed.getPropertyValue(prop);
						const priority = computed.getPropertyPriority(prop);
						pseudoEl.style.setProperty(prop, value, priority);
					}

					pseudoEl.style.setProperty("content", "none", "important");

					if (pseudoName === "::before") {
						el.insertBefore(pseudoEl, el.firstChild);
					} else {
						el.appendChild(pseudoEl);
					}

					materialized.push(pseudoName.slice(2));
				}

				if (materialized.length > 0) {
					const existing = el.getAttribute("data-pseudo-materialized");
					const all = existing ? `${existing},${materialized.join(",")}` : materialized.join(",");
					el.setAttribute("data-pseudo-materialized", all);
				}
			}
		}

		// Inject global style to disable materialized pseudo-elements
		if (!document.getElementById("pseudo-materializer-reset")) {
			const resetStyle = document.createElement("style");
			resetStyle.id = "pseudo-materializer-reset";
			resetStyle.textContent =
				'[data-pseudo-materialized*="before"]::before, [data-pseudo-materialized*="after"]::after { content: none !important; }';
			document.head.appendChild(resetStyle);
		}
	});
}
