import {
  test as setup,
  expect,
} from "@playwright/test";

const studentAuthFile =
  "playwright/.auth/student.json";

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
  "authenticate student",
  async ({ page }) => {
    const email =
      process.env
        .E2E_STUDENT_EMAIL;

    const password =
      process.env
        .E2E_STUDENT_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "E2E student credentials are required."
      );
    }

    await openLoginPage(page);

    await page
      .getByTestId("login-email")
      .fill(email);

    await page
      .getByTestId("login-password")
      .fill(password);

    const rememberMe =
      page.getByLabel(
        /remember me/i
      );

    if (
      await rememberMe
        .isVisible()
        .catch(() => false)
    ) {
      await rememberMe.check();
    }

    const loginResponsePromise =
      page.waitForResponse(
        (response) =>
          response.url() ===
            `${backendUrl}/api/users/login` &&
          response.request()
            .method() === "POST",
        {
          timeout: 15_000,
        }
      );

    await page
      .getByTestId("login-submit")
      .click();

    const loginResponse =
      await loginResponsePromise;

    const responseText =
      await loginResponse
        .text()
        .catch(() => "");

    expect(
      loginResponse.ok(),
      `Student login failed with ${loginResponse.status()}: ${responseText}`
    ).toBeTruthy();

    await expect(
      page.getByTestId(
        "student-dashboard"
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
      "Student was not saved in localStorage."
    ).toBeTruthy();

    await page
      .context()
      .storageState({
        path: studentAuthFile,
      });
  }
);