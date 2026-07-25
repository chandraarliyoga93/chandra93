import { describe, expect, it } from "vitest";

import { dedupeExamQuestionsForSubmit } from "./CreateExamDialog";

describe("dedupeExamQuestionsForSubmit", () => {
	it("keeps multiple questions from same bank when question ids differ", () => {
		const result = dedupeExamQuestionsForSubmit([
			{
				id: "q-1",
				bankId: "bank-math",
				bankQuestionId: "q-1",
				text: "Soal 1",
				type: "pg",
			},
			{
				id: "q-2",
				bankId: "bank-math",
				bankQuestionId: "q-2",
				text: "Soal 2",
				type: "pg",
			},
			{
				id: "q-3",
				bankId: "bank-math",
				bankQuestionId: "q-3",
				text: "Soal 3",
				type: "pg",
			},
		] as any);

		expect(result).toHaveLength(3);
		expect(result.map((q) => q.id)).toEqual(["q-1", "q-2", "q-3"]);
	});

	it("removes duplicate selections for the same bank question", () => {
		const result = dedupeExamQuestionsForSubmit([
			{
				id: "temp-1",
				bankId: "bank-math",
				bankQuestionId: "q-1",
				text: "Soal 1",
				type: "pg",
			},
			{
				id: "temp-2",
				bankId: "bank-math",
				bankQuestionId: "q-1",
				text: "Soal 1 copy",
				type: "pg",
			},
		] as any);

		expect(result).toHaveLength(1);
		expect(result[0].bankQuestionId).toBe("q-1");
	});
});
