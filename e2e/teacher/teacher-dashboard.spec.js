import {
  test,
  expect,
} from "@playwright/test";

test.describe(
  "Authenticated teacher dashboard",
  () => {
    test(
      "saved authentication opens the teacher dashboard",
      async ({ page }) => {
        await page.goto("/");

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
            .toHaveText(
              /teacher/i
            );
        }
      }
    );

    test(
      "teacher session survives page reload",
      async ({ page }) => {
        await page.goto("/");

        await expect(
          page.getByTestId(
            "teacher-dashboard"
          )
        ).toBeVisible();

        await page.reload();

        await expect(
          page.getByTestId(
            "teacher-dashboard"
          )
        ).toBeVisible({
          timeout: 15_000,
        });

        await expect(
          page.getByTestId(
            "login-form"
          )
        ).toHaveCount(0);
      }
    );
  }
);