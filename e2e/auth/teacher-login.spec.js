import {
  test,
  expect,
} from "@playwright/test";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

async function submitLogin(page) {
  const responsePromise =
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url() ===
          `${backendUrl}/api/users/login`,
      {
        timeout: 15_000,
      }
    );

  await page
    .getByTestId("login-submit")
    .click();

  return responsePromise;
}

async function openLoginPage(page) {
  await page.goto("/login");

  const emailInput =
    page.getByTestId("login-email");

  /*
   * If /login is not a real route, return to the
   * home page and use the visible Sign In control.
   */
  if (!(await emailInput.isVisible().catch(() => false))) {
    await page.goto("/");

    const signInLink = page.getByRole(
      "link",
      {
        name: /sign in|login/i,
      }
    );

    const signInButton = page.getByRole(
      "button",
      {
        name: /sign in|login/i,
      }
    );

    if (
      await signInLink
        .isVisible()
        .catch(() => false)
    ) {
      await signInLink.click();
    } else if (
      await signInButton
        .isVisible()
        .catch(() => false)
    ) {
      await signInButton.click();
    }
  }

  await expect(
    page.getByTestId("login-form")
  ).toBeVisible({
    timeout: 10_000,
  });
}

test.describe(
  "Teacher authentication",
  () => {
    test(
      "teacher can log in and reach the dashboard",
      async ({ page }) => {
        const email =
          process.env
            .E2E_TEACHER_EMAIL;

        const password =
          process.env
            .E2E_TEACHER_PASSWORD;

        if (!email || !password) {
          throw new Error(
            "E2E teacher credentials are missing."
          );
        }
page.on("console", (message) => {
  console.log(
    `[browser:${message.type()}]`,
    message.text()
  );
});

page.on("pageerror", (error) => {
  console.error(
    "[browser page error]",
    error.message
  );
});

page.on("request", (request) => {
  if (request.method() === "POST") {
    console.log(
      "[POST request]",
      request.url()
    );
  }
});

page.on(
  "requestfailed",
  (request) => {
    console.error(
      "[request failed]",
      request.url(),
      request.failure()
    );
  }
);
        await openLoginPage(page);

        await page
          .getByTestId("login-email")
          .fill(email);

        await page
          .getByTestId("login-password")
          .fill(password);

        // await page
        //   .getByTestId("login-submit")
        //   .click();

        const loginResponse =
          await submitLogin(page);

        const responseBody =
          await loginResponse
            .text()
            .catch(() => "");

        expect(
          loginResponse.ok(),
          `Login failed with ${loginResponse.status()}: ${responseBody}`
        ).toBeTruthy();

        await expect(
          page.getByTestId(
            "teacher-dashboard"
          )
        ).toBeVisible({
          timeout: 15_000,
        });

        const role =
          page.getByTestId(
            "current-user-role"
          );

        if (
          await role
            .isVisible()
            .catch(() => false)
        ) {
          await expect(role)
            .toHaveText(/teacher/i);
        }
      }
    );

    test(
      "invalid credentials display an error",
      async ({ page }) => {
        await openLoginPage(page);

        await page
          .getByTestId("login-email")
          .fill(
            "invalid-user@etest.com"
          );

        await page
          .getByTestId(
            "login-password"
          )
          .fill(
            "incorrect-password"
          );

        const loginResponsePromise =
          page.waitForResponse(
            (response) =>
              response
                .request()
                .method() ===
                "POST" &&
              /login/i.test(
                response.url()
              ),
            {
              timeout: 15_000,
            }
          );

        await page
          .getByTestId("login-submit")
          .click();

        const response =
          await loginResponsePromise;

        expect(
          response.status()
        ).toBeGreaterThanOrEqual(
          400
        );

        await expect(
          page.getByTestId(
            "login-error"
          )
        ).toBeVisible({
          timeout: 10_000,
        });

        await expect(
          page.getByTestId(
            "login-error"
          )
        ).toContainText(
          /invalid|incorrect|failed|not found|credentials/i
        );

        await expect(
          page.getByTestId(
            "teacher-dashboard"
          )
        ).toHaveCount(0);
      }
    );
  }
);