/**
 * Konversi HTML hasil markdown-it (task lists GitHub-style) ke bentuk yang
 * dikenali TipTap TaskList/TaskItem (`data-type` + konten blok minimal).
 */
export function normalizeMarkdownPasteHtml(html: string): string {
	if (typeof window === "undefined" || !html.trim()) return html;

	const parser = new DOMParser();
	const doc = parser.parseFromString(
		`<div id="__md_root">${html}</div>`,
		"text/html",
	);
	const root = doc.getElementById("__md_root");
	if (!root) return html;

	const blockTags = new Set([
		"P",
		"DIV",
		"UL",
		"OL",
		"BLOCKQUOTE",
		"PRE",
		"H1",
		"H2",
		"H3",
		"H4",
		"H5",
		"H6",
		"TABLE",
	]);

	const upgradeTaskList = (ul: Element) => {
		ul.setAttribute("data-type", "taskList");
		ul.classList.remove("contains-task-list");

		ul.querySelectorAll("li.task-list-item").forEach((li) => {
			const input = li.querySelector(
				'input[type="checkbox"]',
			) as HTMLInputElement | null;
			const checked = Boolean(input?.checked || input?.hasAttribute("checked"));
			input?.remove();

			li.querySelectorAll("label").forEach((label) => {
				while (label.firstChild) {
					li.insertBefore(label.firstChild, label);
				}
				label.remove();
			});

			li.setAttribute("data-type", "taskItem");
			li.setAttribute("data-checked", checked ? "true" : "false");
			li.classList.remove("task-list-item");

			const elementChildren = Array.from(li.childNodes).filter(
				(n) => n.nodeType === 1,
			) as Element[];
			const hasBlock = elementChildren.some((el) => blockTags.has(el.tagName));
			if (!hasBlock) {
				const p = doc.createElement("p");
				while (li.firstChild) p.appendChild(li.firstChild);
				li.appendChild(p);
			}
			if (li.childNodes.length === 0) {
				li.appendChild(doc.createElement("p"));
			}
		});
	};

	root
		.querySelectorAll("ul.contains-task-list")
		.forEach((ul) => upgradeTaskList(ul));

	// Fallback: beberapa sumber hanya menandai <li class="task-list-item"> tanpa class di <ul>
	root.querySelectorAll("li.task-list-item").forEach((li) => {
		const ul = li.parentElement;
		if (!ul || ul.tagName !== "UL") return;
		if (ul.getAttribute("data-type") === "taskList") return;
		if (ul.querySelector(":scope > li.task-list-item")) {
			upgradeTaskList(ul);
		}
	});

	return root.innerHTML;
}
