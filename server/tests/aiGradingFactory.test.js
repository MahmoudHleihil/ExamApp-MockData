import "./bootstrap.js";

import test, {
  afterEach,
} from "node:test";

import assert from "node:assert/strict";

const originalApiKey =
  process.env.OPENROUTER_API_KEY;

const {
  getAiGradingService,
  resetAiGradingServiceForTests,
} = await import(
  "../services/createAiGradingService.js"
);

afterEach(() => {
  if (
    originalApiKey ===
    undefined
  ) {
    delete process.env
      .OPENROUTER_API_KEY;
  } else {
    process.env
      .OPENROUTER_API_KEY =
      originalApiKey;
  }

  resetAiGradingServiceForTests();
});

test(
  "AI grading is disabled when the API key is missing",
  () => {
    delete process.env
      .OPENROUTER_API_KEY;

    resetAiGradingServiceForTests();

    const service =
      getAiGradingService();

    assert.equal(
      service,
      null
    );
  }
);

test(
  "AI grading service is created when an API key exists",
  () => {
    process.env
      .OPENROUTER_API_KEY =
      "test-key";

    resetAiGradingServiceForTests();

    const service =
      getAiGradingService();

    assert.ok(service);

    assert.equal(
      typeof service
        .gradeWrittenAnswer,
      "function"
    );
  }
);

test(
  "AI grading service is reused as a singleton",
  () => {
    process.env
      .OPENROUTER_API_KEY =
      "test-key";

    resetAiGradingServiceForTests();

    const first =
      getAiGradingService();

    const second =
      getAiGradingService();

    assert.equal(
      first,
      second
    );
  }
);
