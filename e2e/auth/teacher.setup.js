import {
  test as setup,
  expect,
} from "@playwright/test";

const teacherAuthFile =
  "playwright/.auth/teacher.json";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

async function openLoginPage(page) {
  await page.goto("/login");

  const loginForm =
    page.getByTestId("login-form");

  if (
    await loginForm
      .isVisible()
      .catch(() => false)
  ) {
    return;
  }

  await page.goto("/");

  const signInLink =
    page.getByRole("link", {
      name: /sign in|login/i,
    });

  const signInButton =
    page.getByRole("button", {
      name: /sign in|login/i,
    });

  if (
    await signInLink
      .isVisible()
      .catch(() => false)
  ) {
    await signInLink.click();
  } else {
    await expect(
      signInButton
    ).toBeVisible();

    await signInButton.click();
  }

  await expect(
    loginForm
  ).toBeVisible();
}

setup(
  "authenticate teacher",
  async ({ page }) => {
    const email =
      process.env
        .E2E_TEACHER_EMAIL;

    const password =
      process.env
        .E2E_TEACHER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD are required."
      );
    }

    await openLoginPage(page);

    await page
      .getByTestId(
        "login-email"
      )
      .fill(email);

    await page
      .getByTestId(
        "login-password"
      )
      .fill(password);

    const rememberMe =
      page.getByLabel(
        /remember me for 30 days/i
      );

    await expect(
      rememberMe
    ).toBeVisible();

    await rememberMe.check();

    await expect(
      rememberMe
    ).toBeChecked();

    const responsePromise =
      page.waitForResponse(
        (response) =>
          response.url() ===
            `${backendUrl}/api/users/login` &&
          response.request()
            .method() === "POST"
      );

    await page
      .getByTestId(
        "login-submit"
      )
      .click();

    const response =
      await responsePromise;

    const responseBody =
      await response
        .text()
        .catch(() => "");

    expect(
      response.ok(),
      `Teacher authentication failed with ${response.status()}: ${responseBody}`
    ).toBeTruthy();

    await expect(
      page.getByTestId(
        "teacher-dashboard"
      )
    ).toBeVisible({
      timeout: 15_000,
    });

    const persistedUser =
      await page.evaluate(() =>
        localStorage.getItem(
          "etest_user"
        )
      );

    expect(
      persistedUser,
      "Teacher user was not persisted in localStorage."
    ).toBeTruthy();
    
    await page.context()
      .storageState({
        path: teacherAuthFile,
      });
  }
);