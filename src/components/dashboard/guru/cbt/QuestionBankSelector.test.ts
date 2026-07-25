import { describe, expect, it } from "vitest";

import { isQuestionAlreadyAdded } from "./QuestionBankSelector";

describe("isQuestionAlreadyAdded", () => {
	it("returns true when question is tracked by bankId from persisted exam", () => {
		const selected = [{ id: "exam-q-1", bankId: "q-bank-9" }];

		expect(isQuestionAlreadyAdded(selected, "q-bank-9")).toBe(true);
	});

	it("returns true when question id exists directly", () => {
		const selected = [{ id: "q-1" }, { id: "q-2" }];

		expect(isQuestionAlreadyAdded(selected, "q-2")).toBe(true);
	});

	it("returns true when question is tracked by bankQuestionId", () => {
		const selected = [{ id: "temp-1", bankQuestionId: "q-bank-1" }];

		expect(isQuestionAlreadyAdded(selected, "q-bank-1")).toBe(true);
	});

	it("returns false when question is not in selected list", () => {
		const selected = [{ id: "temp-1", bankQuestionId: "q-bank-1" }];

		expect(isQuestionAlreadyAdded(selected, "q-bank-2")).toBe(false);
	});
});
